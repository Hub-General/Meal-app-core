import { Request, Response } from "express";
import errorHandler from "../helpers/errorHandler";
import { roleService } from "../services/roleService";

export const roleController = {
    createRoleController: async (req: Request, res: Response) => {
        try {
            const role = await roleService.createRole(req.body);
            res.status(201).json({message: "Role created successfully", role});
        } 
        catch (error){
            res.status(500).json({
            message: "Failed to create role",
            error,
            });
        }
    },
    updateRoleController: async (req: Request, res: Response) => {
        try {
            if(!req.params.id || isNaN(Number(req.params.id))){
                return res.status(400).json({message: "Role ID is required"});
            }
            const role = await roleService.updateRole(Number(req.params.id), req.body);
            res.status(200).json({message: "Role updated successfully", role});
        } 
        catch (error){
            res.status(500).json({
            message: "Failed to update role",
            error,
            });
        }
    },
    getAllRolesController: async (req: Request, res: Response) => {
        try {
            const roles = await roleService.getAllRoles();
            res.status(200).json({message: "Roles retrieved successfully", roles});
        } 
        catch (error){
            res.status(500).json({
            message: "Failed to fetch roles",
            error,
            });
        }
    },
    getRoleByIdController: async (req: Request, res: Response) => {
        try {
            if(!req.params.id || isNaN(Number(req.params.id))){
                return res.status(400).json({message: "Role ID is required"});
            }
            const role = await roleService.getRoleById(Number(req.params.id));
            res.status(200).json({message: "Role retrieved successfully", role});
        } 
        catch (error){
            res.status(500).json({
            message: "Failed to fetch role",
            error,
            });
        }
    },
}