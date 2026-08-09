import { Router } from "express";
import { menuController } from "../controllers/menuController";
import { authenticate, authorize } from "../middleware/authMiddleware";
import { Roles } from "../enums/ERoles";

const router = Router();

router.get("/", menuController.getAllMenusController);
router.post("/", authenticate, authorize([Roles.admin, Roles.hr]), menuController.createMenuController);
router.get("/:id", menuController.getMenuByIdController);
router.get("/:id/meals", authenticate, menuController.getMenuMealsController);
router.put("/:id",  authenticate, authorize([Roles.admin, Roles.hr]), menuController.updateMenuController);
router.delete("/:id", authenticate, authorize([Roles.admin, Roles.hr]), menuController.deleteMenuController);

//Menu Meals Routes
router.get("/days/:id", menuController.getMenuDaysByMenuIdController);
router.post("/meals", authenticate, authorize([Roles.admin, Roles.hr]),menuController.createMenuMealsController);
router.patch("/meals/:id",authenticate, authorize([Roles.admin, Roles.hr]), menuController.updateMenuMealsController);

export default router;