import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import exercisesRouter from "./exercises";
import workoutsRouter from "./workouts";
import workoutLogsRouter from "./workout_logs";
import progressRouter from "./progress";
import profileRouter from "./profile";
import runLogsRouter from "./run-logs";
import friendsRouter from "./friends";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(exercisesRouter);
router.use(workoutsRouter);
router.use(workoutLogsRouter);
router.use(progressRouter);
router.use(profileRouter);
router.use(runLogsRouter);
router.use(friendsRouter);

export default router;
