"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const roleController_1 = require("../controllers/roleController");
const router = (0, express_1.Router)();
router.post("/", roleController_1.roleController.createRoleController);
router.put("/:id", roleController_1.roleController.updateRoleController);
router.get("/", roleController_1.roleController.getAllRolesController);
router.get("/:id", roleController_1.roleController.getRoleByIdController);
exports.default = router;
//# sourceMappingURL=roleRoutes.js.map