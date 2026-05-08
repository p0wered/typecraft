import { Router } from "express";
import {
  createResult,
  getResults,
  getStats,
  getProgress,
  getPersonalBest,
} from "../controllers/resultsController.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.use(requireAuth);

router.post("/", createResult);
router.get("/", getResults);
router.get("/stats", getStats);
router.get("/progress", getProgress);
router.get("/personal-best", getPersonalBest);

export default router;
