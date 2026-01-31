/**
 * Profile Routes
 * Handle user profile management with PostgreSQL
 */

import express from "express";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import { authenticateToken } from "../middleware/auth.js";
import { getUserById, updateUserDisplayName, updateUserProfileImage } from "../db/users.js";
import { getUserWithProfile, updateProfile } from "../db/profiles.js";
import { getRecipesByUserId } from "../db/recipes.js";
import { getPool } from "../database.js";
import { readUsers, writeUsers } from "../utils/dataStorage.js"; // Keep for fallback

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Configure multer for file uploads
const UPLOAD_DIR = path.resolve(__dirname, "../../uploads");
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const userId = req.user?.id || req.user?.userId || "unknown";
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `profile-${userId}-${uniqueSuffix}${ext}`);
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed (jpeg, jpg, png, gif, webp)"));
    }
  },
});

// Helper to check if DB is available
const isDbAvailable = () => {
  try {
    return !!getPool();
  } catch {
    return false;
  }
};

/**
 * GET /api/profile
 * Get user profile (protected)
 * Uses PostgreSQL if available, falls back to JSON file storage
 */
router.get("/", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id || req.user.userId;

    // Try PostgreSQL first
    if (isDbAvailable()) {
      try {
        const userWithProfile = await getUserWithProfile(userId);
        
        if (!userWithProfile) {
          return res.status(404).json({ error: "User not found" });
        }

        // Format for frontend compatibility
        const userResponse = {
          id: userWithProfile.id,
          email: userWithProfile.email,
          displayName: userWithProfile.profile?.display_name || userWithProfile.display_name || userWithProfile.email.split("@")[0],
          username: userWithProfile.profile?.display_name || userWithProfile.display_name || userWithProfile.email.split("@")[0],
          profile_image_url: userWithProfile.profile_image_url || userWithProfile.profile?.avatar_url || null,
          profilePhoto: userWithProfile.profile_image_url || userWithProfile.profile?.avatar_url || null, // Backward compatibility
          profile_photo_url: userWithProfile.profile_image_url || userWithProfile.profile?.avatar_url || null, // Backward compatibility
          created_at: userWithProfile.created_at,
          createdAt: userWithProfile.created_at, // Backward compatibility
          profile: userWithProfile.profile, // Include full profile data
        };

        return res.json({ user: userResponse });
      } catch (dbError) {
        console.error("DB error, falling back to JSON:", dbError);
        // Fall through to JSON fallback
      }
    }

    // Fallback to JSON file storage
    const users = readUsers();
    const user = users.find((u) => u.id === userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const { password: _, ...userWithoutPassword } = user;
    res.json({ user: userWithoutPassword });
  } catch (error) {
    console.error("Error fetching profile:", error);
    res.status(500).json({ error: "Failed to fetch profile" });
  }
});

/**
 * PUT /api/profile
 * Update user profile (protected)
 * Uses PostgreSQL if available, falls back to JSON file storage
 */
router.put("/", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id || req.user.userId;
    const { displayName, username, bio, avatarColor, halal_standard, school_of_thought, language } = req.body;

    // Try PostgreSQL first
    if (isDbAvailable()) {
      try {
        // Update user display_name in users table
        if (displayName !== undefined || username !== undefined) {
          const nameToUpdate = displayName || username;
          const pool = getPool();
          const client = await pool.connect();
          try {
            await client.query(
              `UPDATE users SET display_name = $1 WHERE id = $2`,
              [nameToUpdate, userId]
            );
          } finally {
            client.release();
          }
        }

        // Update profile table
        const profileUpdate = {};
        if (displayName !== undefined || username !== undefined) {
          profileUpdate.displayName = displayName || username;
        }
        if (bio !== undefined) {
          profileUpdate.bio = bio;
        }
        if (halal_standard !== undefined) {
          profileUpdate.halalStandard = halal_standard;
        }
        if (school_of_thought !== undefined) {
          profileUpdate.schoolOfThought = school_of_thought;
        }
        if (language !== undefined) {
          profileUpdate.language = language;
        }

        if (Object.keys(profileUpdate).length > 0) {
          await updateProfile(userId, profileUpdate);
        }

        // Get updated user with profile
        const userWithProfile = await getUserWithProfile(userId);

        // Format for frontend compatibility
        const userResponse = {
          id: userWithProfile.id,
          email: userWithProfile.email,
          displayName: userWithProfile.profile?.display_name || userWithProfile.display_name || userWithProfile.email.split("@")[0],
          username: userWithProfile.profile?.display_name || userWithProfile.display_name || userWithProfile.email.split("@")[0],
          profile_image_url: userWithProfile.profile_image_url || userWithProfile.profile?.avatar_url || null,
          profilePhoto: userWithProfile.profile_image_url || userWithProfile.profile?.avatar_url || null,
          profile_photo_url: userWithProfile.profile_image_url || userWithProfile.profile?.avatar_url || null,
          created_at: userWithProfile.created_at,
          createdAt: userWithProfile.created_at,
        };

        return res.json({
          message: "Profile updated successfully",
          user: userResponse,
        });
      } catch (dbError) {
        console.error("DB error, falling back to JSON:", dbError);
        // Fall through to JSON fallback
      }
    }

    // Fallback to JSON file storage
    const users = readUsers();
    const userIndex = users.findIndex((u) => u.id === userId);

    if (userIndex === -1) {
      return res.status(404).json({ error: "User not found" });
    }

    // Update user fields
    if (displayName !== undefined || username !== undefined) {
      const value = displayName || username;
      users[userIndex].displayName = value;
      users[userIndex].username = value;
    }
    if (bio !== undefined) {
      users[userIndex].bio = bio;
    }
    if (avatarColor !== undefined) {
      users[userIndex].avatarColor = avatarColor;
    }
    if (halal_standard !== undefined) {
      users[userIndex].halal_standard = halal_standard;
    }
    if (school_of_thought !== undefined) {
      users[userIndex].school_of_thought = school_of_thought;
    }
    if (language !== undefined) {
      users[userIndex].language = language;
    }
    users[userIndex].updatedAt = new Date().toISOString();

    writeUsers(users);

    const { password: _, ...userWithoutPassword } = users[userIndex];
    res.json({
      message: "Profile updated successfully",
      user: userWithoutPassword,
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).json({ error: "Failed to update profile" });
  }
});

