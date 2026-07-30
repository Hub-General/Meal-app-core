import { Request, Response } from "express";
import { tasteProfileService } from "../services/tasteProfileService";

export const tasteProfileController = {

    getTasteProfileByUserIdController: async(req:Request, res: Response) =>{
        try{
            if(!req.params.id || isNaN(Number(req.params.id))) {
                return res.status(400).json({
                    message: "Invalid User ID"
                })
            }
            const tasteProfile = await tasteProfileService.getTasteProfileByUserId(Number(req.params.id));
            res.status(200).json(tasteProfile);
        }catch(error){
            res.status(500).json({
                message: 'Failed to Fetch Taste Profile by User ID'
            })
        }
    },

    getTasteProfilesController: async(req:Request, res: Response)=>{
        try{
            const year = req.query.year ? Number(req.query.year) : undefined;
            const tasteProfiles = await tasteProfileService.getTasteProfiles(year);
            res.status(200).json(tasteProfiles);
        }catch(error){
            res.status(500).json({
                message: 'Failed to Fetch Taste Profiles'
            })
        }
    },
    updateUserTasteProfileController: async(req:Request, res: Response) =>{
        try{
            if(!req.params.id || isNaN(Number(req.params.id))) {
                return res.status(400).json({
                    message: "Invalid User ID"
                })
            }
            const tasteProfile = await tasteProfileService.updateUserTasteProfile(Number(req.params.id));
            res.status(200).json(tasteProfile);
        }catch(error){
            res.status(500).json({
                message: 'Failed to Update User Taste Profile'
            })
        }
    },
}