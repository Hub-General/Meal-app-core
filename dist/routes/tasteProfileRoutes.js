"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const tasteProfileController_1 = require("../controllers/tasteProfileController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = (0, express_1.Router)();
router.get("/by-user/:id", authMiddleware_1.authenticate, tasteProfileController_1.tasteProfileController.getTasteProfileByUserIdController);
router.get("/", authMiddleware_1.authenticate, tasteProfileController_1.tasteProfileController.getTasteProfilesController);
router.put("/by-user/:id", authMiddleware_1.authenticate, tasteProfileController_1.tasteProfileController.updateUserTasteProfileController);
exports.default = router;
//# sourceMappingURL=tasteProfileRoutes.js.map