/**
 * POST /api/profile/photo
 * Upload profile photo (protected)
 * Updates profile_image_url in users table
 */
router.post("/photo", authenticateToken, upload.single("photo"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const userId = req.user.id || req.user.userId;
    const photoUrl = `/uploads/${req.file.filename}`;

    // Try PostgreSQL first
    if (isDbAvailable()) {
      try {
        // Update users table with profile_image_url
        const pool = getPool();
        const client = await pool.connect();
        
        try {
          // Get current user to check for old photo
          const currentUser = await getUserById(userId);
          
          // Delete old photo if exists
          if (currentUser?.profile_image_url) {
            const oldPhotoPath = path.resolve(UPLOAD_DIR, path.basename(currentUser.profile_image_url));
            if (fs.existsSync(oldPhotoPath)) {
              fs.unlinkSync(oldPhotoPath);
            }
          }

          // Update profile_image_url in users table
          await client.query(
            `UPDATE users SET profile_image_url = $1 WHERE id = $2`,
            [photoUrl, userId]
          );

          // Also update profiles.avatar_url for backward compatibility
          await client.query(
            `UPDATE profiles SET avatar_url = $1 WHERE user_id = $2`,
            [photoUrl, userId]
          );
        } finally {
          client.release();
        }

        // Get updated user
        const user = await getUserById(userId);

        const userResponse = {
          id: user.id,
          email: user.email,
          displayName: user.display_name || user.email.split("@")[0],
          username: user.display_name || user.email.split("@")[0],
          profile_image_url: user.profile_image_url || null,
          profilePhoto: user.profile_image_url || null,
          profile_photo_url: user.profile_image_url || null,
          created_at: user.created_at,
          createdAt: user.created_at,
        };

        return res.json({
          message: "Profile photo uploaded successfully",
          user: userResponse,
        });
      } catch (dbError) {
        console.error("DB error, falling back to JSON:", dbError);
        // Fall through to JSON fallback
      }
    }

    // Fallback to JSON file storage
    const users = readUsers();
    const userIndex = users.findIndex((u) => u.id === userId);

    if (userIndex === -1) {
      return res.status(404).json({ error: "User not found" });
    }

    // Delete old photo if exists
    if (users[userIndex].profilePhoto) {
      const oldPhotoPath = path.resolve(UPLOAD_DIR, path.basename(users[userIndex].profilePhoto));
      if (fs.existsSync(oldPhotoPath)) {
        fs.unlinkSync(oldPhotoPath);
      }
    }

    // Update profile photo URL
    users[userIndex].profilePhoto = photoUrl;
    users[userIndex].profile_photo_url = photoUrl;
    users[userIndex].updatedAt = new Date().toISOString();

    writeUsers(users);

    const { password: _, ...userWithoutPassword } = users[userIndex];
    res.json({
      message: "Profile photo uploaded successfully",
      user: userWithoutPassword,
    });
  } catch (error) {
    console.error("Error uploading photo:", error);
    res.status(500).json({ error: "Failed to upload photo" });
  }
});

export default router;
