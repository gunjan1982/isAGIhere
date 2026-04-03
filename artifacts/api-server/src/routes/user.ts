import { Router, type IRouter } from "express";
import { getAuth } from "@clerk/express";
import { db } from "@workspace/db";
import { userFollowsTable, customSourcesTable, peopleTable, sourcesTable, communitiesTable } from "@workspace/db/schema";
import { eq, and } from "drizzle-orm";

const router: IRouter = Router();

function requireAuth(req: any, res: any, next: any) {
  const auth = getAuth(req);
  const userId = auth?.userId;
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  req.userId = userId;
  next();
}

// GET /api/user/follows — all follows for current user
router.get("/user/follows", requireAuth, async (req: any, res) => {
  try {
    const follows = await db
      .select()
      .from(userFollowsTable)
      .where(eq(userFollowsTable.userId, req.userId));
    res.json(follows);
  } catch (e) {
    res.status(500).json({ error: "Failed to fetch follows" });
  }
});

// POST /api/user/follows — follow an entity
router.post("/user/follows", requireAuth, async (req: any, res) => {
  const { entityType, entityId } = req.body;
  if (!entityType || !entityId || !["person", "source", "community"].includes(entityType)) {
    res.status(400).json({ error: "Invalid entityType or entityId" });
    return;
  }
  try {
    const [follow] = await db
      .insert(userFollowsTable)
      .values({ userId: req.userId, entityType, entityId: Number(entityId) })
      .onConflictDoNothing()
      .returning();
    res.json(follow ?? { already: true });
  } catch (e) {
    res.status(500).json({ error: "Failed to follow" });
  }
});

// DELETE /api/user/follows — unfollow an entity
router.delete("/user/follows", requireAuth, async (req: any, res) => {
  const { entityType, entityId } = req.body;
  if (!entityType || !entityId) {
    res.status(400).json({ error: "Missing entityType or entityId" });
    return;
  }
  try {
    await db
      .delete(userFollowsTable)
      .where(
        and(
          eq(userFollowsTable.userId, req.userId),
          eq(userFollowsTable.entityType, entityType),
          eq(userFollowsTable.entityId, Number(entityId))
        )
      );
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: "Failed to unfollow" });
  }
});

// GET /api/user/hub — personalized hub: followed people/sources/communities + custom sources
router.get("/user/hub", requireAuth, async (req: any, res) => {
  try {
    const follows = await db
      .select()
      .from(userFollowsTable)
      .where(eq(userFollowsTable.userId, req.userId));

    const personIds = follows.filter(f => f.entityType === "person").map(f => f.entityId);
    const sourceIds = follows.filter(f => f.entityType === "source").map(f => f.entityId);
    const communityIds = follows.filter(f => f.entityType === "community").map(f => f.entityId);

    const [people, sources, communities, customSources] = await Promise.all([
      personIds.length > 0
        ? db.select().from(peopleTable).then(all => all.filter(p => personIds.includes(p.id)))
        : Promise.resolve([]),
      sourceIds.length > 0
        ? db.select().from(sourcesTable).then(all => all.filter(s => sourceIds.includes(s.id)))
        : Promise.resolve([]),
      communityIds.length > 0
        ? db.select().from(communitiesTable).then(all => all.filter(c => communityIds.includes(c.id)))
        : Promise.resolve([]),
      db.select().from(customSourcesTable).where(eq(customSourcesTable.userId, req.userId)),
    ]);

    res.json({ people, sources, communities, customSources });
  } catch (e) {
    res.status(500).json({ error: "Failed to fetch hub" });
  }
});

// GET /api/user/custom-sources
router.get("/user/custom-sources", requireAuth, async (req: any, res) => {
  try {
    const sources = await db
      .select()
      .from(customSourcesTable)
      .where(eq(customSourcesTable.userId, req.userId));
    res.json(sources);
  } catch (e) {
    res.status(500).json({ error: "Failed to fetch custom sources" });
  }
});

// POST /api/user/custom-sources
router.post("/user/custom-sources", requireAuth, async (req: any, res) => {
  const { name, url, platform } = req.body;
  if (!name || !url) {
    res.status(400).json({ error: "name and url are required" });
    return;
  }
  try {
    const [source] = await db
      .insert(customSourcesTable)
      .values({ userId: req.userId, name, url, platform: platform || "website" })
      .returning();
    res.json(source);
  } catch (e) {
    res.status(500).json({ error: "Failed to add custom source" });
  }
});

// DELETE /api/user/custom-sources/:id
router.delete("/user/custom-sources/:id", requireAuth, async (req: any, res) => {
  try {
    await db
      .delete(customSourcesTable)
      .where(
        and(
          eq(customSourcesTable.id, Number(req.params.id)),
          eq(customSourcesTable.userId, req.userId)
        )
      );
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: "Failed to delete custom source" });
  }
});

export default router;
