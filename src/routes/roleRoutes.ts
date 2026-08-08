import { Router } from "express";
import { roleController } from "../controllers/roleController";
import { authenticate, authorize } from "../middleware/authMiddleware";
import { Roles } from "../enums/ERoles";

const router = Router();

router.post("/", authenticate, authorize([Roles.admin, Roles.hr]), roleController.createRoleController);
router.put("/:id",authenticate, authorize([Roles.admin, Roles.hr]), roleController.updateRoleController);
router.get("/", authenticate, authorize([Roles.admin, Roles.hr]), roleController.getAllRolesController);
router.get("/:id",authenticate, authorize([Roles.admin, Roles.hr]), roleController.getRoleByIdController);

export default router;