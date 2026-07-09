import z from "zod";

// Export zod schemas
export const createRoleRequestSchema = z.object({
    name: z.string().min(1).max(50),
    description: z.string().optional()
});


//Export types / interfaces
export interface Role {
    id: number;
    name: string;
    description?: string;
}

export type CreateRoleRequest = z.infer<typeof createRoleRequestSchema>;