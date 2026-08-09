"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const presetsController_1 = require("../controllers/presetsController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = (0, express_1.Router)();
// Preset Routes
router.get("/", authMiddleware_1.authenticate, presetsController_1.presetController.getAllPresetsController);
router.get("/:id", authMiddleware_1.authenticate, presetsController_1.presetController.getPresetbyIdController);
router.get("/by-user/:id", authMiddleware_1.authenticate, presetsController_1.presetController.getPresetsByUserIdController);
router.get("/with-details/:id", authMiddleware_1.authenticate, presetsController_1.presetController.getPresetWithDetailsByIdController);
router.post("/", authMiddleware_1.authenticate, presetsController_1.presetController.createPresetController);
router.put("/:id", authMiddleware_1.authenticate, presetsController_1.presetController.updatePresetController);
//Preset Items Routes
router.get("/:id/items", authMiddleware_1.authenticate, presetsController_1.presetController.getPresetItemsByPresetIdController);
router.post("/items", authMiddleware_1.authenticate, presetsController_1.presetController.createPresetItemController);
router.post("/items-batch", authMiddleware_1.authenticate, presetsController_1.presetController.createPresetItemsBatchController);
router.put("/items/:id", authMiddleware_1.authenticate, presetsController_1.presetController.updatePresetItemController);
router.delete("/items/:id", authMiddleware_1.authenticate, presetsController_1.presetController.deletePresetItemController);
exports.default = router;
//# sourceMappingURL=presetRoutes.js.map