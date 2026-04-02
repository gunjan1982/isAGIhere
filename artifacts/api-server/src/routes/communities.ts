import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { communitiesTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { ListCommunitiesQueryParams } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/communities", async (req, res) => {
  const parsed = ListCommunitiesQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid query params" });
    return;
  }
  const { platform } = parsed.data;

  const communities = platform
    ? await db.select().from(communitiesTable).where(eq(communitiesTable.platform, platform))
    : await db.select().from(communitiesTable);

  res.json(communities);
});

export default router;
