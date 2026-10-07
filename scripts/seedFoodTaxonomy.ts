import "dotenv/config";
import { prisma } from "../src/db/prisma";
import { FoodGroup } from "../src/generated/prisma";
import { buildFoodCode, validateFoodCode } from "../src/helpers/foodCodeParser";

export interface TaxonomySeedItem {
    name: string;
    foodCode: string;
    foodGroup: FoodGroup;
}

export const TAXONOMY_DATA: TaxonomySeedItem[] = [
    // 1. SUPERGROUP (9 food families)
    { name: "Rice", foodCode: "R", foodGroup: FoodGroup.SUPERGROUP },
    { name: "Beans-Based", foodCode: "B", foodGroup: FoodGroup.SUPERGROUP },
    { name: "Swallow", foodCode: "S", foodGroup: FoodGroup.SUPERGROUP },
    { name: "Grain-Based", foodCode: "G", foodGroup: FoodGroup.SUPERGROUP },
    { name: "Plantain", foodCode: "P", foodGroup: FoodGroup.SUPERGROUP },
    { name: "Tuber", foodCode: "T", foodGroup: FoodGroup.SUPERGROUP },
    { name: "Noodles", foodCode: "N", foodGroup: FoodGroup.SUPERGROUP },
    { name: "Continental", foodCode: "X", foodGroup: FoodGroup.SUPERGROUP },
    { name: "Other", foodCode: "O", foodGroup: FoodGroup.SUPERGROUP },

    // 2. BASE (Foundation dishes)
    { name: "Jollof", foodCode: "JO", foodGroup: FoodGroup.BASE },
    { name: "Fried Rice", foodCode: "FR", foodGroup: FoodGroup.BASE },
    { name: "Plain Rice", foodCode: "PR", foodGroup: FoodGroup.BASE },
    { name: "Fufu", foodCode: "FU", foodGroup: FoodGroup.BASE },
    { name: "Banku", foodCode: "BK", foodGroup: FoodGroup.BASE },
    { name: "Kenkey", foodCode: "KK", foodGroup: FoodGroup.BASE },
    { name: "Konkonte", foodCode: "KO", foodGroup: FoodGroup.BASE },
    { name: "Eba", foodCode: "EB", foodGroup: FoodGroup.BASE },
    { name: "Omotuo", foodCode: "OT", foodGroup: FoodGroup.BASE },
    { name: "Acheke", foodCode: "AC", foodGroup: FoodGroup.BASE },
    { name: "Yam", foodCode: "YM", foodGroup: FoodGroup.BASE },
    { name: "Waakye", foodCode: "WK", foodGroup: FoodGroup.BASE },
    { name: "Red Red", foodCode: "RR", foodGroup: FoodGroup.BASE },
    { name: "Gobe", foodCode: "GB", foodGroup: FoodGroup.BASE },
    { name: "Garifotor", foodCode: "GF", foodGroup: FoodGroup.BASE },
    { name: "Kelewele", foodCode: "KL", foodGroup: FoodGroup.BASE },
    { name: "Angwamo", foodCode: "AG", foodGroup: FoodGroup.BASE },
    { name: "Apim", foodCode: "AP", foodGroup: FoodGroup.BASE },
    { name: "Chicken Burger", foodCode: "CB", foodGroup: FoodGroup.BASE },
    { name: "Beef Burger", foodCode: "BB", foodGroup: FoodGroup.BASE },
    { name: "Fries", foodCode: "FRI", foodGroup: FoodGroup.BASE },
    { name: "Wrap", foodCode: "WR", foodGroup: FoodGroup.BASE },
    { name: "Salad", foodCode: "SL", foodGroup: FoodGroup.BASE },

    // 3. VARIATION (Dish compositions/variations)
    { name: "Check-Check", foodCode: "CK", foodGroup: FoodGroup.VARIATION },
    { name: "Assorted", foodCode: "AS", foodGroup: FoodGroup.VARIATION },

    // 4. PROTEIN (Principal protein components)
    { name: "No Protein", foodCode: "OO", foodGroup: FoodGroup.PROTEIN },
    { name: "Chicken", foodCode: "CH", foodGroup: FoodGroup.PROTEIN },
    { name: "Chicken Wings", foodCode: "CW", foodGroup: FoodGroup.PROTEIN },
    { name: "Pork", foodCode: "PK", foodGroup: FoodGroup.PROTEIN },
    { name: "Beef", foodCode: "BF", foodGroup: FoodGroup.PROTEIN },
    { name: "Goat", foodCode: "GT", foodGroup: FoodGroup.PROTEIN },
    { name: "Fish", foodCode: "FS", foodGroup: FoodGroup.PROTEIN },
    { name: "Gizzard", foodCode: "GZ", foodGroup: FoodGroup.PROTEIN },
    { name: "Cow Leg", foodCode: "CL", foodGroup: FoodGroup.PROTEIN },
    { name: "Turkey", foodCode: "TU", foodGroup: FoodGroup.PROTEIN },
    { name: "Egg", foodCode: "EG", foodGroup: FoodGroup.PROTEIN },
    { name: "Sausage", foodCode: "SS", foodGroup: FoodGroup.PROTEIN },
    { name: "Tuna", foodCode: "TN", foodGroup: FoodGroup.PROTEIN },
    { name: "Sardine", foodCode: "SD", foodGroup: FoodGroup.PROTEIN },
    { name: "Tilapia", foodCode: "TI", foodGroup: FoodGroup.PROTEIN },

    // 5. ACCOMPANIMENT (Sauces, stews, soups served alongside)
    { name: "Stew", foodCode: "ST", foodGroup: FoodGroup.ACCOMPANIMENT },
    { name: "Light Soup", foodCode: "LS", foodGroup: FoodGroup.ACCOMPANIMENT },
    { name: "Groundnut Soup", foodCode: "GS", foodGroup: FoodGroup.ACCOMPANIMENT },
    { name: "Palava Sauce", foodCode: "PS", foodGroup: FoodGroup.ACCOMPANIMENT },
    { name: "Okro Soup", foodCode: "OS", foodGroup: FoodGroup.ACCOMPANIMENT },
    { name: "Vegetable Stew", foodCode: "VS", foodGroup: FoodGroup.ACCOMPANIMENT },
    { name: "Egg Stew", foodCode: "ES", foodGroup: FoodGroup.ACCOMPANIMENT },
    { name: "Garden Egg Stew", foodCode: "GES", foodGroup: FoodGroup.ACCOMPANIMENT },
    { name: "Fante Fante", foodCode: "FF", foodGroup: FoodGroup.ACCOMPANIMENT },
    { name: "Palmnut Soup", foodCode: "PNS", foodGroup: FoodGroup.ACCOMPANIMENT },
    { name: "Ayoyo Soup", foodCode: "AY", foodGroup: FoodGroup.ACCOMPANIMENT },
    { name: "Gravy", foodCode: "GR", foodGroup: FoodGroup.ACCOMPANIMENT },
    { name: "Creamy Vegetables", foodCode: "CV", foodGroup: FoodGroup.ACCOMPANIMENT },

    // 6. MODIFIER (Dish characteristics/attributes)
    { name: "Peppered", foodCode: "PP", foodGroup: FoodGroup.MODIFIER },

    // 7. PREP (Culinary/cooking preparation methods)
    { name: "Grilled", foodCode: "G", foodGroup: FoodGroup.PREP },
    { name: "Fried", foodCode: "F", foodGroup: FoodGroup.PREP },
    { name: "Boiled", foodCode: "BO", foodGroup: FoodGroup.PREP },
];

