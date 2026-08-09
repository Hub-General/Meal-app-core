"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.roleService = void 0;
const client_1 = require("../prisma/client");
const defaultRoles = [
    { name: "user", description: "Standard user role with basic access" },
    { name: "admin", description: "Administrator role with full system access" },
    { name: "hr", description: "Human Resources role with specific HR functionalities" },
];
exports.roleService = {
    createRole: async (roleData) => {
        return await client_1.prisma.roles.create({ data: roleData });
    },
    getAllRoles: async () => {
        return await client_1.prisma.roles.findMany();
    },
    getRoleById: async (roleId) => {
        return await client_1.prisma.roles.findUnique({ where: { id: roleId } });
    },
    updateRole: async (roleId, roleData) => {
        return await client_1.prisma.roles.update({ where: { id: roleId }, data: roleData });
    },
    seedRoles: async () => {
        for (const role of defaultRoles) {
            await client_1.prisma.roles.upsert({
                where: { name: role.name },
                create: role,
                update: role.description !== undefined ? { description: role.description } : {},
            });
        }
        return await client_1.prisma.roles.findMany({
            where: { name: { in: defaultRoles.map((role) => role.name) } },
            orderBy: { id: "asc" },
            select: { id: true, name: true },
        });
    },
};
//# sourceMappingURL=roleService.js.map