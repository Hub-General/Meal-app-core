import { prisma } from "../prisma/client";
import { roleService } from "./roleService";

async function main() {
  try {
    await prisma.$connect();
    console.log('Database connected successfully for seeding.');

    await roleService.seedRoles();
    console.log('Roles seeding complete.');
  } catch (error) {
    console.error('Database seeding failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();