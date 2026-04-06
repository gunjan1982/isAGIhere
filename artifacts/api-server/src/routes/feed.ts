import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { feedItemsTable, peopleTable } from "@workspace/db/schema";
import { eq, desc, count, isNull, isNotNull, and, SQL } from "drizzle-orm";
import { GetFeedQueryParams } from "@workspace/api-zod";
import { refreshFeeds } from "../lib/rss-fetcher";

const router: IRouter = Router();

router.get("/feed", async (req, res) => {
  const parsed = GetFeedQueryParams.safeParse(req.query);
  const limit = Math.min(parsed.success && parsed.data.limit ? parsed.data.limit : 30, 100);
  const offset = parsed.success && parsed.data.offset ? parsed.data.offset : 0;
  const personId = parsed.success && parsed.data.personId ? parsed.data.personId : undefined;
  const feedFilter = req.query.filter as string | undefined;

  let where: SQL | undefined;
  if (personId) {
    where = eq(feedItemsTable.personId, personId);
  } else if (feedFilter === "people") {
    where = isNotNull(feedItemsTable.personId);
  } else if (feedFilter === "sources") {
    where = isNull(feedItemsTable.personId);
  }

  const [items, [{ value: total }]] = await Promise.all([
    db
      .select({
        id: feedItemsTable.id,
        personId: feedItemsTable.personId,
        personName: peopleTable.name,
        personCategory: peopleTable.category,
        title: feedItemsTable.title,
        url: feedItemsTable.url,
        description: feedItemsTable.description,
        sourceName: feedItemsTable.sourceName,
        sourceUrl: feedItemsTable.sourceUrl,
        imageUrl: feedItemsTable.imageUrl,
        publishedAt: feedItemsTable.publishedAt,
        type: feedItemsTable.type,
      })
      .from(feedItemsTable)
      .leftJoin(peopleTable, eq(feedItemsTable.personId, peopleTable.id))
      .where(where)
      .orderBy(desc(feedItemsTable.publishedAt), desc(feedItemsTable.fetchedAt))
      .limit(limit)
      .offset(offset),
    db
      .select({ value: count() })
      .from(feedItemsTable)
      .where(where),
  ]);

  const mapped = items.map((item) => ({
    ...item,
    publishedAt: item.publishedAt ? item.publishedAt.toISOString() : null,
  }));

  res.json({ items: mapped, total: Number(total), hasMore: offset + limit < Number(total) });
});

router.get("/people/:id/feed", async (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const limit = Math.min(Number(req.query.limit) || 20, 50);

  const items = await db
    .select({
      id: feedItemsTable.id,
      personId: feedItemsTable.personId,
      personName: peopleTable.name,
      personCategory: peopleTable.category,
      title: feedItemsTable.title,
      url: feedItemsTable.url,
      description: feedItemsTable.description,
      sourceName: feedItemsTable.sourceName,
      sourceUrl: feedItemsTable.sourceUrl,
      imageUrl: feedItemsTable.imageUrl,
      publishedAt: feedItemsTable.publishedAt,
      type: feedItemsTable.type,
    })
    .from(feedItemsTable)
    .leftJoin(peopleTable, eq(feedItemsTable.personId, peopleTable.id))
    .where(eq(feedItemsTable.personId, id))
    .orderBy(desc(feedItemsTable.publishedAt), desc(feedItemsTable.fetchedAt))
    .limit(limit);

  res.json(items.map((item) => ({
    ...item,
    publishedAt: item.publishedAt ? item.publishedAt.toISOString() : null,
  })));
});

router.post("/feed/refresh", async (_req, res) => {
  const fetched = await refreshFeeds();
  res.json({ fetched, message: `Fetched ${fetched} new items` });
});

export default router;
