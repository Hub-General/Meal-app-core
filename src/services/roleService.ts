import { prisma } from "../prisma/client";
import { CreateRoleRequest } from "../schema/role";

const defaultRoles: CreateRoleRequest[] = [
    { name: "user", description: "Standard user role with basic access" },
    { name: "admin", description: "Administrator role with full system access" },
    { name: "hr", description: "Human Resources role with specific HR functionalities" },
];

export const roleService = {
    createRole: async(roleData : CreateRoleRequest)=>{
        return await prisma.roles.create({data: roleData});
    },
    getAllRoles: async()=>{
        return await prisma.roles.findMany();
    },
    getRoleById: async(roleId: number)=>{
        return await prisma.roles.findUnique({where: {id: roleId}});

    },
    updateRole: async(roleId: number, roleData: CreateRoleRequest)=>{
        return await prisma.roles.update({where: {id: roleId}, data: roleData});
    },
    seedRoles: async () => {
        for (const role of defaultRoles) {
            await prisma.roles.upsert({
                where: { name: role.name },
                create: role,
                update: role.description !== undefined ? { description: role.description } : {},
            });
        }

        return await prisma.roles.findMany({
            where: { name: { in: defaultRoles.map((role) => role.name) } },
            orderBy: { id: "asc" },
            select: { id: true, name: true },
        });
    },
}
