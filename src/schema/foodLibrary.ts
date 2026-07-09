import z from "zod";
import { FoodGroup } from "../generated/prisma";

export const CreateFoodGroupRequestSchema = z.object({
    name: z.string().min(1).max(50),
    foodCode: z.string().min(1).max(10),
    foodGroup: z.enum(FoodGroup)
});

export const UpdateFoodGroupRequestSchema = z.object({
    name: z.string().min(1).max(50).optional(),
    foodCode: z.string().min(1).max(10).optional(),
    foodGroup: z.enum(FoodGroup).optional()
});

export const CreateFoodItemRequestSchema = z.object({
    name: z.string().min(1).max(100),
    foodCode: z.string().min(1).max(20),
    foodGroup: z.enum(FoodGroup),
});

export type CreateFoodItemRequest = z.infer<typeof CreateFoodItemRequestSchema>;
