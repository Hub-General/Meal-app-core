"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.roleService = void 0;
const prisma_1 = require("../db/prisma");
exports.roleService = {
    createRole: async (roleData) => {
        return await prisma_1.prisma.roles.create({ data: roleData });
    },
    getAllRoles: async () => {
        return await prisma_1.prisma.roles.findMany();
    },
    getRoleById: async (roleId) => {
        return await prisma_1.prisma.roles.findUnique({ where: { id: roleId } });
    },
    updateRole: async (roleId, roleData) => {
        return await prisma_1.prisma.roles.update({ where: { id: roleId }, data: roleData });
    },
};
//# sourceMappingURL=roleService.js.map