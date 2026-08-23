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

    // shift to Thursday of this week (ISO anchor)
    d.setUTCDate(d.getUTCDate() + 4 - isoDay);

    // ISO year is based on this Thursday
    const year = d.getUTCFullYear();

    // first day of ISO year (Jan 1)
    const yearStart = new Date(Date.UTC(year, 0, 1));

    // difference in days
    const dayDiff = (Number(d) - Number(yearStart)) / 86400000;

    // week number (1-based)
    const week = Math.floor(dayDiff / 7) + 1;

    return { day: isoDay, week, year, dayName: d.toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase() };
}

export function getNextISOWeekInfo(date = new Date()) {
    const nextDate = new Date(date);
    nextDate.setUTCDate(nextDate.getUTCDate() + 7);

    return getISOWeekInfo(nextDate);
}

export function getISOWeekRange(date = new Date()) {
    const d = new Date(date);
    d.setUTCHours(0, 0, 0, 0);

    const day = d.getUTCDay();
    if (day === 6) {
        d.setUTCDate(d.getUTCDate() + 2);
    } else if (day === 0) {
        d.setUTCDate(d.getUTCDate() + 1);
    }

    const isoDay = d.getUTCDay() || 7;

    const weekStart = new Date(d);
    weekStart.setUTCDate(d.getUTCDate() - (isoDay - 1));

    const weekEnd = new Date(weekStart);
    weekEnd.setUTCDate(weekStart.getUTCDate() + 6);
    weekEnd.setUTCHours(23, 59, 59, 999);

    return { weekStart, weekEnd };
}

