import "dotenv/config";
import { prisma } from "../src/db/prisma";
import { foodLibraryAdjusted } from "../src/backfillData/foodLibraryAdjusted";
import { mealsAdjusted } from "../src/backfillData/mealsAdjusted";
import { validateFoodCode } from "../src/helpers/foodCodeParser";
import { userPreferenceService } from "../src/services/userPreferenceService";
import { tasteProfileService } from "../src/services/tasteProfileService";

/**
 * Synchronize auto-increment sequence for a table
 */
async function syncSequence(tableName: string) {
    try {
        await prisma.$executeRawUnsafe(
            `SELECT setval(pg_get_serial_sequence('"${tableName}"', 'id'), COALESCE((SELECT MAX(id) FROM "${tableName}"), 1));`
        );
        console.log(`  ✓ Synced sequence for "${tableName}"`);
    } catch (err: any) {
        console.warn(`  ! Sequence sync for "${tableName}" skipped:`, err.message);
    }
}

/**
 * Seeds and normalizes the FoodLibrary records using the canonical 79 taxonomy records.
 */
export async function seedFoodTaxonomy(): Promise<void> {
    console.log(`🌱 Seeding canonical 7-dimensional FoodLibrary taxonomy (${foodLibraryAdjusted.length} records)...`);
    const chunkSize = 15;

    for (let i = 0; i < foodLibraryAdjusted.length; i += chunkSize) {
        const chunk = foodLibraryAdjusted.slice(i, i + chunkSize);
        await Promise.all(
            chunk.map((item) =>
                prisma.foodLibrary.upsert({
                    where: { id: item.id },
                    create: {
                        id: item.id,
                        name: item.name,
                        foodCode: item.foodCode,
                        foodGroup: item.foodGroup,
                        createdAt: new Date(item.createdAt),
                        updatedAt: new Date(item.updatedAt),
                    },
                    update: {
                        name: item.name,
                        foodCode: item.foodCode,
                        foodGroup: item.foodGroup,
                        updatedAt: new Date(item.updatedAt),
                    },
                })
            )
        );
    }

    console.log(`✓ Upserted ${foodLibraryAdjusted.length} FoodLibrary records successfully.`);
    await syncSequence("FoodLibrary");
}

/**
 * Validates all meals and ensures their foodCode adheres to the 7-block standard.
 * Uses mealsAdjusted catalog as the source of truth.
 */
export async function migrateMealFoodCodes(): Promise<void> {
    console.log("🍲 Validating and migrating Meals foodCode values in-place...");

    const allMeals = await prisma.meals.findMany();
    const adjustedMealMap = new Map(mealsAdjusted.map((m) => [m.id, m.foodCode]));

    const mealsToUpdate: Array<{ id: number; name: string; oldCode: string; newCode: string }> = [];
    let alreadyValidCount = 0;
    let unmappedCount = 0;

    for (const meal of allMeals) {
        if (validateFoodCode(meal.foodCode)) {
            alreadyValidCount++;
            continue;
        }

        const canonicalCode = adjustedMealMap.get(meal.id);
        if (canonicalCode && validateFoodCode(canonicalCode)) {
            mealsToUpdate.push({
                id: meal.id,
                name: meal.name,
                oldCode: meal.foodCode,
                newCode: canonicalCode,
            });
        } else {
            unmappedCount++;
            console.warn(`⚠️ Unmapped meal [id=${meal.id}] '${meal.name}': ${meal.foodCode}`);
        }
    }

    if (mealsToUpdate.length > 0) {
        const chunkSize = 15;
        for (let i = 0; i < mealsToUpdate.length; i += chunkSize) {
            const chunk = mealsToUpdate.slice(i, i + chunkSize);
            await Promise.all(
                chunk.map((m) =>
                    prisma.meals.update({
                        where: { id: m.id },
                        data: { foodCode: m.newCode },
                    })
                )
            );
        }
    }

    console.log(`Meal Validation Summary:`);
    console.log(`  Already 7-block valid: ${alreadyValidCount}`);
    console.log(`  Successfully updated:  ${mealsToUpdate.length}`);
    console.log(`  Unmapped / pending:    ${unmappedCount}`);
    await syncSequence("Meals");
}

/**
 * Recalculates all users' excludedMealIds based on updated 7-block meal food codes and dimension rules.
 */
export async function migrateUserPreferences(): Promise<void> {
    console.log("⚙️  Recalculating user dietary preference exclusions...");
    const updated = await userPreferenceService.recalculateAllUserPreferences();
    console.log(`✓ Recalculated excluded meals for ${updated.length} user preferences.`);
}

/**
 * Recalculates taste profiles for active users to reflect new 7-block dimensions and HEAVY_EATER personality.
 */
export async function migrateTasteProfiles(): Promise<void> {
    console.log("🧠 Syncing user taste profiles under new taxonomy and personality rules...");
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
        console.log("\n🎉 FoodCode taxonomy seeding, user preferences, and taste profile analysis finished successfully.");
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


