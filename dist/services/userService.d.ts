import { Status } from "../generated/prisma";
import { RegisterUserDigiHRRequest, RegisterUserRequest, SyncUserDataRequest, UserLeaveRequest } from "../schema/user";
export declare const userService: {
    getAllUsers: (status?: Status) => Promise<{
        name: string;
        id: number;
        roleId: number;
        status: import("../generated/prisma").$Enums.Status;
        email: string | null;
        referenceEmail: string;
        referenceId: number;
        role: {
            name: string;
        };
    }[]>;
    getUserById: (userId: number) => Promise<{
        name: string;
        id: number;
        roleId: number;
        status: import("../generated/prisma").$Enums.Status;
        email: string | null;
        referenceEmail: string;
        referenceId: number;
        role: {
            name: string;
        };
    } | null>;
    updateUserDetails: (userId: number, userData: RegisterUserRequest) => Promise<{
        name: string;
        createdAt: Date;
        id: number;
        roleId: number;
        status: import("../generated/prisma").$Enums.Status;
        email: string | null;
        referenceEmail: string;
        referenceId: number;
        isActivated: boolean;
        passwordHash: string | null;
    }>;
    getUsersByRole: (roleId: number) => Promise<void>;
    getUserByReferenceId: (referenceId: number) => Promise<{
        name: string;
        id: number;
        roleId: number;
        status: import("../generated/prisma").$Enums.Status;
        email: string | null;
        referenceEmail: string;
        referenceId: number;
        role: {
            name: string;
        };
    } | null>;
    syncUserDetails: (referenceId: number, userData: SyncUserDataRequest) => Promise<{
        name: string;
        createdAt: Date;
        id: number;
        roleId: number;
        status: import("../generated/prisma").$Enums.Status;
        email: string | null;
        referenceEmail: string;
        referenceId: number;
        isActivated: boolean;
        passwordHash: string | null;
    }>;
    getUsersByReferenceIds: (referenceIds: number[]) => Promise<{
        name: string;
        id: number;
        roleId: number;
        status: import("../generated/prisma").$Enums.Status;
        email: string | null;
        referenceEmail: string;
        referenceId: number;
        role: {
            name: string;
        };
    }[]>;
    bulkUpdateUserDetails: (updates: Array<{
        referenceId: number;
        data: SyncUserDataRequest;
    }>) => Promise<{
        name: string;
        createdAt: Date;
        id: number;
        roleId: number;
        status: import("../generated/prisma").$Enums.Status;
        email: string | null;
        referenceEmail: string;
        referenceId: number;
        isActivated: boolean;
        passwordHash: string | null;
    }[]>;
    bulkCreateUsers: (users: RegisterUserDigiHRRequest[]) => Promise<import("../generated/prisma").Prisma.BatchPayload>;
    createUserLeave: (data: UserLeaveRequest) => Promise<{
        createdAt: Date;
        id: number;
        userId: number;
        startDate: Date;
        endDate: Date;
    }>;
    createUserLeaveBatch: (data: UserLeaveRequest[]) => Promise<import("../generated/prisma").Prisma.BatchPayload>;
    checkLeaveExists: (userId: number, startDate: Date, endDate: Date) => Promise<boolean>;
};
//# sourceMappingURL=userService.d.ts.map