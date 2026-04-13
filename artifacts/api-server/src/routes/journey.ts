import { Router, type IRouter, type Request, type Response } from "express";
import { getAuth } from "@clerk/express";
import { db } from "@workspace/db";
import {
  aiJourneyProfilesTable,
  aiToolUsageTable,
  frontierModelReviewsTable,
} from "@workspace/db/schema";
import { eq, desc, and, avg, count } from "drizzle-orm";

const router: IRouter = Router();

router.get("/journey/feed", async (req: Request, res: Response) => {
  const limit = Math.min(Number(req.query.limit) || 20, 50);
  const offset = Number(req.query.offset) || 0;

  const profiles = await db
    .select()
    .from(aiJourneyProfilesTable)
    .where(eq(aiJourneyProfilesTable.isPublic, true))
    .orderBy(desc(aiJourneyProfilesTable.updatedAt))
    .limit(limit)
    .offset(offset);

  res.json(profiles);
});

router.get("/journey/profile", async (req: Request, res: Response) => {
  const { userId } = getAuth(req);
  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const [profile] = await db
    .select()
    .from(aiJourneyProfilesTable)
    .where(eq(aiJourneyProfilesTable.userId, userId))
    .limit(1);

  res.json(profile ?? null);
});

router.post("/journey/profile", async (req: Request, res: Response) => {
  const { userId } = getAuth(req);
  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const data = req.body;
  await db
    .insert(aiJourneyProfilesTable)
    .values({ ...data, userId, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: aiJourneyProfilesTable.userId,
      set: { ...data, updatedAt: new Date() },
    });

  const [profile] = await db
    .select()
    .from(aiJourneyProfilesTable)
    .where(eq(aiJourneyProfilesTable.userId, userId))
    .limit(1);

  res.json(profile ?? null);
});

router.get("/journey/tools/mine", async (req: Request, res: Response) => {
  const { userId } = getAuth(req);
  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const tools = await db
    .select()
    .from(aiToolUsageTable)
    .where(eq(aiToolUsageTable.userId, userId))
    .orderBy(desc(aiToolUsageTable.updatedAt));

  res.json(tools);
});

router.post("/journey/tools", async (req: Request, res: Response) => {
  const { userId } = getAuth(req);
  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { id, ...data } = req.body;
  if (id) {
    await db
      .update(aiToolUsageTable)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(aiToolUsageTable.id, Number(id)), eq(aiToolUsageTable.userId, userId)));
  } else {
    await db.insert(aiToolUsageTable).values({ ...data, userId });
  }

  res.json({ ok: true });
});

router.delete("/journey/tools/:id", async (req: Request, res: Response) => {
  const { userId } = getAuth(req);
  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  await db
    .delete(aiToolUsageTable)
    .where(and(eq(aiToolUsageTable.id, Number(req.params.id)), eq(aiToolUsageTable.userId, userId)));

  res.json({ ok: true });
});

router.get("/journey/models", async (req: Request, res: Response) => {
  const rows = await db
    .select({
      provider: frontierModelReviewsTable.provider,
      modelName: frontierModelReviewsTable.modelName,
      avgRating: avg(frontierModelReviewsTable.overallRating),
      reviewCount: count(),
    })
    .from(frontierModelReviewsTable)
    .where(eq(frontierModelReviewsTable.isPublic, true))
    .groupBy(frontierModelReviewsTable.provider, frontierModelReviewsTable.modelName)
    .orderBy(frontierModelReviewsTable.provider, frontierModelReviewsTable.modelName);

  res.json(rows);
});

router.get("/journey/models/reviews", async (req: Request, res: Response) => {
  const limit = Math.min(Number(req.query.limit) || 20, 50);
  const modelName = req.query.model as string | undefined;

  const reviews = modelName
    ? await db
        .select()
        .from(frontierModelReviewsTable)
        .where(and(eq(frontierModelReviewsTable.isPublic, true), eq(frontierModelReviewsTable.modelName, modelName)))
        .orderBy(desc(frontierModelReviewsTable.updatedAt))
        .limit(limit)
    : await db
        .select()
        .from(frontierModelReviewsTable)
        .where(eq(frontierModelReviewsTable.isPublic, true))
        .orderBy(desc(frontierModelReviewsTable.updatedAt))
        .limit(limit);

  res.json(reviews);
});

router.get("/journey/models/mine", async (req: Request, res: Response) => {
  const { userId } = getAuth(req);
  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const reviews = await db
    .select()
    .from(frontierModelReviewsTable)
    .where(eq(frontierModelReviewsTable.userId, userId))
    .orderBy(desc(frontierModelReviewsTable.updatedAt));

  res.json(reviews);
});

router.post("/journey/models", async (req: Request, res: Response) => {
  const { userId } = getAuth(req);
  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { id, ...data } = req.body;
  if (id) {
    await db
      .update(frontierModelReviewsTable)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(frontierModelReviewsTable.id, Number(id)), eq(frontierModelReviewsTable.userId, userId)));
  } else {
    await db.insert(frontierModelReviewsTable).values({ ...data, userId });
  }

  res.json({ ok: true });
});

router.delete("/journey/models/:id", async (req: Request, res: Response) => {
  const { userId } = getAuth(req);
  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  await db
    .delete(frontierModelReviewsTable)
    .where(and(eq(frontierModelReviewsTable.id, Number(req.params.id)), eq(frontierModelReviewsTable.userId, userId)));

  res.json({ ok: true });
});

export default router;
