
import { Status } from "../generated/prisma";
import { SafeUser } from "../selection/selectionShapes";
import { prisma } from "../prisma/client";
import { RegisterUserDigiHRRequest, RegisterUserRequest, SyncUserDataRequest, UserLeaveRequest, UserProfileUpdateRequest } from "../schema/user";



export const userService = {

    // Users endpoints

    getAllUsers: async(status: Status = Status.ACTIVE)=>{
        return await prisma.users.findMany({where:{status}, select:SafeUser})
    },
    getUserById: async(userId: number)=>{
        return await prisma.users.findUnique({where: {id: userId}, select: SafeUser});
    },
    updateUserDetails: async(userId: number, userData: UserProfileUpdateRequest)=>{
        return await prisma.users.update({where: {id: userId}, data: userData});
    },
    getUsersByRole: async(roleId: number)=>{
        
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
        const usersWithRoleId = users.map((user) => ({
            ...user,
            roleId: 1,
        }));

        return await prisma.users.createMany({
            data: usersWithRoleId as any,
            skipDuplicates: true
        });
    },

    // User availability endpoints
    
    createUserLeave: async(data: UserLeaveRequest)=>{
        return await prisma.userAvailability.create({data})
    },

    createUserLeaveBatch: async(data: UserLeaveRequest[])=>{
        return await prisma.userAvailability.createMany({data: data})
    },

    checkLeaveExists: async (userId: number, startDate: Date, endDate: Date) => {
        const count = await prisma.userAvailability.count({
            where: { userId, startDate, endDate }
        });
        return count > 0;
    },

    getUserLeaves: async (userId: number) => {
        return await prisma.userAvailability.findMany({
            where: { userId },
            orderBy: {
                startDate: "asc"
            }
        });
    },

    getUserProfile: async (userId: number) => {
        const user = await prisma.users.findUnique({
            where: { id: userId },
            select: {
                id: true,
                name: true,
                email: true,
                referenceEmail: true,
                referenceId: true,
                status: true,
                roleId: true,
                role: {
                    select: {
                        id: true,
                        name: true,
                        description: true
                    }
                },
                createdAt: true,
                isActivated: true,
                preferences: true,
                userAvailability: {
                    orderBy: {
                        startDate: "desc"
                    }
                },
                _count: {
                    select: {
                        selections: true,
                        presets: true
                    }
                }
            }
        });

        if (!user) {
            return null;
        }

        const now = new Date();
        const upcomingOrActiveLeaves = user.userAvailability.filter(
            (leave) => new Date(leave.endDate) >= now
        );
        const totalLeaveDays = user.userAvailability.reduce(
            (acc, curr) => acc + (curr.daysCount || 0),
            0
        );

        return {
            id: user.id,
            name: user.name,
            email: user.email,
            referenceEmail: user.referenceEmail,
            referenceId: user.referenceId,
            status: user.status,
            roleId: user.roleId,
            roleName: user.role?.name ?? "User",
            role: user.role,
            createdAt: user.createdAt,
            isActivated: user.isActivated,
            preferences: user.preferences,
            leaves: user.userAvailability,
            upcomingOrActiveLeaves,
            totalLeaveDays,
            stats: {
                totalSelections: user._count.selections,
                totalPresets: user._count.presets
            }
        };
    },
}