import { Router } from "express";
import { foodLibraryController } from "../controllers/foodLibraryController";

const router = Router();

router.get("/", foodLibraryController.getAllFoodItemsController);
router.get("/:foodGroup", foodLibraryController.getFoodItemsByFoodGroupsController);
router.post("/batch", foodLibraryController.createFoodItemsBatch);
router.post("/", foodLibraryController.createFoodItem);

export default router;