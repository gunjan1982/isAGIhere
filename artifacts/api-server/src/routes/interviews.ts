import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { interviewsTable, peopleTable } from "@workspace/db/schema";
import { eq, desc, count, and, isNotNull, ilike, type SQL } from "drizzle-orm";

const router: IRouter = Router();

// GET /interviews — paginated list, filterable by personId and topic
router.get("/interviews", async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 20, 50);
  const offset = Number(req.query.offset) || 0;
  const personId = req.query.personId ? Number(req.query.personId) : undefined;
  const topic = req.query.topic as string | undefined;

  const conditions: SQL[] = [];
  if (personId && !isNaN(personId)) conditions.push(eq(interviewsTable.personId, personId));
  if (topic) conditions.push(ilike(interviewsTable.topics, `%${topic}%`));
  const where: SQL | undefined = conditions.length === 0
    ? undefined
    : conditions.length === 1
    ? conditions[0]
    : and(...conditions);

  const [items, [{ value: total }]] = await Promise.all([
    db
      .select({
        id: interviewsTable.id,
        personId: interviewsTable.personId,
        personName: peopleTable.name,
        personCategory: peopleTable.category,
        personImageUrl: peopleTable.imageUrl,
        videoId: interviewsTable.videoId,
        channelName: interviewsTable.channelName,
        title: interviewsTable.title,
        url: interviewsTable.url,
        thumbnailUrl: interviewsTable.thumbnailUrl,
        publishedAt: interviewsTable.publishedAt,
        durationSeconds: interviewsTable.durationSeconds,
        viewCount: interviewsTable.viewCount,
        aiSummary: interviewsTable.aiSummary,
        keyTakeaways: interviewsTable.keyTakeaways,
        topics: interviewsTable.topics,
        hasTranscript: isNotNull(interviewsTable.transcriptText),
      })
      .from(interviewsTable)
      .leftJoin(peopleTable, eq(interviewsTable.personId, peopleTable.id))
      .where(where)
      .orderBy(desc(interviewsTable.publishedAt))
      .limit(limit)
      .offset(offset),
    db.select({ value: count() }).from(interviewsTable).where(where),
  ]);

  res.json({
    items: items.map((i) => ({
      ...i,
      publishedAt: i.publishedAt?.toISOString() ?? null,
      keyTakeaways: i.keyTakeaways ? JSON.parse(i.keyTakeaways) : [],
      topics: i.topics ? JSON.parse(i.topics) : [],
    })),
    total: Number(total),
    hasMore: offset + limit < Number(total),
  });
});

// GET /people/:id/interviews — interviews for a specific person
router.get("/people/:id/interviews", async (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const limit = Math.min(Number(req.query.limit) || 10, 30);

  const items = await db
    .select()
    .from(interviewsTable)
    .where(eq(interviewsTable.personId, id))
    .orderBy(desc(interviewsTable.publishedAt))
    .limit(limit);

  res.json(items.map((i) => ({
    ...i,
    publishedAt: i.publishedAt?.toISOString() ?? null,
    keyTakeaways: i.keyTakeaways ? JSON.parse(i.keyTakeaways) : [],
    topics: i.topics ? JSON.parse(i.topics) : [],
  })));
});

// GET /interviews/:id/transcript — transcript if available
router.get("/interviews/:id/transcript", async (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const [row] = await db
    .select({ transcriptText: interviewsTable.transcriptText, title: interviewsTable.title })
    .from(interviewsTable)
    .where(eq(interviewsTable.id, id))
    .limit(1);

  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  if (!row.transcriptText) { res.status(404).json({ error: "Transcript not yet available" }); return; }
  res.json({ title: row.title, transcript: row.transcriptText });
});

// POST /interviews/refresh — admin-only manual trigger
router.post("/interviews/refresh", async (req, res) => {
  const { fetchPersonInterviews, fetchInterviewerChannels } = await import("../lib/youtube-fetcher");
  const { generateMissingSummaries } = await import("../lib/interview-summarizer");
  const [fetched, fetchedChannels] = await Promise.all([fetchPersonInterviews(), fetchInterviewerChannels()]);
  const summarized = await generateMissingSummaries(10);
  res.json({ fetched, fetchedChannels, summarized });
});

export default router;
