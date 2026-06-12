const fs = require("node:fs");
const path = require("node:path");

const src = path.join(__dirname, "..", "src", "generated", "prisma");
const dest = path.join(__dirname, "..", "dist", "generated", "prisma");

if (!fs.existsSync(src)) {
  console.error(
    `Missing generated Prisma Client at ${src}. Run prisma generate first.`,
  );
  process.exit(1);
}

fs.mkdirSync(path.dirname(dest), { recursive: true });
fs.cpSync(src, dest, { recursive: true });
console.log(`Copied Prisma client: ${src} -> ${dest}`);

