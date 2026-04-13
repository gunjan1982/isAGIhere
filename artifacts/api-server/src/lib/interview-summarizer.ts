import Anthropic from "@anthropic-ai/sdk";
import { db } from "@workspace/db";
import { interviewsTable } from "@workspace/db/schema";
import { isNull, isNotNull, and, eq } from "drizzle-orm";
import { logger } from "./logger";

const anthropic = new Anthropic(); // uses ANTHROPIC_API_KEY env var

const SUMMARY_PROMPT = (title: string, description: string) => `
You are an AI analyst for isagihere.wiki, a platform tracking AI industry progress.

Analyze this YouTube video about AI and generate structured intelligence for our readers.

VIDEO TITLE: ${title}
DESCRIPTION: ${description}

Respond ONLY with valid JSON matching this exact structure:
{
  "summary": "2-3 sentence summary focused on what AI-relevant things were discussed.",
  "keyTakeaways": [
    "Takeaway 1 about AGI, new models, safety, or AI capabilities",
    "Takeaway 2",
    "Takeaway 3"
  ],
  "topics": ["AGI timeline", "new model", "safety", "capabilities", "investment", "regulation"]
}

Rules:
- summary: max 280 characters, present tense
- keyTakeaways: 3-5 items, each max 120 characters, start with a verb
- topics: pick ONLY from: ["AGI timeline", "new model", "capabilities", "safety", "alignment", "investment", "regulation", "benchmark", "open source", "reasoning", "agents", "multimodal"]
- If the description is too short to analyze, return null for all fields
`;

export async function generateMissingSummaries(batchSize = 5): Promise<number> {
  const pending = await db
    .select()
    .from(interviewsTable)
    .where(and(isNull(interviewsTable.aiSummary), isNotNull(interviewsTable.description)))
    .limit(batchSize);

  let processed = 0;
  for (const interview of pending) {
    try {
      const response = await anthropic.messages.create({
        model: "claude-haiku-4-5",
        max_tokens: 512,
        messages: [{
          role: "user",
          content: SUMMARY_PROMPT(interview.title, interview.description ?? ""),
        }],
      });

      const text = response.content[0]?.type === "text" ? response.content[0].text : null;
      if (!text) continue;

      let parsed: { summary?: string; keyTakeaways?: string[]; topics?: string[] } | null = null;
      try {
        parsed = JSON.parse(text);
      } catch {
        logger.warn({ interviewId: interview.id }, "Failed to parse summary JSON");
        continue;
      }

      if (!parsed?.summary) continue;

      await db
        .update(interviewsTable)
        .set({
          aiSummary: parsed.summary,
          keyTakeaways: JSON.stringify(parsed.keyTakeaways ?? []),
          topics: JSON.stringify(parsed.topics ?? []),
          summaryGeneratedAt: new Date(),
        })
        .where(eq(interviewsTable.id, interview.id));

      processed++;
    } catch (err) {
      logger.warn({ interviewId: interview.id, err }, "Failed to generate summary");
    }
  }

  return processed;
}
