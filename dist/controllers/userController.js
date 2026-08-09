"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userController = void 0;
const user_1 = require("../schema/user");
const userService_1 = require("../services/userService");
const userPreferenceService_1 = require("../services/userPreferenceService");
const userPreference_1 = require("../schema/userPreference");
exports.userController = {
    // User endpoints
    getAllUsersController: async (req, res) => {
        try {
            const { status } = user_1.GetUsersQueryRequestSchema.parse(req.query);
            const users = await userService_1.userService.getAllUsers(status);
            res.status(200).json(users);
        }
        catch (error) {
            res.status(500).json({
                message: "Failed to retrieve users",
                error,
            });
        }
    },
    getUserByIdController: async (req, res) => {
        try {
            const users = await userService_1.userService.getUserById(Number(req.params.id));
            res.status(200).json(users);
        }
        catch (error) {
            res.status(500).json({
                message: "Failed to retrieve user",
                error,
            });
        }
    },
    updateUserDetailsController: async (req, res) => {
        try {
            const parsed = user_1.userRegisterRequestSchema.safeParse(req.body);
            if (!parsed.success) {
                return res.status(400).json({ message: "Invalid user payload", errors: parsed.error.flatten() });
            }
            const users = await userService_1.userService.updateUserDetails(Number(req.params.id), parsed.data);
            res.status(200).json(users);
        }
        catch (error) {
            res.status(500).json({
                message: "Failed to update user details",
                error,
            });
        }
    },
    //User Preferences
    getUserPreferencesController: async (req, res) => {
        try {
            const response = await userPreferenceService_1.userPreferenceService.getUserPreference(req.user.id);
            res.status(200).json(response);
        }
        catch (error) {
            res.status(500).json({
                message: `Failed to get user preferences ${req.user?.id}`,
                error,
            });
        }
    },
    updateUserPreferencesController: async (req, res) => {
        try {
            const parsed = userPreference_1.createUserPreferencesSchema.safeParse(req.body);
            if (!parsed.success) {
                return res.status(400).json({ message: "Invalid user preferences payload", errors: parsed.error.flatten() });
            }
            await userPreferenceService_1.userPreferenceService.updateUserPreference(req.user.id, parsed.data);
            res.status(200).json({ message: "Successfully Updated User Preferences" });
        }
        catch (error) {
            res.status(500).json({
                message: "Failed to update user details",
                error,
            });
        }
    },
};
//# sourceMappingURL=userController.js.map