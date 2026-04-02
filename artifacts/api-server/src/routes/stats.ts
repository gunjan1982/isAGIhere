import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { peopleTable, sourcesTable, communitiesTable } from "@workspace/db/schema";
import { sql } from "drizzle-orm";

const router: IRouter = Router();

router.get("/stats", async (_req, res) => {
  const [people, sources, communities] = await Promise.all([
    db.select().from(peopleTable),
    db.select().from(sourcesTable),
    db.select().from(communitiesTable),
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
    categoryCounts,
    sourceTypeCounts,
  });
});

router.get("/featured", async (_req, res) => {
  const [allPeople, allSources] = await Promise.all([
    db.select().from(peopleTable),
    db.select().from(sourcesTable),
  ]);

  const spotlightPerson = allPeople.find((p) => p.isSpotlight) || allPeople[0] || null;
  const topNewsletters = allSources.filter((s) => s.type === "newsletter" && s.isHighSignal).slice(0, 4);
  const topPodcasts = allSources.filter((s) => s.type === "podcast" && s.isHighSignal).slice(0, 4);
  const vibeCodingVoices = allPeople.filter((p) => p.category === "vibe_coders").slice(0, 4);

  res.json({
    spotlightPerson,
    topNewsletters,
    topPodcasts,
    vibeCodingVoices,
  });
});

export default router;
