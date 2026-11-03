import { TastePersonality, tastePersonalities } from "../enums/EPersonalities";
import {
    RecapMetricKey,
    RecapOfficeAverages,
    RecapPersonalitySummary,
    RecapRankingStat,
    RecapSlideCard,
    RecapTasteTwin,
    RecapTopMealHighlight,
    TasteProfileRecapResponse,
} from "../schema/tasteProfile";
import { StoredTasteProfileMetrics, TopMealDetail } from "./tasteProfileMetrics";

export interface RawTasteProfileRow {
    userId: number;
    calendarYear: number;
    totalMealsSelected: number;
    metrics: unknown;
    personalityType: string | null;
    favoriteProtein: string | null;
    updatedAt: Date;
    user?: {
        id: number;
        name: string;
    } | null;
}

const EMPTY_METRICS: StoredTasteProfileMetrics = {
    supergroups: {},
    bases: {},
    variations: {},
    meals: {},
    proteins: {},
    accompaniments: {},
    modifiers: {},
    preparations: {},
    combinations: {},
    uniqueMeals: 0,
    repeatedMeals: 0,
    totalCalories: 0,
    averageCalories: 0,
    diversityScore: 0,
    consistencyScore: 0,
    uniqueMealIds: [],
    topMeals: [],
    swallowCount: 0,
    swallowRatio: 0,
};

function parseMetrics(raw: unknown): StoredTasteProfileMetrics {
    if (!raw || typeof raw !== "object") {
        return { ...EMPTY_METRICS };
    }
    const obj = raw as Partial<StoredTasteProfileMetrics>;
    return {
        supergroups: obj.supergroups ?? {},
        bases: obj.bases ?? {},
        variations: obj.variations ?? {},
        meals: obj.meals ?? {},
        proteins: obj.proteins ?? {},
        accompaniments: obj.accompaniments ?? {},
        modifiers: obj.modifiers ?? {},
        preparations: obj.preparations ?? {},
        combinations: obj.combinations ?? {},
        uniqueMeals: obj.uniqueMeals ?? 0,
        repeatedMeals: obj.repeatedMeals ?? 0,
        totalCalories: obj.totalCalories ?? 0,
        averageCalories: obj.averageCalories ?? 0,
        diversityScore: obj.diversityScore ?? 0,
        consistencyScore: obj.consistencyScore ?? 0,
        uniqueMealIds: Array.isArray(obj.uniqueMealIds) ? obj.uniqueMealIds : [],
        topMeals: Array.isArray(obj.topMeals) ? obj.topMeals : [],
        swallowCount: obj.swallowCount ?? obj.supergroups?.S ?? 0,
        swallowRatio: obj.swallowRatio ?? 0,
    };
}

function getTopKey(record: Record<string, number>): string | null {
    let bestKey: string | null = null;
    let bestVal = -1;
    for (const [k, v] of Object.entries(record)) {
        if (v > bestVal) {
            bestVal = v;
            bestKey = k;
        }
    }
    return bestKey;
}

function computeCosineSimilarity(a: Record<string, number>, b: Record<string, number>): number {
    const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
    if (keys.size === 0) return 0;

    let dot = 0;
    let magA = 0;
    let magB = 0;
    for (const k of keys) {
        const va = a[k] ?? 0;
        const vb = b[k] ?? 0;
        dot += va * vb;
        magA += va * va;
        magB += vb * vb;
    }
    if (magA === 0 || magB === 0) return 0;
    return dot / (Math.sqrt(magA) * Math.sqrt(magB));
}

function pluralizePersonality(name: string): string {
    if (name.endsWith("s") || name.endsWith("Conscious") || name.endsWith("Adventurous") || name.endsWith("Balanced")) {
        return `${name} eaters`;
    }
    return `${name}s`;
}

