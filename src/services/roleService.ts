import { prisma } from "../prisma/client";
import { CreateRoleRequest } from "../interfaces/role";


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

}