/**
 * Seeds and normalizes the FoodLibrary records in place.
 * Retains existing records and primary keys where possible.
 */
export async function seedFoodTaxonomy(): Promise<void> {
    console.log("🌱 Seeding 7-dimensional FoodLibrary taxonomy...");

    for (const item of TAXONOMY_DATA) {
        await prisma.foodLibrary.upsert({
            where: {
                foodCode_foodGroup: {
                    foodCode: item.foodCode,
                    foodGroup: item.foodGroup,
                },
            },
            create: {
                name: item.name,
                foodCode: item.foodCode,
                foodGroup: item.foodGroup,
            },
            update: {
                name: item.name,
            },
        });
    }

    console.log(`✓ Upserted ${TAXONOMY_DATA.length} FoodLibrary records successfully.`);
}

/**
 * Migration dictionary mapping legacy 3/4-block codes to their canonical 7-block equivalents.
 */
export const LEGACY_MEAL_FOOD_CODE_MAP: Record<string, string> = {
    // Jollof dishes
    "R-JO-CH-F": "R-JO-OO-CH-OO-OO-F",
    "R-JO-CW-F": "R-JO-OO-CW-OO-OO-F",
    "R-JO-PK-F": "R-JO-OO-PK-OO-OO-F",
    "R-JO-FI-F": "R-JO-OO-FS-OO-OO-F",
    "R-JO-TK-F": "R-JO-OO-TU-OO-OO-F",
    "R-JO-GZ-F": "R-JO-OO-GZ-OO-PP-F",
    "R-JOCK-CH-F": "R-JO-CK-CH-OO-OO-F",
    "R-JOAS-CH-F": "R-JO-AS-CH-OO-OO-F",

    // Fried Rice dishes
    "R-FR-CH-F": "R-FR-OO-CH-OO-OO-F",
    "R-FR-CW-F": "R-FR-OO-CW-OO-OO-F",
    "R-FR-PK-F": "R-FR-OO-PK-OO-OO-F",
    "R-FR-FI-F": "R-FR-OO-FS-OO-OO-F",
    "R-FRCK-GZ-F": "R-FR-CK-GZ-OO-PP-F",

    // Plain Rice dishes
    "R-PL-ST-F": "R-PR-OO-OO-ST-OO-OO",
    "R-PL-GN-F": "R-PR-OO-OO-GS-OO-OO",
    "R-PL-PN-F": "R-PR-OO-OO-PNS-OO-OO",
    "R-PL-LS-F": "R-PR-OO-OO-LS-OO-OO",
    "R-PL-PV-F": "R-PR-OO-OO-PS-OO-OO",
    "R-PL-GE-F": "R-PR-OO-OO-GES-OO-OO",
    "R-PL-EG-F": "R-PR-OO-OO-ES-OO-OO",

    // Angwamo dishes
    "R-AG-EG-GZ": "R-AG-OO-EG|GZ-OO-OO-OO",
    "R-AG-EG-CH": "R-AG-OO-EG|CH-OO-OO-OO",
    "R-AG-EG-SD": "R-AG-OO-EG|SD-OO-OO-OO",

    // Banku dishes
    "B-TI-F": "S-BK-OO-TI-OO-OO-G",
    "B-OK-F": "S-BK-OO-OO-OS-OO-OO",
    "B-FF-F": "S-BK-OO-OO-FF-OO-OO",
    "B-PK-F": "S-BK-OO-PK-OO-OO-F",

    // Kenkey dishes
    "K-FI-F": "S-KK-OO-FS-OO-OO-F",
    "K-FF-F": "S-KK-OO-TI-FF-OO-OO",

    // Fufu dishes
    "F-PN-F": "S-FU-OO-OO-PNS-OO-OO",
    "F-GT-LS-F": "S-FU-OO-GT-LS-OO-OO",
    "F-GN-F": "S-FU-OO-OO-GS-OO-OO",

    // Omotuo dishes
    "O-PN-F": "S-OT-OO-OO-PNS-OO-OO",
    "O-GN-F": "S-OT-OO-OO-GS-OO-OO",
    "O-GT-LS-F": "S-OT-OO-GT-LS-OO-OO",

    // Konkonte dishes
    "KK-PN-F": "S-KO-OO-OO-PNS-OO-OO",
    "KK-GN-F": "S-KO-OO-OO-GS-OO-OO",
    "KK-GT-LS-F": "S-KO-OO-GT-LS-OO-OO",

    // Yam dishes
    "Y-PV-F": "T-YM-OO-OO-PS-OO-OO",
    "Y-GE-F": "T-YM-OO-OO-GES-OO-OO",
    "Y-EG-F": "T-YM-OO-OO-ES-OO-OO",

    // Plantain dishes
    "AP-PV-F": "P-AP-OO-OO-PS-OO-OO",

    // Wraps, Burgers & Continental (Section 12 collision resolution)
    "W-CH-F": "X-WR-OO-CH-OO-OO-F",
    "BG-CH-F": "X-CB|FRI-OO-OO-OO-OO-OO",
    "BG-BF-F": "X-BB|FRI-OO-OO-OO-OO-OO",
    "N-CH-F": "N-OO-OO-CH-OO-OO-F",
    "W-AS-F": "B-WK-AS-OO-OO-OO-OO",
    "S-TN-F": "X-SL-OO-TN-OO-OO-OO",
    "S-CH-F": "X-SL-OO-CH-OO-OO-OO",
};

