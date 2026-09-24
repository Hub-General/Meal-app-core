import { Router } from "express";
import { budgetController } from "../controllers/budgetController";
import { Roles } from "../enums/ERoles";
import { authenticate, authorize } from "../middleware/authMiddleware";

const router = Router();

router.get("/active", authenticate, authorize([Roles.admin, Roles.manager, Roles.hr]), budgetController.getActiveBudgetController);
router.get("/", authenticate, authorize([Roles.admin, Roles.manager, Roles.hr]), budgetController.getAllBudgetsController);
router.get("/:id", authenticate, authorize([Roles.admin, Roles.manager, Roles.hr]), budgetController.getBudgetByIdController);

router.post("/", authenticate, authorize([Roles.admin, Roles.manager]), budgetController.createBudgetController);
router.patch("/:id", authenticate, authorize([Roles.admin, Roles.manager]), budgetController.updateBudgetController);
router.put("/:id", authenticate, authorize([Roles.admin, Roles.manager]), budgetController.updateBudgetController);

export default router;
