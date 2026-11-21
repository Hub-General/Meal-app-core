import z from "zod";
import {WeekMenuStatus} from "../generated/prisma";


//Export zod schemas
export const weekMenuScheduleCreateRequestSchema = z.object({
    week: z.number().min(1).max(53),
    year: z.number().min(2000).max(2100),
    menuId: z.number(),
    excludedUserIds: z.array(z.number().int().positive()).nullable().optional(),
});

export const weekMenuScheduleUpdateRequestSchema = z.object({
    menuId: z.number().optional(),
    status: z.enum(WeekMenuStatus).optional(),
    excludedUserIds: z.array(z.number().int().positive()).optional(),
});


//Export types / interfaces
export type WeekMenuScheduleCreateRequest = z.infer<typeof weekMenuScheduleCreateRequestSchema>;
export type WeekMenuScheduleUpdateRequest = z.infer<typeof weekMenuScheduleUpdateRequestSchema>;
