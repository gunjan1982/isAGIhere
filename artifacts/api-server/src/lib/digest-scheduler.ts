import { db } from "@workspace/db";
import { feedItemsTable, userFollowsTable, peopleTable } from "@workspace/db/schema";
import { desc, gte, sql, inArray } from "drizzle-orm";
import { createClerkClient } from "@clerk/express";
import { sendWeeklyDigest, type DigestItem, type DigestPerson } from "./email";

export async function buildDigestPayload() {
  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

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

  const [{ count: totalStories }] = await db
    .select({ count: sql<number>`cast(count(*) as int)` })
    .from(feedItemsTable)
    .where(gte(feedItemsTable.publishedAt, oneWeekAgo));

  const [{ count: sourcesActive }] = await db
    .select({ count: sql<number>`cast(count(distinct source_name) as int)` })
    .from(feedItemsTable)
    .where(gte(feedItemsTable.publishedAt, oneWeekAgo));

  const [{ count: peopleTracked }] = await db
    .select({ count: sql<number>`cast(count(*) as int)` })
    .from(peopleTable);

  const topPeopleRaw = await db
    .select({ personId: feedItemsTable.personId, count: sql<number>`cast(count(*) as int)` })
    .from(feedItemsTable)
    .where(gte(feedItemsTable.publishedAt, oneWeekAgo))
    .groupBy(feedItemsTable.personId)
    .orderBy(desc(sql`count(*)`))
    .limit(4);

  const personIds = topPeopleRaw.map(r => r.personId).filter((id): id is number => id !== null);

  const spotlightPeople: DigestPerson[] = personIds.length > 0
    ? await db.select({ id: peopleTable.id, name: peopleTable.name, role: peopleTable.role, imageUrl: peopleTable.imageUrl })
        .from(peopleTable).where(inArray(peopleTable.id, personIds))
    : [];

  const weekLabel = formatWeekLabel();

  return {
    topStories: stories.map(s => ({ ...s, publishedAt: s.publishedAt ?? null })) as DigestItem[],
    spotlightPeople,
    weekLabel,
    stats: { totalStories: totalStories ?? 0, sourcesActive: sourcesActive ?? 0, peopleTracked: peopleTracked ?? 0 },
  };
}

export async function buildDigestAndSendToAll(): Promise<{ sent: number; errors: number }> {
  const clerkClient = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });
  const payload = await buildDigestPayload();

  const rows = await db.selectDistinct({ userId: userFollowsTable.userId }).from(userFollowsTable);
  const userIds = rows.map(r => r.userId);

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

  return { sent, errors };
}

function formatWeekLabel(): string {
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const fmt = (d: Date) => d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return `${fmt(weekAgo)}–${fmt(now)} ${now.getFullYear()}`;
}
