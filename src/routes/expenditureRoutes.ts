import { Router } from "express";
import { expenditureController } from "../controllers/expenditureController";
import { Roles } from "../enums/ERoles";
import { authenticate, authorize } from "../middleware/authMiddleware";

const router = Router();

router.get("/active", authenticate, authorize([Roles.admin, Roles.manager, Roles.hr]), expenditureController.getActiveExpenditureController);
router.get("/", authenticate, authorize([Roles.admin, Roles.manager, Roles.hr]), expenditureController.getAllExpendituresController);
router.get("/:id", authenticate, authorize([Roles.admin, Roles.manager, Roles.hr]), expenditureController.getExpenditureByIdController);

router.post("/", authenticate, authorize([Roles.admin, Roles.manager, Roles.hr]), expenditureController.createExpenditureController);
router.patch("/:id", authenticate, authorize([Roles.admin, Roles.manager, Roles.hr]), expenditureController.updateExpenditureController);
router.put("/:id", authenticate, authorize([Roles.admin, Roles.manager, Roles.hr]), expenditureController.updateExpenditureController);

export default router;
