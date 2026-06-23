import { Router } from "express";
import { mealController } from "../controllers/mealController";

const router = Router();

router.get("/",mealController.getAllMealsController);
router.get("/:id",mealController.getMealByIdController);
router.post("/",mealController.createMealController);
router.post("/batch",mealController.createMealBatchController);
router.put("/:id",mealController.updateMealController);
router.delete("/:id",mealController.deleteMealController);

export default router;