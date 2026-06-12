export interface Role {
    id: number;
    name: string;
    description?: string;
}

export interface CreateRoleRequest {
    name: string;
    description?: string;
}
