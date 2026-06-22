
import { RegisterUserDigiHRRequest, RegisterUserRequest, SyncUserDataRequest, UserLeaveRequestDto } from "../interfaces/user";
import { Status } from "../generated/prisma";
import { SafeUser } from "../selection/selectionShapes";
import { prisma } from "../prisma/client";



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
    getUserByReferenceId: async (referenceId: number) => {
        return await prisma.users.findUnique({where: {referenceId}, select: SafeUser});
    },

    syncUserDetails: async( referenceId: number, userData: SyncUserDataRequest)=>{
        return await prisma.users.update({where: {referenceId}, data: userData});
    },

    // New method to get multiple users by reference IDs
    getUsersByReferenceIds: async (referenceIds: number[]) => {
        return await prisma.users.findMany({
            where: {
                referenceId: {
                    in: referenceIds
                }
            },
            select: SafeUser
        });
    },

    // New method for bulk updating user details within a transaction
    bulkUpdateUserDetails: async (updates: Array<{ referenceId: number; data: SyncUserDataRequest }>) => {
        return prisma.$transaction(
            updates.map(update => prisma.users.update({ where: { referenceId: update.referenceId }, data: update.data }))
        );
    },

    // New method for bulk creating users
    bulkCreateUsers: async (users: RegisterUserDigiHRRequest[]) => {
        return await prisma.users.createMany({
            data: users,
            skipDuplicates: true
        });
    },

    // User availability endpoints
    
    createUserLeave: async(data: UserLeaveRequestDto)=>{
        return await prisma.userAvailability.create({data})
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