import { Request, Response } from "express";
import { createRoleRequestSchema } from "../schema/role";
import { roleService } from "../services/roleService";

export const roleController = {
    createRoleController: async (req: Request, res: Response) => {
        try {
            const parsed = createRoleRequestSchema.safeParse(req.body);
            if (!parsed.success) {
                return res.status(400).json({ message: "Invalid role payload", errors: parsed.error.flatten() });
            }
            const role = await roleService.createRole(parsed.data);
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
            const parsed = createRoleRequestSchema.safeParse(req.body);
            if (!parsed.success) {
                return res.status(400).json({ message: "Invalid role payload", errors: parsed.error.flatten() });
            }
            const role = await roleService.updateRole(Number(req.params.id), parsed.data);
            res.status(200).json(role);
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
            res.status(200).json(roles);
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
            res.status(200).json(role);
        } 
        catch (error){
            res.status(500).json({
            message: "Failed to fetch role",
            error,
            });
        }
    },
}