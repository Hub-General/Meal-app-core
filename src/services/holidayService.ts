import {
    CreateHolidayRequest,
    HolidayItem,
    HolidayRecord,
    HolidayOverrideRequest,
    UpdateHolidayRequest,
    AllHolidaysResponse,
} from "../schema/holiday";
import { prisma } from "../db/prisma";
import { getDateFromISOWeek } from "../helpers/dateFunctions";

/**
 * Computes Gregorian Easter Sunday for a given year using Meeus/Jones/Butcher algorithm.
 */
function getEasterSunday(year: number): Date {
    const a = year % 19;
    const b = Math.floor(year / 100);
    const c = year % 100;
    const d = Math.floor(b / 4);
    const e = b % 4;
    const f = Math.floor((b + 8) / 25);
    const g = Math.floor((b - f + 1) / 3);
    const h = (19 * a + b - d - g + 15) % 30;
    const i = Math.floor(c / 4);
    const k = c % 4;
    const l = (32 + 2 * e + 2 * i - h - k) % 7;
    const m = Math.floor((a + 11 * h + 22 * l) / 451);
    const month = Math.floor((h + l - 7 * m + 114) / 31); // 3 = March, 4 = April
    const day = ((h + l - 7 * m + 114) % 31) + 1;
    return new Date(Date.UTC(year, month - 1, day));
}

// Well-known Islamic holiday dates for Ghana (approximate official sightings)
const ISLAMIC_HOLIDAYS_LOOKUP: Record<number, { eidAlFitr: string; eidAlAdha: string }> = {
    2023: { eidAlFitr: "2023-04-22", eidAlAdha: "2023-06-29" },
    2024: { eidAlFitr: "2024-04-11", eidAlAdha: "2024-06-17" },
    2025: { eidAlFitr: "2025-03-31", eidAlAdha: "2025-06-07" },
    2026: { eidAlFitr: "2026-03-20", eidAlAdha: "2026-05-27" },
    2027: { eidAlFitr: "2027-03-10", eidAlAdha: "2027-05-17" },
    2028: { eidAlFitr: "2028-02-27", eidAlAdha: "2028-05-05" },
    2029: { eidAlFitr: "2029-02-15", eidAlAdha: "2029-04-24" },
    2030: { eidAlFitr: "2030-02-05", eidAlAdha: "2030-04-14" },
};

const dayNames = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];

// In-memory cache for live public holiday feeds (TTL: 12 hours)
const publicHolidaysCache = new Map<number, { holidays: HolidayItem[]; timestamp: number }>();
const CACHE_TTL_MS = 12 * 60 * 60 * 1000;

/**
 * Normalizes holiday title to deduplicate identical holiday names across data sources
 * (e.g. "Founders' Day" vs "Founders Day", "Farmers' Day" vs "Farmer's Day", "Eid al-Fitr" vs "Eid ul-Fitr").
 */
