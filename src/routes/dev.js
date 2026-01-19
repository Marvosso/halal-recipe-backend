/**
 * Development Routes
 * Temporary routes for testing database operations
 * ⚠️ These routes should be removed or protected in production
 */

import express from "express";
import bcrypt from "bcrypt";
import { getPool } from "../database.js";
import { getAllUsersWithProfiles } from "../db/profiles.js";

const router = express.Router();

/**
 * POST /api/dev/create-user
 * Creates a new user and profile in a transaction
 * Body: { email: string, password: string }
 */
router.post("/create-user", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: "Email and password are required",
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: "Invalid email format",
      });
    }

    // Validate password length
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        error: "Password must be at least 6 characters",
      });
    }

    const pool = getPool();
    const client = await pool.connect();

    try {
      // Start transaction
      await client.query("BEGIN");

      // Hash password
      const passwordHash = await bcrypt.hash(password, 10);
      const emailLower = email.toLowerCase().trim();

      // Create user (within transaction)
      let userResult;
      try {
        userResult = await client.query(
          `INSERT INTO users (email, password_hash)
           VALUES ($1, $2)
           RETURNING id, email, created_at`,
          [emailLower, passwordHash]
        );
      } catch (userError) {
        await client.query("ROLLBACK");
        if (userError.code === "23505") {
          // PostgreSQL unique violation
          return res.status(409).json({
            success: false,
            error: "Email already exists",
          });
        }
        throw userError;
      }

      const user = userResult.rows[0];

      // Create profile with default values (within transaction)
      const profileResult = await client.query(
        `INSERT INTO profiles (
          user_id, display_name, avatar_url,
          halal_standard, school_of_thought, language, theme
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *`,
        [
          user.id,
          email.split("@")[0], // Use email prefix as default display name
          null, // avatar_url
          "standard", // halal_standard
          "hanafi", // school_of_thought
          "en", // language
          "light", // theme
        ]
      );

      const profile = profileResult.rows[0];

      // Commit transaction
      await client.query("COMMIT");

      res.status(201).json({
        success: true,
        message: "User and profile created successfully",
        user: {
          id: user.id,
          email: user.email,
          created_at: user.created_at,
        },
        profile: {
          id: profile.id,
          display_name: profile.display_name,
          halal_standard: profile.halal_standard,
          school_of_thought: profile.school_of_thought,
          language: profile.language,
          theme: profile.theme,
        },
      });
    } catch (error) {
      // Rollback on any error
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Error creating user:", error);
    res.status(500).json({
      success: false,
      error: "Failed to create user",
      message: error.message,
    });
  }
});

/**
 * GET /api/dev/users
 * Returns all users with their profiles (no password_hash)
 */
router.get("/users", async (req, res) => {
  try {
    const users = await getAllUsersWithProfiles();

    res.json({
      success: true,
      count: users.length,
      users: users,
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch users",
      message: error.message,
    });
  }
});

export default router;
