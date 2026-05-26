/**
 * Explanation cache — memory L1 + optional Postgres L2.
 */

import { getPool } from "../../../database.js";

const MEMORY_MAX = 500;
const DEFAULT_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const memory = new Map();
const memoryOrder = [];

let dbUnavailable = false;

function isDbEnabled() {
  return process.env.INGREDIENT_INTELLIGENCE_DB === "1" && !dbUnavailable;
}

/**
 * @param {string} cacheKey
 * @returns {Promise<object|null>}
 */
export async function getCachedExplanation(cacheKey) {
  if (!cacheKey) return null;

  const mem = memory.get(cacheKey);
  if (mem && mem.expires_at > Date.now()) {
    return mem.payload;
  }
  if (mem) {
    memory.delete(cacheKey);
  }

  if (!isDbEnabled()) return null;

  try {
    const pool = getPool();
    const result = await pool.query(
      `SELECT payload FROM ai_explanation_cache
       WHERE cache_key = $1 AND expires_at > NOW()`,
      [cacheKey]
    );
    if (result.rows.length > 0) {
      const payload = result.rows[0].payload;
      setMemoryCache(cacheKey, payload, DEFAULT_TTL_MS);
      return payload;
    }
  } catch (err) {
    dbUnavailable = true;
    console.warn("[ai-explanation-cache] DB read skipped:", err.message);
  }

  return null;
}

/**
 * @param {string} cacheKey
 * @param {object} payload
 * @param {number} [ttlMs]
 */
export async function setCachedExplanation(cacheKey, payload, ttlMs = DEFAULT_TTL_MS) {
  if (!cacheKey || !payload) return;

  setMemoryCache(cacheKey, payload, ttlMs);

  if (!isDbEnabled()) return;

  try {
    const pool = getPool();
    const expiresAt = new Date(Date.now() + ttlMs);
    await pool.query(
      `INSERT INTO ai_explanation_cache (cache_key, payload, locale, expires_at)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (cache_key) DO UPDATE SET
         payload = EXCLUDED.payload,
         expires_at = EXCLUDED.expires_at`,
      [cacheKey, JSON.stringify(payload), payload.locale || "en", expiresAt]
    );
  } catch (err) {
    dbUnavailable = true;
    console.warn("[ai-explanation-cache] DB write skipped:", err.message);
  }
}

function setMemoryCache(cacheKey, payload, ttlMs) {
  if (memory.size >= MEMORY_MAX && !memory.has(cacheKey)) {
    const oldest = memoryOrder.shift();
    if (oldest) memory.delete(oldest);
  }
  memory.set(cacheKey, { payload, expires_at: Date.now() + ttlMs });
  if (!memoryOrder.includes(cacheKey)) memoryOrder.push(cacheKey);
}

export function clearExplanationMemoryCache() {
  memory.clear();
  memoryOrder.length = 0;
}
