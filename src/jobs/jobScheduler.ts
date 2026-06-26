import { getNextISOWeekInfo } from "../helpers/dateFunctions";
import { activateWeeklyMenuJob } from "./activateWeeklyMenyJob";
import { scheduleWeeklyMenuScheduleJob } from "./scheduleWeeklyMenuJob";
import { syncDigiHRJob } from "./syncDigiHRJob";

export default async function weeklyScheduler() {
    const targetWeek = getNextISOWeekInfo(new Date());

    try {
        await syncDigiHRJob();
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error(`DigiHR sync failed for week ${targetWeek.week}/${targetWeek.year}: ${message}`);
    }

    await scheduleWeeklyMenuScheduleJob(targetWeek);

    await activateWeeklyMenuJob(targetWeek);
}
