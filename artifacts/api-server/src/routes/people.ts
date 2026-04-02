import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { peopleTable } from "@workspace/db/schema";
import { eq, like, or, SQL } from "drizzle-orm";
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

  res.json(people);
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
