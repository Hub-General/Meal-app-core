import { Router } from "express";
import { roleController } from "../controllers/roleController";

const router = Router();

router.post("/",roleController.createRoleController);
router.put("/:id",roleController.updateRoleController);
router.get("/",roleController.getAllRolesController);
router.get("/:id",roleController.getRoleByIdController);

export default router;