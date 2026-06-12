import { Router } from "express";
import { presetController } from "../controllers/presetsController";

const router = Router();


// Preset Routes
router.get("/", presetController.getAllPresetsController);
router.get("/:id", presetController.getPresetbyIdController);
router.get("/by-user/:id", presetController.getPresetsByUserIdController);
router.get("/with-details/:id", presetController.getPresetWithDetailsByIdController);
router.post("/", presetController.createPresetController);
router.put("/:id", presetController.updatePresetController);

//Preset Items Routes
router.get("/:id/items", presetController.getPresetItemsByPresetIdController);
router.post("/items", presetController.createPresetItemController);
router.post("/items-batch", presetController.createPresetItemsBatchController);
router.put("/items/:id", presetController.updatePresetItemController);
router.delete("/items/:id", presetController.deletePresetItemController);

export default router;