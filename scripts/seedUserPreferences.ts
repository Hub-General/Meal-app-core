import "dotenv/config";
import { prisma } from "../src/prisma/client";
import { Theme } from "../src/generated/prisma";

/**
 * Script to backfill empty UserPreferences records for users that do not yet have one.
 * Existing UserPreferences records will NOT be overwritten or modified.
 */
export async function seedUserPreferences() {
  console.log("🌱 Starting user preferences backfill/seeding...\n");

  const totalUsers = await prisma.users.count();
  const usersWithoutPreferences = await prisma.users.findMany({
    where: {
      preferences: null,
    },
    select: {
      id: true,
      name: true,
      referenceEmail: true,
    },
  });

  console.log(`Total users in database: ${totalUsers}`);
  console.log(`Users without preferences: ${usersWithoutPreferences.length}`);

  if (usersWithoutPreferences.length === 0) {
    console.log("\n✓ All users already have user preferences records. Nothing to backfill.");
    return { totalUsers, backfilledCount: 0 };
  }

  const result = await prisma.userPreferences.createMany({
    data: usersWithoutPreferences.map((user) => ({
      userId: user.id,
      dislikes: { meals: [], foodItems: [] },
      excludedMealIds: [],
      announcementVersion: 0,
      theme: Theme.LIGHT,
      autoSubmitPreset: false,
    })),
    skipDuplicates: true,
  });

  console.log(`\n✓ Successfully created ${result.count} empty user preference record(s).`);
  console.log("User preferences backfill completed successfully.");

  return { totalUsers, backfilledCount: result.count };
}

async function main() {
  try {
    await prisma.$connect();
    await seedUserPreferences();
  } catch (error) {
    console.error("Error backfilling user preferences:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Execute standalone if run directly
if (require.main === module) {
  main();
}
