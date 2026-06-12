import { prisma } from "../db/prisma";
import { RegisterUserRequest } from "../interfaces/user";
import { SafeUser } from "../selection/selectionShapes";

export const userService = {
    getAllUsers: async()=>{
        return await prisma.users.findMany({select:SafeUser})
    },
    getUserById: async(userId: number)=>{
        return await prisma.users.findUnique({where: {id: userId}, select: SafeUser});
    },
    updateUserDetails: async(userId: number, userData: RegisterUserRequest)=>{
        return await prisma.users.update({where: {id: userId}, data: userData});
    },
}