/**
 * Normalizes legacy meal food codes in the Meals table in-place.
 * Preserves meal primary keys, names, image paths, and calorie values.
 */
export async function migrateMealFoodCodes(): Promise<void> {
    console.log("🍲 Migrating Meals foodCode values in-place...");

    const allMeals = await prisma.meals.findMany();
    let updatedCount = 0;
    let alreadyValidCount = 0;
    let unmappedCount = 0;

    for (const meal of allMeals) {
        if (validateFoodCode(meal.foodCode)) {
            alreadyValidCount++;
            continue;
        }

        const canonicalCode = LEGACY_MEAL_FOOD_CODE_MAP[meal.foodCode];
        if (canonicalCode) {
            await prisma.meals.update({
                where: { id: meal.id },
                data: { foodCode: canonicalCode },
            });
            updatedCount++;
            console.log(`✓ Meal [id=${meal.id}] '${meal.name}' migrated: ${meal.foodCode} -> ${canonicalCode}`);
        } else {
            unmappedCount++;
            console.warn(`⚠️ Unmapped meal food code [id=${meal.id}] '${meal.name}': ${meal.foodCode}`);
        }
    }

    console.log(`\nMeal Migration Summary:`);
    console.log(`  Already 7-block valid: ${alreadyValidCount}`);
    console.log(`  Successfully updated:  ${updatedCount}`);
    console.log(`  Unmapped / pending:    ${unmappedCount}`);
}

