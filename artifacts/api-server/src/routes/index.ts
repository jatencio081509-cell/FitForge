import { Router, type IRouter } from "express";
import healthRouter from "./health";
import exercisesRouter from "./exercises";
import workoutsRouter from "./workouts";
import workoutLogsRouter from "./workout_logs";
import progressRouter from "./progress";
import profileRouter from "./profile";
import aiRouter from "./ai";

const router: IRouter = Router();

router.use(healthRouter);
router.use(exercisesRouter);
router.use(workoutsRouter);
router.use(workoutLogsRouter);
router.use(progressRouter);
router.use(profileRouter);
router.use(aiRouter);

export default router;
