import "dotenv/config";
import type { FulfillmentStatus, SelectionStatus, SelectionType } from "../generated/prisma";
import { prisma } from "../db/prisma";
import { foodLibraryAdjusted } from "./foodLibraryAdjusted";
import { mealsAdjusted } from "./mealsAdjusted";
import { weekMenuSchedules } from "./weekMenuScheduleBackfill";
import { menuDayMeals } from "./menuDayMealsAdjusted";
import { selectionsAdjusted } from "./selectionsAdjusted";

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
 * 1. Seed FoodLibrary
 */
async function seedFoodLibrary() {
  console.log(`\n[1/5] 🌱 Seeding FoodLibrary (${foodLibraryAdjusted.length} items)...`);
  const chunkSize = 15;
  let processed = 0;

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
    processed += chunk.length;
    process.stdout.write(`  Upserted ${processed}/${foodLibraryAdjusted.length} food library items\r`);
  }
  console.log(`\n  ✓ FoodLibrary seeding completed (${foodLibraryAdjusted.length} items).`);
  await syncSequence("FoodLibrary");
}

/**
 * 2. Seed Meals
 */
async function seedMeals() {
  console.log(`\n[2/5] 🌱 Seeding Meals (${mealsAdjusted.length} items)...`);
  const chunkSize = 15;
  let processed = 0;

  for (let i = 0; i < mealsAdjusted.length; i += chunkSize) {
    const chunk = mealsAdjusted.slice(i, i + chunkSize);
    await Promise.all(
      chunk.map((meal) =>
        prisma.meals.upsert({
          where: { id: meal.id },
          create: {
            id: meal.id,
            name: meal.name,
            description: meal.description,
            isActive: meal.isActive,
            foodCode: meal.foodCode,
            calories: meal.calories,
            createdAt: new Date(meal.createdAt),
            updatedAt: new Date(meal.updatedAt),
          },
          update: {
            name: meal.name,
            description: meal.description,
            isActive: meal.isActive,
            foodCode: meal.foodCode,
            calories: meal.calories,
            updatedAt: new Date(meal.updatedAt),
          },
        })
      )
    );
    processed += chunk.length;
    process.stdout.write(`  Upserted ${processed}/${mealsAdjusted.length} meals\r`);
  }
  console.log(`\n  ✓ Meals seeding completed (${mealsAdjusted.length} items).`);
  await syncSequence("Meals");
}

/**
 * 3. Seed WeekMenuSchedules
 */
async function seedWeekMenuSchedules() {
  console.log(`\n[3/5] 🌱 Seeding WeekMenuSchedules (${weekMenuSchedules.length} items)...`);
  const chunkSize = 10;
  let processed = 0;

  for (let i = 0; i < weekMenuSchedules.length; i += chunkSize) {
    const chunk = weekMenuSchedules.slice(i, i + chunkSize);
    await Promise.all(
      chunk.map((schedule) =>
        prisma.weekMenuSchedule.upsert({
          where: {
            week_year: {
              week: schedule.week,
              year: schedule.year,
            },
          },
          create: {
            id: schedule.id,
            week: schedule.week,
            year: schedule.year,
            menuId: schedule.menuId,
            status: schedule.status,
            closedAt: schedule.closedAt ? new Date(schedule.closedAt) : null,
          },
          update: {
            menuId: schedule.menuId,
            status: schedule.status,
            closedAt: schedule.closedAt ? new Date(schedule.closedAt) : null,
          },
        })
      )
    );
    processed += chunk.length;
    process.stdout.write(`  Upserted ${processed}/${weekMenuSchedules.length} week menu schedules\r`);
  }
  console.log(`\n  ✓ WeekMenuSchedules seeding completed (${weekMenuSchedules.length} items).`);
  await syncSequence("WeekMenuSchedule");
}

/**
 * 4. Seed MenuDayMeals
 */
