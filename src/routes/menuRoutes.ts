import { Router } from "express";
import { menuController } from "../controllers/menuController";

const router = Router();

router.get("/", menuController.getAllMenusController);
router.get("/:id", menuController.getMenuByIdController);
router.get("/:id/meals", menuController.getMenuMealsController);
router.post("/", menuController.createMenuController);
router.put("/:id", menuController.updateMenuController);
router.delete("/:id", menuController.deleteMenuController);

//Menu Meals Routes
router.get("/days/:id", menuController.getMenuDaysByMenuIdController);
router.post("/meals", menuController.createMenuMealsController);
router.patch("/meals/:id", menuController.updateMenuMealsController);

export default router;