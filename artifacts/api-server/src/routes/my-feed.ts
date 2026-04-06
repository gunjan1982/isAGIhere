import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { feedItemsTable, userFollowsTable } from "@workspace/db/schema";
import { desc, inArray, eq, and, or } from "drizzle-orm";
import { getAuth } from "@clerk/express";

const router: IRouter = Router();

// GET /api/user/feed — personalized feed based on followed people & sources
router.get("/user/feed", async (req, res) => {
  const auth = getAuth(req);
  if (!auth?.userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const limit = Math.min(Number(req.query.limit) || 30, 100);
  const offset = Number(req.query.offset) || 0;

  try {
    // Get what the user follows
    const follows = await db
      .select()
      .from(userFollowsTable)
      .where(eq(userFollowsTable.userId, auth.userId));

    const followedPersonIds = follows
      .filter(f => f.entityType === "person")
      .map(f => f.entityId);

    if (followedPersonIds.length === 0) {
      res.json({ items: [], total: 0, hasMore: false });
      return;
    }

    // Fetch feed items from followed people
    const items = await db
      .select({
        id: feedItemsTable.id,
        title: feedItemsTable.title,
        url: feedItemsTable.url,
        description: feedItemsTable.description,
        sourceName: feedItemsTable.sourceName,
        publishedAt: feedItemsTable.publishedAt,
        imageUrl: feedItemsTable.imageUrl,
        personId: feedItemsTable.personId,
        type: feedItemsTable.type,
      })
      .from(feedItemsTable)
      .where(inArray(feedItemsTable.personId, followedPersonIds))
      .orderBy(desc(feedItemsTable.publishedAt))
      .limit(limit)
      .offset(offset);

    res.json({
      items: items.map(i => ({ ...i, publishedAt: i.publishedAt ? i.publishedAt.toISOString() : null })),
      hasMore: items.length === limit,
      followedPeople: followedPersonIds.length,
    });
  } catch {
    res.status(500).json({ error: "Failed to fetch personalized feed" });
  }
});

export default router;