async function seedMenuDayMeals() {
  console.log(`\n[4/5] 🌱 Seeding MenuDayMeals (${menuDayMeals.length} items)...`);
  const chunkSize = 15;
  let processed = 0;

  for (let i = 0; i < menuDayMeals.length; i += chunkSize) {
    const chunk = menuDayMeals.slice(i, i + chunkSize);
    await Promise.all(
      chunk.map((mdm) =>
        prisma.menuDayMeals.upsert({
          where: {
            menuDayId_mealId: {
              menuDayId: mdm.menuDayId,
              mealId: mdm.mealId,
            },
          },
          create: {
            id: mdm.id,
            menuDayId: mdm.menuDayId,
            mealId: mdm.mealId,
            isActive: mdm.isActive,
            createdAt: new Date(mdm.createdAt),
            updatedAt: new Date(mdm.updatedAt),
          },
          update: {
            isActive: mdm.isActive,
            updatedAt: new Date(mdm.updatedAt),
          },
        })
      )
    );
    processed += chunk.length;
    process.stdout.write(`  Upserted ${processed}/${menuDayMeals.length} menu-day meals\r`);
  }
  console.log(`\n  ✓ MenuDayMeals seeding completed (${menuDayMeals.length} items).`);
  await syncSequence("MenuDayMeals");
}

/**
 * 5. Seed Selections
 */
async function seedSelections() {
  console.log(`\n[5/5] 🌱 Seeding Selections (${selectionsAdjusted.length} total raw items)...`);

  // Deduplicate in memory on (createdFor, weekMenuScheduleId, menuDayId) keeping the latest updated record
  const dedupMap = new Map<string, (typeof selectionsAdjusted)[number]>();
  for (const sel of selectionsAdjusted) {
    const key = `${sel.createdFor}_${sel.weekMenuScheduleId}_${sel.menuDayId}`;
    const existing = dedupMap.get(key);
    if (!existing || new Date(sel.updatedAt).getTime() >= new Date(existing.updatedAt).getTime()) {
      dedupMap.set(key, sel);
    }
  }

  const uniqueSelections = Array.from(dedupMap.values());
  console.log(`  Deduplicated down to ${uniqueSelections.length} unique selections.`);

  const chunkSize = 500;
  let insertedCount = 0;

  for (let i = 0; i < uniqueSelections.length; i += chunkSize) {
    const chunk = uniqueSelections.slice(i, i + chunkSize).map((sel) => ({
      menuDayId: sel.menuDayId,
      dayMealId: sel.dayMealId,
      weekMenuScheduleId: sel.weekMenuScheduleId,
      fulfillmentStatus: sel.fulfillmentStatus as FulfillmentStatus,
      fulfilledAt: sel.fulfilledAt ? new Date(sel.fulfilledAt) : null,
      createdBy: sel.createdBy,
      createdFor: sel.createdFor,
      guestCount: sel.guestCount ?? 1,
      selectionStatus: sel.selectionStatus as SelectionStatus,
      selectionType: (sel.selectionType ?? "MEAL") as SelectionType,
      createdAt: new Date(sel.createdAt),
      updatedAt: new Date(sel.updatedAt),
    }));

    const result = await prisma.selections.createMany({
      data: chunk,
      skipDuplicates: true,
    });

    insertedCount += result.count;
    process.stdout.write(`  Processed ${Math.min(i + chunkSize, uniqueSelections.length)}/${uniqueSelections.length} selections (${insertedCount} new rows inserted)\r`);
  }

  console.log(`\n  ✓ Selections seeding completed (${insertedCount} rows inserted, duplicates skipped).`);
  await syncSequence("Selections");
}

async function main() {
  console.log("==================================================");
  console.log("🚀 STARTING DATABASE SEEDING / BACKFILL PIPELINE");
  console.log("==================================================");
  const startTime = Date.now();

  try {
    await prisma.$connect();

    // 1. make foodLibrary
    await seedFoodLibrary();

    // 2. make meals
    await seedMeals();

    // 3. make weekMenuSchedules
    await seedWeekMenuSchedules();

    // 4. make menuDayMeals
    await seedMenuDayMeals();

    // 5. make selections
    await seedSelections();

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log("\n==================================================");
    console.log(`🎉 ALL 5 SEEDING STEPS COMPLETED SUCCESSFULLY in ${elapsed}s!`);
    console.log("==================================================");
  } catch (error) {
    console.error("\n❌ Seeding failed:", error);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
    process.exit(process.exitCode ?? 0);
  }
}

void main();

