import { getISOWeekInfo } from "../helpers/dateFunctions";
import { notificationService } from "../services/notificationService";
import { cleanUpExpiredTokens } from "./maintenance";
import {
  activateWeeklyMenu,
  autoSubmitUserPreferences,
  scheduleWeeklyMenu,
  syncDigiHRUsers,
  updateBiWeeklyTasteProfiles,
} from "./periodic";

export type DayOfWeek =
  | "SUNDAY"
  | "MONDAY"
  | "TUESDAY"
  | "WEDNESDAY"
  | "THURSDAY"
  | "FRIDAY"
  | "SATURDAY";

export interface CronJobDefinition {
  name: string;
  description: string;
  run: () => Promise<string>;
}

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const dailyCronRegistry: Record<DayOfWeek, CronJobDefinition[]> = {
  SUNDAY: [
    {
      name: "notifyUnselectedSundayNight",
      description: "Send push notification reminder to users who haven't selected meals",
      run: async () => {
        const result = await notificationService.notifyUnselectedUsers({
          title: "Selections closing soon",
          description: "Select your meals now!",
        });
        return result.message;
      },
    },
  ],

  MONDAY: [
    {
      name: "notifyUnselectedMondayMorning",
      description: "Send morning follow-up reminder to users who haven't selected meals",
      run: async () => {
        const result = await notificationService.notifyUnselectedUsers({
          title: "Selections closing soon",
          description: "Final reminder: Select your meals now!",
        });
        return result.message;
      },
    },
  ],

  TUESDAY: [
    {
      name: "syncDigiHRUsersTuesday",
      description: "Sync DigiHR user records with the database",
      run: syncDigiHRUsers,
    },
  ],

  WEDNESDAY: [
    {
      name: "maintenanceCleanUpTokens",
      description: "Clean up expired user tokens and refresh tokens",
      run: cleanUpExpiredTokens,
    },
    {
      name: "updateBiWeeklyTasteProfiles",
      description: "Update taste profiles on biweekly schedule (even ISO weeks)",
      run: updateBiWeeklyTasteProfiles,
    },
  ],

  THURSDAY: [
    {
      name: "thursdayOperationalSync",
      description: "Mid-week user and availability sync check",
      run: async () => "Thursday operational checks completed successfully",
    },
  ],

  FRIDAY: [
    {
      name: "fridayPreWeekendCheck",
      description: "Verify system readiness for upcoming weekly menu cycle",
      run: async () => "Friday pre-weekend checks completed successfully",
    },
  ],

  SATURDAY: [
    {
      name: "syncDigiHRUsers",
      description: "Sync DigiHR users before menu scheduling",
      run: syncDigiHRUsers,
    },
    {
      name: "scheduleWeeklyMenu",
      description: "Schedule next week's menu",
      run: async () => {
        const targetWeek = getISOWeekInfo(new Date());
        return scheduleWeeklyMenu(targetWeek);
      },
    },
    {
      name: "activateWeeklyMenu",
      description: "Activate the scheduled menu for the target week",
      run: async () => {
        const targetWeek = getISOWeekInfo(new Date());
        return activateWeeklyMenu(targetWeek);
      },
    },
    {
      name: "autoSubmitUserPreferences",
      description: "Auto-submit presets for users with autoSubmit enabled",
      run: async () => {
        await delay(2000);
        return autoSubmitUserPreferences();
      },
    },
  ],
};
