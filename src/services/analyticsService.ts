import { prisma } from "../db/prisma";
import {
  Days,
  ExpenditureType,
  FulfillmentStatus,
  SelectionStatus,
  SelectionType,
} from "../generated/prisma";
import { getDateFromISOWeek, getWeekRange } from "../helpers/dateFunctions";
import {
  AnalyticsQueryDto,
  DashboardAnalyticsResponse,
  DayOfWeekExpenditureBreakdown,
  WeeklyExpenditureBreakdown,
} from "../schema/analytics";
import { budgetService } from "./budgetService";

const DAY_OFFSET_MAP: Record<Days, number> = {
  [Days.MONDAY]: 0,
  [Days.TUESDAY]: 1,
  [Days.WEDNESDAY]: 2,
  [Days.THURSDAY]: 3,
  [Days.FRIDAY]: 4,
  [Days.SATURDAY]: 5,
  [Days.SUNDAY]: 6,
};

function formatTimeOfDay(totalSeconds: number): string {
  const totalMinutes = Math.floor(totalSeconds / 60);
  const hours24 = Math.floor(totalMinutes / 60) % 24;
  const minutes = totalMinutes % 60;
  const period = hours24 >= 12 ? "PM" : "AM";
  const hours12 = hours24 % 12 || 12;
  const paddedMinutes = minutes.toString().padStart(2, "0");
  return `${hours12}:${paddedMinutes} ${period}`;
}

