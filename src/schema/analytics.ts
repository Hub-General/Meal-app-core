import { z } from "zod";

export const analyticsQuerySchema = z.object({
  date: z.coerce.date().optional(),
  budgetId: z.coerce.number().int().positive().optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
});

export type AnalyticsQueryDto = z.infer<typeof analyticsQuerySchema>;

export interface WeeklyExpenditureBreakdown {
  week: number;
  year: number;
  weekStart: string; // ISO string
  weekEnd: string;   // ISO string
  totalPortions: number; // sum of guestCount for fulfilled meals
  unitCost: number;     // unit meal cost applied
  totalCost: number;    // portions * unitCost
  fulfilledCount: number;
}

export interface DayOfWeekExpenditureBreakdown {
  day: string;
  portions: number;
  totalCost: number;
}

export interface DashboardAnalyticsResponse {
  period: {
    startDate: string;
    endDate: string;
    asOfDate: string;
    daysTotal: number;
    daysElapsed: number;
  };
  budget: {
    id: number | null;
    title: string | null;
    totalBudget: number;
    consumed: number;
    remaining: number;
    consumptionPercentage: number;
    status: "SURPLUS" | "OVERSPENT" | "BALANCED";
    dailyBurnRate: number;
    projectedTotalSpend: number;
    projectedStatus: "PROJECTED_SURPLUS" | "PROJECTED_OVERSPENT" | "ON_TRACK";
  };
  selections: {
    total: number;
    fulfilled: number;
    notFulfilled: number;
    pending: number;
    fulfillmentRatePercentage: number;
    averageFulfillmentTimeOfDay: string | null; // e.g. "12:35 PM"
    averageFulfillmentDurationMinutes: number | null;
  };
  weeklyExpenditure: WeeklyExpenditureBreakdown[];
  dayOfWeekExpenditure: DayOfWeekExpenditureBreakdown[];
}
