"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.presetController = void 0;
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
        try {
            if (!req.params.id || isNaN(Number(req.params.id))) {
                res.status(400).json({
                    error: 'Invalid Preset Id'
                });
            }
            const preset = await presetService_1.presetService.getPresetbyId(Number(req.params.id));
            res.status(200).json(preset);
        }
        catch (error) {
            res.status(500).json({
                message: "Failed to retrieve preset by ID",
                error,
            });
        }
    },
    getPresetsByUserIdController: async (req, res) => {
        try {
            if (!req.params.id || isNaN(Number(req.params.id))) {
                res.status(400).json({
                    error: 'Invalid User Id'
                });
            }
            const preset = await presetService_1.presetService.getPresetsbyUserId(Number(req.params.id));
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
            const preset = await presetService_1.presetService.createPreset(req.body);
            res.status(200).json(preset);
        }
        catch (error) {
            res.status(500).json({
                message: "Failed to retrieve presets",
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
            const presetUpdated = await presetService_1.presetService.updatePreset(Number(req.params.id), req.body);
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
            if (!req.params.id || isNaN(Number(req.params.id))) {
                res.status(400).json({
                    error: 'Invalid Preset Id'
                });
            }
            const preset = await presetService_1.presetService.createPresetItem(Number(req.params.id), req.body);
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
            if (!req.params.id || isNaN(Number(req.params.id))) {
                res.status(400).json({
                    error: 'Invalid Preset ID'
                });
            }
            const preset = await presetService_1.presetService.createPresetItemsBatch(Number(req.params.id), req.body);
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
            const updatedPresetItem = await presetService_1.presetService.updatePresetItem(Number(req.params.id), req.body);
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