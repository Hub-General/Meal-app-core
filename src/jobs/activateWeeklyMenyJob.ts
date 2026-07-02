import { weekMenuScheduleService } from "../services/weekMenuScheduleService";

export async function activateWeeklyMenuJob(targetWeek: { week: number; year: number }) {
    try {
        const correctWeekMenu = await weekMenuScheduleService.getWeekMenuScheduleByWeekAndYear(
            targetWeek.week,
            targetWeek.year
        );

        if (!correctWeekMenu) {
            console.log(`No week menu schedule exists for week ${targetWeek.week}/${targetWeek.year}`);
            return;
        }

        const activeWeekMenus = await weekMenuScheduleService.getActiveWeekMenuSchedules();

        const [onlyActiveWeekMenu] = activeWeekMenus;

        if (onlyActiveWeekMenu && activeWeekMenus.length === 1 && onlyActiveWeekMenu.id === correctWeekMenu.id) {
            console.log(`Week menu for ${targetWeek.week}/${targetWeek.year} is already active`);
            return;
        }

        await weekMenuScheduleService.switchActiveWeekMenuSchedule(correctWeekMenu.id);

        console.log(`Week menu for ${targetWeek.week}/${targetWeek.year} successfully activated!`);
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        throw new Error(`Failed to activate menu for week ${targetWeek.week}/${targetWeek.year}: ${message}`);
    }
}
