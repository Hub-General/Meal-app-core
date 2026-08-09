import { CreateRoleRequest } from "../schema/role";
export declare const roleService: {
    createRole: (roleData: CreateRoleRequest) => Promise<{
        name: string;
        description: string | null;
        createdAt: Date;
        updatedAt: Date;
        id: number;
    }>;
    getAllRoles: () => Promise<{
        name: string;
        description: string | null;
        createdAt: Date;
        updatedAt: Date;
        id: number;
    }[]>;
    getRoleById: (roleId: number) => Promise<{
        name: string;
        description: string | null;
        createdAt: Date;
        updatedAt: Date;
        id: number;
    } | null>;
    updateRole: (roleId: number, roleData: CreateRoleRequest) => Promise<{
        name: string;
        description: string | null;
        createdAt: Date;
        updatedAt: Date;
        id: number;
    }>;
    seedRoles: () => Promise<{
        name: string;
        id: number;
    }[]>;
};
//# sourceMappingURL=roleService.d.ts.map