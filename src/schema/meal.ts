import z from "zod";

//Export zod schemas
export const CreateMealRequestSchema = z.object({
  name: z.string().min(1).max(100),
  image: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
  foodCode: z.string().min(1).max(20),
  calories: z.number().min(0).nullable().optional(),
  description: z.string().nullable().optional(),
});

export const UpdateMealRequestSchema = z.object({
    name: z.string().min(1).max(100).optional(),
    image: z.string().optional().nullable().transform(v => v ?? null),
    isActive: z.boolean().optional(),
    foodCode: z.string().min(1).max(20).optional(),
    calories: z.number().min(0).optional(),
    description: z.string().optional().nullable().transform(v => v ?? null)
});


//Export interfaces / types

export interface Meal {
    id: number;
    name: string;
    image: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    foodCode: string;
    calories: number;
    description?: string;
}

export type UpdateMealRequest = z.infer<typeof UpdateMealRequestSchema>;
export type CreateMealRequest = z.infer<typeof CreateMealRequestSchema>;
