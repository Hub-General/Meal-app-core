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
router.get("/by-day/:day", mealSelectionController.getSelectionsByDayController);

//CREATE selections routes
router.post("/", mealSelectionController.createSelectionController);
router.post("/batch", mealSelectionController.createBatchSelectionControleer);

export default router;