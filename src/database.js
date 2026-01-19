/**
 * PostgreSQL Database Connection
 * Centralized database client for Halal Kitchen backend
 */

import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pg;

// Create connection pool only if DATABASE_URL is available
let pool = null;

if (process.env.DATABASE_URL) {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    // Production-safe connection pool settings
    max: 20, // Maximum number of clients in the pool
    idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
    connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection could not be established
    ssl: process.env.DATABASE_URL?.includes("localhost") 
      ? false 
      : { rejectUnauthorized: false }, // SSL for production (Render PostgreSQL)
  });

  // Handle pool errors (don't crash the server)
  pool.on("error", (err, client) => {
    console.error("Unexpected error on idle client", err);
    // Don't exit - just log the error
  });
} else {
  console.warn("⚠️  DATABASE_URL not found in environment variables");
}

/**
 * Test database connection
 * @returns {Promise<boolean>} True if connection successful
 */
export async function testConnection() {
  if (!pool) {
    console.warn("⚠️  Database pool not initialized (DATABASE_URL missing)");
    return false;
  }
  
  try {
    const client = await pool.connect();
    const result = await client.query("SELECT NOW()");
    client.release();
    console.log("✅ PostgreSQL connection successful");
    console.log(`   Database time: ${result.rows[0].now}`);
    return true;
  } catch (error) {
    console.error("❌ PostgreSQL connection failed:", error.message);
    return false;
  }
}

/**
 * Initialize database schema
 * Creates all required tables if they don't exist
 */
export async function initializeDatabase() {
  if (!pool) {
    console.warn("⚠️  Cannot initialize database (DATABASE_URL missing)");
    return false;
  }
  
  try {
    const client = await pool.connect();
    
    // Create app_health table
    await client.query(`
      CREATE TABLE IF NOT EXISTS app_health (
        id SERIAL PRIMARY KEY,
        status TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    
    // Create users table with UUID
    await client.query(`
      CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
    `);
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        display_name TEXT,
        profile_image_url TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    
    // Create profiles table (merged into users for simplicity, keeping for backward compatibility)
    await client.query(`
      CREATE TABLE IF NOT EXISTS profiles (
        id SERIAL PRIMARY KEY,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        display_name TEXT,
        avatar_url TEXT,
        halal_standard TEXT DEFAULT 'standard',
        school_of_thought TEXT DEFAULT 'hanafi',
        language TEXT DEFAULT 'en',
        theme TEXT DEFAULT 'light',
        created_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(user_id)
      )
    `);
    
    // Create recipes table
    await client.query(`
      CREATE TABLE IF NOT EXISTS recipes (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        original_recipe TEXT,
        converted_recipe TEXT,
        ingredients JSONB,
        instructions TEXT,
        category TEXT DEFAULT 'Main Course',
        hashtags TEXT[],
        media_url TEXT,
        confidence_score INTEGER DEFAULT 0,
        visibility TEXT DEFAULT 'public' CHECK (visibility IN ('public', 'private')),
        likes INTEGER DEFAULT 0,
        comments INTEGER DEFAULT 0,
        shares INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    
    // Create indexes
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id)
    `);
    
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_recipes_user_id ON recipes(user_id)
    `);
    
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_recipes_visibility ON recipes(visibility)
    `);
    
    client.release();
    console.log("✅ Database schema initialized");
    console.log("   - app_health table ready");
    console.log("   - users table ready (UUID)");
    console.log("   - profiles table ready");
    console.log("   - recipes table ready");
    return true;
  } catch (error) {
    console.error("❌ Database initialization failed:", error.message);
    return false;
  }
}

/**
 * Get database pool (for use in routes)
 * @returns {pg.Pool|null} PostgreSQL connection pool or null if not initialized
 */
export function getPool() {
  if (!pool) {
    throw new Error("Database pool not initialized. DATABASE_URL environment variable is required.");
  }
  return pool;
}

/**
 * Graceful shutdown - close all database connections
 */
export async function closePool() {
  if (!pool) {
    return;
  }
  
  try {
    await pool.end();
    console.log("✅ Database connection pool closed");
  } catch (error) {
    console.error("❌ Error closing database pool:", error.message);
  }
}

export default pool || null;
