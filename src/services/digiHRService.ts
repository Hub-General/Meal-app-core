import { userService } from "./userService";
import { Status } from "../generated/prisma";
import argon2 from "argon2"; // Assuming argon2 is available for hashing passwords
import { RegisterUserDigiHRRequest } from "../interfaces/user";

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

interface DigiHRUpdate {
    name?: string;
    referenceEmail?: string;
    status?: Status;
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
        // Fetch all users from DigiHR service
        const digiUsers = await digiHRService.getUsers();
        const digiUserReferenceIds = digiUsers.map(user => user.ID);

        // Fetch all existing local users that match the reference IDs from DigiHR
        const localUsers = await userService.getUsersByReferenceIds(digiUserReferenceIds);
        const localUserMap = new Map(localUsers.map(user => [user.referenceId, user]));

        const usersToCreate: RegisterUserDigiHRRequest[] = [];
        const usersToUpdate: Array<{ referenceId: number; data: { name?: string; referenceEmail?: string; status?: Status } }> = [];

        const placeholderPasswordHash = await argon2.hash(Math.random().toString(36).substring(2, 15));

        for (const digiUser of digiUsers) {
            const localUser = localUserMap.get(digiUser.ID) as DigiHRUpdate;
            const digiStatus = digiUser.Status.toUpperCase() as Status; // Normalize status to enum type

            if (localUser) {
                // Check for changes to avoid unnecessary updates
                const updateData: DigiHRUpdate = {};

                if (localUser.name !== digiUser.EmployeeName) {
                    updateData.name = digiUser.EmployeeName;
                }
                if (localUser.referenceEmail !== digiUser.Email) {
                    updateData.referenceEmail = digiUser.Email;
                }
                if (localUser.status !== digiStatus) {
                    updateData.status = digiStatus;
                }

                if (Object.keys(updateData).length > 0) {
                    usersToUpdate.push({ referenceId: digiUser.ID, data: updateData });
                }
            } else {
                // User does not exist locally, prepare for creation
                usersToCreate.push({
                    name: digiUser.EmployeeName,
                    referenceEmail: digiUser.Email,
                    referenceId: digiUser.ID,
                    status: digiStatus,
                    passwordHash: placeholderPasswordHash, // Use the generated placeholder hash
                    roleId: 2, // Assuming '2' is a default role ID for new users
                    createdAt: new Date(), // Set creation timestamp
                });
            }
        }

        if (usersToCreate.length > 0) {
            console.log(`Creating ${usersToCreate.length} new users...`);
            await userService.bulkCreateUsers(usersToCreate);
            console.log(`${usersToCreate.length} new users created.`);
        }

        if (usersToUpdate.length > 0) {
            console.log(`Updating ${usersToUpdate.length} existing users...`);
            await userService.bulkUpdateUserDetails(usersToUpdate);
            console.log(`${usersToUpdate.length} existing users updated.`);
        }

        console.log("User synchronization complete.");
    }
}