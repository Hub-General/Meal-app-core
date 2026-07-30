import { Router } from "express";
import { tasteProfileController } from "../controllers/tasteProfileController";

const router = Router();

router.get("/by-user/:id", tasteProfileController.getTasteProfileByUserIdController)
router.get("/",tasteProfileController.getTasteProfilesController)
router.put("/by-user/:id", tasteProfileController.updateUserTasteProfileController)

export default router;