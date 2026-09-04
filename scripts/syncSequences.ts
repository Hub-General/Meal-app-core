import "dotenv/config";
import { prisma } from "../src/prisma/client";

interface AutoIncrementColumn {
  table_schema: string;
  table_name: string;
  column_name: string;
  sequence_name: string;
}

/**
 * Dynamically discovers every table and column in the database that uses an
 * autoincrement sequence (via PostgreSQL's system catalog), computes the MAX(column),
 * and resets the sequence so that subsequent inserts will never collide with existing IDs.
 */
async function syncAllSequences() {
  console.log("🔍 Scanning PostgreSQL system catalog for all autoincrement sequences...\n");

  // 1. Discover all columns in the public schema that have an associated sequence
  const sequences: AutoIncrementColumn[] = await prisma.$queryRawUnsafe(`
    SELECT 
      c.table_schema,
      c.table_name,
      c.column_name,
      pg_get_serial_sequence('"' || c.table_schema || '"."' || c.table_name || '"', c.column_name) AS sequence_name
    FROM information_schema.columns c
    WHERE c.table_schema = 'public'
      AND pg_get_serial_sequence('"' || c.table_schema || '"."' || c.table_name || '"', c.column_name) IS NOT NULL
    ORDER BY c.table_name, c.column_name;
  `);

  if (!sequences || sequences.length === 0) {
    console.log("No autoincrement sequences found in the public schema.");
    return;
  }

  console.log(`Found ${sequences.length} autoincrement column(s). Synchronizing...\n`);

  for (const item of sequences) {
    const { table_schema, table_name, column_name, sequence_name } = item;

    try {
      // 2. Fetch the current MAX value of this column
      const maxResult: Array<{ max_val: number | bigint | null }> = await prisma.$queryRawUnsafe(
        `SELECT MAX("${column_name}") AS max_val FROM "${table_schema}"."${table_name}";`
      );

      const maxVal = maxResult[0]?.max_val !== null ? Number(maxResult[0]?.max_val) : null;

      if (maxVal !== null && maxVal > 0) {
        // Table has records: advance sequence to MAX(id), next insert will get MAX(id) + 1
        await prisma.$executeRawUnsafe(
          `SELECT setval($1, $2, true);`,
          sequence_name,
          maxVal
        );
        console.log(
          `✓ "${table_name}"."${column_name}" -> sequence set to ${maxVal} (next ID will be ${maxVal + 1})`
        );
      } else {
        // Table is empty: reset sequence to 1 with is_called = false (next insert will get 1)
        await prisma.$executeRawUnsafe(
          `SELECT setval($1, 1, false);`,
          sequence_name
        );
        console.log(
          `✓ "${table_name}"."${column_name}" (empty table) -> sequence reset to 1 (next ID will be 1)`
        );
      }
    } catch (error: any) {
      console.error(
        `✗ Failed to sync "${table_name}"."${column_name}" (sequence: ${sequence_name}):`,
        error.message
      );
    }
  }

  console.log("\n🎉 All database sequences have been synchronized successfully!");
}

syncAllSequences()
  .catch((err) => {
    console.error("Fatal error during sequence synchronization:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
