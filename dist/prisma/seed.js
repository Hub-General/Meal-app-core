"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const pg_1 = require("pg");
const adapter_pg_1 = require("@prisma/adapter-pg");
const prisma_1 = require("../generated/prisma");
async function main() {
    const connectionString = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
    if (!connectionString) {
        throw new Error("Missing DIRECT_URL (or DATABASE_URL) environment variable for seeding.");
    }
    const pool = new pg_1.Pool({ connectionString });
    const adapter = new adapter_pg_1.PrismaPg(pool);
    const prisma = new prisma_1.PrismaClient({ adapter });
    const roles = [
        { name: "USER", description: "Default application user" },
        { name: "HR", description: "HR access" },
        { name: "ADMIN", description: "Full access" },
    ];
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
//# sourceMappingURL=seed.js.map