"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const userController_1 = require("../controllers/userController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = (0, express_1.Router)();
//Preferences Routes
router.get("/preferences", authMiddleware_1.authenticate, userController_1.userController.getUserPreferencesController);
router.put("/preferences", authMiddleware_1.authenticate, userController_1.userController.updateUserPreferencesController);
//User Routes
router.get("/", authMiddleware_1.authenticate, userController_1.userController.getAllUsersController);
router.get("/:id", authMiddleware_1.authenticate, userController_1.userController.getUserByIdController);
router.put("/:id", authMiddleware_1.authenticate, userController_1.userController.updateUserDetailsController);
exports.default = router;
//# sourceMappingURL=userRoutes.js.map