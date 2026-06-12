"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.roleController = void 0;
const roleService_1 = require("../services/roleService");
exports.roleController = {
    createRoleController: async (req, res) => {
        try {
            const role = await roleService_1.roleService.createRole(req.body);
            res.status(201).json({ message: "Role created successfully", role });
        }
        catch (error) {
            res.status(500).json({
                message: "Failed to create role",
                error,
            });
        }
    },
    updateRoleController: async (req, res) => {
        try {
            if (!req.params.id || isNaN(Number(req.params.id))) {
                return res.status(400).json({ message: "Role ID is required" });
            }
            const role = await roleService_1.roleService.updateRole(Number(req.params.id), req.body);
            res.status(200).json({ message: "Role updated successfully", role });
        }
        catch (error) {
            res.status(500).json({
                message: "Failed to update role",
                error,
            });
        }
    },
    getAllRolesController: async (req, res) => {
        try {
            const roles = await roleService_1.roleService.getAllRoles();
            res.status(200).json({ message: "Roles retrieved successfully", roles });
        }
        catch (error) {
            res.status(500).json({
                message: "Failed to fetch roles",
                error,
            });
        }
    },
    getRoleByIdController: async (req, res) => {
        try {
            if (!req.params.id || isNaN(Number(req.params.id))) {
                return res.status(400).json({ message: "Role ID is required" });
            }
            const role = await roleService_1.roleService.getRoleById(Number(req.params.id));
            res.status(200).json({ message: "Role retrieved successfully", role });
        }
        catch (error) {
            res.status(500).json({
                message: "Failed to fetch role",
                error,
            });
        }
    },
};
//# sourceMappingURL=roleController.js.map