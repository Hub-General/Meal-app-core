import { Router } from "express";
import { userController } from "../controllers/userController";
import { authenticate, authorize } from "../middleware/authMiddleware";
import { Roles } from "../enums/ERoles";

const router = Router();

// Preferences Routes
router.get("/preferences", authenticate, userController.getUserPreferencesController);
router.patch("/preferences", authenticate, userController.updateUserPreferencesController);
router.put("/preferences", authenticate, userController.updateUserPreferencesController);
// router.get("/preferences/excluded-meals", authenticate, userController.getUserExcludedMealsController);
// router.get("/excluded-meals", authenticate, userController.getUserExcludedMealsController);
// router.post("/preferences/recalculate", authenticate, authorize([Roles.admin, Roles.hr]), userController.recalculateUserPreferencesController);

// User Routes
router.get("/profile", authenticate, userController.getUserProfileController);
router.get("/me", authenticate, userController.getUserProfileController);
router.get("/", authenticate, userController.getAllUsersController);
router.get("/:id", authenticate, userController.getUserByIdController);
router.get("/:id/leaves", authenticate, userController.getUserLeavesController);
router.put("/:id", authenticate, userController.updateUserDetailsController);

export default router;