export const analyticsService = {
  getDashboardAnalytics: async (
    query: AnalyticsQueryDto
  ): Promise<DashboardAnalyticsResponse> => {
    const asOfDate = query.date ? new Date(query.date) : new Date();

    // 1. Resolve Target Budget & Period (1 query via budgetService)
    let budget = query.budgetId
      ? await budgetService.getBudgetById(query.budgetId)
      : null;

    if (!budget && (query.startDate || query.endDate)) {
      const budgets = await budgetService.getBudgets({
        startDate: query.startDate,
        endDate: query.endDate,
      });
      budget = budgets[0] || null;
    }

    if (!budget) {
      budget = await budgetService.getActiveBudget(asOfDate);
    }

    // Determine period boundaries
    const periodStart = query.startDate
      ? new Date(query.startDate)
      : budget?.startPeriod
      ? new Date(budget.startPeriod)
      : new Date(Date.UTC(asOfDate.getUTCFullYear(), asOfDate.getUTCMonth(), 1));

    const periodEnd = query.endDate
      ? new Date(query.endDate)
      : budget?.endPeriod
      ? new Date(budget.endPeriod)
      : new Date(Date.UTC(asOfDate.getUTCFullYear(), asOfDate.getUTCMonth() + 1, 0, 23, 59, 59, 999));

    // Normalize boundaries to UTC
    periodStart.setUTCHours(0, 0, 0, 0);
    periodEnd.setUTCHours(23, 59, 59, 999);

    // 2. Fetch overlapping expenditure periods & relevant selections in parallel (2 lean queries)
    const [expenditurePeriods, selections] = await Promise.all([
      prisma.expenditurePeriod.findMany({
        where: {
          type: ExpenditureType.MEAL,
          startDate: { lte: periodEnd },
          endDate: { gte: periodStart },
        },
        orderBy: { startDate: "asc" },
      }),
      prisma.selections.findMany({
        where: {
          selectionStatus: { not: SelectionStatus.CANCELLED },
          OR: [
            {
              createdAt: { gte: periodStart, lte: periodEnd },
            },
            {
              fulfilledAt: { gte: periodStart, lte: periodEnd },
            },
            {
              weekMenuSchedule: {
                year: {
                  gte: periodStart.getUTCFullYear(),
                  lte: periodEnd.getUTCFullYear(),
                },
              },
            },
          ],
        },
        select: {
          id: true,
          guestCount: true,
          fulfillmentStatus: true,
          fulfilledAt: true,
          createdAt: true,
          selectionStatus: true,
          selectionType: true,
          weekMenuSchedule: {
            select: {
              week: true,
              year: true,
            },
          },
          menuDay: {
            select: {
              day: true,
            },
          },
        },
      }),
    ]);

    // Helper: find unit meal cost for a given date
    const getUnitCostForDate = (date: Date): number => {
      const match = expenditurePeriods.find(
        (ep) => date >= ep.startDate && date <= ep.endDate
      );
      if (match) return match.cost;
      return expenditurePeriods[expenditurePeriods.length - 1]?.cost ?? 0;
    };

    // 3. Single-pass in-memory processing
    let totalConsumed = 0;
    let fulfilledCount = 0;
    let notFulfilledCount = 0;
    let pendingCount = 0;

    let fulfillmentTimeSecondsSum = 0;
    let fulfillmentDurationMsSum = 0;
    let fulfilledWithTimeCount = 0;

    const weeklyMap = new Map<string, {
      week: number;
      year: number;
      totalPortions: number;
      unitCost: number;
      totalCost: number;
      fulfilledCount: number;
    }>();

    const dayMap = new Map<Days, { portions: number; totalCost: number }>();
    for (const day of Object.values(Days)) {
      dayMap.set(day, { portions: 0, totalCost: 0 });
    }

    for (const selection of selections) {
      // Calculate selection scheduled meal date
      const week = selection.weekMenuSchedule.week;
      const year = selection.weekMenuSchedule.year;
      const day = selection.menuDay.day;

      const monday = getDateFromISOWeek(week, year);
      const mealDate = new Date(monday);
      mealDate.setUTCDate(mealDate.getUTCDate() + (DAY_OFFSET_MAP[day] ?? 0));
      mealDate.setUTCHours(12, 0, 0, 0);

      // Check if meal falls within active period window
      const effectiveDate = selection.fulfilledAt || mealDate;
      const isInPeriod = effectiveDate >= periodStart && effectiveDate <= periodEnd;

      if (!isInPeriod) continue;

      const guestCount = Math.max(1, selection.guestCount || 1);
      const isMeal = selection.selectionType === SelectionType.MEAL;
      const isFulfilled = selection.fulfillmentStatus === FulfillmentStatus.FULFILLED;

      // Fulfillment counts
      if (isFulfilled) {
        fulfilledCount++;
      } else if (selection.fulfillmentStatus === FulfillmentStatus.NOT_FULFILLED) {
        notFulfilledCount++;
      } else {
        pendingCount++;
      }

      // Fulfillment time metrics (clock time & turnaround duration)
      if (isFulfilled && selection.fulfilledAt) {
        const fulfilledDate = new Date(selection.fulfilledAt);
        const secondsFromMidnight =
          fulfilledDate.getUTCHours() * 3600 +
          fulfilledDate.getUTCMinutes() * 60 +
          fulfilledDate.getUTCSeconds();
        fulfillmentTimeSecondsSum += secondsFromMidnight;

        const durationMs = Math.max(0, fulfilledDate.getTime() - new Date(selection.createdAt).getTime());
        fulfillmentDurationMsSum += durationMs;
        fulfilledWithTimeCount++;
      }

      // Expenditure calculation (only fulfilled MEAL selections consume budget)
      if (isFulfilled && isMeal) {
        const unitCost = getUnitCostForDate(effectiveDate);
        const itemCost = guestCount * unitCost;
        totalConsumed += itemCost;

        // Weekly breakdown
        const weekKey = `${year}-W${week.toString().padStart(2, "0")}`;
        const currentWeek = weeklyMap.get(weekKey) || {
          week,
          year,
          totalPortions: 0,
          unitCost,
          totalCost: 0,
          fulfilledCount: 0,
        };
        currentWeek.totalPortions += guestCount;
        currentWeek.totalCost += itemCost;
        currentWeek.fulfilledCount++;
        currentWeek.unitCost = unitCost;
        weeklyMap.set(weekKey, currentWeek);

        // Day of week breakdown
        const currentDay = dayMap.get(day) || { portions: 0, totalCost: 0 };
        currentDay.portions += guestCount;
        currentDay.totalCost += itemCost;
        dayMap.set(day, currentDay);
      }
    }

    // Format weekly breakdown
    const weeklyExpenditure: WeeklyExpenditureBreakdown[] = Array.from(weeklyMap.values())
      .sort((a, b) => (a.year !== b.year ? a.year - b.year : a.week - b.week))
      .map((w) => {
        const { weekStart, weekEnd } = getWeekRange(w.week, w.year);
        return {
          week: w.week,
          year: w.year,
          weekStart: weekStart.toISOString(),
          weekEnd: weekEnd.toISOString(),
          totalPortions: w.totalPortions,
          unitCost: Number(w.unitCost.toFixed(2)),
          totalCost: Number(w.totalCost.toFixed(2)),
          fulfilledCount: w.fulfilledCount,
        };
      });

    // Format day-of-week breakdown
    const dayOfWeekExpenditure: DayOfWeekExpenditureBreakdown[] = Array.from(dayMap.entries()).map(
      ([day, data]) => ({
        day,
        portions: data.portions,
        totalCost: Number(data.totalCost.toFixed(2)),
      })
    );

    // Budget math & pacing
    const totalBudget = budget ? budget.amount : 0;
    const remaining = totalBudget - totalConsumed;
    const consumptionPercentage =
      totalBudget > 0 ? Number(((totalConsumed / totalBudget) * 100).toFixed(2)) : 0;

    let budgetStatus: "SURPLUS" | "OVERSPENT" | "BALANCED" = "BALANCED";
    if (remaining > 0) budgetStatus = "SURPLUS";
    else if (remaining < 0) budgetStatus = "OVERSPENT";

    const msPerDay = 86400000;
    const daysTotal = Math.max(1, Math.ceil((periodEnd.getTime() - periodStart.getTime()) / msPerDay));
    const effectiveAsOf = Math.min(periodEnd.getTime(), Math.max(periodStart.getTime(), asOfDate.getTime()));
    const daysElapsed = Math.max(1, Math.ceil((effectiveAsOf - periodStart.getTime()) / msPerDay));

    const dailyBurnRate = Number((totalConsumed / daysElapsed).toFixed(2));
    const projectedTotalSpend = Number((dailyBurnRate * daysTotal).toFixed(2));

    let projectedStatus: "PROJECTED_SURPLUS" | "PROJECTED_OVERSPENT" | "ON_TRACK" = "ON_TRACK";
    if (totalBudget > 0) {
      if (projectedTotalSpend > totalBudget * 1.05) {
        projectedStatus = "PROJECTED_OVERSPENT";
      } else if (projectedTotalSpend < totalBudget * 0.95) {
        projectedStatus = "PROJECTED_SURPLUS";
      }
    }

    // Selections metrics
    const totalSelections = fulfilledCount + notFulfilledCount + pendingCount;
    const fulfillmentRatePercentage =
      totalSelections > 0
        ? Number(((fulfilledCount / totalSelections) * 100).toFixed(2))
        : 0;

    const averageFulfillmentTimeOfDay =
      fulfilledWithTimeCount > 0
        ? formatTimeOfDay(Math.round(fulfillmentTimeSecondsSum / fulfilledWithTimeCount))
        : null;

    const averageFulfillmentDurationMinutes =
      fulfilledWithTimeCount > 0
        ? Math.round(fulfillmentDurationMsSum / fulfilledWithTimeCount / 60000)
        : null;

    return {
      period: {
        startDate: periodStart.toISOString(),
        endDate: periodEnd.toISOString(),
        asOfDate: asOfDate.toISOString(),
        daysTotal,
        daysElapsed,
      },
      budget: {
        id: budget?.id ?? null,
        title: budget?.title ?? null,
        totalBudget: Number(totalBudget.toFixed(2)),
        consumed: Number(totalConsumed.toFixed(2)),
        remaining: Number(remaining.toFixed(2)),
        consumptionPercentage,
        status: budgetStatus,
        dailyBurnRate,
        projectedTotalSpend,
        projectedStatus,
      },
      selections: {
        total: totalSelections,
        fulfilled: fulfilledCount,
        notFulfilled: notFulfilledCount,
        pending: pendingCount,
        fulfillmentRatePercentage,
        averageFulfillmentTimeOfDay,
        averageFulfillmentDurationMinutes,
      },
      weeklyExpenditure,
      dayOfWeekExpenditure,
    };
  },
};
