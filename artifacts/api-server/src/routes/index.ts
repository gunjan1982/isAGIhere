import { Router, type IRouter } from "express";
import healthRouter from "./health";
import peopleRouter from "./people";
import sourcesRouter from "./sources";
import communitiesRouter from "./communities";
import statsRouter from "./stats";
import feedRouter from "./feed";
import userRouter from "./user";
import analyticsRouter from "./analytics";
import adminRouter from "./admin";
import searchRouter from "./search";
import commentsRouter from "./comments";
import submissionsRouter from "./submissions";
import digestRouter from "./digest";
import myFeedRouter from "./my-feed";
import interviewsRouter from "./interviews";
import journeyRouter from "./journey";

const router: IRouter = Router();

router.use(healthRouter);
router.use(peopleRouter);
router.use(sourcesRouter);
router.use(communitiesRouter);
router.use(statsRouter);
router.use(feedRouter);
router.use(userRouter);
router.use(analyticsRouter);
router.use(adminRouter);
router.use(searchRouter);
router.use(commentsRouter);
router.use(submissionsRouter);
router.use(digestRouter);
router.use(myFeedRouter);
router.use(interviewsRouter);
router.use(journeyRouter);

export default router;
