import { Request, Response } from "express";
import { createPresetItemDataRequestSchema, createPresetRequestSchema, GetUserPresetsRequestSchema } from "../schema/preset";
import { presetService } from "../services/presetService";

export const presetController ={
    getAllPresetsController: async (req: Request, res: Response) =>{
        try{
            const presets = await presetService.getAllPresets()
            res.status(200).json(presets)
        }catch(error){
            res.status(500).json({
                message: "Failed to retrieve presets",
                error,
            })
        }
    },
    getPresetbyIdController: async (req: Request, res: Response) =>{
        try{
            if(!req.params.id || isNaN(Number(req.params.id))) {
                res.status(400).json({
                    error:'Invalid Preset Id'
                })
            }
            const preset = await presetService.getPresetbyId(Number(req.params.id));
            res.status(200).json(preset)
        }catch(error){
            res.status(500).json({
                message: "Failed to retrieve preset by ID",
                error,
            })
        }
    },

    getPresetWithDetailsByIdController: async (req: Request, res: Response) =>{
        try{
            if(!req.params.id || isNaN(Number(req.params.id))) {
                res.status(400).json({
                    error:'Invalid Preset Id'
                })
            }
            const preset = await presetService.getPresetItemsByPresetId(Number(req.params.id));
            res.status(200).json(preset)
        }catch(error){
            res.status(500).json({
                message: "Failed to retrieve preset with details",
                error,
            })
        }
    },
    
    getPresetsByUserIdController: async (req: Request, res: Response) =>{
        try{
            const parsed = GetUserPresetsRequestSchema.safeParse(req.params)
            if (!parsed.success) {
                return res.status(400).json({
                    error: "Invalid userId or menuID",
                    details: parsed.error.flatten()
                });
            }
            const preset = await presetService.getPresetsbyUserId(parsed.data.id, parsed.data.menuId);
            res.status(200).json(preset)
        }catch(error){
            res.status(500).json({
                message: "Failed to retrieve preset by ID",
                error,
            })
        }
    },
    createPresetController: async (req: Request, res: Response) =>{
        try{
            if(!req.body){
                return res.status(401).json({
                    error:'Invalid preset body'
                })
            }
            const parsed = createPresetRequestSchema.safeParse(req.body);
            if(!parsed.success){
                return res.status(400).json({ error: "Invalid preset payload", details: parsed.error.flatten() });
            }
            const preset = await presetService.createPreset(parsed.data);
            res.status(200).json(preset)
        }catch(error){
            res.status(500).json({
                message: "Failed to create preset",
                error,
            })
        }
    },
    updatePresetController: async (req: Request, res: Response) =>{
        try{
            if(!req.params.id || isNaN(Number(req.params.id))){
                return res.status(401).json({
                    error:'Invalid Preset ID'
                })
            }
            const parsed = createPresetRequestSchema.safeParse(req.body);
            if(!parsed.success){
                return res.status(400).json({ error: "Invalid preset payload", details: parsed.error.flatten() });
            }
            const presetUpdated = await presetService.updatePreset(Number(req.params.id), parsed.data)
            res.status(200).json(presetUpdated)
        }catch(error){
            res.status(500).json({
                message: "Failed to retrieve presets",
                error,
            })
        }
    },

    // Preset Items Controllers

    getPresetItemsByPresetIdController: async (req: Request, res: Response) =>{
        try{
            if(!req.params.id || isNaN(Number(req.params.id))) {
                res.status(400).json({
                    error:'Invalid Preset Id'
                })
            }
            const preset = await presetService.getPresetItemsByPresetId(Number(req.params.id));
            res.status(200).json(preset)
        }catch(error){
            res.status(500).json({
                message: "Failed to retrieve preset Items by Preset ID",
                error,
            })
        }
    },
    createPresetItemController: async (req: Request, res: Response) =>{
        try{
            if(!req.params.id || isNaN(Number(req.params.id))) {
                res.status(400).json({
                    error:'Invalid Preset Id'
                })
            }
            const parsed = createPresetItemDataRequestSchema.safeParse(req.body);
            if(!parsed.success){
                return res.status(400).json({ error: "Invalid preset item payload", details: parsed.error.flatten() });
            }
            const preset = await presetService.createPresetItem(Number(req.params.id), parsed.data);
            res.status(200).json(preset)
        }catch(error){
            res.status(500).json({
                message: "Failed to retrieve preset Items by Preset ID",
                error,
            })
        }
    },
    createPresetItemsBatchController: async (req: Request, res: Response) =>{
         try{
            if(!req.params.id || isNaN(Number(req.params.id))) {
                res.status(400).json({
                    error:'Invalid Preset ID'
                })
            }
            const parsed = createPresetItemDataRequestSchema.array().safeParse(req.body);
            if(!parsed.success){
                return res.status(400).json({ error: "Invalid preset item batch payload", details: parsed.error.flatten() });
            }
            const preset = await presetService.createPresetItemsBatch(Number(req.params.id), parsed.data);
            res.status(200).json(preset)
        }catch(error){
            res.status(500).json({
                message: "Failed to retrieve preset Items by Preset ID",
                error,
            })
        }
    },
    updatePresetItemController: async (req: Request, res: Response) =>{
        try{
            if(!req.params.id || isNaN(Number(req.params.id))) {
                res.status(400).json({
                    error:'Invalid Preset ID'
                })
            }
            const parsed = createPresetItemDataRequestSchema.safeParse(req.body);
            if(!parsed.success){
                return res.status(400).json({ error: "Invalid preset item payload", details: parsed.error.flatten() });
            }
            const updatedPresetItem = await presetService.updatePresetItem(Number(req.params.id), parsed.data);
            res.status(200).json(updatedPresetItem)
        }catch(error){
            res.status(500).json({
                message: "Failed to retrieve presets",
                error,
            })
        }
    },
    deletePresetItemController: async (req: Request, res: Response) =>{
        try{
            if(!req.params.id || isNaN(Number(req.params.id))) {
                res.status(400).json({
                    error:'Invalid Preset ID'
            })}
            const deletedPresetItem = await presetService.deletePresetItem(Number(req.params.id));
            res.status(200).json(deletedPresetItem)
        }catch(error){
            res.status(500).json({
                message: "Failed to retrieve presets",
                error,
            })
        }
    },
}