export function getISOWeekInfo(date = new Date()) {
    const d = new Date(date);

    // normalize to UTC midnight (prevents timezone bugs)
    d.setUTCHours(0, 0, 0, 0);

    // ISO week starts Monday (Mon=1 ... Sun=7)
    const day = d.getUTCDay() || 7;

    // shift to Thursday of this week (ISO anchor)
    d.setUTCDate(d.getUTCDate() + 4 - day);

    // ISO year is based on this Thursday
    const year = d.getUTCFullYear();

    // first day of ISO year (Jan 1)
    const yearStart = new Date(Date.UTC(year, 0, 1));

    // difference in days
    const dayDiff = (Number(d) - Number(yearStart)) / 86400000;

    // week number (1-based)
    const week = Math.floor(dayDiff / 7) + 1;

    return { day, week, year, dayName: d.toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase() };
}

export function getNextISOWeekInfo(date = new Date()) {
    const nextDate = new Date(date);
    nextDate.setUTCDate(nextDate.getUTCDate() + 7);

    return getISOWeekInfo(nextDate);
}

export function getISOWeekRange(date = new Date()) {
    const d = new Date(date);
    d.setUTCHours(0, 0, 0, 0);
    const day = d.getUTCDay() || 7;

    const weekStart = new Date(d);
    weekStart.setUTCDate(d.getUTCDate() - (day - 1));

    const weekEnd = new Date(weekStart);
    weekEnd.setUTCDate(weekStart.getUTCDate() + 6);
    weekEnd.setUTCHours(23, 59, 59, 999);

    return { weekStart, weekEnd };
}

