import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { peopleTable, sourcesTable, communitiesTable, feedItemsTable } from "@workspace/db/schema";
import { ilike, or, desc } from "drizzle-orm";
import { sql } from "drizzle-orm";

const router: IRouter = Router();

router.get("/search", async (req, res) => {
  const q = (req.query.q as string || "").trim();
  if (!q || q.length < 2) {
    res.json({ people: [], sources: [], communities: [], feed: [] });
    return;
  }

  const term = `%${q}%`;

  const [people, sources, communities, feed] = await Promise.all([
    db.select({
      id: peopleTable.id,
      name: peopleTable.name,
      role: peopleTable.role,
      organization: peopleTable.organization,
      category: peopleTable.category,
      imageUrl: peopleTable.imageUrl,
      bio: peopleTable.bio,
    })
    .from(peopleTable)
    .where(or(
      ilike(peopleTable.name, term),
      ilike(peopleTable.role, term),
      ilike(peopleTable.organization, term),
      ilike(peopleTable.bio, term),
      ilike(peopleTable.category, term),
    ))
    .limit(8),

    db.select({
      id: sourcesTable.id,
      name: sourcesTable.name,
      type: sourcesTable.type,
      description: sourcesTable.description,
      url: sourcesTable.url,
      host: sourcesTable.host,
    })
    .from(sourcesTable)
    .where(or(
      ilike(sourcesTable.name, term),
      ilike(sourcesTable.description, term),
      ilike(sourcesTable.host, term),
      ilike(sourcesTable.type, term),
    ))
    .limit(6),

    db.select({
      id: communitiesTable.id,
      name: communitiesTable.name,
      platform: communitiesTable.platform,
      description: communitiesTable.description,
      url: communitiesTable.url,
      memberCount: communitiesTable.memberCount,
    })
    .from(communitiesTable)
    .where(or(
      ilike(communitiesTable.name, term),
      ilike(communitiesTable.description, term),
      ilike(communitiesTable.platform, term),
    ))
    .limit(4),

    db.select({
      id: feedItemsTable.id,
      title: feedItemsTable.title,
      url: feedItemsTable.url,
      sourceName: feedItemsTable.sourceName,
      publishedAt: feedItemsTable.publishedAt,
      description: feedItemsTable.description,
    })
    .from(feedItemsTable)
    .where(or(
      ilike(feedItemsTable.title, term),
      ilike(feedItemsTable.description, term),
      ilike(feedItemsTable.sourceName, term),
    ))
    .orderBy(desc(feedItemsTable.publishedAt))
    .limit(6),
  ]);

  res.json({
    people,
    sources,
    communities,
    feed: feed.map(f => ({
      ...f,
      publishedAt: f.publishedAt ? f.publishedAt.toISOString() : null,
    })),
    total: people.length + sources.length + communities.length + feed.length,
  });
});

export default router;