/**
 * Recalculates all users' excludedMealIds based on updated 7-block meal food codes.
 */
export async function migrateUserPreferences(): Promise<void> {
    console.log("⚙️  Recalculating user dietary preference exclusions...");
    const { userPreferenceService } = await import("../src/services/userPreferenceService");
    const updated = await userPreferenceService.recalculateAllUserPreferences();
    console.log(`✓ Recalculated excluded meals for ${updated.length} user preferences.`);
}

/**
 * Recalculates taste profiles for active users to reflect new 7-block dimensions and HEAVY_EATER personality.
 */
export async function migrateTasteProfiles(): Promise<void> {
    console.log("🧠 Syncing user taste profiles under new taxonomy and personality rules...");
    const { tasteProfileService } = await import("../src/services/tasteProfileService");
    const profiles = await tasteProfileService.updateActiveUsersTasteProfiles();
    console.log(`✓ Synchronized taste profiles for ${profiles.length} active users.`);
}

async function main() {
    try {
        await prisma.$connect();
        await seedFoodTaxonomy();
        await migrateMealFoodCodes();
        await migrateUserPreferences();
        await migrateTasteProfiles();
        console.log("\n🎉 FoodCode taxonomy migration, user preferences, and taste profile analysis finished successfully.");
    } catch (error) {
        console.error("Migration failed:", error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

if (require.main === module) {
    main();
}

