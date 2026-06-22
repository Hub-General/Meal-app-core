import { Status } from "../generated/prisma";

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

export interface RegisterUserRequest{
    name: string;
    email: string;
    password: string;
    roleId?: number;
}

export interface UserLeaveRequestDto{
    userId: number;
    startDate: Date;
    endDate: Date;
}

export interface SyncUserDataRequest {
    name?: string;
    referenceEmail?: string;
    status?: Status;
}

export interface RegisterUserDigiHRRequest {
    name: string;
    passwordHash: string;
    referenceEmail: string
    referenceId: number;
    roleId: number;
    status: Status;
    createdAt: Date;
}