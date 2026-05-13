import { Router, type IRouter } from "express";
import healthRouter from "./health";
import proposalsRouter from "./proposals";
import membersRouter from "./members";
import treasuryRouter from "./treasury";
import activityRouter from "./activity";
import analyticsRouter from "./analytics";

const router: IRouter = Router();

router.use(healthRouter);
router.use(proposalsRouter);
router.use(membersRouter);
router.use(treasuryRouter);
router.use(activityRouter);
router.use(analyticsRouter);

export default router;
