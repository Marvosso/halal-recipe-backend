/**
 * Run a single SQL migration file against DATABASE_URL.
 * Usage: node scripts/run-migration.js src/migrations/13_ingredient_intelligence_phase1.sql
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rel = process.argv[2];
if (!rel) {
  console.error("Usage: node scripts/run-migration.js <path-to.sql>");
  process.exit(1);
}

const sqlPath = path.resolve(__dirname, "..", rel);
const sql = fs.readFileSync(sqlPath, "utf8");

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is required");
  process.exit(1);
}

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
try {
  await pool.query(sql);
  console.log(`✅ Applied migration: ${rel}`);
} catch (err) {
  console.error("❌ Migration failed:", err.message);
  process.exit(1);
} finally {
  await pool.end();
}
