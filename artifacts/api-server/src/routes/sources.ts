import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { sourcesTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { ListSourcesQueryParams } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/sources", async (req, res) => {
  const parsed = ListSourcesQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid query params" });
    return;
  }
  const { type } = parsed.data;

  const sources = type
    ? await db.select().from(sourcesTable).where(eq(sourcesTable.type, type))
    : await db.select().from(sourcesTable);

  res.json(sources);
});

export default router;
