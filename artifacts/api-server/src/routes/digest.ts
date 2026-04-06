import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { feedItemsTable, userFollowsTable, peopleTable } from "@workspace/db/schema";
import { desc, gte, sql, inArray } from "drizzle-orm";
import { getAuth } from "@clerk/express";
import { createClerkClient } from "@clerk/express";
import { sendWeeklyDigest, type DigestItem, type DigestPerson } from "../lib/email";

const router: IRouter = Router();
const ADMIN_EMAIL = "gunjan1982@gmail.com";

// Build the digest payload (stories + people) — shared by preview and send
async function buildDigestPayload() {
  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  // Top stories from the last 7 days
  const stories = await db
    .select({
      id: feedItemsTable.id,
      title: feedItemsTable.title,
      url: feedItemsTable.url,
      sourceName: feedItemsTable.sourceName,
      publishedAt: feedItemsTable.publishedAt,
    })
    .from(feedItemsTable)
    .where(gte(feedItemsTable.publishedAt, oneWeekAgo))
    .orderBy(desc(feedItemsTable.publishedAt))
    .limit(10);

  // Count of stories in the past 7 days
  const [{ count: totalStories }] = await db
    .select({ count: sql<number>`cast(count(*) as int)` })
    .from(feedItemsTable)
    .where(gte(feedItemsTable.publishedAt, oneWeekAgo));

  // Distinct sources active this week
  const [{ count: sourcesActive }] = await db
    .select({ count: sql<number>`cast(count(distinct source_name) as int)` })
    .from(feedItemsTable)
    .where(gte(feedItemsTable.publishedAt, oneWeekAgo));

  // Total people tracked
  const [{ count: peopleTracked }] = await db
    .select({ count: sql<number>`cast(count(*) as int)` })
    .from(peopleTable);

  // Spotlight: top people by recent feed volume
  const topPeopleRaw = await db
    .select({
      personId: feedItemsTable.personId,
      count: sql<number>`cast(count(*) as int)`,
    })
    .from(feedItemsTable)
    .where(gte(feedItemsTable.publishedAt, oneWeekAgo))
    .groupBy(feedItemsTable.personId)
    .orderBy(desc(sql`count(*)`))
    .limit(4);

  const personIds = topPeopleRaw
    .map(r => r.personId)
    .filter((id): id is number => id !== null);

  const spotlightPeople: DigestPerson[] = personIds.length > 0
    ? (await db
        .select({ id: peopleTable.id, name: peopleTable.name, role: peopleTable.role, imageUrl: peopleTable.imageUrl })
        .from(peopleTable)
        .where(inArray(peopleTable.id, personIds)))
    : [];

  const weekLabel = formatWeekLabel();

  return {
    topStories: stories.map(s => ({ ...s, publishedAt: s.publishedAt ?? null })) as DigestItem[],
    spotlightPeople,
    weekLabel,
    stats: {
      totalStories: totalStories ?? 0,
      sourcesActive: sourcesActive ?? 0,
      peopleTracked: peopleTracked ?? 0,
    },
  };
}

// GET /api/digest/preview — admin: preview digest payload
router.get("/digest/preview", async (req, res) => {
  const clerkClient = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });
  const auth = getAuth(req);
  if (!auth?.userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  try {
    const user = await clerkClient.users.getUser(auth.userId);
    if (user.emailAddresses[0]?.emailAddress !== ADMIN_EMAIL) {
      res.status(403).json({ error: "ACCESS_DENIED" });
      return;
    }
  } catch {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  try {
    const payload = await buildDigestPayload();
    res.json(payload);
  } catch (err) {
    res.status(500).json({ error: "Failed to build digest" });
  }
});

// POST /api/digest/send — admin: send digest to all followers
router.post("/digest/send", async (req, res) => {
  const clerkClient = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });
  const auth = getAuth(req);
  if (!auth?.userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  try {
    const user = await clerkClient.users.getUser(auth.userId);
    if (user.emailAddresses[0]?.emailAddress !== ADMIN_EMAIL) {
      res.status(403).json({ error: "ACCESS_DENIED" });
      return;
    }
  } catch {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  try {
    const payload = await buildDigestPayload();

    // Get all unique Clerk user IDs that have at least one follow
    const rows = await db
      .selectDistinct({ userId: userFollowsTable.userId })
      .from(userFollowsTable);

    const userIds = rows.map(r => r.userId);

    if (userIds.length === 0) {
      res.json({ sent: 0, message: "No followers to send to yet" });
      return;
    }

    // Fetch Clerk user details (email + name) in batches of 100
    let sent = 0;
    let errors = 0;

    for (let i = 0; i < userIds.length; i += 100) {
      const batch = userIds.slice(i, i + 100);
      const { data: clerkUsers } = await clerkClient.users.getUserList({ userId: batch, limit: 100 });

      for (const cu of clerkUsers) {
        const email = cu.emailAddresses[0]?.emailAddress;
        if (!email) continue;
        const name = cu.firstName || undefined;

        try {
          await sendWeeklyDigest({ toEmail: email, toName: name, ...payload });
          sent++;
        } catch {
          errors++;
        }
      }
    }

    res.json({ sent, errors, total: userIds.length, weekLabel: payload.weekLabel });
  } catch (err) {
    res.status(500).json({ error: "Failed to send digest" });
  }
});

// POST /api/digest/send-test — admin: send test to self only
router.post("/digest/send-test", async (req, res) => {
  const clerkClient = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });
  const auth = getAuth(req);
  if (!auth?.userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  let adminEmail = ADMIN_EMAIL;
  try {
    const user = await clerkClient.users.getUser(auth.userId);
    const email = user.emailAddresses[0]?.emailAddress;
    if (email !== ADMIN_EMAIL) { res.status(403).json({ error: "ACCESS_DENIED" }); return; }
    adminEmail = email;
  } catch {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  try {
    const payload = await buildDigestPayload();
    await sendWeeklyDigest({ toEmail: adminEmail, toName: "Admin", ...payload });
    res.json({ sent: 1, to: adminEmail });
  } catch (err: unknown) {
    res.status(500).json({ error: String(err) });
  }
});

function formatWeekLabel(): string {
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const fmt = (d: Date) => d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return `${fmt(weekAgo)}–${fmt(now)} ${now.getFullYear()}`;
}

export default router;
