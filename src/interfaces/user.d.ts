export interface User {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    isActive: boolean;
    createdAt: Date;
    roleId?: number;
}

export interface RegisterUserRequest{
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    roleId?: number;
}