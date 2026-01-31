import { getAxiosInstance } from "./axiosConfig";
import { getAuthToken } from "./authApi";
import logger from "../utils/logger";

/**
 * Profile API service
 * Handles user profile operations
 */

/**
 * Get user profile
 */
export async function getProfile() {
  try {
    const token = getAuthToken();
    if (!token) {
      throw new Error("Not authenticated");
    }

    const axios = await getAxiosInstance();
    const response = await axios.get("/api/profile", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return response.data.user;
  } catch (error) {
    logger.error("Get profile error:", error);
    throw error.response?.data || { error: "Failed to fetch profile" };
  }
}

/**
 * Update user profile
 */
export async function updateProfile(profileData) {
  try {
    const token = getAuthToken();
    if (!token) {
      throw new Error("Not authenticated");
    }

    const axios = await getAxiosInstance();
    const response = await axios.put("/api/profile", profileData, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    return response.data.user;
  } catch (error) {
    logger.error("Update profile error:", error);
    throw error.response?.data || { error: "Failed to update profile" };
  }
}

/**
 * Upload profile photo
 */
export async function uploadProfilePhoto(file) {
  try {
    const token = getAuthToken();
    if (!token) {
      throw new Error("Not authenticated");
    }

    const formData = new FormData();
    formData.append("photo", file);

    const axios = await getAxiosInstance();
    
    // Use axios with FormData - don't set Content-Type header, let browser set it with boundary
    const response = await axios.post("/api/profile/photo", formData, {
      headers: {
        Authorization: `Bearer ${token}`,
        // Don't set Content-Type - axios will set it with boundary for multipart/form-data
      },
    });

    return response.data.user;
  } catch (error) {
    logger.error("Upload photo error:", error);
    throw error.response?.data || { error: "Failed to upload photo" };
  }
}
