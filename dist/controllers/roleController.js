"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.roleController = void 0;
const role_1 = require("../schema/role");
const roleService_1 = require("../services/roleService");
exports.roleController = {
    createRoleController: async (req, res) => {
        try {
            const parsed = role_1.createRoleRequestSchema.safeParse(req.body);
            if (!parsed.success) {
                return res.status(400).json({ message: "Invalid role payload", errors: parsed.error.flatten() });
            }
            const role = await roleService_1.roleService.createRole(parsed.data);
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
            const parsed = role_1.createRoleRequestSchema.safeParse(req.body);
            if (!parsed.success) {
                return res.status(400).json({ message: "Invalid role payload", errors: parsed.error.flatten() });
            }
            const role = await roleService_1.roleService.updateRole(Number(req.params.id), parsed.data);
            res.status(200).json(role);
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
            res.status(200).json(roles);
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
            res.status(200).json(role);
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