export function normalizeHolidayTitle(title: string): string {
    return title
        .toLowerCase()
        .replace(/['’`"]/g, "")
        .replace(/\b(ul|el)\b/g, "al")
        .replace(/[^a-z0-9]/g, " ")
        .replace(/\s+/g, " ")
        .trim();
}

export const holidayService = {
    /**
     * Calculates all statutory public holidays for Ghana for a given year,
     * including movable Easter and Islamic dates and statutory weekend roll-overs (Act 601).
     */
    getGhanaStatutoryHolidays: (year: number): HolidayItem[] => {
        const rawHolidays: Array<{ title: string; date: Date }> = [];

        // Fixed statutory public holidays in Ghana
        rawHolidays.push({ title: "New Year's Day", date: new Date(Date.UTC(year, 0, 1)) });
        rawHolidays.push({ title: "Constitution Day", date: new Date(Date.UTC(year, 0, 7)) });
        rawHolidays.push({ title: "Independence Day", date: new Date(Date.UTC(year, 2, 6)) });
        rawHolidays.push({ title: "Workers' Day (May Day)", date: new Date(Date.UTC(year, 4, 1)) });
        rawHolidays.push({ title: "Republic Day", date: new Date(Date.UTC(year, 6, 1)) });
        rawHolidays.push({ title: "Founders' Day", date: new Date(Date.UTC(year, 7, 4)) });
        rawHolidays.push({ title: "Kwame Nkrumah Memorial Day", date: new Date(Date.UTC(year, 8, 21)) });

        // Farmers' Day: 1st Friday of December
        const decFirst = new Date(Date.UTC(year, 11, 1));
        const decFirstDay = decFirst.getUTCDay();
        const daysToFriday = (5 - decFirstDay + 7) % 7;
        const farmersDay = new Date(Date.UTC(year, 11, 1 + daysToFriday));
        rawHolidays.push({ title: "National Farmers' Day", date: farmersDay });

        rawHolidays.push({ title: "Christmas Day", date: new Date(Date.UTC(year, 11, 25)) });
        rawHolidays.push({ title: "Boxing Day", date: new Date(Date.UTC(year, 11, 26)) });

        // Movable Christian holidays
        const easterSunday = getEasterSunday(year);
        const goodFriday = new Date(easterSunday);
        goodFriday.setUTCDate(easterSunday.getUTCDate() - 2);
        const easterMonday = new Date(easterSunday);
        easterMonday.setUTCDate(easterSunday.getUTCDate() + 1);

        rawHolidays.push({ title: "Good Friday", date: goodFriday });
        rawHolidays.push({ title: "Easter Monday", date: easterMonday });

        // Islamic holidays (from lookup if available)
        const islamic = ISLAMIC_HOLIDAYS_LOOKUP[year];
        if (islamic) {
            rawHolidays.push({ title: "Eid al-Fitr", date: new Date(`${islamic.eidAlFitr}T00:00:00.000Z`) });
            rawHolidays.push({ title: "Eid al-Adha", date: new Date(`${islamic.eidAlAdha}T00:00:00.000Z`) });
        }

        // Apply weekend roll-over rule (Public Holidays Act 2001, Act 601):
        // If a statutory holiday falls on Saturday or Sunday, the next Monday is declared an observed public holiday.
        const holidays: HolidayItem[] = [];

        for (const item of rawHolidays) {
            const originalDate = item.date;
            const dow = originalDate.getUTCDay();
            let observedDate = originalDate;
            let observedTitle = item.title;

            if (dow === 6) {
                // Saturday -> roll to Monday (+2 days)
                observedDate = new Date(originalDate);
                observedDate.setUTCDate(originalDate.getUTCDate() + 2);
                observedTitle = `${item.title} (Observed)`;
            } else if (dow === 0 && item.title !== "Easter Sunday") {
                // Sunday -> roll to Monday (+1 day)
                observedDate = new Date(originalDate);
                observedDate.setUTCDate(originalDate.getUTCDate() + 1);
                observedTitle = `${item.title} (Observed)`;
            }

            const dateStr = observedDate.toISOString().split("T")[0]!;
            const dayName = dayNames[observedDate.getUTCDay()]!;

            holidays.push({
                title: observedTitle,
                description: `Statutory Ghana Public Holiday (${item.title})`,
                date: dateStr,
                dayName,
                isCompany: false,
                source: "PUBLIC",
            });
        }

        return holidays.sort((a, b) => a.date.localeCompare(b.date));
    },

    /**
     * Fetches Islamic holidays (Eid al-Fitr and Eid al-Adha) dynamically from Aladhan API.
     * Aladhan accurately converts lunar Hijri dates (Shawwal 1 for Eid-ul-Fitr, Dhu al-Hijjah 10 for Eid-ul-Adha)
     * to exact Gregorian calendar dates.
     */
    fetchAladhanIslamicHolidays: async (year: number): Promise<HolidayItem[]> => {
        const results: HolidayItem[] = [];
        const baseHijri = Math.round((year - 622) * (33 / 32));

        // Check adjacent Hijri years (since lunar years are ~354 days)
        const hijriYears = [baseHijri - 1, baseHijri, baseHijri + 1];

        for (const hYear of hijriYears) {
            try {
                // Month 10 = Shawwal (Day 1 is Eid al-Fitr)
                const resFitr = await fetch(`https://api.aladhan.com/v1/hToGCalendar/10/${hYear}`, {
                    signal: AbortSignal.timeout(3000),
                });
                if (resFitr.ok) {
                    const dataFitr: any = await resFitr.json();
                    if (Array.isArray(dataFitr.data)) {
                        const day1 = dataFitr.data.find((d: any) => d.hijri?.day === "1" || d.hijri?.day === "01");
                        if (day1 && day1.gregorian?.date) {
                            const [gDay, gMonth, gYear] = day1.gregorian.date.split("-");
                            if (parseInt(gYear, 10) === year) {
                                const dateStr = `${gYear}-${gMonth}-${gDay}`;
                                const dateObj = new Date(`${dateStr}T00:00:00.000Z`);
                                results.push({
                                    title: "Eid al-Fitr",
                                    description: "Statutory Ghana Public Holiday (Eid al-Fitr)",
                                    date: dateStr,
                                    dayName: dayNames[dateObj.getUTCDay()]!,
                                    isCompany: false,
                                    source: "EXTERNAL_API",
                                });
                            }
                        }
                    }
                }

                // Month 12 = Dhu al-Hijjah (Day 10 is Eid al-Adha)
                const resAdha = await fetch(`https://api.aladhan.com/v1/hToGCalendar/12/${hYear}`, {
                    signal: AbortSignal.timeout(3000),
                });
                if (resAdha.ok) {
                    const dataAdha: any = await resAdha.json();
                    if (Array.isArray(dataAdha.data)) {
                        const day10 = dataAdha.data.find((d: any) => d.hijri?.day === "10");
                        if (day10 && day10.gregorian?.date) {
                            const [gDay, gMonth, gYear] = day10.gregorian.date.split("-");
                            if (parseInt(gYear, 10) === year) {
                                const dateStr = `${gYear}-${gMonth}-${gDay}`;
                                const dateObj = new Date(`${dateStr}T00:00:00.000Z`);
                                results.push({
                                    title: "Eid al-Adha",
                                    description: "Statutory Ghana Public Holiday (Eid al-Adha)",
                                    date: dateStr,
                                    dayName: dayNames[dateObj.getUTCDay()]!,
                                    isCompany: false,
                                    source: "EXTERNAL_API",
                                });
                            }
                        }
                    }
                }
            } catch {
                // Continue to fallback
            }
        }

        return results;
    },

    /**
     * Fetches official Ghana public holidays from Google Calendar's live iCal feed.
     * Google Calendar's Ghana feed specifically includes Eid al-Fitr, Eid al-Adha,
     * Easter dates, and all Ghanaian national observances.
     */
    fetchGoogleCalendarFeed: async (year: number): Promise<HolidayItem[]> => {
        try {
            const calendarUrl = "https://calendar.google.com/calendar/ical/en.gh%23holiday%40group.v.calendar.google.com/public/basic.ics";
            const response = await fetch(calendarUrl, { signal: AbortSignal.timeout(4000) });
            if (!response.ok) return [];

            const icsText = await response.text();
            const events: HolidayItem[] = [];

            const veventRegex = /BEGIN:VEVENT([\s\S]*?)END:VEVENT/g;
            let match;
            while ((match = veventRegex.exec(icsText)) !== null) {
                const block = match[1]!;
                const summaryMatch = /SUMMARY:(.*)/.exec(block);
                const dtstartMatch = /DTSTART;VALUE=DATE:(\d{8})/.exec(block) || /DTSTART:(\d{8})/.exec(block);

                if (summaryMatch && dtstartMatch) {
                    const rawDate = dtstartMatch[1]!; // YYYYMMDD
                    const eventYear = parseInt(rawDate.substring(0, 4), 10);
                    if (eventYear === year) {
                        const month = rawDate.substring(4, 6);
                        const day = rawDate.substring(6, 8);
                        const dateStr = `${eventYear}-${month}-${day}`;
                        const d = new Date(`${dateStr}T00:00:00.000Z`);
                        const title = summaryMatch[1]!.trim().replace(/\\,/g, ",");

                        // Exclude pure religious observances that are not statutory public holidays if needed
                        events.push({
                            title,
                            description: `Official Ghana Public Holiday (${title})`,
                            date: dateStr,
                            dayName: dayNames[d.getUTCDay()]!,
                            isCompany: false,
                            source: "GOOGLE_CALENDAR",
                        });
                    }
                }
            }

            return events;
        } catch {
            return [];
        }
    },

    /**
     * Multi-Source Live Resolution:
     * 1. Google Calendar Official Ghana Public Holiday Feed (includes Eid al-Fitr & Eid al-Adha)
     * 2. Aladhan Islamic Lunar Calendar API (exact Islamic calculation)
     * 3. Nager.Date Global Public Holiday API
     * 4. Ghana Statutory Act 601 Algorithmic Engine + Weekend Roll-over Fallback
     */
    fetchLivePublicHolidays: async (year: number): Promise<HolidayItem[]> => {
        // Check in-memory cache first
        const cached = publicHolidaysCache.get(year);
        if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
            return cached.holidays;
        }

        const holidayMap = new Map<string, HolidayItem>();

        const addHolidayIfUnique = (h: HolidayItem) => {
            const key = `${h.date}|${normalizeHolidayTitle(h.title)}`;
            if (!holidayMap.has(key)) {
                holidayMap.set(key, h);
            }
        };

        // 1. Start with local statutory algorithmic baseline (guarantees zero missing statutory dates)
        const statutory = holidayService.getGhanaStatutoryHolidays(year);
        for (const h of statutory) {
            addHolidayIfUnique(h);
        }

        // 2. Fetch Google Calendar Live Ghana Feed
        try {
            const gCalHolidays = await holidayService.fetchGoogleCalendarFeed(year);
            for (const h of gCalHolidays) {
                addHolidayIfUnique(h);
            }
        } catch {
            // Ignore failure
        }

        // 3. Fetch Aladhan Islamic Holidays (accurate Eid dates)
        try {
            const islamicHolidays = await holidayService.fetchAladhanIslamicHolidays(year);
            for (const h of islamicHolidays) {
                addHolidayIfUnique(h);
            }
        } catch {
            // Ignore failure
        }

        // 4. Fetch Nager.Date Global API
        try {
            const nagerUrl = `https://date.nager.at/api/v3/PublicHolidays/${year}/GH`;
            const res = await fetch(nagerUrl, { signal: AbortSignal.timeout(3000) });
            if (res.ok) {
                const data: any = await res.json();
                if (Array.isArray(data)) {
                    for (const item of data) {
                        const dateStr = item.date;
                        const d = new Date(`${dateStr}T00:00:00.000Z`);
                        const title = item.localName || item.name || "Public Holiday";
                        addHolidayIfUnique({
                            title,
                            description: `Official Ghana Public Holiday (${title})`,
                            date: dateStr,
                            dayName: dayNames[d.getUTCDay()]!,
                            isCompany: false,
                            source: "EXTERNAL_API",
                        });
                    }
                }
            }
        } catch {
            // Ignore failure
        }

        const combinedHolidays = Array.from(holidayMap.values()).sort((a, b) =>
            a.date.localeCompare(b.date),
        );

        publicHolidaysCache.set(year, { holidays: combinedHolidays, timestamp: Date.now() });
        return combinedHolidays;
    },

    /**
     * Admin Override Management:
     * Retrieves all admin holiday overrides (ignoring a public holiday, adjusting date, etc.)
     */
    getOverrides: async (year?: number): Promise<HolidayRecord[]> => {
        const records = await prisma.holidays.findMany({
            where: { type: "OVERRIDE", ...(year ? { year } : {}) },
            orderBy: { originalDate: "asc" },
        });
        return records as HolidayRecord[];
    },

    /**
     * Admin Override: Creates or updates an override for a public holiday
     */
    createOrUpdateOverride: async (data: HolidayOverrideRequest): Promise<HolidayRecord> => {
        const year = data.year || new Date(data.originalDate).getFullYear();
        let dayName: string | null = null;
        if (data.adjustedDate) {
            const adj = new Date(`${data.adjustedDate}T00:00:00.000Z`);
            dayName = dayNames[adj.getUTCDay()] ?? null;
        }

        const override = await prisma.holidays.upsert({
            where: { originalDate: data.originalDate },
            create: {
                type: "OVERRIDE",
                originalDate: data.originalDate,
                startDate: data.originalDate,
                title: data.title,
                year,
                isIgnored: data.isIgnored ?? false,
                adjustedDate: data.adjustedDate ?? null,
                adjustedDayName: dayName,
                notes: data.notes ?? null,
            },
            update: {
                title: data.title,
                year,
                isIgnored: data.isIgnored ?? false,
                adjustedDate: data.adjustedDate ?? null,
                adjustedDayName: dayName,
                notes: data.notes ?? null,
            },
        });

        return override as HolidayRecord;
    },

    /**
     * Admin Override: Removes an override (reverting public holiday to default)
     */
    deleteOverride: async (id: number): Promise<{ message: string }> => {
        await prisma.holidays.delete({
            where: { id },
        });
        return { message: "Holiday override removed successfully" };
    },

    /**
     * Returns public holidays with active Admin Overrides mapped on top.
     */
    getResolvedPublicHolidays: async (year: number): Promise<HolidayItem[]> => {
        const rawPublicHolidays = await holidayService.fetchLivePublicHolidays(year);
        const overrides = await holidayService.getOverrides(year);

        const matchedOverrideOriginalDates = new Set<string>();

        const resolved: HolidayItem[] = rawPublicHolidays.map((holiday) => {
            const override = overrides.find(o => o.originalDate === holiday.date);
            if (!override) {
                return holiday;
            }
            matchedOverrideOriginalDates.add(override.originalDate!);

            const effectiveDate = override.adjustedDate || holiday.date;
            const effectiveDay = override.adjustedDayName || holiday.dayName;

            return {
                ...holiday,
                title: override.title || holiday.title,
                date: effectiveDate,
                dayName: effectiveDay,
                isOverridden: true,
                isIgnored: override.isIgnored,
                adjustedDate: override.adjustedDate,
                overrideId: override.id,
            };
        });

        // Also include any standalone admin overrides for that year that weren't in raw public holidays
        for (const override of overrides) {
            if (!matchedOverrideOriginalDates.has(override.originalDate!)) {
                const effectiveDate = override.adjustedDate || override.originalDate!;
                const d = new Date(`${effectiveDate}T00:00:00.000Z`);
                const dayName = override.adjustedDayName || dayNames[d.getUTCDay()]!;
                resolved.push({
                    id: override.id,
                    title: override.title,
                    description: override.notes || `Admin Override Holiday (${override.title})`,
                    date: effectiveDate,
                    dayName,
                    isCompany: false,
                    source: "EXTERNAL_API",
                    isOverridden: true,
                    isIgnored: override.isIgnored,
                    adjustedDate: override.adjustedDate,
                    overrideId: override.id,
                });
            }
        }

        // Final safety deduplication: remove duplicate holidays with same name on same date
        const finalMap = new Map<string, HolidayItem>();
        for (const item of resolved) {
            const key = `${item.date}|${normalizeHolidayTitle(item.title)}`;
            if (!finalMap.has(key)) {
                finalMap.set(key, item);
            }
        }

        return Array.from(finalMap.values()).sort((a, b) => a.date.localeCompare(b.date));
    },

    /**
     * Retrieves all company-specific marked holidays.
     */
    getCompanyHolidays: async (year?: number): Promise<HolidayItem[]> => {
        const results: HolidayItem[] = [];

        const records = await prisma.holidays.findMany({
            where: { type: "COMPANY", ...(year ? { year } : {}) },
            orderBy: { startDate: "asc" },
        });

        for (const item of records) {
            // Expand date range for multi-day company holidays
            const startParts = item.startDate.split("-").map(Number);
            const start = new Date(Date.UTC(startParts[0]!, startParts[1]! - 1, startParts[2]!));
            const endDateStr = item.endDate ?? item.startDate;
            const endParts = endDateStr.split("-").map(Number);
            const end = new Date(Date.UTC(endParts[0]!, endParts[1]! - 1, endParts[2]!));

            const current = new Date(start);
            while (current <= end) {
                const dateStr = current.toISOString().split("T")[0]!;
                results.push({
                    id: item.id,
                    title: item.title,
                    description: item.description,
                    date: dateStr,
                    endDate: item.endDate ?? null,
                    dayName: dayNames[current.getUTCDay()]!,
                    isCompany: true,
                    source: "COMPANY",
                });
                current.setUTCDate(current.getUTCDate() + 1);
            }
        }

        return results;
    },

    /**
     * Retrieves all effective holidays (Company + Resolved Public Holidays)
     * that fall within Monday-Friday of the specified ISO week.
     * Automatically filters out holidays marked as 'isIgnored' (Working Day).
     */
    getHolidaysForWeek: async (week: number, year: number): Promise<HolidayItem[]> => {
        // Calculate start of ISO week (Monday)
        const ISOweekStart = getDateFromISOWeek(week, year);

        const weekDates: string[] = [];
        for (let i = 0; i < 7; i++) {
            const d = new Date(ISOweekStart);
            d.setUTCDate(ISOweekStart.getUTCDate() + i);
            weekDates.push(d.toISOString().split("T")[0]!);
        }

        const publicHolidays = await holidayService.getResolvedPublicHolidays(year);
        const companyHolidays = await holidayService.getCompanyHolidays(year);

        // Filter out public holidays that have been overridden to 'isIgnored: true' (working day)
        const activePublicHolidays = publicHolidays.filter(h => !h.isIgnored);

        const allHolidays = [...activePublicHolidays, ...companyHolidays];
        const weekHolidaysMap = new Map<string, HolidayItem>();
        for (const h of allHolidays) {
            if (weekDates.includes(h.date)) {
                const key = `${h.date}|${normalizeHolidayTitle(h.title)}`;
                if (!weekHolidaysMap.has(key)) {
                    weekHolidaysMap.set(key, h);
                }
            }
        }
        return Array.from(weekHolidaysMap.values()).sort((a, b) => a.date.localeCompare(b.date));
    },

    /**
     * Get all holidays unified (Company + Resolved Public Holidays + Overrides) for management page.
     */
    getAllHolidays: async (year?: number): Promise<AllHolidaysResponse> => {
        const targetYear = year || new Date().getFullYear();
        const companyHolidays = await holidayService.getCompanyHolidays(targetYear);
        const publicHolidays = await holidayService.getResolvedPublicHolidays(targetYear);
        const overrides = await holidayService.getOverrides(targetYear);

        return { companyHolidays, publicHolidays, overrides };
    },

    /**
     * Admin CRUD: Create a new company holiday
     */
    createCompanyHoliday: async (data: CreateHolidayRequest) => {
        const startDate = data.startDate;
        const endDate = data.endDate ?? null;
        const year = data.year || parseInt(startDate.substring(0, 4), 10);

        const record = await prisma.holidays.create({
            data: {
                type: "COMPANY",
                title: data.title,
                description: data.description,
                year,
                startDate,
                endDate,
                notes: data.notes ?? null,
            },
        });
        return record;
    },

    /**
     * Admin CRUD: Update an existing company holiday
     */
    updateCompanyHoliday: async (id: number, data: UpdateHolidayRequest) => {
        const updateData: {
            title?: string;
            description?: string;
            startDate?: string;
            endDate?: string | null;
            year?: number;
            notes?: string | null;
        } = {};

        if (data.title !== undefined) updateData.title = data.title;
        if (data.description !== undefined) updateData.description = data.description;
        if (data.notes !== undefined) updateData.notes = data.notes;
        if (data.startDate !== undefined) {
            updateData.startDate = data.startDate;
            updateData.year = data.year || parseInt(data.startDate.substring(0, 4), 10);
        } else if (data.year !== undefined) {
            updateData.year = data.year;
        }
        if (data.endDate !== undefined) {
            updateData.endDate = data.endDate ?? null;
        }

        const record = await prisma.holidays.update({
            where: { id },
            data: updateData,
        });

        return record;
    },

    /**
     * Admin CRUD: Delete a company holiday
     */
    deleteCompanyHoliday: async (id: number) => {
        await prisma.holidays.delete({
            where: { id },
        });
        return { id };
    },
};
