"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const userController_1 = require("../controllers/userController");
const router = (0, express_1.Router)();
router.get("/", userController_1.userController.getAllUsersController);
router.get("/:id", userController_1.userController.getUserByIdController);
router.put("/:id", userController_1.userController.updateUserDetailsController);
exports.default = router;
//# sourceMappingURL=userRoutes.js.map