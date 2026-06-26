import { prisma } from "../db/prisma";
import { weekMenuScheduleService } from "../services/weekMenuScheduleService";

export async function scheduleWeeklyMenuScheduleJob(targetWeek: { week: number; year: number }) {
    try {
        const existingSchedule = await weekMenuScheduleService.getWeekMenuScheduleByWeekAndYear(
            targetWeek.week,
            targetWeek.year
        );

        if (existingSchedule) {
            console.log(`Week ${targetWeek.week}/${targetWeek.year} already has a menu schedule.`);
            return existingSchedule;
        }

        const activeMenus = await prisma.menus.findMany({
            where: { isActive: true },
            select: { id: true },
            orderBy: { id: "asc" },
        });

        if (activeMenus.length === 0) {
            throw new Error("No active menus available to schedule");
        }

        const assignedMenu = activeMenus[(targetWeek.week - 1) % activeMenus.length];
        if (!assignedMenu) {
            throw new Error("Failed to assign a menu for the target week");
        }

        const res = await weekMenuScheduleService.createWeekMenuSchedule({
            menuId: assignedMenu.id,
            week: targetWeek.week,
            year: targetWeek.year,
        });

        console.log(`Successfully updated menu for week ${targetWeek.week}/${targetWeek.year}`);
        return res;
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        throw new Error(`Failed to schedule menu for week ${targetWeek.week}/${targetWeek.year}: ${message}`);
    }
}
