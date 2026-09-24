import { Request, Response } from "express";
import {
  dailyCronRegistry,
  DayOfWeek,
} from "./dailyCron";

type JobResult = {
  job: string;
  status: "success" | "failed";
  message: string;
  durationMs?: number;
};

const DAY_NAMES: DayOfWeek[] = [
  "SUNDAY",
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
];

async function runJob(name: string, fn: () => Promise<string>): Promise<JobResult> {
  const start = Date.now();
  try {
    const message = await fn();
    return {
      job: name,
      status: "success",
      message,
      durationMs: Date.now() - start,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[CRON] ${name} failed: ${message}`);
    return {
      job: name,
      status: "failed",
      message,
      durationMs: Date.now() - start,
    };
  }
}

export const cronController = {
  /**
   * Daily Cron Dispatcher:
   * Runs daily, executing only the functions registered for the current day.
   * Can be overridden with ?day=MONDAY or ?slot=night for manual/targeted runs.
   */
  daily: async (req: Request, res: Response) => {
    const now = new Date();
    const queryDay = typeof req.query.day === "string" ? req.query.day.toUpperCase() : null;
    const currentDay: DayOfWeek =
      queryDay && DAY_NAMES.includes(queryDay as DayOfWeek)
        ? (queryDay as DayOfWeek)
        : (DAY_NAMES[now.getUTCDay()] ?? "SUNDAY");

    const slot = typeof req.query.slot === "string" ? req.query.slot.toLowerCase() : "default";

    const jobs = dailyCronRegistry[currentDay] || [];
    const results: JobResult[] = [];

    console.log(`[CRON] Starting daily runner for ${currentDay} (slot: ${slot}) with ${jobs.length} job(s)`);

    for (const job of jobs) {
      results.push(await runJob(job.name, job.run));
    }

    const failed = results.filter((r) => r.status === "failed").length;

    res.status(failed === results.length && results.length > 0 ? 500 : 200).json({
      category: "daily",
      day: currentDay,
      slot,
      timestamp: now.toISOString(),
      jobsRun: results.length,
      results,
    });
  },
};