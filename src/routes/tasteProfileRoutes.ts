import { Router } from "express";
import { tasteProfileController } from "../controllers/tasteProfileController";

const router = Router();

router.get("/:id", tasteProfileController.getTasteProfileByUserIdController)

export default router;