/**
 * Profiles Data Access Layer
 * Handles all database operations for profiles table
 */

import { getPool } from "../database.js";

/**
 * Create a profile for a user
 * @param {string|number} userId - User ID (UUID or number)
 * @param {Object} profileData - Profile data
 * @param {string} [profileData.displayName] - Display name
 * @param {string} [profileData.avatarUrl] - Avatar URL
 * @param {string} [profileData.halalStandard] - Halal standard (default: 'standard')
 * @param {string} [profileData.schoolOfThought] - School of thought (default: 'hanafi')
 * @param {string} [profileData.language] - Language (default: 'en')
 * @param {string} [profileData.theme] - Theme (default: 'light')
 * @returns {Promise<Object>} Created profile object
 */
export async function createProfile(userId, profileData = {}) {
  if (!userId) {
    throw new Error("User ID is required");
  }

  const pool = getPool();
  const client = await pool.connect();

  try {
    const result = await client.query(
      `INSERT INTO profiles (
        user_id, display_name, avatar_url,
        halal_standard, school_of_thought, language, theme
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *`,
      [
        userId,
        profileData.displayName || null,
        profileData.avatarUrl || null,
        profileData.halalStandard || "standard",
        profileData.schoolOfThought || "hanafi",
        profileData.language || "en",
        profileData.theme || "light",
      ]
    );

    return result.rows[0];
  } catch (error) {
    // Handle foreign key violation (user doesn't exist)
    if (error.code === "23503") {
      throw new Error("User not found");
    }
    // Handle duplicate user_id
    if (error.code === "23505") {
      throw new Error("Profile already exists for this user");
    }
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Get profile by user ID
 * @param {number} userId - User ID
 * @returns {Promise<Object|null>} Profile object, or null if not found
 */
export async function getProfileByUserId(userId) {
  if (!userId) {
    return null;
  }

  const pool = getPool();
  const client = await pool.connect();

  try {
    const result = await client.query(
      `SELECT * FROM profiles WHERE user_id = $1`,
      [userId]
    );

    return result.rows[0] || null;
  } finally {
    client.release();
  }
}

/**
 * Update profile
 * @param {number} userId - User ID
 * @param {Object} profileData - Profile data to update
 * @returns {Promise<Object>} Updated profile object
 */
export async function updateProfile(userId, profileData) {
  if (!userId) {
    throw new Error("User ID is required");
  }

  const pool = getPool();
  const client = await pool.connect();

  try {
    // Build dynamic update query
    const fields = [];
    const values = [];
    let paramIndex = 1;

    if (profileData.displayName !== undefined) {
      fields.push(`display_name = $${paramIndex++}`);
      values.push(profileData.displayName);
    }
    if (profileData.avatarUrl !== undefined) {
      fields.push(`avatar_url = $${paramIndex++}`);
      values.push(profileData.avatarUrl);
    }
    if (profileData.halalStandard !== undefined) {
      fields.push(`halal_standard = $${paramIndex++}`);
      values.push(profileData.halalStandard);
    }
    if (profileData.schoolOfThought !== undefined) {
      fields.push(`school_of_thought = $${paramIndex++}`);
      values.push(profileData.schoolOfThought);
    }
    if (profileData.language !== undefined) {
      fields.push(`language = $${paramIndex++}`);
      values.push(profileData.language);
    }
    if (profileData.theme !== undefined) {
      fields.push(`theme = $${paramIndex++}`);
      values.push(profileData.theme);
    }

    if (fields.length === 0) {
      // No fields to update, return existing profile
      return await getProfileByUserId(userId);
    }

    values.push(userId);
    const result = await client.query(
      `UPDATE profiles
       SET ${fields.join(", ")}
       WHERE user_id = $${paramIndex}
       RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      throw new Error("Profile not found");
    }

    return result.rows[0];
  } finally {
    client.release();
  }
}

/**
 * Get user with profile (joined)
 * @param {number} userId - User ID
 * @returns {Promise<Object|null>} User object with profile, or null if not found
 */
export async function getUserWithProfile(userId) {
  if (!userId) {
    return null;
  }

  const pool = getPool();
  const client = await pool.connect();

  try {
    const result = await client.query(
      `SELECT 
        u.id, u.email, u.created_at,
        p.id as profile_id, p.display_name, p.avatar_url,
        p.halal_standard, p.school_of_thought, p.language, p.theme,
        p.created_at as profile_created_at
       FROM users u
       LEFT JOIN profiles p ON u.id = p.user_id
       WHERE u.id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    return {
      id: row.id,
      email: row.email,
      created_at: row.created_at,
      profile: row.profile_id ? {
        id: row.profile_id,
        display_name: row.display_name,
        avatar_url: row.avatar_url,
        halal_standard: row.halal_standard,
        school_of_thought: row.school_of_thought,
        language: row.language,
        theme: row.theme,
        created_at: row.profile_created_at,
      } : null,
    };
  } finally {
    client.release();
  }
}

/**
 * Get all users with profiles (for dev/testing)
 * @returns {Promise<Array>} Array of user objects with profiles (without password_hash)
 */
export async function getAllUsersWithProfiles() {
  const pool = getPool();
  const client = await pool.connect();

  try {
    const result = await client.query(
      `SELECT 
        u.id, u.email, u.created_at,
        p.id as profile_id, p.display_name, p.avatar_url,
        p.halal_standard, p.school_of_thought, p.language, p.theme,
        p.created_at as profile_created_at
       FROM users u
       LEFT JOIN profiles p ON u.id = p.user_id
       ORDER BY u.created_at DESC`
    );

    return result.rows.map((row) => ({
      id: row.id,
      email: row.email,
      created_at: row.created_at,
      profile: row.profile_id ? {
        id: row.profile_id,
        display_name: row.display_name,
        avatar_url: row.avatar_url,
        halal_standard: row.halal_standard,
        school_of_thought: row.school_of_thought,
        language: row.language,
        theme: row.theme,
        created_at: row.profile_created_at,
      } : null,
    }));
  } finally {
    client.release();
  }
}
