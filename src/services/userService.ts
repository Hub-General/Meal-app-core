import { prisma } from "../db/prisma";
import { RegisterUserRequest, UserLeaveRequestDto } from "../interfaces/user";
import { SafeUser } from "../selection/selectionShapes";

export const userService = {

    // Users endpoints

    getAllUsers: async()=>{
        return await prisma.users.findMany({select:SafeUser})
    },
    getUserById: async(userId: number)=>{
        return await prisma.users.findUnique({where: {id: userId}, select: SafeUser});
    },
    updateUserDetails: async(userId: number, userData: RegisterUserRequest)=>{
        return await prisma.users.update({where: {id: userId}, data: userData});
    },
    getUserByReferenceId: async (referenceID: number) => {
        return await prisma.users.findUnique({where: {referenceID}, select: SafeUser});
    },

    // User availability endpoints
    
    createUserLeave: async(data: UserLeaveRequestDto)=>{
        return await prisma.userAvailability.create({data: data})
    },

    createUserLeaveBatch: async(data: UserLeaveRequestDto[])=>{
        return await prisma.userAvailability.createMany({data: data})
    },

    checkLeaveExists: async (userId: number, startDate: Date, endDate: Date) => {
        const count = await prisma.userAvailability.count({
            where: { userId, startDate, endDate }
        });
        return count > 0;
    },
}