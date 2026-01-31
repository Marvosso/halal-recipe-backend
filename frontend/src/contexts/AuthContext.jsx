/**
 * Authentication Context
 * Provides user authentication state and methods throughout the app
 * Uses localStorage for session persistence (JWT token)
 */

import React, { createContext, useContext, useState, useEffect } from "react";
import { 
  getAuthToken, 
  getUserData, 
  clearAuth, 
  getCurrentUser as getCurrentUserAPI,
  saveAuth 
} from "../api/authApi";
import logger from "../utils/logger";

const AuthContext = createContext(null);

/**
 * AuthProvider component
 * Wraps the app and provides authentication context
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Load user from localStorage or API on mount
  useEffect(() => {
    loadUser();
  }, []);

  /**
   * Load user from token (check localStorage, then API)
   */
  const loadUser = async () => {
    try {
      const token = getAuthToken();
      if (!token) {
        // Try loading from localStorage (guest mode)
        const userData = getUserData();
        if (userData) {
          setUser(userData);
          setIsAuthenticated(true);
        }
        setIsLoading(false);
        return;
      }

      // Verify token with API
      try {
        const userData = await getCurrentUserAPI();
        if (userData) {
          setUser(userData);
          setIsAuthenticated(true);
          saveAuth(token, userData); // Update localStorage
        } else {
          // Token invalid, clear auth
          clearAuth();
          setUser(null);
          setIsAuthenticated(false);
        }
      } catch (error) {
        logger.error("Error loading user from API:", error);
        // Token might be invalid, clear it
        clearAuth();
        setUser(null);
        setIsAuthenticated(false);
      }
    } catch (error) {
      logger.error("Error loading user:", error);
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Update user data (called after login/register/profile update)
   */
  const updateUser = (userData) => {
    if (userData) {
      setUser(userData);
      setIsAuthenticated(true);
    } else {
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  /**
   * Logout user
   */
  const logout = () => {
    clearAuth();
    setUser(null);
    setIsAuthenticated(false);
    // Reload page to reset state
    window.location.reload();
  };

  const value = {
    user,
    isAuthenticated,
    isLoading,
    updateUser,
    logout,
    refreshUser: loadUser
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Hook to use authentication context
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
