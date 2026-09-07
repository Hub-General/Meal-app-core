import { userService } from "./userService";
import { Status, Theme } from "../generated/prisma";
import { prisma } from "../prisma/client";
import { Roles } from "../enums/ERoles";
import { GetEmploymentStatus } from "../helpers/digiHRStatusConverter";

interface DigiHRUser {
    EmployeeName: string
    Email: string
    StaffID: string
    Role: string
    Status: string
    ID: number
    EmploymentType: string
}

interface DigiHRUserLeave {
    EmployeeName: string
    Email: string
    DaysRequested: number
    StartDate: string
    EndDate: string
    referenceID: number
    ApprovalStatus: string
}



export function getExcludedReferenceIds(): Set<number> {
    if (!process.env.EXCLUDED_USERS) return new Set();
    return new Set(process.env.EXCLUDED_USERS.split(",").map(Number));
}

export const digiHRService = {
    getUsers: async (): Promise<DigiHRUser[]> => {
        const url = process.env.DIGI_HR_USERS;
        if (!url) {
            throw new Error("Environment variable DIGI_HR_USERS is not defined");
        }

        const res = await fetch(url);
        if (!res.ok) {
            throw new Error(`Failed to fetch users: ${res.status} ${res.statusText}`);
        }
        return await res.json() as DigiHRUser[];
    },

    getUsersLeaves: async (): Promise<DigiHRUserLeave[]> => {
        const url = process.env.DIGI_HR_USER_LEAVES || process.env.DIGI_HR_LEAVES;
        if (!url) {
            throw new Error("Environment variable DIGI_HR_USER_LEAVES (or DIGI_HR_LEAVES) is not defined");
        }

        const res = await fetch(url);
        if (!res.ok) {
            throw new Error(`Failed to fetch user leaves: ${res.status} ${res.statusText}`);
        }
        const user_leaves = await res.json() as DigiHRUserLeave[];

        const today = new Date();

        return user_leaves.filter(leave => 
            leave.ApprovalStatus === "Approved" && 
            new Date(leave.StartDate) > today
        );
    },

    updateUserAvailabilityTable: async (data: DigiHRUserLeave[]) => {
        for (const leave of data) {
            const user = await userService.getUserByReferenceId(leave.referenceID);
            if (user) {
                const startDate = new Date(leave.StartDate);
                const endDate = new Date(leave.EndDate);

                const alreadyExists = await userService.checkLeaveExists(user.id, startDate, endDate);
                if (!alreadyExists) {
                    await userService.createUserLeave({
                        userId: user.id,
                        startDate,
                        endDate,
                        daysRequested: leave.DaysRequested
                    });
                }
            }
        }
    },

    syncUsersWithDatabase: async () => {
        const digiUsers = await digiHRService.getUsers();
        const excludedIds = getExcludedReferenceIds();

        for (const digiUser of digiUsers) {
            if (excludedIds.has(digiUser.ID)) continue;

            const digiStatus = GetEmploymentStatus(digiUser.Status) as Status;

            await prisma.users.upsert({
                where: {
                    referenceId: digiUser.ID,
                },
                create: {
                    name: digiUser.EmployeeName.trim(),
                    referenceEmail: digiUser.Email.trim(),
                    referenceId: digiUser.ID,
                    status: digiStatus,
                    isActivated: false,
                    roleId: Roles.user,
                    preferences: {
                        create: {
                            dislikes: { meals: [], foodItems: [] },
                            excludedMealIds: [],
                            announcementVersion: 0,
                            theme: Theme.LIGHT,
                            autoSubmitPreset: false,
                        },
                    },
                },
                update: {
                    name: digiUser.EmployeeName.trim(),
                    referenceEmail: digiUser.Email.trim(),
                    status: digiStatus,
                },
            });
        }

        console.log(`Synchronized users from DigiHR.`);
    }
}