import { Router } from "express";
import {
  createCustomText,
  deleteCustomText,
  getCustomText,
  listCustomTexts,
  updateCustomText,
} from "../controllers/customTextsController.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.use(requireAuth);

router.post("/", createCustomText);
router.get("/", listCustomTexts);
router.get("/:id", getCustomText);
router.put("/:id", updateCustomText);
router.delete("/:id", deleteCustomText);

export default router;
