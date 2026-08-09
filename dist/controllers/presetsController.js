"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.presetController = void 0;
const preset_1 = require("../schema/preset");
const presetService_1 = require("../services/presetService");
exports.presetController = {
    getAllPresetsController: async (req, res) => {
        try {
            const presets = await presetService_1.presetService.getAllPresets();
            res.status(200).json(presets);
        }
        catch (error) {
            res.status(500).json({
                message: "Failed to retrieve presets",
                error,
            });
        }
    },
    getPresetbyIdController: async (req, res) => {
        const parsed = preset_1.GetUserPresetsRequestSchema.safeParse({ ...req.params, ...req.query });
        if (!parsed.success) {
            return res.status(400).json({
                error: "Invalid preset ID",
                details: parsed.error.flatten(),
            });
        }
        try {
            const preset = await presetService_1.presetService.getPresetbyId(parsed.data.id);
            res.status(200).json(preset);
        }
        catch (error) {
            res.status(500).json({
                message: "Failed to retrieve preset by ID",
                error,
            });
        }
    },
    getPresetWithDetailsByIdController: async (req, res) => {
        try {
            if (!req.params.id || isNaN(Number(req.params.id))) {
                res.status(400).json({
                    error: 'Invalid Preset Id'
                });
            }
            const preset = await presetService_1.presetService.getPresetwithDetails(Number(req.params.id));
            res.status(200).json(preset);
        }
        catch (error) {
            res.status(500).json({
                message: "Failed to retrieve preset with details",
                error,
            });
        }
    },
    getPresetsByUserIdController: async (req, res) => {
        try {
            const parsed = preset_1.GetUserPresetsRequestSchema.safeParse(req.params);
            if (!parsed.success) {
                return res.status(400).json({
                    error: "Invalid userId or menuID",
                    details: parsed.error.flatten()
                });
            }
            const preset = await presetService_1.presetService.getPresetsbyUserId(parsed.data.id, parsed.data.menuId);
            res.status(200).json(preset);
        }
        catch (error) {
            res.status(500).json({
                message: "Failed to retrieve preset by ID",
                error,
            });
        }
    },
    createPresetController: async (req, res) => {
        try {
            if (!req.body) {
                return res.status(401).json({
                    error: 'Invalid preset body'
                });
            }
            const parsed = preset_1.createPresetRequestSchema.safeParse(req.body);
            if (!parsed.success) {
                return res.status(400).json({ error: "Invalid preset payload", details: parsed.error.flatten() });
            }
            const preset = await presetService_1.presetService.createPreset(parsed.data);
            res.status(200).json(preset);
        }
        catch (error) {
            res.status(500).json({
                message: "Failed to create preset",
                error,
            });
        }
    },
    updatePresetController: async (req, res) => {
        try {
            if (!req.params.id || isNaN(Number(req.params.id))) {
                return res.status(401).json({
                    error: 'Invalid Preset ID'
                });
            }
            const parsed = preset_1.updatePresetRequestSchema.safeParse(req.body);
            if (!parsed.success) {
                return res.status(400).json({ error: "Invalid preset payload", details: parsed.error.flatten() });
            }
            const presetUpdated = await presetService_1.presetService.updatePreset(Number(req.params.id), parsed.data);
            res.status(200).json(presetUpdated);
        }
        catch (error) {
            res.status(500).json({
                message: "Failed to retrieve presets",
                error,
            });
        }
    },
    // Preset Items Controllers
    getPresetItemsByPresetIdController: async (req, res) => {
        try {
            if (!req.params.id || isNaN(Number(req.params.id))) {
                res.status(400).json({
                    error: 'Invalid Preset Id'
                });
            }
            const preset = await presetService_1.presetService.getPresetItemsByPresetId(Number(req.params.id));
            res.status(200).json(preset);
        }
        catch (error) {
            res.status(500).json({
                message: "Failed to retrieve preset Items by Preset ID",
                error,
            });
        }
    },
    createPresetItemController: async (req, res) => {
        try {
            const parsed = preset_1.createPresetItemDataRequestSchema.safeParse(req.body);
            if (!parsed.success) {
                return res.status(400).json({ error: "Invalid preset item payload", details: parsed.error.flatten() });
            }
            const preset = await presetService_1.presetService.createPresetItem(parsed.data.presetId, parsed.data);
            res.status(200).json(preset);
        }
        catch (error) {
            res.status(500).json({
                message: "Failed to retrieve preset Items by Preset ID",
                error,
            });
        }
    },
    createPresetItemsBatchController: async (req, res) => {
        try {
            const parsed = preset_1.createPresetItemDataRequestSchema.array().safeParse(req.body);
            if (!parsed.success) {
                return res.status(400).json({ error: "Invalid preset item batch payload", details: parsed.error.flatten() });
            }
            const firstPresetItem = parsed.data[0];
            if (!firstPresetItem) {
                return res.status(400).json({ error: "Preset item batch cannot be empty" });
            }
            const preset = await presetService_1.presetService.createPresetItemsBatch(firstPresetItem.presetId, parsed.data);
            res.status(200).json(preset);
        }
        catch (error) {
            res.status(500).json({
                message: "Failed to retrieve preset Items by Preset ID",
                error,
            });
        }
    },
    updatePresetItemController: async (req, res) => {
        try {
            if (!req.params.id || isNaN(Number(req.params.id))) {
                res.status(400).json({
                    error: 'Invalid Preset ID'
                });
            }
            const parsed = preset_1.updatePresetItemDataRequestSchema.safeParse(req.body);
            if (!parsed.success) {
                return res.status(400).json({ error: "Invalid preset item payload", details: parsed.error.flatten() });
            }
            const updatedPresetItem = await presetService_1.presetService.updatePresetItem(Number(req.params.id), parsed.data);
            res.status(200).json(updatedPresetItem);
        }
        catch (error) {
            res.status(500).json({
                message: "Failed to retrieve presets",
                error,
            });
        }
    },
    deletePresetItemController: async (req, res) => {
        try {
            if (!req.params.id || isNaN(Number(req.params.id))) {
                res.status(400).json({
                    error: 'Invalid Preset ID'
                });
            }
            const deletedPresetItem = await presetService_1.presetService.deletePresetItem(Number(req.params.id));
            res.status(200).json(deletedPresetItem);
        }
        catch (error) {
            res.status(500).json({
                message: "Failed to retrieve presets",
                error,
            });
        }
    },
};
//# sourceMappingURL=presetsController.js.map