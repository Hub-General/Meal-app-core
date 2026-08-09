"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userService = void 0;
const prisma_1 = require("../generated/prisma");
const selectionShapes_1 = require("../selection/selectionShapes");
const client_1 = require("../prisma/client");
exports.userService = {
    // Users endpoints
    getAllUsers: async (status = prisma_1.Status.ACTIVE) => {
        return await client_1.prisma.users.findMany({ where: { status }, select: selectionShapes_1.SafeUser });
    },
    getUserById: async (userId) => {
        return await client_1.prisma.users.findUnique({ where: { id: userId }, select: selectionShapes_1.SafeUser });
    },
    updateUserDetails: async (userId, userData) => {
        return await client_1.prisma.users.update({ where: { id: userId }, data: userData });
    },
    getUsersByRole: async (roleId) => {
    },
    getUserByReferenceId: async (referenceId) => {
        return await client_1.prisma.users.findUnique({ where: { referenceId }, select: selectionShapes_1.SafeUser });
    },
    syncUserDetails: async (referenceId, userData) => {
        return await client_1.prisma.users.update({ where: { referenceId }, data: userData });
    },
    // New method to get multiple users by reference IDs
    getUsersByReferenceIds: async (referenceIds) => {
        return await client_1.prisma.users.findMany({
            where: {
                referenceId: {
                    in: referenceIds
                }
            },
            select: selectionShapes_1.SafeUser
        });
    },
    // New method for bulk updating user details within a transaction
    bulkUpdateUserDetails: async (updates) => {
        return client_1.prisma.$transaction(updates.map(update => client_1.prisma.users.update({ where: { referenceId: update.referenceId }, data: update.data })));
    },
    // New method for bulk creating users
    bulkCreateUsers: async (users) => {
        const usersWithRoleId = users.map((user) => ({
            ...user,
            roleId: 1,
        }));
        return await client_1.prisma.users.createMany({
            data: usersWithRoleId,
            skipDuplicates: true
        });
    },
    // User availability endpoints
    createUserLeave: async (data) => {
        return await client_1.prisma.userAvailability.create({ data });
    },
    createUserLeaveBatch: async (data) => {
        return await client_1.prisma.userAvailability.createMany({ data: data });
    },
    checkLeaveExists: async (userId, startDate, endDate) => {
        const count = await client_1.prisma.userAvailability.count({
            where: { userId, startDate, endDate }
        });
        return count > 0;
    },
};
//# sourceMappingURL=userService.js.map