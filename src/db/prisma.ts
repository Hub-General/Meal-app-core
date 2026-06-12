import "dotenv/config";

import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma";

const connectionString = process.env.DATABASE_URL ?? process.env.DIRECT_URL;
if (!connectionString) {
  throw new Error("Missing DATABASE_URL (or DIRECT_URL) environment variable.");
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

export const prisma = new PrismaClient({ adapter });


