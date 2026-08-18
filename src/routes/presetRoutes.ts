import { Router } from "express";
import { presetController } from "../controllers/presetsController";
import { authenticate } from "../middleware/authMiddleware";

const router = Router();

// Preset Routes
router.get("/", authenticate, presetController.getAllPresetsController);
router.get("/by-user/:id", authenticate, presetController.getPresetsByUserIdController);
router.get("/with-details/:id", authenticate, presetController.getPresetWithDetailsByIdController);
router.get("/:id", authenticate, presetController.getPresetbyIdController);
router.post("/", authenticate, presetController.createPresetController);
router.put("/set-default", authenticate, presetController.setDefaultPresetController);
router.put("/:id/set-default", authenticate, presetController.setDefaultPresetController);
router.put("/:id", authenticate, presetController.updatePresetController);
router.delete("/:id", authenticate, presetController.deletePresetController);

// Preset Items Routes
router.get("/:id/items", authenticate, presetController.getPresetItemsByPresetIdController);
router.post("/:id/items", authenticate, presetController.createPresetItemController);
router.post("/:id/items-batch", authenticate, presetController.createPresetItemsBatchController);
router.put("/items/:id", authenticate, presetController.updatePresetItemController);
router.delete("/items/:id", authenticate, presetController.deletePresetItemController);

export default router;