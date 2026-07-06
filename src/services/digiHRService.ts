import { userService } from "./userService";
import { Status } from "../generated/prisma";
import { prisma } from "../prisma/client";
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
    ID: number
    ApprovalStatus: string
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
        const url = process.env.DIGI_HR_USER_LEAVES;
        if (!url) {
            throw new Error("Environment variable DIGI_HR_USER_LEAVES is not defined");
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

    updateUserAvailabilityTable: async()=>{
        const user_leaves_records = await digiHRService.getUsersLeaves();
        
        for (const leave of user_leaves_records) {
            // Resolve the local userId from the DigiHR Email
            const user = await userService.getUserByReferenceId(leave.ID);
            
            if (user) {
                const startDate = new Date(leave.StartDate);
                const endDate = new Date(leave.EndDate);

                // Check for duplicates using the helper with prisma.count
                const alreadyExists = await userService.checkLeaveExists(user.id, startDate, endDate);

                if (!alreadyExists) {
                    await userService.createUserLeave({
                        userId: user.id,
                        startDate,
                        endDate
                    });
                }
            }
        }
    },

    syncUsersWithDatabase: async () => {
        const digiUsers = await digiHRService.getUsers();

        for (const digiUser of digiUsers) {
            const digiStatus = GetEmploymentStatus(digiUser.Status) as Status;

            await prisma.users.upsert({
                where: {
                    referenceId: digiUser.ID,
                },
                create: {
                    name: digiUser.EmployeeName,
                    referenceEmail: digiUser.Email,
                    referenceId: digiUser.ID,
                    status: digiStatus,
                    isActivated: false,
                    roleId: 1,
                },
                update: {
                    name: digiUser.EmployeeName,
                    referenceEmail: digiUser.Email,
                    status: digiStatus,
                },
            });
        }

        console.log(`Synchronized ${digiUsers.length} users.`);
    }
}