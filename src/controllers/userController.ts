import { Request, Response } from "express";
import { GetUsersQueryRequestSchema, userRegisterRequestSchema, userUpdateSchema } from "../schema/user";
import { userService } from "../services/userService";
import { Status } from "../generated/prisma";
import { userPreferenceService } from "../services/userPreferenceService";
import { createUserPreferencesSchema } from "../schema/userPreference";

export const userController = {

    // User endpoints

    getAllUsersController: async (req: Request, res: Response) => {
        try{
            const {status} = GetUsersQueryRequestSchema.parse(req.query)
            const users = await userService.getAllUsers(status);
            res.status(200).json(users);
        }catch(error){
            res.status(500).json({
                message: "Failed to retrieve users",
                error,
            })
        }
    },
    getUserProfileController: async (req: Request, res: Response) => {
        try {
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({ message: "Unauthorized" });
            }
            const profile = await userService.getUserProfile(userId);
            if (!profile) {
                return res.status(404).json({ message: "User profile not found" });
            }
            res.status(200).json(profile);
        } catch (error) {
            res.status(500).json({
                message: "Failed to retrieve user profile",
                error: error instanceof Error ? error.message : error
            });
        }
    },
    getUserByIdController: async (req: Request, res: Response) => {
        try{
            const users = await userService.getUserById(Number(req.params.id));
            res.status(200).json(users);
        }catch(error){
            res.status(500).json({
                message: "Failed to retrieve user",
                error,
            })
        }
    },
    getUserLeavesController: async (req: Request, res: Response) => {
        try {
            const userId = Number(req.params.id);
            if (!userId || isNaN(userId)) {
                return res.status(400).json({ message: "Invalid user ID" });
            }
            const leaves = await userService.getUserLeaves(userId);
            res.status(200).json(leaves);
        } catch (error) {
            res.status(500).json({
                message: "Failed to retrieve user leaves",
                error,
            });
        }
    },
    updateUserDetailsController: async (req: Request, res: Response) => {
        try{
            const parsed = userUpdateSchema.safeParse(req.body);
            if(!parsed.success){
                return res.status(400).json({ message: "Invalid user payload", errors: parsed.error.flatten() });
            }
            const users = await userService.updateUserDetails(req.user!.id, parsed.data);
            res.status(200).json(users);
        }catch(error){
            res.status(500).json({
                message: "Failed to update user details",
                error,
            })
        }
    },

    //User Preferences
    getUserPreferencesController: async(req: Request, res: Response)=>{
        try{
            const response = await userPreferenceService.getUserPreference(req.user!.id);
            res.status(200).json(response);
        }catch(error){
            res.status(500).json({
                message: `Failed to get user preferences ${req.user?.id}`,
                error,
            })
        }
    },
    updateUserPreferencesController: async(req: Request, res: Response)=>{
        try{
            const parsed = createUserPreferencesSchema.safeParse(req.body);
            if(!parsed.success){
                return res.status(400).json({ message: "Invalid user preferences payload", errors: parsed.error.flatten() });
            }
            await userPreferenceService.updateUserPreference(req.user!.id, parsed.data);
            res.status(200).json({message: "Successfully Updated User Preferences"})
        }catch(error){
            res.status(500).json({
                message: "Failed to update user details",
                error,
            })
        }
    },
}