import { prisma } from "../db/prisma";
import { weekMenuScheduleService } from "../services/weekMenuScheduleService";

export async function scheduleWeeklyMenuScheduleJob (targetWeek: { week: number; year: number }){
    try{
        const activeMenus = await prisma.menus.findMany({
            where: {isActive: true},
            select: { id: true, order: true },
            orderBy: { order: "asc" },
        });

        if (activeMenus.length === 0) {
            throw new Error("No active menus available to schedule");
        }

        const assignedMenu = activeMenus[(targetWeek.week) % activeMenus.length];
        const existingSchedule = await weekMenuScheduleService.getWeekMenuScheduleByWeekAndYear({week:targetWeek.week, year: targetWeek.year});

        if (existingSchedule) {
            console.log(`Week ${targetWeek.week}/${targetWeek.year} already has a menu schedule.`);
            return;
        }

        await weekMenuScheduleService.createWeekMenuSchedule({
            menuId: assignedMenu!.id,
            week: targetWeek.week,
            year: targetWeek.year,
        });

        console.log(`Successfully created menu for week ${targetWeek.week}`);
        return;
    }catch (error){
        const message = error instanceof Error ? error.message : String(error);
        throw new Error(`Failed to schedule menu for ${targetWeek.week}/${targetWeek.year}: ${message}`);
    }
}
