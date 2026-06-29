/**
 * Apply MVP launch migrations in order (idempotent SQL).
 * Usage: npm run migrate:mvp
 * Requires DATABASE_URL in backend/.env or environment.
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

const MVP_MIGRATIONS = [
  "src/migrations/00_create_core_tables.sql",
  "src/migrations/13_ingredient_intelligence_phase1.sql",
  "src/migrations/15_saved_halal_recipes.sql",
  "src/migrations/14_ai_explanation_cache.sql",
  "src/migrations/create_conversion_history_table.sql",
];

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is required");
  process.exit(1);
}

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

try {
  for (const rel of MVP_MIGRATIONS) {
    const sqlPath = path.join(root, rel);
    const sql = fs.readFileSync(sqlPath, "utf8");
    console.log(`Applying ${rel}...`);
    await pool.query(sql);
    console.log(`✅ ${rel}`);
  }
  console.log("\n✅ All MVP migrations applied.");
} catch (err) {
  console.error("\n❌ Migration failed:", err.message);
  process.exit(1);
} finally {
  await pool.end();
}
