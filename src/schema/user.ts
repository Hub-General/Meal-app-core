import { Status } from "../generated/prisma";
import z, { email } from "zod";

//Export zod schemas
export const GetUsersQueryRequestSchema = z.object({
    status: z.enum(Status).optional(),
})
export const userRegisterRequestSchema = z.object({
    email: z.email(),
    password: z.string().min(6).max(100),
    name: z.string().min(2).max(100)
});

export const userUpdateSchema = z.object({
    email: z.email().optional(),
})

export const userLeaveRequestSchema = z.object({
    userId: z.number(),
    startDate: z.date(),
    endDate: z.date()
});

export const syncUserDataRequestSchema = z.object({
    name: z.string().optional(),
    referenceEmail: z.string().email().optional(),
    status: z.enum(Status).optional()
});

export const registerUserDigiHRRequestSchema = z.object({
    name: z.string().min(2).max(100),
    referenceEmail: z.string().email(),
    referenceId: z.number(),
    status: z.enum(Status),
    isActivated: z.boolean()
});


// Export interfaces / types

export interface User {
    id: number;
    name: string
    email: string;
    passwordHash: string;
    status: Status;
    referenceEmail: string;
    referenceId: number;
    createdAt: Date;
    roleId?: number;
}

export type UserProfileUpdateRequest = z.infer<typeof userUpdateSchema>;
export type RegisterUserRequest = z.infer<typeof userRegisterRequestSchema>;
export type UserLeaveRequest = z.infer<typeof userLeaveRequestSchema>;
export type SyncUserDataRequest = z.infer<typeof syncUserDataRequestSchema>;
export type RegisterUserDigiHRRequest = z.infer<typeof registerUserDigiHRRequestSchema>;