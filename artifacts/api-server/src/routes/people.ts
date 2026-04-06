import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { peopleTable, feedItemsTable } from "@workspace/db/schema";
import { eq, like, or, SQL, gte, count, inArray, and } from "drizzle-orm";
import { ListPeopleQueryParams, GetPersonParams } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/people", async (req, res) => {
  const parsed = ListPeopleQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid query params" });
    return;
  }
  const { category, search } = parsed.data;

  const conditions: SQL[] = [];
  if (category) {
    conditions.push(eq(peopleTable.category, category));
  }
  if (search) {
    conditions.push(
      or(
        like(peopleTable.name, `%${search}%`),
        like(peopleTable.role, `%${search}%`),
        like(peopleTable.organization, `%${search}%`)
      ) as SQL
    );
  }

  const people = conditions.length > 0
    ? await db.select().from(peopleTable).where(conditions.length === 1 ? conditions[0] : conditions[0])
    : await db.select().from(peopleTable);

  // Count feed items in last 7 days per person for "hot this week" badge
  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const personIds = people.map(p => p.id);
  const hotCounts = personIds.length > 0
    ? await db
        .select({ personId: feedItemsTable.personId, cnt: count(feedItemsTable.id) })
        .from(feedItemsTable)
        .where(
          and(inArray(feedItemsTable.personId, personIds), gte(feedItemsTable.publishedAt, oneWeekAgo))
        )
        .groupBy(feedItemsTable.personId)
    : [];

  const hotMap: Record<number, number> = {};
  for (const row of hotCounts) {
    if (row.personId != null) hotMap[row.personId] = Number(row.cnt);
  }

  res.json(people.map(p => ({ ...p, recentItemCount: hotMap[p.id] ?? 0 })));
});

router.get("/people/:id", async (req, res) => {
  const parsed = GetPersonParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const [person] = await db.select().from(peopleTable).where(eq(peopleTable.id, parsed.data.id)).limit(1);
  if (!person) {
    res.status(404).json({ error: "Person not found" });
    return;
  }
  res.json(person);
});

export default router;
