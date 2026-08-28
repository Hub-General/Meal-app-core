import z from "zod";

//Export zod schemas
export const CreateMealRequestSchema = z.object({
  name: z.string().min(1).max(100),
  imagePath: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
  foodCode: z.string().min(1).max(20),
  calories: z.number().min(0).nullable().optional(),
  description: z.string().nullable().optional(),
});

export const UpdateMealRequestSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  imagePath: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
  foodCode: z.string().min(1).max(20).optional(),
  calories: z.number().min(0).nullable().optional(),
  description: z.string().nullable().optional(),
});

export const UpdateMealBatchRequestSchema = z.array(
  z.object({
    id: z.number(),
    name: z.string().optional(),
    imagePath: z.string().nullable().optional(),
    isActive: z.boolean().optional(),
    foodCode: z.string().optional(),
    calories: z.number().min(0).nullable().optional(),
    description: z.string().nullable().optional(),
  })
);
export type UpdateMealBatchRequest = z.infer<typeof UpdateMealBatchRequestSchema>;

//Export interfaces / types

export interface Meal {
  id: number;
  name: string;
  imagePath: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  foodCode: string;
  calories: number;
  description?: string;
}

export type UpdateMealRequest = z.infer<typeof UpdateMealRequestSchema>;
export type CreateMealRequest = z.infer<typeof CreateMealRequestSchema>;
