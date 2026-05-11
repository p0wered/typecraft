import { Router } from "express";
import { getAdaptiveRecommendation } from "../controllers/adaptiveController.js";

const router = Router();

router.post("/recommendation", getAdaptiveRecommendation);

export default router;
