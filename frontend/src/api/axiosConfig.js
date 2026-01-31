import axios from "axios";
import { getAPIBaseURL } from "../utils/apiConfig";
import { getAuthToken } from "./authApi";
import logger from "../utils/logger";

/**
 * Creates an axios instance with the auto-detected base URL
 * This instance will automatically use the correct backend URL
 * based on whether the device is mobile or desktop
 */
let axiosInstance = null;

/**
 * Gets or creates the configured axios instance
 * @returns {Promise<axios.AxiosInstance>} Configured axios instance
 */
export async function getAxiosInstance() {
  if (axiosInstance) {
    // Update auth token in headers if available
    const token = getAuthToken();
    if (token) {
      axiosInstance.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    } else {
      delete axiosInstance.defaults.headers.common["Authorization"];
    }
    return axiosInstance;
  }
  
  const baseURL = await getAPIBaseURL();
  const token = getAuthToken();
  
  axiosInstance = axios.create({
    baseURL: baseURL,
    timeout: 30000, // 30 second timeout
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    }
  });
  
  // Add request interceptor to include auth token
  axiosInstance.interceptors.request.use(
    (config) => {
      const token = getAuthToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );
  
  // Add response interceptor for error handling
  axiosInstance.interceptors.response.use(
    (response) => response,
    (error) => {
      logger.error("API Error:", error);
      if (error.code === "ECONNREFUSED" || error.message.includes("Network Error")) {
        logger.error("Backend server not reachable. Please ensure the server is running.");
      }
      return Promise.reject(error);
    }
  );
  
  return axiosInstance;
}

/**
 * Resets the axios instance (useful for testing or re-detection)
 */
export function resetAxiosInstance() {
  axiosInstance = null;
}
