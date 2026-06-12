import "dotenv/config";

import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma";

async function main() {
  const connectionString = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      "Missing DIRECT_URL (or DATABASE_URL) environment variable for seeding.",
    );
  }

  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  const roles = [
    { name: "USER", description: "Default application user" },
    { name: "HR", description: "HR access" },
    { name: "ADMIN", description: "Full access" },
  ] as const;

  for (const role of roles) {
    await prisma.roles.upsert({
      where: { name: role.name },
      create: role,
      update: { description: role.description },
    });
  }

  const seeded = await prisma.roles.findMany({
    where: { name: { in: roles.map((r) => r.name) } },
    orderBy: { id: "asc" },
    select: { id: true, name: true },
  });

  console.log("Seeded roles:", seeded);
  await prisma.$disconnect();
  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

