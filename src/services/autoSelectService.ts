import { prisma } from "../db/prisma";
import { TastePersonality } from "../enums/EPersonalities";
import { autoSelectWeek, CandidateMeal } from "../helpers/autoSelectEngine";
import { StoredTasteProfileMetrics } from "../helpers/tasteProfileMetrics";
import { CreateMealSelectionRequest } from "../schema/mealSelection";

export type AutoSelectItem = Omit<CreateMealSelectionRequest, "weekMenuScheduleId"> & {
    weekMenuScheduleId?: number;
};

export const autoSelectService = {
    /**
     * Generate a personality-driven week of meal suggestions for a user.
     *
     * Returns CreateMealSelectionRequest[] — the exact same shape accepted
     * by the batch selections endpoint, ready to submit without any transformation.
     *
     * Single DB round-trip: all data is fetched in one Promise.all.
     */
    autoSelect: async (
        menuId: number,
        userId: number,
        weekMenuScheduleId?: number
    ): Promise<AutoSelectItem[]> => {

        // ── 1. Single parallel fetch ──────────────────────────────────────────
        // weekMenuSchedule is only fetched when the caller passes a weekMenuScheduleId;
        // without it the output omits that field (preview/browse mode).
        const [dayMeals, tasteProfile, userPreference] = await Promise.all([

            // All active meals per menuDay for this menu
            prisma.menuDayMeals.findMany({
                where: {
                    menuDay: { menuId },
                    isActive: true,
                },
                select: {
                    id: true,          // dayMealId
                    menuDayId: true,
                    menuDay: {
                        select: { day: true }
                    },
                    meal: {
                        select: {
                            id: true,
                            name: true,
                            foodCode: true,
                            calories: true,
                        }
                    }
                }
            }),

            // Most recent taste profile for this user
            prisma.tasteProfile.findFirst({
                where: { userId },
                orderBy: { calendarYear: "desc" },
                select: {
                    personalityType: true,
                    totalMealsSelected: true,
                    metrics: true,
                }
            }),

            // User preference — for the excluded meal ids blacklist
            prisma.userPreferences.findUnique({
                where: { userId },
                select: { excludedMealIds: true }
            }),

        ]);

        // ── 2. Build day → candidates map ─────────────────────────────────────
        const dayMap = new Map<string, CandidateMeal[]>();

        for (const dm of dayMeals) {
            const day = dm.menuDay.day as string;
            const existing = dayMap.get(day) ?? [];
            existing.push({
                dayMealId: dm.id,
                menuDayId: dm.menuDayId,
                meal: {
                    id:       dm.meal.id,
                    name:     dm.meal.name,
                    foodCode: dm.meal.foodCode,
                    calories: dm.meal.calories,
                },
            });
            dayMap.set(day, existing);
        }

        // ── 3. Resolve personality & metrics ──────────────────────────────────
        const personality = (tasteProfile?.personalityType ?? "BALANCED") as TastePersonality;
        const metrics = tasteProfile?.totalMealsSelected && tasteProfile.totalMealsSelected > 0
            ? (tasteProfile.metrics as unknown as StoredTasteProfileMetrics)
            : null;

        // ── 4. Build excluded-meal set ────────────────────────────────────────
        const rawExcluded = userPreference?.excludedMealIds;
        const excludedIds = new Set<number>(
            Array.isArray(rawExcluded) ? (rawExcluded as number[]) : []
        );

        // ── 5. Run the engine (pure, zero DB) ─────────────────────────────────
        const engineResult = autoSelectWeek(dayMap, metrics, personality, excludedIds);

        // ── 6. Map to AutoSelectItem[] ────────────────────────────────────────
        return Array.from(engineResult.values()).map(picked => ({
            dayMealId:     picked.dayMealId,
            menuDayId:     picked.menuDayId,
            createdFor:    userId,
            selectionType: "MEAL" as const,
            // Only included when caller supplies a weekMenuScheduleId
            ...(weekMenuScheduleId !== undefined ? { weekMenuScheduleId } : {}),
        }));
    },
};
