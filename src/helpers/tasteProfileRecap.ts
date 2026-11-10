import { TastePersonality, tastePersonalities } from "../enums/EPersonalities";
import {
    RecapCardCategory,
    RecapContrarianHighlight,
    RecapMetricKey,
    RecapOfficeAverages,
    RecapOfficeCrown,
    RecapPersonalityCohortItem,
    RecapPersonalitySummary,
    RecapProteinChampion,
    RecapRankingStat,
    RecapSlideCard,
    RecapTasteOpposite,
    RecapTasteTwin,
    RecapTopMealHighlight,
    TasteProfileRecapResponse,
} from "../schema/tasteProfile";
import {
    SPICE_MODIFIER,
    SWALLOW_SUPERGROUP,
    StoredTasteProfileMetrics,
    TopMealDetail,
    tasteProfileHelper,
} from "./tasteProfileMetrics";

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

interface ParsedProfileRow extends RawTasteProfileRow {
    parsedMetrics: StoredTasteProfileMetrics;
    resolvedPersonality: TastePersonality;
}

interface OfficeMealAggregate {
    id: number;
    name: string;
    foodCode: string;
    imageUrl: string | null;
    totalOrders: number;
    fanCounts: Map<number, number>;
}

interface CachedOfficeYearData {
    signature: string;
    activePool: ParsedProfileRow[];
    profileByUserId: Map<number, ParsedProfileRow>;
    officeAverages: RecapOfficeAverages;
    officeMealStats: Map<number, OfficeMealAggregate>;
    officeCrownMeal: OfficeMealAggregate | null;
}

const officeRecapCache = new Map<number, CachedOfficeYearData>();

const TWIN_WEIGHT_MEALS = 0.40;
const TWIN_WEIGHT_PROTEINS = 0.30;
const TWIN_WEIGHT_BASES = 0.20;
const TWIN_WEIGHT_PERSONALITY = 0.10;
const TWIN_MIN_SIMILARITY_PERCENT = 30;
const OPPOSITE_MAX_SIMILARITY_PERCENT = 25;

const DEFAULT_PROTEIN_NAMES: Record<string, string> = {
    CK: "Chicken",
    BF: "Beef",
    FS: "Fish",
    GT: "Goat",
    TK: "Turkey",
    EG: "Egg",
    PK: "Pork",
    SH: "Shrimp",
    PR: "Prawn",
    MT: "Mutton",
    LB: "Lamb",
    SN: "Snail",
    GC: "Gizzard",
    CB: "Crab",
    SL: "Salmon",
    TN: "Tuna",
    TL: "Tilapia",
    CF: "Catfish",
    MC: "Mackerel",
    SC: "Sausage",
    TO: "Tofu",
    BN: "Beans",
};

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
    diversityScore: 0,
    consistencyScore: 0,
    uniqueMealIds: [],
    topMeals: [],
    swallowCount: 0,
    swallowRatio: 0,
};

function resolvePersonality(rawType: string | null | undefined): TastePersonality {
    if (rawType && Object.prototype.hasOwnProperty.call(tastePersonalities, rawType)) {
        return rawType as TastePersonality;
    }
    return "BALANCED";
}

function resolveProteinName(code: string, proteinNameMap?: Map<string, string>): string {
    const normalized = code.trim().toUpperCase();
    return (
        proteinNameMap?.get(normalized) ??
        DEFAULT_PROTEIN_NAMES[normalized] ??
        normalized
    );
}

function parseMetrics(raw: unknown): StoredTasteProfileMetrics {
    if (!raw || typeof raw !== "object") {
        return { ...EMPTY_METRICS };
    }
    const obj = raw as Partial<StoredTasteProfileMetrics>;
    const rawTopMeals = Array.isArray(obj.topMeals) ? obj.topMeals : [];
    const topMeals: TopMealDetail[] = rawTopMeals.map((tm: any) => ({
        id: Number(tm.id),
        name: String(tm.name ?? `Meal #${tm.id}`),
        foodCode: String(tm.foodCode ?? ""),
        count: Number(tm.count ?? 0),
        imageUrl: tm.imageUrl ?? null,
    }));

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
        diversityScore: obj.diversityScore ?? 0,
        consistencyScore: obj.consistencyScore ?? 0,
        uniqueMealIds: Array.isArray(obj.uniqueMealIds) ? obj.uniqueMealIds : [],
        topMeals,
        swallowCount: obj.swallowCount ?? obj.supergroups?.[SWALLOW_SUPERGROUP] ?? 0,
        swallowRatio: obj.swallowRatio ?? 0,
    };
}

function hydrateTopMealsWithImages(
    topMeals: TopMealDetail[],
    mealImageMap?: Map<number, string | null>
): TopMealDetail[] {
    if (!mealImageMap || mealImageMap.size === 0) return topMeals;
    return topMeals.map((tm) => ({
        ...tm,
        imageUrl: tm.imageUrl ?? mealImageMap.get(tm.id) ?? null,
    }));
}

function getPeerMealFrequencyMap(metrics: StoredTasteProfileMetrics): Record<string, number> {
    const freq: Record<string, number> = {};
    for (const [key, count] of Object.entries(metrics.meals)) {
        if (/^\d+$/.test(key) && count > 0) {
            freq[key] = count;
        }
    }
    for (const tm of metrics.topMeals) {
        const key = String(tm.id);
        if (!freq[key] && tm.count > 0) {
            freq[key] = tm.count;
        }
    }
    return freq;
}

