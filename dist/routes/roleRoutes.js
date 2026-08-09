"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const roleController_1 = require("../controllers/roleController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const ERoles_1 = require("../enums/ERoles");
const router = (0, express_1.Router)();
router.post("/", authMiddleware_1.authenticate, (0, authMiddleware_1.authorize)([ERoles_1.Roles.admin, ERoles_1.Roles.hr]), roleController_1.roleController.createRoleController);
router.put("/:id", authMiddleware_1.authenticate, (0, authMiddleware_1.authorize)([ERoles_1.Roles.admin, ERoles_1.Roles.hr]), roleController_1.roleController.updateRoleController);
router.get("/", authMiddleware_1.authenticate, (0, authMiddleware_1.authorize)([ERoles_1.Roles.admin, ERoles_1.Roles.hr]), roleController_1.roleController.getAllRolesController);
router.get("/:id", authMiddleware_1.authenticate, (0, authMiddleware_1.authorize)([ERoles_1.Roles.admin, ERoles_1.Roles.hr]), roleController_1.roleController.getRoleByIdController);
exports.default = router;
//# sourceMappingURL=roleRoutes.js.map