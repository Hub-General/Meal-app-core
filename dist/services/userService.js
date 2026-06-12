"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userService = void 0;
const prisma_1 = require("../db/prisma");
exports.userService = {
    getAllUsers: async () => {
        return await prisma_1.prisma.users.findMany();
    },
    getUserById: async (userId) => {
        return await prisma_1.prisma.users.findUnique({ where: { id: userId } });
    },
    updateUserDetails: async (userId, userData) => {
        return await prisma_1.prisma.users.update({ where: { id: userId }, data: userData });
    },
};
//# sourceMappingURL=userService.js.map