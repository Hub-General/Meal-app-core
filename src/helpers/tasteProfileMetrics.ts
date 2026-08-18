import { TastePersonality } from "../enums/EPersonalities";

interface TasteProfileSelection {
    dayMeal: {
        meal: {
            id: number;
            name?: string;
            calories: number | null;
            foodCode: string;
        }
    }
}

export interface TasteProfileMetrics {
    supergroups: Record<string, number>;
    meals: Record<string, number>;
    proteins: Record<string, number>;
    preparations: Record<string, number>;
    combinations: Record<string, number>;
}

interface TasteProfileFavorites {
    favoriteProtein?: string;
    favoriteMeal?: { id: number; name: string; count: number };
}

interface TasteProfileCounts {
    totalSelections: number;
    uniqueMeals: number;
    repeatedMeals: number;
    totalCalories: number;
    averageCalories: number;
}

interface TasteProfileScores {
    diversityScore: number;
    consistencyScore: number;
}

export interface TopMealDetail {
    id: number;
    name: string;
    foodCode: string;
    count: number;
}

export type StoredTasteProfileMetrics = TasteProfileMetrics &
    Omit<TasteProfileCounts, "totalSelections"> &
    TasteProfileScores & {
        uniqueMealIds: number[];
        topMeals: TopMealDetail[];
    };

export interface GeneratedTasteProfile {
    totalMealsSelected: number;
    metrics: StoredTasteProfileMetrics;
    favorites: TasteProfileFavorites;
    personalityType: TastePersonality;
}


interface PersonalityContext {
    diversity: number;
    consistency: number;
    avgCalories: number;
    proteinRatio: number;
    isSpicy: boolean;
}

const PERSONALITY_RULES: Array<{ type: TastePersonality; test: (c: PersonalityContext) => boolean }> = [
    { type: "ADVENTUROUS", test: (c) => c.diversity >= 75 && c.isSpicy },
    { type: "SPICE_CHASER", test: (c) => c.isSpicy },
    { type: "HEALTH_CONSCIOUS", test: (c) => c.avgCalories > 0 && c.avgCalories <= 550 },
    { type: "PROTEIN_LOVER", test: (c) => c.proteinRatio >= 0.45 },
    { type: "EXPLORER", test: (c) => c.diversity >= 70 },
    { type: "TRADITIONALIST", test: (c) => c.consistency >= 60 },
    { type: "COMFORT_SEEKER", test: (c) => c.consistency >= 40 },
];

export const tasteProfileHelper = {
    findFavorite(metric: Record<string, number>): string | undefined {
        return this.findFavoriteEntry(metric)?.[0];
    },

    findFavoriteEntry(metric: Record<string, number>): [string, number] | undefined {
        return Object.entries(metric).reduce<[string, number] | undefined>(
            (best, current) => (!best || current[1] > best[1] ? current : best),
            undefined
        );
    },

    increment(metric: Map<string, number>, key?: string) {
        if (key) {
            metric.set(key, (metric.get(key) ?? 0) + 1);
        }
    },

    buildMetrics(selections: TasteProfileSelection[]) {
        const supergroups = new Map<string, number>();
        const meals = new Map<string, number>();
        const proteins = new Map<string, number>();
        const preparations = new Map<string, number>();
        const combinations = new Map<string, number>();
        const uniqueMealIds = new Set<number>();
        const mealDetails = new Map<number, TopMealDetail>();
        let totalSelections = 0;
        let totalCalories = 0;

        for (const selection of selections) {
            const mealObj = selection.dayMeal.meal;
            const parts = mealObj.foodCode.split("-");
            const supergroup = parts[0] ?? "";
            const meal = parts[1] ?? "";
            const protein = parts[2] ?? "";
            const preparation = parts[3] ?? "";
            uniqueMealIds.add(mealObj.id);
            totalCalories += mealObj.calories ?? 0;

            const existingMeal = mealDetails.get(mealObj.id);
            if (existingMeal) {
                existingMeal.count += 1;
            } else {
                mealDetails.set(mealObj.id, {
                    id: mealObj.id,
                    name: mealObj.name || meal || `Meal #${mealObj.id}`,
                    foodCode: mealObj.foodCode,
                    count: 1,
                });
            }

            this.increment(supergroups, supergroup);
            this.increment(proteins, protein);
            this.increment(meals, meal);
            this.increment(preparations, preparation);
            this.increment(combinations, protein && preparation ? `${protein}-${preparation}` : undefined);

            totalSelections++;
        }

        const topMeals = Array.from(mealDetails.values())
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);

        const metrics: TasteProfileMetrics = {
            supergroups: Object.fromEntries(supergroups),
            proteins: Object.fromEntries(proteins),
            meals: Object.fromEntries(meals),
            preparations: Object.fromEntries(preparations),
            combinations: Object.fromEntries(combinations),
        };
        const counts: TasteProfileCounts = {
            totalSelections,
            uniqueMeals: uniqueMealIds.size,
            repeatedMeals: totalSelections - uniqueMealIds.size,
            totalCalories,
            averageCalories: totalSelections > 0 ? Math.round(totalCalories / totalSelections) : 0,
        };
        return { counts, metrics, uniqueMealIds: Array.from(uniqueMealIds), topMeals };
    },

    getFavorites(metrics: TasteProfileMetrics): TasteProfileFavorites {
        return {
            favoriteProtein: this.findFavorite(metrics.proteins),
        };
    },

    calculateScores(counts: TasteProfileCounts): TasteProfileScores {
        if (counts.totalSelections === 0) {
            return {
                diversityScore: 0,
                consistencyScore: 0,
            };
        }

        const mealScores: TasteProfileScores = {
            diversityScore: Math.round((counts.uniqueMeals / counts.totalSelections) * 100),
            consistencyScore: Math.round((counts.repeatedMeals / counts.totalSelections) * 100),
        };

        return mealScores;
    },

    determinePersonality(counts: TasteProfileCounts, scores: TasteProfileScores, favoritePreparation?: string, favoriteProteinCount = 0): TastePersonality {
        const ctx: PersonalityContext = {
            diversity: scores.diversityScore,
            consistency: scores.consistencyScore,
            avgCalories: counts.averageCalories,
            proteinRatio: counts.totalSelections > 0 ? favoriteProteinCount / counts.totalSelections : 0,
            isSpicy: Boolean(favoritePreparation?.toLowerCase().includes("spic")),
        };

        return PERSONALITY_RULES.find((rule) => rule.test(ctx))?.type ?? "BALANCED";
    },

    generateProfile(selections: TasteProfileSelection[]): GeneratedTasteProfile {
        const { counts, metrics, uniqueMealIds, topMeals } = this.buildMetrics(selections);
        const scores = this.calculateScores(counts);
        const favoriteProtein = this.findFavoriteEntry(metrics.proteins);
        const favoritePreparation = this.findFavorite(metrics.preparations);
        const personalityType = this.determinePersonality(counts, scores, favoritePreparation, favoriteProtein?.[1]);

        return {
            totalMealsSelected: counts.totalSelections,
            metrics: {
                ...metrics,
                uniqueMeals: counts.uniqueMeals,
                repeatedMeals: counts.repeatedMeals,
                totalCalories: counts.totalCalories,
                averageCalories: counts.averageCalories,
                uniqueMealIds,
                topMeals,
                ...scores,
            },
            favorites: {
                favoriteProtein: favoriteProtein?.[0],
                favoriteMeal: topMeals[0] ? { id: topMeals[0].id, name: topMeals[0].name, count: topMeals[0].count } : undefined,
            },
            personalityType,
        };
    },
};
