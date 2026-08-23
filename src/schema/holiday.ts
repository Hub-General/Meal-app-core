import { z } from "zod";

export const createHolidaySchema = z.object({
    title: z.string().min(1, "Title is required"),
    description: z.string().optional(),
    year: z.number().int().min(2000).max(2100).optional(),
    startDate: z.string().or(z.date()),
    endDate: z.string().or(z.date()).optional().nullable(),
    isCompany: z.boolean().optional().default(true),
});

export const updateHolidaySchema = createHolidaySchema.partial();

export const holidayQuerySchema = z.object({
    year: z.coerce.number().int().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
});

export const weekHolidayQuerySchema = z.object({
    week: z.coerce.number().int().min(1).max(53),
    year: z.coerce.number().int().min(2000).max(2100),
});

export const holidayOverrideSchema = z.object({
    originalDate: z.string().min(10, "Original date (YYYY-MM-DD) is required"),
    title: z.string().min(1, "Title is required"),
    year: z.number().int().optional(),
    isIgnored: z.boolean().optional().default(false),
    adjustedDate: z.string().optional().nullable(),
    adjustedDayName: z.string().optional().nullable(),
    notes: z.string().optional().nullable(),
});

export type CreateHolidayRequest = z.infer<typeof createHolidaySchema>;
export type UpdateHolidayRequest = z.infer<typeof updateHolidaySchema>;
export type HolidayQuery = z.infer<typeof holidayQuerySchema>;
export type WeekHolidayQuery = z.infer<typeof weekHolidayQuerySchema>;
export type HolidayOverrideRequest = z.infer<typeof holidayOverrideSchema>;

export interface HolidayOverrideItem {
    id: number;
    originalDate: string;
    title: string;
    year: number;
    isIgnored: boolean;
    adjustedDate?: string | null;
    adjustedDayName?: string | null;
    notes?: string | null;
    createdAt: Date;
    updatedAt: Date;
}

export interface HolidayItem {
    id?: number;
    title: string;
    description?: string | null;
    date: string; // ISO date string (YYYY-MM-DD)
    endDate?: string | null;
    dayName: string; // MONDAY, TUESDAY, etc.
    isCompany: boolean;
    source: "COMPANY" | "PUBLIC" | "EXTERNAL_API" | "GOOGLE_CALENDAR";
    isOverridden?: boolean;
    isIgnored?: boolean;
    adjustedDate?: string | null;
    overrideId?: number;
}

export interface AllHolidaysResponse {
    companyHolidays: HolidayItem[];
    publicHolidays: HolidayItem[];
    overrides: HolidayOverrideItem[];
}
