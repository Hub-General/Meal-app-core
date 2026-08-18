import { prisma } from "../db/prisma";
import { digiHRService } from "../services/digiHRService";
import { weekMenuScheduleService } from "../services/weekMenuScheduleService";

export async function syncDigiHRUsers() {
    await digiHRService.syncUsersWithDatabase();
    return "DigiHR users synced successfully";
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

    const assignedMenu = activeMenus[targetWeek.week % activeMenus.length];

    const existingSchedule = await weekMenuScheduleService.getWeekMenuScheduleByWeekAndYear({
        week: targetWeek.week,
        year: targetWeek.year,
    });

    if (existingSchedule) {
        return `Week ${targetWeek.week}/${targetWeek.year} already has a menu schedule`;
    }

    await weekMenuScheduleService.createWeekMenuSchedule({
        menuId: assignedMenu!.id,
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
