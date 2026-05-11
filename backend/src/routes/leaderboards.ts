import { Router } from "express";
import { getWeeklyLeaderboard } from "../controllers/leaderboardsController.js";

const router = Router();

router.get("/weekly", getWeeklyLeaderboard);

export default router;
