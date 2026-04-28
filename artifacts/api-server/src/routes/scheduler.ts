import { Router, type Request, type Response, type NextFunction } from "express";
import { refreshFeeds } from "../lib/rss-fetcher";
import { fetchPersonInterviews, fetchInterviewerChannels } from "../lib/youtube-fetcher";
import { logger } from "../lib/logger";

const router = Router();

function verifyScheduler(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    logger.warn("Missing authorization header in scheduler request");
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
}

router.post("/internal/refresh-feeds", verifyScheduler, async (req: Request, res: Response) => {
  try {
    await refreshFeeds();
    res.json({ ok: true });
  } catch (error) {
    logger.error({ error }, "Error refreshing feeds via scheduler");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.post("/internal/fetch-interviews", verifyScheduler, async (req: Request, res: Response) => {
  try {
    await Promise.all([fetchPersonInterviews(), fetchInterviewerChannels()]);
    res.json({ ok: true });
  } catch (error) {
    logger.error({ error }, "Error fetching interviews via scheduler");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;
