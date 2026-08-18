import { Request, Response } from "express";
import { getNextISOWeekInfo } from "../helpers/dateFunctions";
import { syncDigiHRUsers, scheduleWeeklyMenu, activateWeeklyMenu, updateBiWeeklyTasteProfiles } from "./periodic";
import { cleanUpExpiredTokens, updateUserTasteProfiles } from "./maintenance";

type JobResult = { job: string; status: "success" | "failed"; message: string };

async function runJob(name: string, fn: () => Promise<string>): Promise<JobResult> {
    try {
        const message = await fn();
        return { job: name, status: "success", message };
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error(`[CRON] ${name} failed: ${message}`);
        return { job: name, status: "failed", message };
    }
}

export const cronController = {
    periodic: async (req: Request, res: Response) => {
        const targetWeek = getNextISOWeekInfo(new Date());
        const results: JobResult[] = [];

        results.push(await runJob("syncDigiHRUsers", syncDigiHRUsers));
        results.push(await runJob("scheduleWeeklyMenu", () => scheduleWeeklyMenu(targetWeek)));
        results.push(await runJob("activateWeeklyMenu", () => activateWeeklyMenu(targetWeek)));
        results.push(await runJob("updateBiWeeklyTasteProfiles", updateBiWeeklyTasteProfiles));

        const failed = results.filter((r) => r.status === "failed").length;

        res.status(failed === results.length ? 500 : 200).json({
            category: "periodic",
            timestamp: new Date().toISOString(),
            results,
        });
    },

    maintenance: async (req: Request, res: Response) => {
        const results: JobResult[] = [];

        results.push(await runJob("cleanUpExpiredTokens", cleanUpExpiredTokens));
        results.push(await runJob("updateUserTasteProfiles", updateUserTasteProfiles));

        const failed = results.filter((r) => r.status === "failed").length;

        res.status(failed === results.length ? 500 : 200).json({
            category: "maintenance",
            timestamp: new Date().toISOString(),
            results,
        });
    },
};