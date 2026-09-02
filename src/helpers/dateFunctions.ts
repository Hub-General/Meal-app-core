import { Days } from "../generated/prisma";

const UTC_DAY_TO_DAYS: Record<number, Days> = {
    0: Days.SUNDAY,
    1: Days.MONDAY,
    2: Days.TUESDAY,
    3: Days.WEDNESDAY,
    4: Days.THURSDAY,
    5: Days.FRIDAY,
    6: Days.SATURDAY,
};

export function getDateFromISOWeek(week: number, year: number): Date {
    const simple = new Date(Date.UTC(year, 0, 4));
    const day = simple.getUTCDay() || 7;
    simple.setUTCDate(simple.getUTCDate() - day + 1);
    simple.setUTCDate(simple.getUTCDate() + (week - 1) * 7);
    return simple;
}

export function getISOWeekInfo(date = new Date()) {
    const d = new Date(date);

    // normalize to UTC midnight (prevents timezone bugs)
    d.setUTCHours(0, 0, 0, 0);

    // Day of week: 0 = Sun, 1 = Mon, ..., 6 = Sat
    const day = d.getUTCDay();

    // Right from Saturday, selections are for the following week
    if (day === 6) {
        d.setUTCDate(d.getUTCDate() + 2);
    } else if (day === 0) {
        d.setUTCDate(d.getUTCDate() + 1);
    }

    // ISO week starts Monday (Mon=1 ... Sun=7)
    const isoDay = d.getUTCDay() || 7;
    const dayNames = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"] as const;
    const dayName = dayNames[d.getUTCDay()] ?? "MONDAY";

    // shift to Thursday of this week on a copy (ISO anchor)
    const anchor = new Date(d);
    anchor.setUTCDate(anchor.getUTCDate() + 4 - isoDay);

    // ISO year is based on this Thursday
    const year = anchor.getUTCFullYear();

    // first day of ISO year (Jan 1)
    const yearStart = new Date(Date.UTC(year, 0, 1));

    // difference in days
    const dayDiff = (Number(anchor) - Number(yearStart)) / 86400000;

    // week number (1-based)
    const week = Math.floor(dayDiff / 7) + 1;

    return { day: isoDay, week, year, dayName };
}

export function getNextISOWeekInfo(date = new Date()) {
    const current = getISOWeekInfo(date);
    const monday = getDateFromISOWeek(current.week, current.year);
    const nextMonday = new Date(monday);
    nextMonday.setUTCDate(nextMonday.getUTCDate() + 7);
    return getISOWeekInfo(nextMonday);
}

export function getISOWeekRange(date = new Date()) {
    const weekInfo = getISOWeekInfo(date);
    const weekStart = getDateFromISOWeek(weekInfo.week, weekInfo.year);
    const weekEnd = new Date(weekStart);
    weekEnd.setUTCDate(weekStart.getUTCDate() + 6);
    weekEnd.setUTCHours(23, 59, 59, 999);

    return { weekStart, weekEnd };
}

export function getWeekRange(week: number, year: number) {
    const weekStart = getDateFromISOWeek(week, year);

    const weekEnd = new Date(weekStart);
    weekEnd.setUTCDate(weekEnd.getUTCDate() + 6);
    weekEnd.setUTCHours(23, 59, 59, 999);

    return { weekStart, weekEnd };
}

export function getUnavailableDays(
    weekStart: Date,
    weekEnd: Date,
    availability: {
        startDate: Date;
        endDate: Date;
    }[],
): Set<Days> {
    const unavailableDays = new Set<Days>();

    for (const range of availability) {
        const rangeStart = new Date(range.startDate);
        const rangeEnd = new Date(range.endDate);

        rangeStart.setUTCHours(0, 0, 0, 0);
        rangeEnd.setUTCHours(23, 59, 59, 999);

        // No overlap with this week.
        if (rangeEnd < weekStart || rangeStart > weekEnd) {
            continue;
        }

        const current = new Date(
            Math.max(rangeStart.getTime(), weekStart.getTime()),
        );
        current.setUTCHours(0, 0, 0, 0);

        const end = new Date(
            Math.min(rangeEnd.getTime(), weekEnd.getTime()),
        );

        while (current <= end) {
            const day = UTC_DAY_TO_DAYS[current.getUTCDay()];
            if (day) {
                unavailableDays.add(day);
            }

            current.setUTCDate(current.getUTCDate() + 1);
        }
    }

    return unavailableDays;
}