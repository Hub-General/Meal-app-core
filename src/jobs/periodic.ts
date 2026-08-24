import { prisma } from "../db/prisma";
import { digiHRService } from "../services/digiHRService";
import { weekMenuScheduleService } from "../services/weekMenuScheduleService";
import { getISOWeekInfo } from "../helpers/dateFunctions";
import { tasteProfileService } from "../services/tasteProfileService";

export async function syncDigiHRUsers() {
    await digiHRService.syncUsersWithDatabase();
    return "DigiHR users synced successfully";
}

export async function getNextCycleMenu(
    activeMenus: Array<{ id: number; order: number | null }>,
    targetWeek: { week: number; year: number }
) {
    if (activeMenus.length === 0) {
        throw new Error("No active menus available to schedule");
    }

    if (activeMenus.length === 1) {
        return activeMenus[0]!;
    }

    const targetWeekVal = targetWeek.year * 100 + targetWeek.week;

    // Fetch prior week menu schedules to determine current cycle state
    const priorSchedules = await prisma.weekMenuSchedule.findMany({
        orderBy: [{ year: "desc" }, { week: "desc" }],
        take: activeMenus.length * 2,
        select: {
            id: true,
            week: true,
            year: true,
            menuId: true,
        },
    });

    const validPrior = priorSchedules.filter(
        (s) => s.year * 100 + s.week < targetWeekVal
    );

    const activeMenuMap = new Map(
        activeMenus.map((m, idx) => [m.id, { menu: m, index: idx }])
    );

    // Track recently used active menus in continuous history without repeats
    const recentUsedMenuIds: number[] = [];
    for (const s of validPrior) {
        if (recentUsedMenuIds.length >= activeMenus.length) break;
        if (activeMenuMap.has(s.menuId)) {
            if (recentUsedMenuIds.includes(s.menuId)) {
                // Cycle boundary reached
                break;
            }
            recentUsedMenuIds.push(s.menuId);
        }
    }

    // Remaining unused menus in the current cycle
    const unusedMenus = activeMenus.filter((m) => !recentUsedMenuIds.includes(m.id));

    if (unusedMenus.length === 0) {
        // All active menus have been exhausted in the current cycle!
        // Start a brand new cycle from the first menu in the sequence
        const lastScheduledId = validPrior.length > 0 ? validPrior[0]!.menuId : null;
        if (lastScheduledId === activeMenus[0]!.id && activeMenus.length > 1) {
            return activeMenus[1]!;
        }
        return activeMenus[0]!;
    }

    const lastScheduledId = validPrior.length > 0 ? validPrior[0]!.menuId : null;
    const lastScheduledInfo = lastScheduledId ? activeMenuMap.get(lastScheduledId) : null;

    if (lastScheduledInfo) {
        const nextInSequence = unusedMenus.find((m) => {
            const info = activeMenuMap.get(m.id);
            return info && info.index > lastScheduledInfo.index;
        });
        return nextInSequence || unusedMenus[0]!;
    }

    return unusedMenus[0]!;
}

export async function scheduleWeeklyMenu(targetWeek: { week: number; year: number }) {
    const activeMenus = await prisma.menus.findMany({
        where: { isActive: true },
        select: { id: true, order: true },
        orderBy: { order: "asc" },
    });

    if (activeMenus.length === 0) {
        throw new Error("No active menus available to schedule");
    }

    const assignedMenu = await getNextCycleMenu(activeMenus, targetWeek);

    const existingSchedule = await weekMenuScheduleService.getWeekMenuScheduleByWeekAndYear({
        week: targetWeek.week,
        year: targetWeek.year,
    });

    if (existingSchedule) {
        return `Week ${targetWeek.week}/${targetWeek.year} already has a menu schedule`;
    }

    await weekMenuScheduleService.createWeekMenuSchedule({
        menuId: assignedMenu.id,
        week: targetWeek.week,
        year: targetWeek.year,
    });

    return `Successfully scheduled menu for week ${targetWeek.week}/${targetWeek.year}`;
}

export async function activateWeeklyMenu(targetWeek: { week: number; year: number }) {
    const correctWeekMenu = await weekMenuScheduleService.getWeekMenuScheduleByWeekAndYear({
        week: targetWeek.week,
        year: targetWeek.year,
    });

    if (!correctWeekMenu) {
        return `No week menu schedule exists for week ${targetWeek.week}/${targetWeek.year}`;
    }

    const activeWeekMenus = await weekMenuScheduleService.getActiveWeekMenuSchedules();
    const [onlyActiveWeekMenu] = activeWeekMenus;

    if (onlyActiveWeekMenu && activeWeekMenus.length === 1 && onlyActiveWeekMenu.id === correctWeekMenu.id) {
        return `Week menu for ${targetWeek.week}/${targetWeek.year} is already active`;
    }

    await weekMenuScheduleService.switchActiveWeekMenuSchedule(correctWeekMenu.id);

    return `Week menu for ${targetWeek.week}/${targetWeek.year} successfully activated`;
}

export async function updateBiWeeklyTasteProfiles() {
    const currentWeekInfo = getISOWeekInfo(new Date());

    if (currentWeekInfo.week % 2 !== 0) {
        return `Skipped: Taste profile updates run on even ISO weeks only (current week: ${currentWeekInfo.week})`;
    }

    const updatedProfiles = await tasteProfileService.updateActiveUsersTasteProfiles(currentWeekInfo.year);
    return `Updated ${updatedProfiles.length} active user taste profiles for week ${currentWeekInfo.week}/${currentWeekInfo.year}`;
}
