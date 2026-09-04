import "dotenv/config";
import { prisma } from "../src/prisma/client";

export interface RoleSeedData {
  id: number;
  name: string;
  description: string;
}

export const defaultRoles: RoleSeedData[] = [
  {
    id: 1,
    name: "admin",
    description: "Administrator role with full system access, configuration controls, and administrative privileges",
  },
  {
    id: 2,
    name: "manager",
    description: "Management role with supervisory oversight, departmental meal approvals, and reporting capabilities",
  },
  {
    id: 3,
    name: "hr",
    description: "Human Resources role with employee management, dietary preferences oversight, and attendance tracking",
  },
  {
    id: 4,
    name: "worker",
    description: "Operational staff role with access to kitchen workflows, preparation schedules, and meal distribution",
  },
  {
    id: 5,
    name: "user",
    description: "Standard user role with access to view weekly menus and make personal meal selections",
  },
];

export async function seedRoles() {
  console.log("🌱 Starting roles seeding...");

  // 1. Temporarily rename existing target roles to avoid unique constraint violations during reordering
  for (const role of defaultRoles) {
    try {
      await prisma.roles.updateMany({
        where: { id: role.id },
        data: { name: `_temp_${role.id}_${Date.now()}` },
      });
    } catch {
      // Non-fatal if record does not exist
    }
  }

  // 2. Upsert each role with target id, name, and description
  for (const role of defaultRoles) {
    const upserted = await prisma.roles.upsert({
      where: { id: role.id },
      create: {
        id: role.id,
        name: role.name,
        description: role.description,
      },
      update: {
        name: role.name,
        description: role.description,
      },
    });
    console.log(`✓ Role [id=${upserted.id}] '${upserted.name}' upserted.`);
  }

  // 3. Synchronize the PostgreSQL auto-increment sequence with the table's max ID
  try {
    await prisma.$executeRawUnsafe(
      `SELECT setval(pg_get_serial_sequence('"Roles"', 'id'), COALESCE((SELECT MAX(id) FROM "Roles"), 1));`
    );
  } catch (error) {
    console.warn("Notice: Roles sequence sync skipped or not supported:", error instanceof Error ? error.message : error);
  }

  const seeded = await prisma.roles.findMany({
    orderBy: { id: "asc" },
  });
  console.log("Seeded roles summary:", seeded);
}

async function main() {
  try {
    await prisma.$connect();
    await seedRoles();
    console.log("Role Seeding completed successfully.");
  } catch (error) {
    console.error("Role Seeding failed:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
