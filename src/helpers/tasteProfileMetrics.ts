import { TastePersonality } from "../enums/EPersonalities";

interface TasteProfileSelection {
    dayMeal: {
        meal: {
            id: number;
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

export type StoredTasteProfileMetrics = TasteProfileMetrics & Omit<TasteProfileCounts, "totalSelections"> & TasteProfileScores;

export interface GeneratedTasteProfile {
    totalMealsSelected: number;
    metrics: StoredTasteProfileMetrics;
    favorites: TasteProfileFavorites;
    personalityType: TastePersonality;
}


export const tasteProfileHelper ={
    findFavorite(metric: Record<string, number>): string | undefined {
        return this.findFavoriteEntry(metric)?.[0];
    },

    findFavoriteEntry(metric: Record<string, number>): [string, number] | undefined {
        return Object.entries(metric).reduce<[string, number] | undefined>(
            (best, current) => !best || current[1] > best[1] ? current : best,
            undefined
        );
    },

    increment(metric: Map<string, number>, key?: string) {
        if(key) {
            metric.set(key, (metric.get(key) ?? 0) + 1)
        }
    },

    buildMetrics(selections: TasteProfileSelection[]){
        const supergroups = new Map<string, number>();
        const meals = new Map<string, number>();
        const proteins = new Map<string, number>();
        const preparations =  new Map<string, number>();
        const combinations =  new Map<string, number>();
        const uniqueMealIds = new Set<number>();
        let totalSelections = 0
        let totalCalories = 0

        for(const selection of selections){
            const [supergroup, meal, protein, preparation] = selection.dayMeal.meal.foodCode.split("-");
            uniqueMealIds.add(selection.dayMeal.meal.id);
            totalCalories += selection.dayMeal.meal.calories ?? 0;

            this.increment(supergroups, supergroup)
            this.increment(proteins, protein)
            this.increment(meals, meal)
            this.increment(preparations, preparation)
            this.increment(combinations, protein && preparation ? `${protein}-${preparation}` : undefined)
            
            totalSelections++;
        }

        const metrics : TasteProfileMetrics = {
            supergroups: Object.fromEntries(supergroups),
            proteins: Object.fromEntries(proteins),
            meals: Object.fromEntries(meals),
            preparations: Object.fromEntries(preparations),
            combinations: Object.fromEntries(combinations)
        }
        const counts: TasteProfileCounts = {
            totalSelections,
            uniqueMeals: uniqueMealIds.size,
            repeatedMeals: totalSelections - uniqueMealIds.size,
            totalCalories,
            averageCalories: totalSelections > 0 ? Math.round(totalCalories / totalSelections) : 0,
        }
        return ({counts, metrics})
    },
    getFavorites(metrics : TasteProfileMetrics): TasteProfileFavorites {
        return {
            favoriteProtein: this.findFavorite(metrics.proteins),
        }
    },

    calculateScores(counts: TasteProfileCounts): TasteProfileScores {
        if(counts.totalSelections === 0) {
            return {
                diversityScore: 0,
                consistencyScore: 0,
            }
        }

        const mealScores: TasteProfileScores = {
            diversityScore: Math.round((counts.uniqueMeals / counts.totalSelections) * 100),
            consistencyScore: Math.round((counts.repeatedMeals / counts.totalSelections) * 100),
        }

        return mealScores
    },

    determinePersonality(counts: TasteProfileCounts, scores: TasteProfileScores, favoritePreparation?: string, favoriteProteinCount = 0): TastePersonality {
        const proteinRatio = counts.totalSelections > 0 ? favoriteProteinCount / counts.totalSelections : 0;
        const preparation = favoritePreparation?.toLowerCase();

        if(scores.diversityScore >= 75 && preparation?.includes("spic")) {
            return "ADVENTUROUS";
        }

        if(preparation?.includes("spic")) {
            return "SPICE_CHASER";
        }

        if(counts.averageCalories > 0 && counts.averageCalories <= 550) {
            return "HEALTH_CONSCIOUS";
        }

        if(proteinRatio >= 0.45) {
            return "PROTEIN_LOVER";
        }

        if(scores.diversityScore >= 70) {
            return "EXPLORER";
        }

        if(scores.consistencyScore >= 60) {
            return "TRADITIONALIST";
        }

        if(scores.consistencyScore >= 40) {
            return "COMFORT_SEEKER";
        }

        return "BALANCED";
    },

    generateProfile(selections: TasteProfileSelection[]): GeneratedTasteProfile {
        const {counts, metrics} = this.buildMetrics(selections);
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
                ...scores,
            },
            favorites: {
                favoriteProtein: favoriteProtein?.[0],
            },
            personalityType,
        }
    }
}
