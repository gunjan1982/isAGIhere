import { Router, type IRouter } from "express";
import healthRouter from "./health";
import peopleRouter from "./people";
import sourcesRouter from "./sources";
import communitiesRouter from "./communities";
import statsRouter from "./stats";
import feedRouter from "./feed";

const router: IRouter = Router();

router.use(healthRouter);
router.use(peopleRouter);
router.use(sourcesRouter);
router.use(communitiesRouter);
router.use(statsRouter);
router.use(feedRouter);

export default router;
