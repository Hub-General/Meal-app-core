import "dotenv/config";

import { CreateRoleRequest } from "../src/interfaces/role";
import { prisma } from "../src/prisma/client";

async function main() {
  const roles: CreateRoleRequest[] = [
    { name: "user", description: "Standard user role with basic access" },
    { name: "admin", description: "Administrator role with full system access" },
    { name: "hr", description: "Human Resources role with specific HR functionalities" },
  ];

  for (const role of roles) {
    await prisma.roles.upsert({
      where: { name: role.name },
      create: role,
      // Only update the description if the role already exists.
      // The 'name' is used for matching and should not be updated.
      update: {
        description: role.description
      },
    });
  }

  const seeded = await prisma.roles.findMany({
    where: { name: { in: roles.map((r) => r.name) } },
    orderBy: { id: "asc" },
    select: { id: true, name: true },
  });

  console.log("Seeded roles:", seeded);
  console.log("This is working")
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
