import { RegisterUserRequest } from "../interfaces/user";
export declare const userService: {
    getAllUsers: () => Promise<{
        roleId: number;
        name: string;
        createdAt: Date;
        id: number;
        email: string;
        status: import("../generated/prisma").$Enums.Status;
        password: string;
    }[]>;
    getUserById: (userId: number) => Promise<{
        roleId: number;
        name: string;
        createdAt: Date;
        id: number;
        email: string;
        status: import("../generated/prisma").$Enums.Status;
        password: string;
    } | null>;
    updateUserDetails: (userId: number, userData: RegisterUserRequest) => Promise<{
        roleId: number;
        name: string;
        createdAt: Date;
        id: number;
        email: string;
        status: import("../generated/prisma").$Enums.Status;
        password: string;
    }>;
};
//# sourceMappingURL=userService.d.ts.map