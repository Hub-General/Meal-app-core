import { z } from "zod";

export const holidayTypeSchema = z.enum(["COMPANY", "OVERRIDE"]);
export type HolidayType = z.infer<typeof holidayTypeSchema>;

// ─── Company Holiday Schemas ────────────────────────────────────────────────

export const createHolidaySchema = z.object({
    title: z.string().min(1, "Title is required"),
    description: z.string().optional(),
    year: z.number().int().min(2000).max(2100).optional(),
    startDate: z.string().min(10, "Start date (YYYY-MM-DD) is required"),
    endDate: z.string().optional().nullable(),
    notes: z.string().optional().nullable(),
});

export const updateHolidaySchema = createHolidaySchema.partial();

// ─── Override Schemas ────────────────────────────────────────────────────────

export const holidayOverrideSchema = z.object({
    originalDate: z.string().min(10, "Original date (YYYY-MM-DD) is required"),
    title: z.string().min(1, "Title is required"),
    year: z.number().int().optional(),
    isIgnored: z.boolean().optional().default(false),
    adjustedDate: z.string().optional().nullable(),
    adjustedDayName: z.string().optional().nullable(),
    notes: z.string().optional().nullable(),
});

// ─── Query Schemas ────────────────────────────────────────────────────────────

export const holidayQuerySchema = z.object({
    year: z.coerce.number().int().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
});

export const weekHolidayQuerySchema = z.object({
    week: z.coerce.number().int().min(1).max(53),
    year: z.coerce.number().int().min(2000).max(2100),
});

// ─── Inferred Types ───────────────────────────────────────────────────────────

export type CreateHolidayRequest = z.infer<typeof createHolidaySchema>;
export type UpdateHolidayRequest = z.infer<typeof updateHolidaySchema>;
export type HolidayQuery = z.infer<typeof holidayQuerySchema>;
export type WeekHolidayQuery = z.infer<typeof weekHolidayQuerySchema>;
export type HolidayOverrideRequest = z.infer<typeof holidayOverrideSchema>;

// ─── DB Record Shape (mirrors consolidated Holidays model) ───────────────────

export interface HolidayRecord {
    id: number;
    type: HolidayType;
    title: string;
    description?: string | null;
    year: number;
    startDate: string;          // YYYY-MM-DD
    endDate?: string | null;    // YYYY-MM-DD, multi-day COMPANY ranges
    notes?: string | null;
    // OVERRIDE-only
    originalDate?: string | null;
    isIgnored: boolean;
    adjustedDate?: string | null;
    adjustedDayName?: string | null;
    createdAt: Date;
    updatedAt: Date;
}

// ─── Computed / Resolved Holiday Shape (not persisted) ───────────────────────

export interface HolidayItem {
    id?: number;
    title: string;
    description?: string | null;
    date: string;               // ISO date string (YYYY-MM-DD)
    endDate?: string | null;
    dayName: string;            // MONDAY, TUESDAY, etc.
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
    overrides: HolidayRecord[];
}

