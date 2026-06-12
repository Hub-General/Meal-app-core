"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
require("dotenv/config");
const pg_1 = require("pg");
const adapter_pg_1 = require("@prisma/adapter-pg");
const prisma_1 = require("../generated/prisma");
const connectionString = process.env.DATABASE_URL ?? process.env.DIRECT_URL;
if (!connectionString) {
    throw new Error("Missing DATABASE_URL (or DIRECT_URL) environment variable.");
}
const pool = new pg_1.Pool({ connectionString });
const adapter = new adapter_pg_1.PrismaPg(pool);
exports.prisma = new prisma_1.PrismaClient({ adapter });
// Default any newly-created user to the "USER" role unless explicitly set.
exports.prisma.$use(async (params, next) => {
    if (params.model === "Users" && params.action === "create") {
        const data = params.args?.data;
        if (data && data.roleId == null && data.role == null) {
            params.args.data = {
                ...params.args.data,
                role: { connect: { name: "USER" } },
            };
        }
    }
    return next(params);
});
//# sourceMappingURL=prisma.js.map