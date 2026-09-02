import { Router } from "express";
import { userController } from "../controllers/userController";
import { authenticate } from "../middleware/authMiddleware";

const router = Router();

// Preferences Routes - Dietary
router.get("/preferences/dietary", authenticate, userController.getUserDietaryPreferencesController);
router.put("/preferences/dietary", authenticate, userController.updateUserDietaryPreferencesController);

// Preferences Routes - App
router.get("/preferences/app", authenticate, userController.getUserAppPreferencesController);
router.put("/preferences/app", authenticate, userController.updateUserAppPreferencesController);
router.patch("/preferences/announcement-version", authenticate, userController.patchUserAnnouncementVersionController);
router.patch("/preferences/app/announcement-version", authenticate, userController.patchUserAnnouncementVersionController);

// Preferences Routes - General
router.get("/preferences", authenticate, userController.getUserPreferencesController);
router.put("/preferences", authenticate, userController.updateUserPreferencesController);

// User Routes
router.get("/profile", authenticate, userController.getUserProfileController);
router.get("/me", authenticate, userController.getUserProfileController);
router.get("/", authenticate, userController.getAllUsersController);
router.get("/:id", authenticate, userController.getUserByIdController);
router.get("/:id/leaves", authenticate, userController.getUserLeavesController);
router.put("/:id", authenticate, userController.updateUserDetailsController);

export default router;

