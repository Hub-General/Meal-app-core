import { Request, Response } from "express";
import { GetUsersQueryRequestSchema, userRegisterRequestSchema } from "../schema/user";
import { userService } from "../services/userService";
import { Status } from "../generated/prisma";

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
            const parsed = userRegisterRequestSchema.safeParse(req.body);
            if(!parsed.success){
                return res.status(400).json({ message: "Invalid user payload", errors: parsed.error.flatten() });
            }
            const users = await userService.updateUserDetails(Number(req.params.id), parsed.data);
            res.status(200).json(users);
        }catch(error){
            res.status(500).json({
                message: "Failed to update user details",
                error,
            })
        }
    },
}