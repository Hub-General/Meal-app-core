"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userController = void 0;
const userService_1 = require("../services/userService");
exports.userController = {
    getAllUsersController: async (req, res) => {
        try {
            const users = await userService_1.userService.getAllUsers();
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
            const users = await userService_1.userService.updateUserDetails(Number(req.params.id), req.body);
            res.status(200).json(users);
        }
        catch (error) {
            res.status(500).json({
                message: "Failed to update user details",
                error,
            });
        }
    }
};
//# sourceMappingURL=userController.js.map