import { Router } from "express";
import { foodLibraryController } from "../controllers/foodLibraryController";
import { authenticate, authorize } from "../middleware/authMiddleware";
import { Roles } from "../enums/ERoles";

const router = Router();

router.get("/", authenticate, authorize([Roles.admin, Roles.hr, Roles.user]), foodLibraryController.getAllFoodItemsController);
router.get("/:foodGroup", authenticate, authorize([Roles.admin, Roles.hr]), foodLibraryController.getFoodItemsByFoodGroupsController);
router.post("/batch", authenticate, authorize([Roles.admin, Roles.hr]), foodLibraryController.createFoodItemsBatch);
router.post("/", authenticate, authorize([Roles.admin, Roles.hr]), foodLibraryController.createFoodItem);

export default router;