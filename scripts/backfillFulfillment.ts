import "dotenv/config";
import { prisma } from "../src/prisma/client";
import { FulfillmentStatus, SelectionStatus, SelectionType } from "../src/generated/prisma";

/**
 * Backfill script to change all selections which are submitted and are meals
 * to fulfillmentStatus: FULFILLED.
 *
 * Usage:
 *   npm run backfill:fulfillment
 *   npm run backfill:fulfillment -- --dry-run
 *   npm run backfill:fulfillment -- --force
 */
async function main() {
  const isDryRun = process.argv.includes("--dry-run");
  const forceAll = process.argv.includes("--force");

  console.log("=== Backfill Meal Fulfillment ===");
  if (isDryRun) {
    console.log("MODE: DRY RUN (no database records will be modified)\n");
  }
  if (forceAll) {
    console.log("MODE: FORCE (all submitted meals will be re-fulfilled regardless of current fulfillmentStatus)\n");
  }

  // 1. Initial breakdown of selections by status & type
  console.log("Analyzing current selections...");
  const initialFulfillmentCounts = await prisma.selections.groupBy({
    by: ["selectionStatus", "selectionType", "fulfillmentStatus"],
    _count: { id: true },
  });

  console.log("\nCurrent Selections Breakdown (Status x Type x Fulfillment):");
  console.table(
    initialFulfillmentCounts.map((c) => ({
      selectionStatus: c.selectionStatus,
      selectionType: c.selectionType,
      fulfillmentStatus: c.fulfillmentStatus,
      count: c._count.id,
    }))
  );

  const targetFilter = {
    selectionStatus: SelectionStatus.SUBMITTED,
    selectionType: SelectionType.MEAL,
    ...(forceAll ? {} : { fulfillmentStatus: { not: FulfillmentStatus.FULFILLED } }),
  };

  const eligibleCount = await prisma.selections.count({
    where: targetFilter,
  });

  const alreadyFulfilledCount = await prisma.selections.count({
    where: {
      selectionStatus: SelectionStatus.SUBMITTED,
      selectionType: SelectionType.MEAL,
      fulfillmentStatus: FulfillmentStatus.FULFILLED,
    },
  });

  console.log(`\nEligible submitted meal selections to fulfill: ${eligibleCount}`);
  console.log(`Already fulfilled submitted meal selections: ${alreadyFulfilledCount}`);

  if (eligibleCount === 0) {
    console.log("\n✓ No eligible selections require backfilling.");
    return;
  }

  if (isDryRun) {
    console.log(`\n[Dry Run] Would update ${eligibleCount} selection(s) to FULFILLED.`);
    return;
  }

  // 2. Perform backfill update
  console.log(`\nUpdating ${eligibleCount} selection(s) to FULFILLED...`);
  const now = new Date();
  const updateResult = await prisma.selections.updateMany({
    where: targetFilter,
    data: {
      fulfillmentStatus: FulfillmentStatus.FULFILLED,
      fulfilledAt: now,
    },
  });

  console.log(`✓ Successfully updated ${updateResult.count} selection(s) to FULFILLED.`);

  // 3. Final breakdown verification
  const finalFulfillmentCounts = await prisma.selections.groupBy({
    by: ["fulfillmentStatus"],
    _count: { id: true },
  });

  console.log("\nFinal Selections Breakdown by Fulfillment Status:");
  console.table(
    finalFulfillmentCounts.map((c) => ({
      fulfillmentStatus: c.fulfillmentStatus,
      count: c._count.id,
    }))
  );

  console.log("\nBackfill completed successfully.");
}

main()
  .catch((err) => {
    console.error("Failed to backfill meal fulfillment:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
