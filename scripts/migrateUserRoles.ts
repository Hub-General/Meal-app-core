import "dotenv/config";
import { prisma } from "../src/prisma/client";

/**
 * Script to migrate user roles in the database.
 *
 * Current 5-role hierarchy:
 *  1: user
 *  2: worker
 *  3: hr
 *  4: manager
 *  5: admin
 */
async function main() {
  console.log("Starting user role updates...\n");

  // Display initial breakdown
  const initialCounts = await prisma.users.groupBy({
    by: ["roleId"],
    _count: { id: true },
  });
  console.log("Initial user count by roleId:", initialCounts);

  const role2Users = await prisma.users.findMany({
    where: { roleId: 2 },
    select: { id: true, name: true, email: true, roleId: true },
  });
  console.log("Users currently with roleId = 2:", role2Users);

  // 1. Update all users whose roleId is NOT 2 to roleId = 1 (User)
  const nonAdminUpdate = await prisma.users.updateMany({
    where: {
      roleId: { not: 2 },
    },
    data: {
      roleId: 5,
    },
  });
  console.log(`✓ Set ${nonAdminUpdate.count} user(s) to roleId = 1 (User).`);

  // 2. Handle users with roleId = 2:
  // If --admin flag is passed or by default in 5-role schema: update old admins (roleId 2) to roleId = 5 (Admin).
  // If --all-user flag is passed: update roleId 2 users to roleId = 1 as well.
  const targetForRole2 = process.argv.includes("--all-user") ? 5 : 1;

  if (role2Users.length > 0) {
    const role2Update = await prisma.users.updateMany({
      where: {
        roleId: 2,
      },
      data: {
        roleId: targetForRole2,
      },
    });
    console.log(
      `✓ Set ${role2Update.count} user(s) with previous roleId=2 to roleId = ${targetForRole2} (${targetForRole2 === 5 ? "Admin" : "User"}).`
    );
  }

  // Display final breakdown
  const finalCounts = await prisma.users.groupBy({
    by: ["roleId"],
    _count: { id: true },
  });
  console.log("\nFinal user count by roleId:", finalCounts);
  console.log("Role update completed successfully.");
}

main()
  .catch((err) => {
    console.error("Failed to update user roles:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
