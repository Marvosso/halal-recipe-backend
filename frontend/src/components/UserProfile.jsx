import React, { useState, useEffect } from "react";
import { User, BookOpen, Heart, Users, Settings, Moon, Sun, Bell, Shield, HelpCircle, LogOut, Camera, CreditCard } from "lucide-react";
import RecipePost from "./RecipePost";
import { useTheme } from "../contexts/ThemeContext";
import HelpModal from "./HelpModal";
import PrivacyModal from "./PrivacyModal";
import NotificationsModal from "./NotificationsModal";
import AccountModal from "./AccountModal";
import EditProfileModal from "./EditProfileModal";
import HalalPreferencesModal from "./HalalPreferencesModal";
import SubscriptionManagement from "./SubscriptionManagement";
import { getUserData, isAuthenticated, clearAuth } from "../api/authApi";
import { getProfile } from "../api/profileApi";
import { getMyRecipes } from "../api/recipesApi";
import LanguageSwitcher from "./LanguageSwitcher";
import logger from "../utils/logger";
import "./UserProfile.css";

function UserProfile() {
  const { theme, toggleTheme } = useTheme();
  const [userStats, setUserStats] = useState({
    recipesConverted: 0,
    recipesShared: 0,
    likesReceived: 0,
    followers: 0,
    following: 0,
  });
  const [userPosts, setUserPosts] = useState([]);
  const [savedPosts, setSavedPosts] = useState([]);
  const [savedRecipes, setSavedRecipes] = useState([]);
  const [activeProfileTab, setActiveProfileTab] = useState("recipes"); // "recipes", "saved", or "subscription"
  const [profile, setProfile] = useState({
    displayName: "",
    bio: "",
    profilePhoto: null,
    email: "",
  });
  const [isLoading, setIsLoading] = useState(true);
  
  // Modal states
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false);
  const [isNotificationsModalOpen, setIsNotificationsModalOpen] = useState(false);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [isEditProfileModalOpen, setIsEditProfileModalOpen] = useState(false);
  const [isHalalPreferencesModalOpen, setIsHalalPreferencesModalOpen] = useState(false);

  useEffect(() => {
    loadUserData();
    loadProfileData();
    loadSavedRecipes();
    
    // Listen for profile updates
    const handleProfileUpdate = () => {
      loadProfileData();
    };
    
    // Listen for saved recipes updates
    const handleRecipesUpdate = () => {
      loadSavedRecipes();
    };
    
    window.addEventListener("profileUpdated", handleProfileUpdate);
    window.addEventListener("recipesUpdated", handleRecipesUpdate);
    return () => {
      window.removeEventListener("profileUpdated", handleProfileUpdate);
      window.removeEventListener("recipesUpdated", handleRecipesUpdate);
    };
  }, []);
  
  const loadSavedRecipes = () => {
    try {
      const saved = localStorage.getItem("halalRecipes");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setSavedRecipes(parsed);
        }
      }
    } catch (error) {
      logger.error("Error loading saved recipes:", error);
    }
  };

  const loadUserData = async () => {
    try {
      if (isAuthenticated()) {
        // Fetch user's recipes from API
        try {
          const recipes = await getMyRecipes();
          const publicRecipes = recipes.filter(r => r.isPublic === true);
          setUserPosts(publicRecipes);
          
          const likesReceived = publicRecipes.reduce((sum, post) => sum + (post.likes || 0), 0);
          const recipesConverted = parseInt(localStorage.getItem("userRecipesConverted") || "0");
          
          setUserStats({
            recipesConverted,
            recipesShared: publicRecipes.length,
            likesReceived,
            followers: 0,
            following: 0,
          });
        } catch (apiError) {
          logger.error("Error loading recipes from API:", apiError);
          // Fallback to localStorage
          loadFromLocalStorage();
        }
      } else {
        // Not authenticated - use localStorage
        loadFromLocalStorage();
      }
    } catch (error) {
      logger.error("Error loading user data:", error);
      loadFromLocalStorage();
    } finally {
      setIsLoading(false);
    }
  };

  const loadFromLocalStorage = () => {
    try {
      const posts = JSON.parse(localStorage.getItem("halalKitchenPosts") || "[]");
      const currentUserId = getUserData()?.id || "current_user";
      const userPosts = posts.filter((p) => p.userId === currentUserId);
      setUserPosts(userPosts);

      const saved = JSON.parse(localStorage.getItem("halalKitchenSavedPosts") || "[]");
      setSavedPosts(saved);

      const recipesConverted = parseInt(localStorage.getItem("userRecipesConverted") || "0");
      const likesReceived = userPosts.reduce((sum, post) => sum + (post.likes || 0), 0);

      setUserStats({
        recipesConverted,
        recipesShared: userPosts.length,
        likesReceived,
        followers: 0,
        following: 0,
      });
    } catch (error) {
      logger.error("Error loading from localStorage:", error);
    }
  };

  const loadProfileData = async () => {
    try {
      if (isAuthenticated()) {
        // Fetch profile from API
        try {
          const userProfile = await getProfile();
          setProfile({
            displayName: userProfile.displayName || "",
            bio: userProfile.bio || "",
            profilePhoto: userProfile.profilePhoto || null,
            email: userProfile.email || "",
          });
        } catch (apiError) {
          logger.error("Error loading profile from API:", apiError);
          // Fallback to localStorage
          loadProfileFromLocalStorage();
        }
      } else {
        // Not authenticated - use localStorage
        loadProfileFromLocalStorage();
      }
    } catch (error) {
      logger.error("Error loading profile:", error);
      loadProfileFromLocalStorage();
    }
  };

  const loadProfileFromLocalStorage = () => {
    try {
      const userData = getUserData();
      if (userData) {
        setProfile({
          displayName: userData.displayName || "",
          bio: userData.bio || "",
          profilePhoto: userData.profilePhoto || null,
          email: userData.email || "",
        });
      } else {
        // Try old localStorage format
        const saved = localStorage.getItem("userProfile");
        if (saved) {
          const parsed = JSON.parse(saved);
          setProfile({
            displayName: parsed.displayName || "",
            bio: parsed.bio || "",
            profilePhoto: null,
            email: "",
          });
        }
      }
    } catch (error) {
      logger.error("Error loading profile from localStorage:", error);
    }
  };

  const handleLogOut = () => {
    if (isAuthenticated()) {
      if (confirm("Are you sure you want to log out?")) {
        clearAuth();
        setProfile({
          displayName: "",
          bio: "",
          profilePhoto: null,
          email: "",
        });
        setUserPosts([]);
        setUserStats({
          recipesConverted: 0,
          recipesShared: 0,
          likesReceived: 0,
          followers: 0,
          following: 0,
        });
        window.location.reload();
      }
    } else {
      alert("You are not currently logged in.");
    }
  };

  const handleLike = (postId) => {
    setUserPosts((prev) =>
      prev.map((post) =>
        post.id === postId
          ? {
              ...post,
              isLiked: !post.isLiked,
              likes: post.isLiked ? post.likes - 1 : post.likes + 1,
            }
          : post
      )
    );
  };

  const handleSave = (postId) => {
    // Toggle save
    const isSaved = savedPosts.some((p) => p.id === postId);
    if (isSaved) {
      setSavedPosts(savedPosts.filter((p) => p.id !== postId));
    } else {
      const post = userPosts.find((p) => p.id === postId);
      if (post) {
        setSavedPosts([...savedPosts, post]);
      }
    }
    localStorage.setItem("halalKitchenSavedPosts", JSON.stringify(savedPosts));
  };

  return (
    <div className="user-profile">
      {/* Profile Header */}
      <div className="profile-header">
        <div className="profile-avatar-large">
          {profile.profilePhoto ? (
            <img 
              src={profile.profilePhoto.startsWith('/') ? `${window.location.origin}${profile.profilePhoto}` : profile.profilePhoto}
              alt={profile.displayName || "Profile"}
              className="profile-photo-large"
            />
          ) : (
            <div 
              className="avatar-placeholder-large"
              style={{ background: "linear-gradient(135deg, #0A9D58 0%, var(--accent-gold) 100%)" }}
            >
              <User className="avatar-icon" />
            </div>
          )}
        </div>
        <div className="profile-info">
          <h1 className="profile-username">
            {profile.displayName || (isAuthenticated() ? "Your Profile" : "Guest User")}
          </h1>
          {profile.email && (
            <p className="profile-email">{profile.email}</p>
          )}
          {profile.bio && (
            <p className="profile-bio">{profile.bio}</p>
          )}
          {isAuthenticated() ? (
            <button 
              className="edit-profile-btn"
              onClick={() => setIsEditProfileModalOpen(true)}
              aria-label="Edit profile"
            >
              <Settings className="settings-icon" />
              Edit Profile
            </button>
          ) : (
            <div className="profile-auth-buttons">
              <button 
                className="edit-profile-btn"
                onClick={() => {
                  window.dispatchEvent(new CustomEvent("showAuthModal", { detail: { mode: "register" } }));
                }}
                aria-label="Create account"
              >
                <User className="settings-icon" />
                Create Account
              </button>
              <button 
                className="edit-profile-btn secondary"
                onClick={() => {
                  window.dispatchEvent(new CustomEvent("showAuthModal", { detail: { mode: "login" } }));
                }}
                aria-label="Log in"
              >
                Log In
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <BookOpen className="stat-icon" />
          <div className="stat-content">
            <div className="stat-value">{userStats.recipesConverted}</div>
            <div className="stat-label">Recipes Converted</div>
          </div>
        </div>
        <div className="stat-card">
          <Heart className="stat-icon" />
          <div className="stat-content">
            <div className="stat-value">{userStats.recipesShared}</div>
            <div className="stat-label">Recipes Shared</div>
          </div>
        </div>
        <div className="stat-card">
          <Heart className="stat-icon liked" />
          <div className="stat-content">
            <div className="stat-value">{userStats.likesReceived}</div>
            <div className="stat-label">Likes Received</div>
          </div>
        </div>
        <div className="stat-card">
          <Users className="stat-icon" />
          <div className="stat-content">
            <div className="stat-value">{userStats.followers}</div>
            <div className="stat-label">Followers</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="profile-tabs">
        <button 
          className={`profile-tab ${activeProfileTab === "recipes" ? "active" : ""}`}
          onClick={() => setActiveProfileTab("recipes")}
        >
          My Recipes
        </button>
        <button 
          className={`profile-tab ${activeProfileTab === "saved" ? "active" : ""}`}
          onClick={() => setActiveProfileTab("saved")}
        >
          Saved
        </button>
        {isAuthenticated() && (
          <button 
            className={`profile-tab ${activeProfileTab === "subscription" ? "active" : ""}`}
            onClick={() => setActiveProfileTab("subscription")}
          >
            <CreditCard size={16} />
            Subscription
          </button>
        )}
      </div>

      {/* Settings Section */}
      <div className="profile-settings">
        <h3 className="settings-title">Settings</h3>
        <div className="settings-list">
          <button 
            className="settings-item"
            onClick={() => setIsAccountModalOpen(true)}
            aria-label="Open account information"
          >
            <User className="settings-icon" />
            <span>Account</span>
          </button>
          <button 
            className="settings-item"
            onClick={() => setIsHalalPreferencesModalOpen(true)}
            aria-label="Open halal preferences"
          >
            <BookOpen className="settings-icon" />
            <span>Halal Preferences</span>
          </button>
          <button 
            className="settings-item"
            onClick={() => setIsNotificationsModalOpen(true)}
            aria-label="Open notification settings"
          >
            <Bell className="settings-icon" />
            <span>Notifications</span>
          </button>
          <button 
            className="settings-item"
            onClick={() => setIsPrivacyModalOpen(true)}
            aria-label="Open privacy information"
          >
            <Shield className="settings-icon" />
            <span>Privacy</span>
          </button>
          <button 
            className="settings-item"
            onClick={() => setIsHelpModalOpen(true)}
            aria-label="Open help and support"
          >
            <HelpCircle className="settings-icon" />
            <span>Help</span>
          </button>
          <div className="settings-item language-switcher-item">
            <LanguageSwitcher />
          </div>
          <button 
            className="settings-item" 
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
          >
            {theme === "dark" ? (
              <>
                <Sun className="settings-icon" />
                <span>Light Mode</span>
              </>
            ) : (
              <>
                <Moon className="settings-icon" />
                <span>Dark Mode</span>
              </>
            )}
          </button>
          <button 
            className="settings-item logout"
            onClick={handleLogOut}
            aria-label="Log out"
          >
            <LogOut className="settings-icon" />
            <span>Log Out</span>
          </button>
        </div>
      </div>

      {/* Subscription Section */}
      {activeProfileTab === "subscription" && isAuthenticated() && (
        <div className="profile-subscription">
          <SubscriptionManagement />
        </div>
      )}

      {/* Posts Section */}
      {activeProfileTab !== "subscription" && (
      <div className="profile-posts">
        {activeProfileTab === "recipes" ? (
          userPosts.length === 0 ? (
            <div className="empty-state">
              <BookOpen className="empty-icon" />
              <h3>No recipes shared yet</h3>
              <p>Start converting and sharing recipes to build your profile!</p>
            </div>
          ) : (
            <div className="posts-list">
              {userPosts.map((post) => (
                <RecipePost
                  key={post.id}
                  post={post}
                  onLike={handleLike}
                  onSave={handleSave}
                />
              ))}
            </div>
          )
        ) : (
          savedRecipes.length === 0 ? (
            <div className="empty-state">
              <Heart className="empty-icon" />
              <h3>No saved recipes yet</h3>
              <p>Save recipes from the Convert tab to view them here!</p>
            </div>
          ) : (
            <div className="posts-list">
              {savedRecipes.map((recipe) => (
                <div key={recipe.id || recipe.title} className="saved-recipe-card">
                  <h4>{recipe.title || "Untitled Recipe"}</h4>
                  <p className="saved-recipe-preview">
                    {recipe.originalText ? recipe.originalText.substring(0, 150) + "..." : "No preview available"}
                  </p>
                  <button
                    className="load-recipe-btn"
                    onClick={() => {
                      // Load recipe into converter
                      window.dispatchEvent(new CustomEvent("loadRecipe", { 
                        detail: { 
                          recipe: recipe.originalText || recipe.originalRecipe || "",
                          converted: recipe.convertedText || recipe.convertedRecipe || "",
                          issues: recipe.issues || []
                        } 
                      }));
                      // Switch to convert tab
                      window.dispatchEvent(new CustomEvent("switchTab", { detail: { tab: "convert" } }));
                    }}
                  >
                    Load Recipe
                  </button>
                </div>
              ))}
            </div>
          )
        )}
      </div>
      )}

      {/* Modals */}
      <HelpModal 
        isOpen={isHelpModalOpen} 
        onClose={() => setIsHelpModalOpen(false)} 
      />
      <PrivacyModal 
        isOpen={isPrivacyModalOpen} 
        onClose={() => setIsPrivacyModalOpen(false)} 
      />
      <NotificationsModal 
        isOpen={isNotificationsModalOpen} 
        onClose={() => setIsNotificationsModalOpen(false)} 
      />
      <AccountModal 
        isOpen={isAccountModalOpen} 
        onClose={() => setIsAccountModalOpen(false)} 
      />
      <EditProfileModal 
        isOpen={isEditProfileModalOpen} 
        onClose={() => setIsEditProfileModalOpen(false)} 
      />
      <HalalPreferencesModal 
        isOpen={isHalalPreferencesModalOpen} 
        onClose={() => setIsHalalPreferencesModalOpen(false)}
        onSettingsChange={(settings) => {
          // Settings are already saved in localStorage by the modal
          console.log("Halal preferences updated:", settings);
        }}
      />
    </div>
  );
}

export default UserProfile;
