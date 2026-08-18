import { Router } from "express";
import { tasteProfileController } from "../controllers/tasteProfileController";
import { authenticate, authorize } from "../middleware/authMiddleware";
import { Roles } from "../enums/ERoles";

const router = Router();

router.get("/by-user/:id", authenticate, tasteProfileController.getTasteProfileByUserIdController);
router.get("/", authenticate, tasteProfileController.getTasteProfilesController);
router.put("/by-user/:id", authenticate, tasteProfileController.updateUserTasteProfileController);

// Admin Force Sync Endpoints
router.post("/sync", authenticate, authorize([Roles.admin, Roles.hr]), tasteProfileController.forceSyncTasteProfilesController);
router.post("/sync/:userId", authenticate, authorize([Roles.admin, Roles.hr]), tasteProfileController.forceSyncTasteProfilesController);

export default router;