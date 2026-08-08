import { Router } from "express";
import { tasteProfileController } from "../controllers/tasteProfileController";
import { authenticate } from "../middleware/authMiddleware";

const router = Router();

router.get("/by-user/:id", authenticate, tasteProfileController.getTasteProfileByUserIdController)
router.get("/", authenticate, tasteProfileController.getTasteProfilesController)
router.put("/by-user/:id", authenticate, tasteProfileController.updateUserTasteProfileController)

export default router;