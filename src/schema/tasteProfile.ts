import z from "zod";

export const tasteProfileSchema = z.object({
    userId: z.number().int().positive(),
    calendarYear: z.number().int().min(2000),
    totalMealsSelected: z.number().int().min(0),
    metrics: z.string(),
    personalityType: z.string().optional(),
    updatedAt: z.date(),
});

export type TasteProfile = z.infer<typeof tasteProfileSchema>;