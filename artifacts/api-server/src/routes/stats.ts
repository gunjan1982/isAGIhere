import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { peopleTable, sourcesTable, communitiesTable, feedItemsTable } from "@workspace/db/schema";
import { count, desc, eq, inArray, sql } from "drizzle-orm";

const router: IRouter = Router();

router.get("/stats", async (_req, res) => {
  const [people, sources, communities, [{ feedCount }]] = await Promise.all([
    db.select().from(peopleTable),
    db.select().from(sourcesTable),
    db.select().from(communitiesTable),
    db.select({ feedCount: count() }).from(feedItemsTable),
  ]);

  const categoryCounts: Record<string, number> = {};
  for (const p of people) {
    categoryCounts[p.category] = (categoryCounts[p.category] || 0) + 1;
  }

  const sourceTypeCounts: Record<string, number> = {};
  for (const s of sources) {
    sourceTypeCounts[s.type] = (sourceTypeCounts[s.type] || 0) + 1;
  }

  res.json({
    totalPeople: people.length,
    totalSources: sources.length,
    totalCommunities: communities.length,
    totalFeedItems: Number(feedCount),
    categoryCounts,
    sourceTypeCounts,
  });
});

router.get("/featured", async (_req, res) => {
  const [allPeople, allSources, recentFeed] = await Promise.all([
    db.select().from(peopleTable),
    db.select().from(sourcesTable),
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
      .orderBy(desc(feedItemsTable.publishedAt), desc(feedItemsTable.fetchedAt))
      .limit(12),
  ]);

  // Top 6 people by feed volume
  const feedCountsResult = await db
    .select({
      personId: feedItemsTable.personId,
      cnt: count(feedItemsTable.id),
    })
    .from(feedItemsTable)
    .where(sql`${feedItemsTable.personId} IS NOT NULL`)
    .groupBy(feedItemsTable.personId)
    .orderBy(desc(count(feedItemsTable.id)))
    .limit(6);

  const topPersonIds = feedCountsResult
    .map((r) => r.personId)
    .filter((id): id is number => id !== null);

  // Fetch recent feed items for those people (top 12 per person)
  const spotlightFeedItems = topPersonIds.length
    ? await db
        .select({
          id: feedItemsTable.id,
          personId: feedItemsTable.personId,
          title: feedItemsTable.title,
          url: feedItemsTable.url,
          sourceName: feedItemsTable.sourceName,
          publishedAt: feedItemsTable.publishedAt,
          type: feedItemsTable.type,
        })
        .from(feedItemsTable)
        .where(inArray(feedItemsTable.personId, topPersonIds))
        .orderBy(desc(feedItemsTable.publishedAt))
        .limit(200)
    : [];

  // Group feed items by personId
  const feedByPerson: Record<number, typeof spotlightFeedItems> = {};
  for (const item of spotlightFeedItems) {
    if (item.personId) {
      if (!feedByPerson[item.personId]) feedByPerson[item.personId] = [];
      if (feedByPerson[item.personId].length < 12) feedByPerson[item.personId].push(item);
    }
  }

  // Build spotlight people array — only include those with recent feed items
  const spotlightPeople = topPersonIds
    .map((id) => {
      const person = allPeople.find((p) => p.id === id);
      if (!person) return null;
      const items = (feedByPerson[id] || []).map((item) => ({
        ...item,
        publishedAt: item.publishedAt ? item.publishedAt.toISOString() : null,
      }));
      if (items.length === 0) return null; // Skip people with no activity
      return { ...person, feedItems: items };
    })
    .filter(Boolean);

  const spotlightPerson = allPeople.find((p) => p.isSpotlight) || allPeople[0] || null;
  const topNewsletters = allSources.filter((s) => s.type === "newsletter" && s.isHighSignal).slice(0, 4);
  const topPodcasts = allSources.filter((s) => s.type === "podcast" && s.isHighSignal).slice(0, 4);
  const vibeCodingVoices = allPeople.filter((p) => p.category === "vibe_coders").slice(0, 4);

  res.json({
    spotlightPerson,
    spotlightPeople,
    topNewsletters,
    topPodcasts,
    vibeCodingVoices,
    recentFeed: recentFeed.map((item) => ({
      ...item,
      publishedAt: item.publishedAt ? item.publishedAt.toISOString() : null,
    })),
  });
});

export default router;
