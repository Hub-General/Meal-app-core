import { Router } from "express";
import { mealController } from "../controllers/mealController";
import { upload } from "../middleware/multerUpload";

const router = Router();

router.get("/", mealController.getAllMealsController);
router.get("/details/:foodCode", mealController.getMealDetailsByIdController);
router.get("/:id", mealController.getMealByIdController);
router.post("/", upload.single("image"), mealController.createMealController);
router.post("/batch", mealController.createMealBatchController);
router.put("/batch", mealController.updateMealBatchController);
router.put("/:id", upload.single("image"), mealController.updateMealController);
router.delete("/:id", mealController.deleteMealController);

export default router;