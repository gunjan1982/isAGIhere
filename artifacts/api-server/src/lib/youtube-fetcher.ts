import Parser from "rss-parser";
import { db } from "@workspace/db";
import { interviewsTable, peopleTable, sourcesTable } from "@workspace/db/schema";
import { isNotNull, eq, and } from "drizzle-orm";
import { logger } from "./logger";

const parser = new Parser({ timeout: 10000 });

const YT_CHANNEL_RSS = (channelId: string) =>
  `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;

function extractVideoId(url: string): string | null {
  const match = url.match(/(?:v=|youtu\.be\/|\/embed\/)([a-zA-Z0-9_-]{11})/);
  return match?.[1] ?? null;
}

const AI_KEYWORDS = [
  "artificial intelligence", " ai ", " ai,", " ai.", " agi", "machine learning",
  "deep learning", "neural network", "large language model", "llm", "gpt",
  "openai", "anthropic", "deepmind", "google deepmind", "mistral", "nvidia gpu",
  "robotics", "alignment", "safety", "capabilities", "scaling", "reasoning",
  "future of ai", "future of technology", "silicon valley", "tech ceo",
  "sam altman", "yann lecun", "andrej karpathy", "ilya sutskever",
  "dario amodei", "demis hassabis", "jensen huang", "elon musk",
  "geoffrey hinton", "yoshua bengio", "meta ai", "openai ceo",
];

function isInterviewLike(title: string, description: string): boolean {
  const text = (title + " " + description).toLowerCase();
  return AI_KEYWORDS.some((kw) => text.includes(kw));
}

export async function fetchPersonInterviews(): Promise<number> {
  const people = await db
    .select({ id: peopleTable.id, name: peopleTable.name, youtubeChannelId: peopleTable.youtubeChannelId })
    .from(peopleTable)
    .where(isNotNull(peopleTable.youtubeChannelId));

  let inserted = 0;

  const results = await Promise.allSettled(
    people.map(async (person: { id: number; name: string; youtubeChannelId: string | null }) => {
      const rssUrl = YT_CHANNEL_RSS(person.youtubeChannelId!);
      let items: Parser.Item[];
      try {
        const feed = await parser.parseURL(rssUrl);
        items = feed.items ?? [];
      } catch (err) {
        logger.warn({ rssUrl, name: person.name, err }, "Failed to fetch YouTube RSS");
        return;
      }

      for (const item of items.slice(0, 15)) {
        const videoUrl = item.link ?? "";
        const videoId = extractVideoId(videoUrl);
        if (!videoId) continue;

        const title = item.title ?? "";
        const description = item.contentSnippet ?? item.content ?? "";
        if (!isInterviewLike(title, description)) continue;

        const thumbnailUrl = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

        try {
          await db
            .insert(interviewsTable)
            .values({
              personId: person.id,
              videoId,
              channelId: person.youtubeChannelId!,
              channelName: person.name,
              title,
              url: `https://www.youtube.com/watch?v=${videoId}`,
              thumbnailUrl,
              description: description.slice(0, 2000),
              publishedAt: item.pubDate ? new Date(item.pubDate) : null,
              isOriginalSource: true,
            })
            .onConflictDoNothing({ target: interviewsTable.videoId });
          inserted++;
        } catch (err) {
          logger.error({ videoId, err }, "Failed to insert interview");
        }
      }
    })
  );

  const failed = results.filter((r: PromiseSettledResult<unknown>) => r.status === "rejected").length;
  if (failed > 0) {
    logger.warn({ failed }, "Some person channel fetches failed");
  }

  logger.info({ inserted }, "YouTube interview fetch complete");
  return inserted;
}

let lastFetchedAt: Date | null = null;
let fetchTimer: ReturnType<typeof setInterval> | null = null;

export async function fetchInterviewerChannels(): Promise<number> {
  const channels = await db
    .select({
      id: sourcesTable.id,
      name: sourcesTable.name,
      youtubeChannelId: sourcesTable.youtubeChannelId,
    })
    .from(sourcesTable)
    .where(
      and(
        eq(sourcesTable.isInterviewChannel, true),
        isNotNull(sourcesTable.youtubeChannelId)
      )
    );

  if (channels.length === 0) return 0;

  // Build a name-to-id lookup from people table for attribution
  const allPeople = await db
    .select({ id: peopleTable.id, name: peopleTable.name })
    .from(peopleTable);

  const peopleByName = new Map(allPeople.map((p) => [p.name.toLowerCase(), p.id]));

  let inserted = 0;

  const results = await Promise.allSettled(
    channels.map(async (channel: { id: number; name: string; youtubeChannelId: string | null }) => {
      const rssUrl = YT_CHANNEL_RSS(channel.youtubeChannelId!);
      let items: Parser.Item[];
      try {
        const feed = await parser.parseURL(rssUrl);
        items = feed.items ?? [];
      } catch (err) {
        logger.warn({ rssUrl, name: channel.name, err }, "Failed to fetch interviewer channel RSS");
        return;
      }

      for (const item of items.slice(0, 20)) {
        const videoUrl = item.link ?? "";
        const videoId = extractVideoId(videoUrl);
        if (!videoId) continue;

        const title = item.title ?? "";
        const description = item.contentSnippet ?? item.content ?? "";
        if (!isInterviewLike(title, description)) continue;

        // Try to match a person from the title
        let matchedPersonId: number | null = null;
        const titleLower = title.toLowerCase();
        for (const [personName, personId] of peopleByName) {
          if (titleLower.includes(personName)) {
            matchedPersonId = personId;
            break;
          }
        }

        const thumbnailUrl = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

        try {
          await db
            .insert(interviewsTable)
            .values({
              personId: matchedPersonId ?? null,
              videoId,
              channelId: channel.youtubeChannelId!,
              channelName: channel.name,
              title,
              url: `https://www.youtube.com/watch?v=${videoId}`,
              thumbnailUrl,
              description: description.slice(0, 2000),
              publishedAt: item.pubDate ? new Date(item.pubDate) : null,
              isOriginalSource: false,
            })
            .onConflictDoNothing({ target: interviewsTable.videoId });
          inserted++;
        } catch (err) {
          logger.error({ videoId, err }, "Failed to insert interviewer channel video");
        }
      }
    })
  );

  const failed = results.filter((r: PromiseSettledResult<unknown>) => r.status === "rejected").length;
  if (failed > 0) {
    logger.warn({ failed }, "Some interviewer channel fetches failed");
  }

  logger.info({ inserted }, "YouTube interviewer channel fetch complete");
  return inserted;
}

export function startInterviewScheduler(intervalMs = 60 * 60 * 1000) {
  if (fetchTimer) return;
  Promise.all([fetchPersonInterviews(), fetchInterviewerChannels()])
    .then(() => { lastFetchedAt = new Date(); })
    .catch((e) => {
      logger.error({ err: e }, "Initial interview fetch failed");
    });
  fetchTimer = setInterval(async () => {
    try {
      await Promise.all([fetchPersonInterviews(), fetchInterviewerChannels()]);
      lastFetchedAt = new Date();
    } catch (e) {
      logger.error({ err: e }, "Scheduled interview fetch failed");
    }
  }, intervalMs);
}

export function getInterviewLastFetchedAt() { return lastFetchedAt; }