export function buildTasteProfileRecap(
    targetUserId: number,
    calendarYear: number,
    allProfiles: RawTasteProfileRow[],
    fallbackUserName: string | null = null
): TasteProfileRecapResponse {
    const parsedProfiles = allProfiles.map((row) => ({
        ...row,
        parsedMetrics: parseMetrics(row.metrics),
        resolvedPersonality: ((row.personalityType && row.personalityType in tastePersonalities
            ? row.personalityType
            : "BALANCED") as TastePersonality),
    }));

    let userProfile = parsedProfiles.find((p) => p.userId === targetUserId);
    if (!userProfile) {
        userProfile = {
            userId: targetUserId,
            calendarYear,
            totalMealsSelected: 0,
            metrics: EMPTY_METRICS,
            parsedMetrics: { ...EMPTY_METRICS },
            personalityType: "BALANCED",
            resolvedPersonality: "BALANCED",
            favoriteProtein: null,
            updatedAt: new Date(),
            user: fallbackUserName ? { id: targetUserId, name: fallbackUserName } : null,
        };
        parsedProfiles.push(userProfile);
    }

    const activePool = parsedProfiles.filter(
        (p) => p.totalMealsSelected > 0 || p.userId === targetUserId
    );
    const totalParticipants = Math.max(1, activePool.length);

    const userMetrics = userProfile.parsedMetrics;
    const userPersonality = userProfile.resolvedPersonality;
    const personalityMeta = tastePersonalities[userPersonality] ?? tastePersonalities.BALANCED;

    // ── 1. Office Averages & Personality Breakdown (single pass) ─────────────
    const personalityBreakdown: Record<string, number> = {};
    let sumMeals = 0;
    let sumUnique = 0;
    let sumCalories = 0;
    let sumAvgCalories = 0;
    let sumConsistency = 0;
    let sumDiversity = 0;
    let sumSwallow = 0;
    let sumSpice = 0;

    for (const p of activePool) {
        personalityBreakdown[p.resolvedPersonality] =
            (personalityBreakdown[p.resolvedPersonality] ?? 0) + 1;
        sumMeals += p.totalMealsSelected;
        sumUnique += p.parsedMetrics.uniqueMeals;
        sumCalories += p.parsedMetrics.totalCalories;
        sumAvgCalories += p.parsedMetrics.averageCalories;
        sumConsistency += p.parsedMetrics.consistencyScore;
        sumDiversity += p.parsedMetrics.diversityScore;
        sumSwallow += p.parsedMetrics.swallowCount ?? 0;
        sumSpice += p.parsedMetrics.modifiers?.PP ?? 0;
    }

    const officeAverages: RecapOfficeAverages = {
        totalParticipants,
        averageMealsSelected: Math.round(sumMeals / totalParticipants),
        averageUniqueMeals: Math.round(sumUnique / totalParticipants),
        averageCaloriesTotal: Math.round(sumCalories / totalParticipants),
        averageCaloriesPerMeal: Math.round(sumAvgCalories / totalParticipants),
        averageConsistencyScore: Math.round(sumConsistency / totalParticipants),
        averageDiversityScore: Math.round(sumDiversity / totalParticipants),
        averageSwallowCount: Math.round(sumSwallow / totalParticipants),
        personalityBreakdown,
    };

    const officeAvgSpice = Math.round(sumSpice / totalParticipants);

    // ── 2. Personality Cohort Summary ("You are 1 of 6 Explorers") ───────────
    const cohortCount = personalityBreakdown[userPersonality] ?? 1;
    const cohortPercentage = Math.round((cohortCount / totalParticipants) * 100);
    const pluralLabel = pluralizePersonality(personalityMeta.name);

    const personality: RecapPersonalitySummary = {
        type: userPersonality,
        name: personalityMeta.name,
        title: `You are ${/^[aeiou]/i.test(personalityMeta.name) ? "an" : "a"} ${personalityMeta.name}`,
        subtitle:
            cohortCount === 1
                ? `You are the only ${personalityMeta.name} in the office this year!`
                : `You are 1 of ${cohortCount} ${pluralLabel} in the office (${cohortPercentage}% of the team)`,
        description: personalityMeta.description,
        rank: null,
        totalParticipants,
        cohortCount,
        cohortPercentage,
    };

    // ── 3. Comparative Rankings (RecapRankingStat) ───────────────────────────
    function computeRanking(
        key: RecapMetricKey,
        label: string,
        unit: string,
        officeAverage: number,
        scoreExtractor: (p: (typeof activePool)[number]) => number,
        tieBreaker: (p: (typeof activePool)[number]) => number,
        copyBuilder: (ctx: {
            rank: number;
            total: number;
            value: number;
            officeAverage: number;
        }) => { title: string; subtitle: string; description: string }
    ): RecapRankingStat {
        const sorted = [...activePool].sort((a, b) => {
            const diff = scoreExtractor(b) - scoreExtractor(a);
            if (diff !== 0) return diff;
            const tie = tieBreaker(b) - tieBreaker(a);
            if (tie !== 0) return tie;
            return a.userId - b.userId;
        });

        const index = sorted.findIndex((p) => p.userId === targetUserId);
        const rank = index >= 0 ? index + 1 : totalParticipants;
        const value = scoreExtractor(userProfile!);
        const percentile =
            totalParticipants > 1
                ? Math.max(1, Math.round(((totalParticipants - rank + 1) / totalParticipants) * 100))
                : 100;

        const { title, subtitle, description } = copyBuilder({
            rank,
            total: totalParticipants,
            value,
            officeAverage,
        });

        return {
            key,
            label,
            title,
            subtitle,
            description,
            rank,
            totalParticipants,
            value,
            unit,
            percentile,
            officeAverage,
        };
    }

    const loyaltyRank = computeRanking(
        "loyalty",
        "Loyalty Ranking",
        "%",
        officeAverages.averageConsistencyScore,
        (p) => p.parsedMetrics.consistencyScore,
        (p) => p.parsedMetrics.repeatedMeals,
        ({ rank, total, value, officeAverage }) => ({
            title:
                rank === 1 && value > 0
                    ? "You are the #1 most loyal eater in the office!"
                    : `Ranked #${rank} in Meal Loyalty`,
            subtitle: `Loyalty Rank #${rank} of ${total} (${value}% consistency)`,
            description: `${value}% of your selections (${userMetrics.repeatedMeals} plates) were repeat favourites vs. the office average of ${officeAverage}%.`,
        })
    );

    const explorerRank = computeRanking(
        "explorer",
        "Explorer Ranking",
        "unique meals",
        officeAverages.averageUniqueMeals,
        (p) => p.parsedMetrics.uniqueMeals,
        (p) => p.parsedMetrics.diversityScore,
        ({ rank, total, value, officeAverage }) => ({
            title:
                rank === 1 && value > 0
                    ? `You are the #1 menu explorer with ${value} unique dishes tried!`
                    : `Ranked #${rank} on the Explorer Leaderboard`,
            subtitle: `Explorer Rank #${rank} of ${total} (${userMetrics.diversityScore}% diversity score)`,
            description: `You sampled ${value} distinct meals across the menu compared to the office average of ${officeAverage}.`,
        })
    );

    const caloriesRank = computeRanking(
        "calories",
        "Calorie Leaderboard",
        "kcal",
        officeAverages.averageCaloriesTotal,
        (p) => p.parsedMetrics.totalCalories,
        (p) => p.parsedMetrics.averageCalories,
        ({ rank, total, value, officeAverage }) => ({
            title:
                rank === 1 && value > 0
                    ? `You have consumed the most calories in the office (${value.toLocaleString()} kcal)!`
                    : `Ranked #${rank} on the Calorie Leaderboard`,
            subtitle: `Calorie Rank #${rank} of ${total} (${userMetrics.averageCalories} kcal/meal avg)`,
            description: `You consumed ${value.toLocaleString()} total kcal across ${calendarYear} compared to the office average of ${officeAverage.toLocaleString()} kcal.`,
        })
    );

    const swallowRank = computeRanking(
        "swallow",
        "Swallow Heavyweight Ranking",
        "meals",
        officeAverages.averageSwallowCount,
        (p) => p.parsedMetrics.swallowCount ?? 0,
        (p) => p.parsedMetrics.swallowRatio ?? 0,
        ({ rank, total, value, officeAverage }) => ({
            title:
                rank === 1 && value > 0
                    ? `You are the #1 Swallow Heavyweight with ${value} swallow meals!`
                    : value === 0
                    ? "Zero swallow meals this year — you kept it light!"
                    : `Ranked #${rank} in Swallow Consumption`,
            subtitle: `Swallow Rank #${rank} of ${total} (${Math.round((userMetrics.swallowRatio ?? 0) * 100)}% of your meals)`,
            description: `You ordered ${value} swallow meals this year compared to the office average of ${officeAverage}.`,
        })
    );

    const spiceRank = computeRanking(
        "spice",
        "Spice Chaser Ranking",
        "spicy meals",
        officeAvgSpice,
        (p) => p.parsedMetrics.modifiers?.PP ?? 0,
        (p) => p.totalMealsSelected,
        ({ rank, total, value, officeAverage }) => ({
            title:
                rank === 1 && value > 0
                    ? `You are the #1 Spice Chaser in the office with ${value} peppered meals!`
                    : value === 0
                    ? "You steered clear of peppered dishes all year!"
                    : `Ranked #${rank} on the Spice Meter`,
            subtitle: `Spice Rank #${rank} of ${total}`,
            description: `You selected ${value} peppered/spicy meals compared to the office average of ${officeAverage}.`,
        })
    );

    const volumeRank = computeRanking(
        "volume",
        "Table Regular Ranking",
        "meals",
        officeAverages.averageMealsSelected,
        (p) => p.totalMealsSelected,
        (p) => p.parsedMetrics.uniqueMeals,
        ({ rank, total, value, officeAverage }) => ({
            title:
                rank === 1 && value > 0
                    ? `You never missed a plate — #1 in total meals ordered (${value})!`
                    : `${value} Plates Enjoyed in ${calendarYear}`,
            subtitle: `Ranked #${rank} of ${total} in total meals selected`,
            description: `You selected ${value} meals this year (${userMetrics.uniqueMeals} unique dishes, ${userMetrics.repeatedMeals} repeat favourites) compared to the office average of ${officeAverage}.`,
        })
    );

    const rankings: Record<RecapMetricKey, RecapRankingStat> = {
        loyalty: loyaltyRank,
        explorer: explorerRank,
        calories: caloriesRank,
        swallow: swallowRank,
        spice: spiceRank,
        volume: volumeRank,
    };

    const rankingList: RecapRankingStat[] = [
        loyaltyRank,
        explorerRank,
        caloriesRank,
        swallowRank,
        spiceRank,
        volumeRank,
    ];

    // ── 4. Top Meal Highlight (RecapTopMealHighlight) ────────────────────────
    let topMealHighlight: RecapTopMealHighlight | null = null;
    const favMeal: TopMealDetail | undefined = userMetrics.topMeals[0];

    if (favMeal) {
        const fansWithCounts = activePool
            .map((p) => {
                const match = p.parsedMetrics.topMeals.find((m) => m.id === favMeal.id);
                return match ? { userId: p.userId, count: match.count } : null;
            })
            .filter((x): x is { userId: number; count: number } => x !== null)
            .sort((a, b) => b.count - a.count || a.userId - b.userId);

        const fanIndex = fansWithCounts.findIndex((f) => f.userId === targetUserId);
        const officeFanRank = fanIndex >= 0 ? fanIndex + 1 : 1;
        const totalOfficeFans = Math.max(1, fansWithCounts.length);
        const shareOfYearPercentage =
            userProfile.totalMealsSelected > 0
                ? Math.round((favMeal.count / userProfile.totalMealsSelected) * 100)
                : 0;

        topMealHighlight = {
            ...favMeal,
            title: favMeal.name,
            subtitle:
                officeFanRank === 1
                    ? `You ordered ${favMeal.name} ${favMeal.count} times — you're its #1 fan in the office!`
                    : `You ordered ${favMeal.name} ${favMeal.count} times — #${officeFanRank} among ${totalOfficeFans} office fans!`,
            description: `It accounted for ${shareOfYearPercentage}% of all your meals in ${calendarYear}.`,
            rank: officeFanRank,
            totalParticipants: totalOfficeFans,
            shareOfYearPercentage,
        };
    }

    // ── 5. Office Taste Twin (RecapTasteTwin) ────────────────────────────────
    let tasteTwin: RecapTasteTwin | null = null;
    const otherPeers = activePool.filter(
        (p) => p.userId !== targetUserId && p.totalMealsSelected > 0
    );

    if (otherPeers.length > 0 && userProfile.totalMealsSelected > 0) {
        const userMealFreq: Record<string, number> = {};
        for (const m of userMetrics.topMeals) {
            userMealFreq[String(m.id)] = m.count;
        }

        let bestPeer: (typeof otherPeers)[number] | null = null;
        let bestScore = -1;
        let bestSharedMeal: string | null = null;

        for (const peer of otherPeers) {
            const peerMealFreq: Record<string, number> = {};
            for (const m of peer.parsedMetrics.topMeals) {
                peerMealFreq[String(m.id)] = m.count;
            }

            const mealSim = computeCosineSimilarity(userMealFreq, peerMealFreq);
            const proteinSim = computeCosineSimilarity(userMetrics.proteins, peer.parsedMetrics.proteins);
            const baseSim = computeCosineSimilarity(userMetrics.bases, peer.parsedMetrics.bases);
            const personalityBonus = peer.resolvedPersonality === userPersonality ? 1 : 0;

            const weighted = 0.40 * mealSim + 0.30 * proteinSim + 0.20 * baseSim + 0.10 * personalityBonus;

            if (weighted > bestScore) {
                bestScore = weighted;
                bestPeer = peer;
                const sharedMeal = userMetrics.topMeals.find((um) =>
                    peer.parsedMetrics.topMeals.some((pm) => pm.id === um.id)
                );
                bestSharedMeal = sharedMeal?.name ?? null;
            }
        }

        if (bestPeer) {
            const similarityScore = Math.min(99, Math.max(15, Math.round(bestScore * 100)));
            const peerName = bestPeer.user?.name ?? `User #${bestPeer.userId}`;
            const sharedFavoriteProtein =
                userProfile.favoriteProtein && userProfile.favoriteProtein === bestPeer.favoriteProtein
                    ? userProfile.favoriteProtein
                    : null;

            tasteTwin = {
                userId: bestPeer.userId,
                name: peerName,
                similarityScore,
                personalityType: bestPeer.resolvedPersonality,
                sharedTopMeal: bestSharedMeal,
                sharedFavoriteProtein,
                title: `Your Office Taste Twin is ${peerName}`,
                subtitle: `${similarityScore}% palate similarity${bestSharedMeal ? ` · You both love ${bestSharedMeal}` : ""}`,
                description: `Matched across your top meals, protein picks, and lunch habits.`,
                rank: 1,
                totalParticipants,
            };
        }
    }

    const favoriteProtein = userProfile.favoriteProtein ?? getTopKey(userMetrics.proteins);
    const favoriteCombination = getTopKey(userMetrics.combinations);

    // ── 6. Standardized Story Slides (RecapSlideCard[]) ──────────────────────
    const cards: RecapSlideCard[] = [
        {
            id: "slide-overview",
            category: "OVERVIEW",
            slideOrder: 1,
            title: volumeRank.title,
            subtitle: volumeRank.subtitle,
            description: volumeRank.description,
            value: volumeRank.value,
            unit: volumeRank.unit,
            rank: volumeRank.rank,
            totalParticipants: volumeRank.totalParticipants,
            percentile: volumeRank.percentile,
            officeAverage: volumeRank.officeAverage,
            metadata: {
                uniqueMeals: userMetrics.uniqueMeals,
                repeatedMeals: userMetrics.repeatedMeals,
            },
        },
        {
            id: "slide-personality",
            category: "PERSONALITY",
            slideOrder: 2,
            title: personality.title,
            subtitle: personality.subtitle,
            description: personality.description,
            value: personality.name,
            unit: "personality",
            rank: null,
            totalParticipants: personality.totalParticipants,
            percentile: personality.cohortPercentage,
            officeAverage: null,
            metadata: {
                personalityType: personality.type,
                cohortCount: personality.cohortCount,
                cohortPercentage: personality.cohortPercentage,
                personalityBreakdown,
            },
        },
        {
            id: "slide-top-meal",
            category: "TOP_MEAL",
            slideOrder: 3,
            title: topMealHighlight ? topMealHighlight.title : "No Top Meal Yet",
            subtitle: topMealHighlight ? topMealHighlight.subtitle : "Select meals to unlock your #1 dish",
            description: topMealHighlight
                ? topMealHighlight.description
                : "Your top 5 meals will appear here once you start ordering.",
            value: topMealHighlight ? topMealHighlight.count : 0,
            unit: "orders",
            rank: topMealHighlight?.rank ?? null,
            totalParticipants: topMealHighlight?.totalParticipants ?? totalParticipants,
            percentile: null,
            officeAverage: null,
            metadata: {
                topMeal: topMealHighlight,
                topMeals: userMetrics.topMeals,
            },
        },
        {
            id: "slide-loyalty",
            category: "LOYALTY",
            slideOrder: 4,
            title: loyaltyRank.title,
            subtitle: loyaltyRank.subtitle,
            description: loyaltyRank.description,
            value: loyaltyRank.value,
            unit: loyaltyRank.unit,
            rank: loyaltyRank.rank,
            totalParticipants: loyaltyRank.totalParticipants,
            percentile: loyaltyRank.percentile,
            officeAverage: loyaltyRank.officeAverage,
            metadata: {
                repeatedMeals: userMetrics.repeatedMeals,
                consistencyScore: userMetrics.consistencyScore,
            },
        },
        {
            id: "slide-explorer",
            category: "EXPLORER",
            slideOrder: 5,
            title: explorerRank.title,
            subtitle: explorerRank.subtitle,
            description: explorerRank.description,
            value: explorerRank.value,
            unit: explorerRank.unit,
            rank: explorerRank.rank,
            totalParticipants: explorerRank.totalParticipants,
            percentile: explorerRank.percentile,
            officeAverage: explorerRank.officeAverage,
            metadata: {
                uniqueMeals: userMetrics.uniqueMeals,
                diversityScore: userMetrics.diversityScore,
            },
        },
        {
            id: "slide-calories",
            category: "CALORIES",
            slideOrder: 6,
            title: caloriesRank.title,
            subtitle: caloriesRank.subtitle,
            description: caloriesRank.description,
            value: caloriesRank.value,
            unit: caloriesRank.unit,
            rank: caloriesRank.rank,
            totalParticipants: caloriesRank.totalParticipants,
            percentile: caloriesRank.percentile,
            officeAverage: caloriesRank.officeAverage,
            metadata: {
                totalCalories: userMetrics.totalCalories,
                averageCalories: userMetrics.averageCalories,
                officeAverageCaloriesPerMeal: officeAverages.averageCaloriesPerMeal,
            },
        },
        {
            id: "slide-swallow",
            category: "SWALLOW",
            slideOrder: 7,
            title: swallowRank.title,
            subtitle: swallowRank.subtitle,
            description: swallowRank.description,
            value: swallowRank.value,
            unit: swallowRank.unit,
            rank: swallowRank.rank,
            totalParticipants: swallowRank.totalParticipants,
            percentile: swallowRank.percentile,
            officeAverage: swallowRank.officeAverage,
            metadata: {
                swallowCount: userMetrics.swallowCount ?? 0,
                swallowRatio: userMetrics.swallowRatio ?? 0,
            },
        },
        {
            id: "slide-spice",
            category: "SPICE",
            slideOrder: 8,
            title: spiceRank.title,
            subtitle: spiceRank.subtitle,
            description: spiceRank.description,
            value: spiceRank.value,
            unit: spiceRank.unit,
            rank: spiceRank.rank,
            totalParticipants: spiceRank.totalParticipants,
            percentile: spiceRank.percentile,
            officeAverage: spiceRank.officeAverage,
        },
        {
            id: "slide-taste-twin",
            category: "TASTE_TWIN",
            slideOrder: 9,
            title: tasteTwin ? tasteTwin.title : "One of a Kind Palate",
            subtitle: tasteTwin
                ? tasteTwin.subtitle
                : "Nobody in the office matched your exact meal pattern this year!",
            description: tasteTwin
                ? tasteTwin.description
                : "Your combination of meals and proteins stood in a league of its own.",
            value: tasteTwin ? tasteTwin.similarityScore : 100,
            unit: "%",
            rank: tasteTwin?.rank ?? null,
            totalParticipants,
            percentile: tasteTwin?.similarityScore ?? null,
            officeAverage: null,
            metadata: {
                tasteTwin,
                favoriteProtein,
                favoriteCombination,
            },
        },
    ];

    return {
        userId: targetUserId,
        userName: userProfile.user?.name ?? fallbackUserName,
        calendarYear,
        updatedAt: userProfile.updatedAt,
        totalMealsSelected: userProfile.totalMealsSelected,
        favoriteProtein,
        favoriteCombination,
        personality,
        topMealHighlight,
        topMeals: userMetrics.topMeals,
        rankings,
        rankingList,
        tasteTwin,
        officeAverages,
        metrics: userMetrics,
        cards,
    };
}
