import { Request, Response } from "express";
import { userService } from "../services/userService";

export const userController = {

    // User endpoints

    getAllUsersController: async (req: Request, res: Response) => {
        try{
            const users = await userService.getAllUsers();
            res.status(200).json(users);
        }catch(error){
            res.status(500).json({
                message: "Failed to retrieve users",
                error,
            })
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
    updateUserDetailsController: async (req: Request, res: Response) => {
        try{
            const users = await userService.updateUserDetails(Number(req.params.id), req.body);
            res.status(200).json(users);
        }catch(error){
            res.status(500).json({
                message: "Failed to update user details",
                error,
            })
        }
    },
}