import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../middleware/auth.js";
import { createUser, getUserByEmail, verifyUserPassword, getUserById } from "../db/users.js";
import { createProfile } from "../db/profiles.js";
import { getPool } from "../database.js";

const router = express.Router();

/**
 * GET /api/auth/test
 * Test route to verify auth routes are mounted correctly
 */
router.get("/test", (req, res) => {
  res.json({ ok: true, message: "Auth routes are working", timestamp: new Date().toISOString() });
});

/**
 * POST /api/auth/register
 * Register a new user (using PostgreSQL)
 */
router.post("/register", async (req, res) => {
  try {
    const { email, password, displayName } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters" });
    }

    const pool = getPool();
    const client = await pool.connect();

    try {
      // Start transaction
      await client.query("BEGIN");

      // Create user in PostgreSQL
      let user;
      try {
        user = await createUser(email, password);
      } catch (userError) {
        await client.query("ROLLBACK");
        if (userError.message === "Email already exists") {
          return res.status(400).json({ error: "User with this email already exists" });
        }
        throw userError;
      }

      // Update display_name if provided
      if (displayName && displayName !== user.display_name) {
        await client.query(
          `UPDATE users SET display_name = $1 WHERE id = $2`,
          [displayName, user.id]
        );
        user.display_name = displayName;
      }

      // Create profile with default values
      const profile = await createProfile(user.id, {
        displayName: displayName || user.display_name || email.split("@")[0],
        halalStandard: "standard",
        schoolOfThought: "hanafi",
        language: "en",
        theme: "light",
      });

      // Commit transaction
      await client.query("COMMIT");

      // Generate JWT token
      const token = jwt.sign(
        { userId: user.id, email: user.email },
        JWT_SECRET,
        { expiresIn: "30d" }
      );

      // Return user data in format compatible with frontend
      const userResponse = {
        id: user.id,
        email: user.email,
        displayName: user.display_name || email.split("@")[0],
        username: user.display_name || email.split("@")[0],
        profile_image_url: user.profile_image_url || null,
        profilePhoto: user.profile_image_url || null, // Backward compatibility
        profile_photo_url: user.profile_image_url || null, // Backward compatibility
        created_at: user.created_at,
        createdAt: user.created_at, // Backward compatibility
      };

      res.status(201).json({
        message: "User registered successfully",
        token,
        user: userResponse,
      });
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Error in register:", error);
    res.status(500).json({ 
      error: error.message || "Registration failed. Please try again." 
    });
  }
});

/**
 * POST /api/auth/login
 * Login user (using PostgreSQL)
 */
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    // Verify password using DB helper
    const user = await verifyUserPassword(email, password);

    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: "30d" }
    );

    // Return user data in format compatible with frontend
    const userResponse = {
      id: user.id,
      email: user.email,
      displayName: user.display_name || email.split("@")[0],
      username: user.display_name || email.split("@")[0],
      profile_image_url: user.profile_image_url || null,
      profilePhoto: user.profile_image_url || null, // Backward compatibility
      profile_photo_url: user.profile_image_url || null, // Backward compatibility
      created_at: user.created_at,
      createdAt: user.created_at, // Backward compatibility
    };

    res.json({
      message: "Login successful",
      token,
      user: userResponse,
    });
  } catch (error) {
    console.error("Error in login:", error);
    res.status(500).json({ error: "Login failed. Please try again." });
  }
});

/**
 * GET /api/auth/me
 * Get current user (protected route, using PostgreSQL)
 */
router.get("/me", async (req, res) => {
  try {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Get user from PostgreSQL
    const user = await getUserById(decoded.userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Return user data in format compatible with frontend
    const userResponse = {
      id: user.id,
      email: user.email,
      displayName: user.display_name || user.email.split("@")[0],
      username: user.display_name || user.email.split("@")[0],
      profile_image_url: user.profile_image_url || null,
      profilePhoto: user.profile_image_url || null, // Backward compatibility
      profile_photo_url: user.profile_image_url || null, // Backward compatibility
      created_at: user.created_at,
      createdAt: user.created_at, // Backward compatibility
    };

    res.json({ user: userResponse });
  } catch (error) {
    console.error("Error in /me:", error);
    res.status(401).json({ error: "Invalid or expired token" });
  }
});

export default router;
