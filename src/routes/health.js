/**
 * Health Check Routes
 * Database connectivity verification endpoint
 */

import express from "express";
import { getPool } from "../database.js";

const router = express.Router();

/**
 * GET /api/health/db
 * Tests database read/write operations
 * Inserts a row and reads it back to verify connectivity
 */
router.get("/db", async (req, res) => {
  try {
    let pool;
    try {
      pool = getPool();
    } catch (error) {
      return res.status(503).json({
        success: false,
        error: "Database not configured",
        message: "DATABASE_URL environment variable is not set",
        timestamp: new Date().toISOString()
      });
    }
    
    const client = await pool.connect();
    
    // Insert a test row
    const insertResult = await client.query(
      "INSERT INTO app_health (status) VALUES ($1) RETURNING id, status, created_at",
      ["ok"]
    );
    
    const insertedRow = insertResult.rows[0];
    
    // Read the latest row
    const readResult = await client.query(
      "SELECT id, status, created_at FROM app_health ORDER BY created_at DESC LIMIT 1"
    );
    
    client.release();
    
    // Verify the data matches
    if (readResult.rows[0].id === insertedRow.id) {
      res.json({
        success: true,
        message: "Database read/write operations successful",
        inserted: {
          id: insertedRow.id,
          status: insertedRow.status,
          created_at: insertedRow.created_at
        },
        latest: {
          id: readResult.rows[0].id,
          status: readResult.rows[0].status,
          created_at: readResult.rows[0].created_at
        },
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(500).json({
        success: false,
        error: "Data mismatch between insert and read operations"
      });
    }
  } catch (error) {
    console.error("Database health check error:", error);
    res.status(500).json({
      success: false,
      error: "Database operation failed",
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

export default router;
