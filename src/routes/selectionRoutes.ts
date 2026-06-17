import { Router } from "express";
import { mealSelectionController } from "../controllers/mealSelectionController";

const router = Router();

//GET selections routes
router.get("/",mealSelectionController.getAllSelectionsController);
router.get("/date-range",mealSelectionController.getSelectionsByDateRangeController);
router.get("/filter", mealSelectionController.getSelectionsByFilterController)
router.get("/:id",mealSelectionController.getSelectionByIdController);
router.get("/by-user/:id", mealSelectionController.getSelectionsByUserIdController);
router.get("/by-meal/:id", mealSelectionController.getSelectionsByMealIdController);

//GET weekly selections routes
router.get("/weekly", mealSelectionController.getWeeklySelectionsController);
router.get("/weekly/by-date", mealSelectionController.getWeeklySelectionsByDateController);
router.get("/weekly/by-user/:id", mealSelectionController.getWeeklySelectionsByUserController);

//CREATE selections routes
router.post("/", mealSelectionController.createSelectionController);
router.post("/batch", mealSelectionController.createBatchSelectionController);

//UPDATE selections routes
router.put("/:id", mealSelectionController.updateSelectionController);
router.put("/batch", mealSelectionController.updateSelectionsBatchController);

export default router;