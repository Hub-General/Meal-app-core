"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const presetsController_1 = require("../controllers/presetsController");
const router = (0, express_1.Router)();
router.get("/", presetsController_1.presetController.getAllPresetsController);
router.get("/:id", presetsController_1.presetController.getPresetbyIdController);
router.get("/by-user/:id", presetsController_1.presetController.getPresetsByUserIdController);
router.post("/", presetsController_1.presetController.createPresetItemsBatchController);
router.put("/:id", presetsController_1.presetController.updatePresetItemController);
router.delete("/:id", presetsController_1.presetController.deletePresetItemController);
exports.default = router;
//# sourceMappingURL=presetRoutes.js.map