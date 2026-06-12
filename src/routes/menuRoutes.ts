import { Router } from "express";
import { menuController } from "../controllers/menuController";

const router = Router();

router.get("/", menuController.getAllMenusController);
router.get("/:id", menuController.getMenuByIdController);
router.get("/:id/meals", menuController.getMenuMealsController);
router.post("/", menuController.createMenuController);
router.put("/:id", menuController.updateMenuController);
router.delete("/:id", menuController.deleteMenuController);

export default router;