function getPeerMealOrderCount(metrics: StoredTasteProfileMetrics, mealId: number): number {
    const key = String(mealId);
    const fromMealsMap = metrics.meals[key];
    if (typeof fromMealsMap === "number" && fromMealsMap > 0) {
        return fromMealsMap;
    }
    const fromTopMeals = metrics.topMeals.find((m) => m.id === mealId)?.count;
    if (typeof fromTopMeals === "number" && fromTopMeals > 0) {
        return fromTopMeals;
    }
    if (metrics.uniqueMealIds.includes(mealId)) {
        return 1;
    }
    return 0;
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

function buildCacheSignature(calendarYear: number, allProfiles: RawTasteProfileRow[]): string {
    let maxUpdated = 0;
    let sumMeals = 0;
    for (const row of allProfiles) {
        const ts = row.updatedAt ? new Date(row.updatedAt).getTime() : 0;
        if (ts > maxUpdated) maxUpdated = ts;
        sumMeals += row.totalMealsSelected;
    }
    return `${calendarYear}:${allProfiles.length}:${maxUpdated}:${sumMeals}`;
}

function getOrBuildOfficeYearData(
    calendarYear: number,
    allProfiles: RawTasteProfileRow[]
): CachedOfficeYearData {
    const signature = buildCacheSignature(calendarYear, allProfiles);
    const cached = officeRecapCache.get(calendarYear);
    if (cached && cached.signature === signature) {
        return cached;
    }

    const profileByUserId = new Map<number, ParsedProfileRow>();
    const activePool: ParsedProfileRow[] = [];

    for (const row of allProfiles) {
        const parsed: ParsedProfileRow = {
            ...row,
            parsedMetrics: parseMetrics(row.metrics),
            resolvedPersonality: resolvePersonality(row.personalityType),
        };
        profileByUserId.set(row.userId, parsed);
        if (parsed.totalMealsSelected > 0) {
            activePool.push(parsed);
        }
    }

    const totalParticipants = activePool.length;
    const denominator = Math.max(1, totalParticipants);

    const personalityBreakdown: Record<string, number> = {};
    let sumMeals = 0;
    let sumUnique = 0;
    let sumConsistency = 0;
    let sumDiversity = 0;
    let sumSwallow = 0;
    let sumSpice = 0;

    const mealDetailsCatalog = new Map<number, { name: string; foodCode: string; imageUrl: string | null }>();
    for (const p of activePool) {
        personalityBreakdown[p.resolvedPersonality] =
            (personalityBreakdown[p.resolvedPersonality] ?? 0) + 1;
        sumMeals += p.totalMealsSelected;
        sumUnique += p.parsedMetrics.uniqueMeals;
        sumConsistency += p.parsedMetrics.consistencyScore;
        sumDiversity += p.parsedMetrics.diversityScore;
        sumSwallow += p.parsedMetrics.swallowCount ?? 0;
        sumSpice += p.parsedMetrics.modifiers?.[SPICE_MODIFIER] ?? 0;

        for (const tm of p.parsedMetrics.topMeals) {
            const existing = mealDetailsCatalog.get(tm.id);
            if (!existing) {
                mealDetailsCatalog.set(tm.id, {
                    name: tm.name,
                    foodCode: tm.foodCode,
                    imageUrl: tm.imageUrl ?? null,
                });
            } else if (!existing.imageUrl && tm.imageUrl) {
                existing.imageUrl = tm.imageUrl;
            }
        }
    }

    const officeMealStats = new Map<number, OfficeMealAggregate>();
    for (const [mealId, meta] of mealDetailsCatalog.entries()) {
        const fanCounts = new Map<number, number>();
        let totalOrders = 0;
        for (const peer of activePool) {
            const count = getPeerMealOrderCount(peer.parsedMetrics, mealId);
            if (count > 0) {
                fanCounts.set(peer.userId, count);
                totalOrders += count;
            }
        }
        if (totalOrders > 0) {
            officeMealStats.set(mealId, {
                id: mealId,
                name: meta.name,
                foodCode: meta.foodCode,
                imageUrl: meta.imageUrl,
                totalOrders,
                fanCounts,
            });
        }
    }

    let officeCrownMeal: OfficeMealAggregate | null = null;
    for (const stat of officeMealStats.values()) {
        if (
            !officeCrownMeal ||
            stat.totalOrders > officeCrownMeal.totalOrders ||
            (stat.totalOrders === officeCrownMeal.totalOrders &&
                stat.fanCounts.size > officeCrownMeal.fanCounts.size) ||
            (stat.totalOrders === officeCrownMeal.totalOrders &&
                stat.fanCounts.size === officeCrownMeal.fanCounts.size &&
                stat.id < officeCrownMeal.id)
        ) {
            officeCrownMeal = stat;
        }
    }

    const officeAverages: RecapOfficeAverages = {
        totalParticipants,
        averageMealsSelected: totalParticipants > 0 ? Math.round(sumMeals / denominator) : 0,
        averageUniqueMeals: totalParticipants > 0 ? Math.round(sumUnique / denominator) : 0,
        averageConsistencyScore: totalParticipants > 0 ? Math.round(sumConsistency / denominator) : 0,
        averageDiversityScore: totalParticipants > 0 ? Math.round(sumDiversity / denominator) : 0,
        averageSwallowCount: totalParticipants > 0 ? Math.round(sumSwallow / denominator) : 0,
        averageSpiceCount: totalParticipants > 0 ? Math.round(sumSpice / denominator) : 0,
        personalityBreakdown,
    };

    const yearData: CachedOfficeYearData = {
        signature,
        activePool,
        profileByUserId,
        officeAverages,
        officeMealStats,
        officeCrownMeal,
    };

    officeRecapCache.set(calendarYear, yearData);
    return yearData;
}

interface RankingDefinition {
    key: RecapMetricKey;
    label: string;
    unit: string;
    officeAverage: number;
    scoreExtractor: (p: ParsedProfileRow) => number;
    copyBuilder: (ctx: {
        rank: number;
        total: number;
        value: number;
        officeAverage: number;
    }) => { title: string; subtitle: string; description: string };
}

type UnorderedSlideCard<TMetadata = Record<string, unknown>> = Omit<
    RecapSlideCard<TMetadata>,
    "slideOrder"
>;

function rankingToCard<TMetadata = Record<string, unknown>>(
    stat: RecapRankingStat,
    id: string,
    category: RecapCardCategory,
    metadata?: TMetadata
): UnorderedSlideCard<TMetadata> {
    return {
        id,
        category,
        title: stat.title,
        subtitle: stat.subtitle,
        description: stat.description,
        value: stat.value,
        unit: stat.unit,
        rank: stat.rank,
        totalParticipants: stat.totalParticipants,
        percentile: stat.percentile,
        officeAverage: stat.officeAverage,
        ...(metadata !== undefined ? { metadata } : {}),
    };
}

export function buildTasteProfileRecap(
    targetUserId: number,
    calendarYear: number,
    allProfiles: RawTasteProfileRow[],
    fallbackUserName: string | null = null,
    mealImageMap?: Map<number, string | null>,
    proteinNameMap?: Map<string, string>
): TasteProfileRecapResponse {
    const {
        activePool,
        profileByUserId,
        officeAverages,
        officeMealStats,
        officeCrownMeal,
    } = getOrBuildOfficeYearData(calendarYear, allProfiles);

    const existingUserProfile = profileByUserId.get(targetUserId);

    // ── Early Exit: User has 0 selected meals ────────────────────────────────
    if (!existingUserProfile || existingUserProfile.totalMealsSelected === 0) {
        return {
            message: "No meals selected",
            userId: targetUserId,
            userName: existingUserProfile?.user?.name ?? fallbackUserName,
            calendarYear,
            updatedAt: existingUserProfile?.updatedAt ?? new Date(),
            totalMealsSelected: 0,
            favoriteProtein: null,
            favoriteCombination: null,
            personality: null,
            topMealHighlight: null,
            officeCrown: null,
            proteinChampion: null,
            contrarian: null,
            topMeals: [],
            rankings: null,
            rankingList: [],
            tasteTwin: null,
            tasteOpposite: null,
            officeAverages,
            metrics: { ...EMPTY_METRICS },
            cards: [],
        };
    }

    const topMealsWithImages = hydrateTopMealsWithImages(
        existingUserProfile.parsedMetrics.topMeals,
        mealImageMap
    );
    const userMetrics: StoredTasteProfileMetrics = {
        ...existingUserProfile.parsedMetrics,
        topMeals: topMealsWithImages,
    };
    const userProfile: ParsedProfileRow = {
        ...existingUserProfile,
        parsedMetrics: userMetrics,
    };

    const totalParticipants = Math.max(1, activePool.length);
    const userPersonality = userProfile.resolvedPersonality;
    const personalityMeta = tastePersonalities[userPersonality] ?? tastePersonalities.BALANCED;
    const { personalityBreakdown } = officeAverages;

    // ── 1. Personality Cohort Summary ("You are 1 of 6 Explorers") ───────────
    const cohortCount = personalityBreakdown[userPersonality] ?? 1;
    const cohortPercentage = Math.round((cohortCount / totalParticipants) * 100);

    const personality: RecapPersonalitySummary = {
        type: userPersonality,
        name: personalityMeta.name,
        title: `You are ${/^[aeiou]/i.test(personalityMeta.name) ? "an" : "a"} ${personalityMeta.name}`,
        subtitle:
            cohortCount === 1
                ? `You are the only ${personalityMeta.name} in the office this year!`
                : `You are 1 of ${cohortCount} ${personalityMeta.pluralName} in the office (${cohortPercentage}% of the team)`,
        description: personalityMeta.description,
        rank: null,
        totalParticipants,
        cohortCount,
        cohortPercentage,
    };

    // ── 2. O(N) Competition Rankings ─────────────────────────────────────────
    function computeRanking(def: RankingDefinition): RecapRankingStat {
        const value = def.scoreExtractor(userProfile);
        let strictlyBetterCount = 0;
        for (const peer of activePool) {
            if (def.scoreExtractor(peer) > value) {
                strictlyBetterCount++;
            }
        }
        const rank = 1 + strictlyBetterCount;
        const topPercent = Math.max(1, Math.ceil((rank / totalParticipants) * 100));
        const beatsPercentage =
            totalParticipants > 1
                ? Math.round(((totalParticipants - rank) / (totalParticipants - 1)) * 100)
                : 100;

        const { title, subtitle, description } = def.copyBuilder({
            rank,
            total: totalParticipants,
            value,
            officeAverage: def.officeAverage,
        });

        return {
            key: def.key,
            label: def.label,
            title,
            subtitle,
            description,
            rank,
            totalParticipants,
            value,
            unit: def.unit,
            percentile: topPercent,
            topPercent,
            beatsPercentage,
            officeAverage: def.officeAverage,
        };
    }

    const loyaltyRank = computeRanking({
        key: "loyalty",
        label: "Loyalty Ranking",
        unit: "%",
        officeAverage: officeAverages.averageConsistencyScore,
        scoreExtractor: (p) => p.parsedMetrics.consistencyScore,
        copyBuilder: ({ rank, total, value, officeAverage }) => ({
            title:
                rank === 1 && value > 0
                    ? "You are the #1 most loyal eater in the office!"
                    : `Ranked #${rank} in Meal Loyalty`,
            subtitle: `Loyalty Rank #${rank} of ${total} (${value}% consistency)`,
            description: `${value}% of your selections (${userMetrics.repeatedMeals} plates) were repeat favourites vs. the office average of ${officeAverage}%.`,
        }),
    });

    const explorerRank = computeRanking({
        key: "explorer",
        label: "Explorer Ranking",
        unit: "unique meals",
        officeAverage: officeAverages.averageUniqueMeals,
        scoreExtractor: (p) => p.parsedMetrics.uniqueMeals,
        copyBuilder: ({ rank, total, value, officeAverage }) => ({
            title:
                rank === 1 && value > 0
                    ? `You are the #1 menu explorer with ${value} unique dishes tried!`
                    : `Ranked #${rank} on the Explorer Leaderboard`,
            subtitle: `Explorer Rank #${rank} of ${total} (${userMetrics.diversityScore}% diversity score)`,
            description: `You sampled ${value} distinct meals across the menu compared to the office average of ${officeAverage}.`,
        }),
    });

    const swallowRank = computeRanking({
        key: "swallow",
        label: "Swallow Heavyweight Ranking",
        unit: "meals",
        officeAverage: officeAverages.averageSwallowCount,
        scoreExtractor: (p) => p.parsedMetrics.swallowCount ?? 0,
        copyBuilder: ({ rank, total, value, officeAverage }) => ({
            title:
                rank === 1 && value > 0
                    ? `You are the #1 Swallow Heavyweight with ${value} swallow meals!`
                    : `Ranked #${rank} in Swallow Consumption`,
            subtitle: `Swallow Rank #${rank} of ${total} (${Math.round((userMetrics.swallowRatio ?? 0) * 100)}% of your meals)`,
            description: `You ordered ${value} swallow meals this year compared to the office average of ${officeAverage}.`,
        }),
    });

    const spiceRank = computeRanking({
        key: "spice",
        label: "Spice Chaser Ranking",
        unit: "spicy meals",
        officeAverage: officeAverages.averageSpiceCount,
        scoreExtractor: (p) => p.parsedMetrics.modifiers?.[SPICE_MODIFIER] ?? 0,
        copyBuilder: ({ rank, total, value, officeAverage }) => ({
            title:
                rank === 1 && value > 0
                    ? `You are the #1 Spice Chaser in the office with ${value} peppered meals!`
                    : `Ranked #${rank} on the Spice Meter`,
            subtitle: `Spice Rank #${rank} of ${total}`,
            description: `You selected ${value} peppered/spicy meals compared to the office average of ${officeAverage}.`,
        }),
    });

    const volumeRank = computeRanking({
        key: "volume",
        label: "Table Regular Ranking",
        unit: "meals",
        officeAverage: officeAverages.averageMealsSelected,
        scoreExtractor: (p) => p.totalMealsSelected,
        copyBuilder: ({ rank, total, value, officeAverage }) => ({
            title:
                rank === 1 && value > 0
                    ? `You never missed a plate — #1 in total meals ordered (${value})!`
                    : `${value} Plates Enjoyed in ${calendarYear}`,
            subtitle: `Ranked #${rank} of ${total} in total meals selected`,
            description: `You selected ${value} meals this year (${userMetrics.uniqueMeals} unique dishes, ${userMetrics.repeatedMeals} repeat favourites) compared to the office average of ${officeAverage}.`,
        }),
    });

    const rankings: Record<RecapMetricKey, RecapRankingStat> = {
        loyalty: loyaltyRank,
        explorer: explorerRank,
        swallow: swallowRank,
        spice: spiceRank,
        volume: volumeRank,
    };

    const rankingList: RecapRankingStat[] = Object.values(rankings);

    // ── 3. Top Meal Highlight (RecapTopMealHighlight) ────────────────────────
    let topMealHighlight: RecapTopMealHighlight | null = null;
    const favMeal: TopMealDetail | undefined = userMetrics.topMeals[0];

    if (favMeal && favMeal.count > 0) {
        const mealStat = officeMealStats.get(favMeal.id);
        let strictlyBetterFans = 0;
        let totalOfficeFans = 1;

        if (mealStat) {
            totalOfficeFans = Math.max(1, mealStat.fanCounts.size);
            for (const count of mealStat.fanCounts.values()) {
                if (count > favMeal.count) {
                    strictlyBetterFans++;
                }
            }
        }

        const officeFanRank = 1 + strictlyBetterFans;
        const shareOfYearPercentage = Math.round(
            (favMeal.count / userProfile.totalMealsSelected) * 100
        );

        topMealHighlight = {
            ...favMeal,
            title: favMeal.name,
            subtitle:
                officeFanRank === 1 && totalOfficeFans > 1
                    ? `You ordered ${favMeal.name} ${favMeal.count} times — you're its #1 fan among ${totalOfficeFans} office lovers!`
                    : officeFanRank === 1
                    ? `You ordered ${favMeal.name} ${favMeal.count} times — you're its #1 fan in the office!`
                    : `You ordered ${favMeal.name} ${favMeal.count} times — #${officeFanRank} among ${totalOfficeFans} office fans!`,
            description: `It accounted for ${shareOfYearPercentage}% of all your meals in ${calendarYear}.`,
            rank: officeFanRank,
            totalParticipants: totalOfficeFans,
            shareOfYearPercentage,
        };
    }

    // ── 4. Office Crown (#1 Most Popular Dish in the Office) ─────────────────
    let officeCrown: RecapOfficeCrown | null = null;
    if (officeCrownMeal) {
        const userOrderCount = getPeerMealOrderCount(userMetrics, officeCrownMeal.id);
        const isUserTopMeal = favMeal?.id === officeCrownMeal.id;
        const totalOfficeFans = officeCrownMeal.fanCounts.size;
        const totalOfficeOrders = officeCrownMeal.totalOrders;
        const crownImageUrl =
            officeCrownMeal.imageUrl ?? mealImageMap?.get(officeCrownMeal.id) ?? null;

        let strictlyBetterCrownFans = 0;
        if (userOrderCount > 0) {
            for (const count of officeCrownMeal.fanCounts.values()) {
                if (count > userOrderCount) {
                    strictlyBetterCrownFans++;
                }
            }
        }
        const userCrownRank = userOrderCount > 0 ? 1 + strictlyBetterCrownFans : null;

        let title: string;
        let subtitle: string;
        let description: string;

        if (isUserTopMeal) {
            title = `${officeCrownMeal.name} Took the Office Crown — And Yours!`;
            subtitle = `#1 dish in the office (${totalOfficeOrders} plates across ${totalOfficeFans} colleagues)`;
            description = `Your #1 favourite was also the office's undisputed champion — you ordered ${userOrderCount} of those plates!`;
        } else if (userOrderCount > 0) {
            title = `The Office Crown: ${officeCrownMeal.name}`;
            subtitle = `#1 most ordered dish in the office (${totalOfficeOrders} plates across ${totalOfficeFans} colleagues)`;
            description = `You joined the ${officeCrownMeal.name} wave ${userOrderCount} ${
                userOrderCount === 1 ? "time" : "times"
            } this year, while ${favMeal?.name ?? "another dish"} stayed your personal #1.`;
        } else {
            title = `You Dodged the Office Obsession: ${officeCrownMeal.name}`;
            subtitle = `The office ordered it ${totalOfficeOrders} times (${totalOfficeFans} fans) — you ordered it 0 times!`;
            description = `While ${officeCrownMeal.name} ruled the office tables in ${calendarYear}, you charted your own path.`;
        }

        officeCrown = {
            id: officeCrownMeal.id,
            name: officeCrownMeal.name,
            foodCode: officeCrownMeal.foodCode,
            count: totalOfficeOrders,
            imageUrl: crownImageUrl,
            totalOfficeOrders,
            totalOfficeFans,
            userOrderCount,
            isUserTopMeal,
            title,
            subtitle,
            description,
            rank: userCrownRank,
            totalParticipants: totalOfficeFans,
        };
    }

    // ── 5. Protein Champion (User's Top Protein + Office Rank) ───────────────
    const topProteinEntry = tasteProfileHelper.findFavoriteEntry(userMetrics.proteins);
    const favoriteProtein =
        userProfile.favoriteProtein ?? topProteinEntry?.[0] ?? null;
    const favoriteCombination =
        tasteProfileHelper.findFavorite(userMetrics.combinations) ?? null;

    let proteinChampion: RecapProteinChampion | null = null;
    if (favoriteProtein) {
        const userProteinCount =
            userMetrics.proteins[favoriteProtein] ?? topProteinEntry?.[1] ?? 0;

        if (userProteinCount > 0) {
            const proteinName = resolveProteinName(favoriteProtein, proteinNameMap);
            let betterProteinPeers = 0;
            let sumProteinAcrossOffice = 0;

            for (const peer of activePool) {
                const peerCount = peer.parsedMetrics.proteins[favoriteProtein] ?? 0;
                sumProteinAcrossOffice += peerCount;
                if (peerCount > userProteinCount) {
                    betterProteinPeers++;
                }
            }

            const proteinRank = 1 + betterProteinPeers;
            const shareOfPlatesPercentage = Math.round(
                (userProteinCount / userProfile.totalMealsSelected) * 100
            );
            const officeAverageCount = Math.round(
                sumProteinAcrossOffice / totalParticipants
            );

            proteinChampion = {
                proteinCode: favoriteProtein,
                proteinName,
                userCount: userProteinCount,
                shareOfPlatesPercentage,
                officeAverageCount,
                title:
                    proteinRank === 1
                        ? `You are the #1 ${proteinName} Champion in the Office!`
                        : `${proteinName} Powered ${shareOfPlatesPercentage}% of Your Plates`,
                subtitle: `#${proteinRank} ${proteinName} lover in the office (${userProteinCount} plates)`,
                description: `You chose ${proteinName}-based meals ${userProteinCount} times this year compared to the office average of ${officeAverageCount}.`,
                rank: proteinRank,
                totalParticipants,
            };
        }
    }

    // ── 6. Contrarian / Hidden Gem Highlight ─────────────────────────────────
    let contrarian: RecapContrarianHighlight | null = null;
    if (totalParticipants >= 3 && userMetrics.topMeals.length > 0) {
        const maxContrarianFans = Math.max(2, Math.floor(totalParticipants * 0.25));
        const candidates = userMetrics.topMeals
            .filter((meal) => meal.count >= 2)
            .map((meal) => {
                const stat = officeMealStats.get(meal.id);
                const totalOfficeFans = stat ? stat.fanCounts.size : 1;
                const totalOfficeOrders = stat ? stat.totalOrders : meal.count;
                return {
                    meal,
                    totalOfficeFans,
                    totalOfficeOrders,
                };
            })
            .filter(
                (c) =>
                    c.totalOfficeFans <= maxContrarianFans &&
                    c.meal.id !== officeCrown?.id &&
                    // Avoid repeating the user's #1 meal unless they are literally 1 of <=2 fans in the office
                    (c.meal.id !== favMeal?.id || c.totalOfficeFans <= 2)
            )
            .sort(
                (a, b) =>
                    a.totalOfficeFans - b.totalOfficeFans ||
                    b.meal.count - a.meal.count ||
                    a.meal.id - b.meal.id
            );

        const winner = candidates[0];
        if (winner) {
            const { meal, totalOfficeFans, totalOfficeOrders } = winner;
            const otherFansCount = Math.max(0, totalOfficeFans - 1);

            contrarian = {
                ...meal,
                totalOfficeFans,
                totalOfficeOrders,
                title:
                    totalOfficeFans === 1
                        ? `Your Secret Menu Pick: ${meal.name}`
                        : `Hidden Gem: ${meal.name}`,
                subtitle:
                    totalOfficeFans === 1
                        ? `You were the ONLY person in the office to order ${meal.name} (${meal.count} times)!`
                        : `Only ${totalOfficeFans} people in the office appreciated ${meal.name} (${otherFansCount} other ${
                              otherFansCount === 1 ? "colleague" : "colleagues"
                          })`,
                description: `You ordered ${meal.name} ${meal.count} times while ${
                    totalParticipants - totalOfficeFans
                } of your colleagues slept on it.`,
                rank: 1,
                totalParticipants: totalOfficeFans,
            };
        }
    }

    // ── 7. Office Taste Twin & Taste Opposite ────────────────────────────────
    let tasteTwin: RecapTasteTwin | null = null;
    let tasteOpposite: RecapTasteOpposite | null = null;
    const otherPeers = activePool.filter((p) => p.userId !== targetUserId);

    if (otherPeers.length > 0) {
        const userMealFreq = getPeerMealFrequencyMap(userMetrics);
        const userMealIdSet = new Set(Object.keys(userMealFreq));

        let bestPeer: ParsedProfileRow | null = null;
        let bestScore = -1;
        let bestSharedCount = -1;
        let bestSharesProtein = false;
        let bestSharedMealName: string | null = null;

        let lowestPeer: ParsedProfileRow | null = null;
        let lowestScore = Infinity;
        let lowestSharedCount = Infinity;
        let lowestSharesProtein = true;

        for (const peer of otherPeers) {
            const peerMealFreq = getPeerMealFrequencyMap(peer.parsedMetrics);
            let sharedMealsCount = 0;
            for (const mId of Object.keys(peerMealFreq)) {
                if (userMealIdSet.has(mId)) {
                    sharedMealsCount++;
                }
            }

            const mealSim = computeCosineSimilarity(userMealFreq, peerMealFreq);
            const proteinSim = computeCosineSimilarity(
                userMetrics.proteins,
                peer.parsedMetrics.proteins
            );
            const baseSim = computeCosineSimilarity(
                userMetrics.bases,
                peer.parsedMetrics.bases
            );

            // Gate personality bonus on actual meal or protein overlap (A3-26)
            const hasPalateOverlap = mealSim > 0 || proteinSim > 0;
            const personalityBonus =
                hasPalateOverlap && peer.resolvedPersonality === userPersonality ? 1 : 0;

            const weighted =
                TWIN_WEIGHT_MEALS * mealSim +
                TWIN_WEIGHT_PROTEINS * proteinSim +
                TWIN_WEIGHT_BASES * baseSim +
                TWIN_WEIGHT_PERSONALITY * personalityBonus;

            const peerFavProtein =
                peer.favoriteProtein ??
                tasteProfileHelper.findFavorite(peer.parsedMetrics.proteins) ??
                null;
            const sharesFavProtein = Boolean(
                favoriteProtein && peerFavProtein && favoriteProtein === peerFavProtein
            );

            // Deterministic tie-breaker for Taste Twin (highest match)
            const isBetterTwin =
                weighted > bestScore + 1e-9 ||
                (Math.abs(weighted - bestScore) <= 1e-9 &&
                    (sharedMealsCount > bestSharedCount ||
                        (sharedMealsCount === bestSharedCount &&
                            sharesFavProtein &&
                            !bestSharesProtein) ||
                        (sharedMealsCount === bestSharedCount &&
                            sharesFavProtein === bestSharesProtein &&
                            (!bestPeer || peer.userId < bestPeer.userId))));

            if (isBetterTwin) {
                bestScore = weighted;
                bestPeer = peer;
                bestSharedCount = sharedMealsCount;
                bestSharesProtein = sharesFavProtein;
                const sharedMeal = userMetrics.topMeals.find(
                    (um) => getPeerMealOrderCount(peer.parsedMetrics, um.id) > 0
                );
                bestSharedMealName = sharedMeal?.name ?? null;
            }

            // Deterministic tie-breaker for Taste Opposite (lowest match)
            const isBetterOpposite =
                weighted < lowestScore - 1e-9 ||
                (Math.abs(weighted - lowestScore) <= 1e-9 &&
                    (sharedMealsCount < lowestSharedCount ||
                        (sharedMealsCount === lowestSharedCount &&
                            !sharesFavProtein &&
                            lowestSharesProtein) ||
                        (sharedMealsCount === lowestSharedCount &&
                            sharesFavProtein === lowestSharesProtein &&
                            (!lowestPeer || peer.userId < lowestPeer.userId))));

            if (isBetterOpposite) {
                lowestScore = weighted;
                lowestPeer = peer;
                lowestSharedCount = sharedMealsCount;
                lowestSharesProtein = sharesFavProtein;
            }
        }

        if (bestPeer) {
            const rawTwinScore = Math.min(99, Math.round(bestScore * 100));
            if (rawTwinScore >= TWIN_MIN_SIMILARITY_PERCENT) {
                const peerName = bestPeer.user?.name ?? `User #${bestPeer.userId}`;
                const peerFavProtein =
                    bestPeer.favoriteProtein ??
                    tasteProfileHelper.findFavorite(bestPeer.parsedMetrics.proteins) ??
                    null;
                const sharedFavoriteProtein =
                    favoriteProtein && favoriteProtein === peerFavProtein
                        ? resolveProteinName(favoriteProtein, proteinNameMap)
                        : null;

                tasteTwin = {
                    userId: bestPeer.userId,
                    name: peerName,
                    similarityScore: rawTwinScore,
                    personalityType: bestPeer.resolvedPersonality,
                    sharedTopMeal: bestSharedMealName,
                    sharedFavoriteProtein,
                    title: `Your Office Taste Twin is ${peerName}`,
                    subtitle: `${rawTwinScore}% palate similarity${
                        bestSharedMealName ? ` · You both love ${bestSharedMealName}` : ""
                    }`,
                    description: `Matched across your top meals, protein picks, and lunch habits.`,
                    rank: 1,
                    totalParticipants,
                };
            }
        }

        if (lowestPeer && lowestPeer.userId !== tasteTwin?.userId) {
            const rawOppositeScore = Math.max(0, Math.round(lowestScore * 100));
            if (rawOppositeScore <= OPPOSITE_MAX_SIMILARITY_PERCENT) {
                const peerName = lowestPeer.user?.name ?? `User #${lowestPeer.userId}`;
                const peerTopMeal = lowestPeer.parsedMetrics.topMeals[0]?.name ?? null;
                const peerProteinCode =
                    lowestPeer.favoriteProtein ??
                    tasteProfileHelper.findFavorite(lowestPeer.parsedMetrics.proteins) ??
                    null;
                const peerFavoriteProtein = peerProteinCode
                    ? resolveProteinName(peerProteinCode, proteinNameMap)
                    : null;
                const peerPersonalityMeta =
                    tastePersonalities[lowestPeer.resolvedPersonality] ??
                    tastePersonalities.BALANCED;

                tasteOpposite = {
                    userId: lowestPeer.userId,
                    name: peerName,
                    similarityScore: rawOppositeScore,
                    personalityType: lowestPeer.resolvedPersonality,
                    peerTopMeal,
                    peerFavoriteProtein,
                    title: `Your Palate Opposite is ${peerName}`,
                    subtitle:
                        rawOppositeScore === 0
                            ? `0% palate overlap${
                                  peerTopMeal ? ` · Their #1 was ${peerTopMeal}` : ""
                              }`
                            : `Only ${rawOppositeScore}% palate overlap${
                                  peerTopMeal ? ` · They swear by ${peerTopMeal}` : ""
                              }`,
                    description:
                        rawOppositeScore === 0
                            ? `You and ${peerName} barely shared a single meal or protein pattern all year!`
                            : `While you ate like ${
                                  /^[aeiou]/i.test(personalityMeta.name) ? "an" : "a"
                              } ${personalityMeta.name}, ${peerName} went full ${
                                  peerPersonalityMeta.name
                              }.`,
                    rank: null,
                    totalParticipants,
                };
            }
        }
    }

    // ── 8. Personality Map Cohort Distribution ───────────────────────────────
    const personalityDistribution: RecapPersonalityCohortItem[] = Object.entries(
        personalityBreakdown
    )
        .filter(([, count]) => count > 0)
        .map(([rawType, count]) => {
            const type = resolvePersonality(rawType);
            const meta = tastePersonalities[type];
            return {
                type,
                name: meta.name,
                pluralName: meta.pluralName,
                count,
                percentage: Math.round((count / totalParticipants) * 100),
                isUserCohort: type === userPersonality,
            };
        })
        .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));

    const dominantCohort = personalityDistribution[0];
    const userCohortRank =
        1 +
        personalityDistribution.filter((item) => item.count > cohortCount).length;

    // ── 9. Conditional Story Slides (filtered & dynamically ordered) ─────────
    const spiceCount = userMetrics.modifiers?.[SPICE_MODIFIER] ?? 0;
    const spiceRatio =
        userProfile.totalMealsSelected > 0
            ? Number((spiceCount / userProfile.totalMealsSelected).toFixed(2))
            : 0;
    const swallowCount = userMetrics.swallowCount ?? 0;

    const candidateCards: Array<UnorderedSlideCard | null> = [
        // 1. Overview (always shown for active users with >0 meals)
        rankingToCard(volumeRank, "slide-overview", "OVERVIEW", {
            uniqueMeals: userMetrics.uniqueMeals,
            repeatedMeals: userMetrics.repeatedMeals,
        }),

        // 2. User Personality
        {
            id: "slide-personality",
            category: "PERSONALITY",
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

        // 3. Office Personality Map (only when at least 2 distinct personalities exist in the office)
        totalParticipants >= 2 && personalityDistribution.length >= 2 && dominantCohort
            ? {
                  id: "slide-personality-map",
                  category: "PERSONALITY_MAP",
                  title: `The ${calendarYear} Office Palate Map`,
                  subtitle:
                      dominantCohort.type === userPersonality
                          ? `${dominantCohort.pluralName} lead the office (${dominantCohort.percentage}%) — and you're right at the heart of it!`
                          : `${dominantCohort.pluralName} lead the office (${dominantCohort.percentage}%), while your ${personalityMeta.name} crew makes up ${cohortPercentage}%`,
                  description: `Across ${totalParticipants} active colleagues, the office split into ${personalityDistribution.length} distinct taste personalities this year.`,
                  value: personalityDistribution.length,
                  unit: "personalities",
                  rank: userCohortRank,
                  totalParticipants,
                  percentile: cohortPercentage,
                  officeAverage: null,
                  metadata: {
                      userPersonality,
                      userPersonalityName: personality.name,
                      dominantPersonality: dominantCohort.type,
                      dominantPersonalityName: dominantCohort.name,
                      dominantCount: dominantCohort.count,
                      dominantPercentage: dominantCohort.percentage,
                      distribution: personalityDistribution,
                      personalityBreakdown,
                  },
              }
            : null,

        // 4. Top Meal (only when user has a top meal)
        topMealHighlight
            ? {
                  id: "slide-top-meal",
                  category: "TOP_MEAL",
                  title: topMealHighlight.title,
                  subtitle: topMealHighlight.subtitle,
                  description: topMealHighlight.description,
                  value: topMealHighlight.count,
                  unit: "orders",
                  rank: topMealHighlight.rank,
                  totalParticipants: topMealHighlight.totalParticipants,
                  percentile: null,
                  officeAverage: null,
                  metadata: {
                      topMeal: topMealHighlight,
                      topMeals: userMetrics.topMeals,
                  },
              }
            : null,

        // 5. Office Crown (only when the office crown is shared by >=2 fans or ordered by this user)
        officeCrown && (officeCrown.totalOfficeFans >= 2 || officeCrown.userOrderCount > 0)
            ? {
                  id: "slide-office-crown",
                  category: "OFFICE_CROWN",
                  title: officeCrown.title,
                  subtitle: officeCrown.subtitle,
                  description: officeCrown.description,
                  value: officeCrown.totalOfficeOrders,
                  unit: "office orders",
                  rank: officeCrown.rank,
                  totalParticipants: officeCrown.totalParticipants,
                  percentile: null,
                  officeAverage: null,
                  metadata: {
                      officeCrown,
                      userOrderCount: officeCrown.userOrderCount,
                      isUserTopMeal: officeCrown.isUserTopMeal,
                  },
              }
            : null,

        // 6. Protein Champion (only when user ordered their top protein >= 2 times and >= 20% of plates)
        proteinChampion &&
        proteinChampion.userCount >= 2 &&
        proteinChampion.shareOfPlatesPercentage >= 20
            ? {
                  id: "slide-protein-champion",
                  category: "PROTEIN_CHAMPION",
                  title: proteinChampion.title,
                  subtitle: proteinChampion.subtitle,
                  description: proteinChampion.description,
                  value: proteinChampion.proteinName,
                  unit: `${proteinChampion.shareOfPlatesPercentage}% of plates`,
                  rank: proteinChampion.rank,
                  totalParticipants: proteinChampion.totalParticipants,
                  percentile: Math.max(
                      1,
                      Math.ceil((proteinChampion.rank! / totalParticipants) * 100)
                  ),
                  officeAverage: proteinChampion.officeAverageCount,
                  metadata: {
                      proteinChampion,
                      proteins: userMetrics.proteins,
                  },
              }
            : null,

        // 7. Contrarian / Hidden Gem (only when user has a qualifying rare pick)
        contrarian
            ? {
                  id: "slide-contrarian",
                  category: "CONTRARIAN",
                  title: contrarian.title,
                  subtitle: contrarian.subtitle,
                  description: contrarian.description,
                  value: contrarian.count,
                  unit: "orders",
                  rank: contrarian.rank,
                  totalParticipants: contrarian.totalParticipants,
                  percentile: null,
                  officeAverage: null,
                  metadata: {
                      contrarian,
                  },
              }
            : null,

        // 8. Loyalty (only when user actually repeated meals)
        userMetrics.repeatedMeals > 0
            ? rankingToCard(loyaltyRank, "slide-loyalty", "LOYALTY", {
                  repeatedMeals: userMetrics.repeatedMeals,
                  consistencyScore: userMetrics.consistencyScore,
              })
            : null,

        // 9. Explorer (only when user tried >= 2 unique meals)
        userMetrics.uniqueMeals >= 2
            ? rankingToCard(explorerRank, "slide-explorer", "EXPLORER", {
                  uniqueMeals: userMetrics.uniqueMeals,
                  diversityScore: userMetrics.diversityScore,
              })
            : null,

        // 10. Swallow (only when user ordered at least 1 swallow meal)
        swallowCount > 0
            ? rankingToCard(swallowRank, "slide-swallow", "SWALLOW", {
                  swallowCount,
                  swallowRatio: userMetrics.swallowRatio ?? 0,
              })
            : null,

        // 11. Spice (only when user ordered at least 1 peppered/spicy meal)
        spiceCount > 0
            ? rankingToCard(spiceRank, "slide-spice", "SPICE", {
                  spiceCount,
                  spiceRatio,
              })
            : null,

        // 12. Taste Twin (only when similarityScore >= 30%)
        tasteTwin
            ? {
                  id: "slide-taste-twin",
                  category: "TASTE_TWIN",
                  title: tasteTwin.title,
                  subtitle: tasteTwin.subtitle,
                  description: tasteTwin.description,
                  value: tasteTwin.similarityScore,
                  unit: "%",
                  rank: tasteTwin.rank,
                  totalParticipants,
                  percentile: tasteTwin.similarityScore,
                  officeAverage: null,
                  metadata: {
                      tasteTwin,
                      favoriteProtein,
                      favoriteCombination,
                  },
              }
            : null,

        // 13. Taste Opposite (only when a true opposite <= 25% similarity exists)
        tasteOpposite
            ? {
                  id: "slide-taste-opposite",
                  category: "TASTE_OPPOSITE",
                  title: tasteOpposite.title,
                  subtitle: tasteOpposite.subtitle,
                  description: tasteOpposite.description,
                  value: tasteOpposite.similarityScore,
                  unit: "% overlap",
                  rank: null,
                  totalParticipants,
                  percentile: tasteOpposite.similarityScore,
                  officeAverage: null,
                  metadata: {
                      tasteOpposite,
                  },
              }
            : null,
    ];

    const cards: RecapSlideCard[] = candidateCards
        .filter((card): card is UnorderedSlideCard => card !== null)
        .map((card, index) => ({
            ...card,
            slideOrder: index + 1,
        }));

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
        officeCrown,
        proteinChampion,
        contrarian,
        topMeals: userMetrics.topMeals,
        rankings,
        rankingList,
        tasteTwin,
        tasteOpposite,
        officeAverages,
        metrics: userMetrics,
        cards,
    };
}
