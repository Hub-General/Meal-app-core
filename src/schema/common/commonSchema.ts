import z from "zod";

export const weekAndYearRequestSchema = z.object({
    week: z.number().min(1).max(53),
    year: z.number().min(2000).max(2100)
})

export type WeekAndYearRequest = z.infer<typeof weekAndYearRequestSchema>;