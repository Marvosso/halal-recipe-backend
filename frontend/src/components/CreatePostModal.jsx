import React, { useState, useEffect } from "react";
import { X, Image, Video, Hash, Send } from "lucide-react";
import MediaUploader from "./MediaUploader";
import { evaluateItem } from "../lib/halalEngine";
import { FEATURES } from "../lib/featureFlags";
import { createRecipe } from "../api/recipesApi";
import { getUserData, isAuthenticated } from "../api/authApi";
import logger from "../utils/logger";
import "./CreatePostModal.css";

function CreatePostModal({ isOpen, onClose, onPost, originalRecipe, convertedRecipe, confidenceScore, issues = [], halalSettings = {} }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [hashtags, setHashtags] = useState("");
  const [category, setCategory] = useState("");
  const [mediaFiles, setMediaFiles] = useState([]);
  const [displayName, setDisplayName] = useState("You");
  const [sharePublicly, setSharePublicly] = useState(false); // Default to private - user must explicitly choose to post publicly
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    // Load user data from API/auth
    const userData = getUserData();
    if (userData?.displayName) {
      setDisplayName(userData.displayName);
    }
  }, []);

  // Reset form when modal opens (ensure private is default)
  useEffect(() => {
    if (isOpen) {
      setSharePublicly(false); // Always default to private when modal opens
      setError("");
    }
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    
    if (!title.trim()) {
      setError("Please enter a recipe title");
      return;
    }

    // Check authentication for posting (both public and private require login)
    if (!isAuthenticated()) {
      setError("Please log in to save recipes");
      // Prompt user to login
      setTimeout(() => {
        onClose();
        window.dispatchEvent(new CustomEvent("showAuthModal", { detail: { mode: "login" } }));
      }, 2000);
      return;
    }

    setIsSubmitting(true);

    try {
      // Enhance issues with Halal Knowledge Model data
      let expandedIssues = [];
      if (FEATURES.HALAL_KNOWLEDGE_ENGINE && Array.isArray(issues) && issues.length > 0) {
        expandedIssues = issues.map((issue) => {
          if (issue?.ingredient) {
            const normalizedIngredient = issue.ingredient.toLowerCase().trim().replace(/\s+/g, "_");
            const engineResult = evaluateItem(normalizedIngredient, {
              madhab: halalSettings?.schoolOfThought || "no-preference",
              strictness: halalSettings?.strictnessLevel || "standard"
            });
            
            return {
              ...issue,
              inheritedFrom: engineResult.inheritedFrom || issue.inheritedFrom,
              alternatives: engineResult.alternatives || issue.alternatives,
              notes: engineResult.notes || issue.notes,
              eli5: engineResult.eli5 || issue.eli5,
              tags: engineResult.tags || issue.tags,
              trace: engineResult.trace || issue.trace || [],
              hkmResult: engineResult
            };
          }
          return issue;
        });
      } else {
        expandedIssues = issues;
      }

      // Convert media files to URLs (for now, use object URLs - can be uploaded to server later)
      const mediaUrls = mediaFiles.map((file) => URL.createObjectURL(file));

      const recipeData = {
        title: title.trim(),
        description: description.trim(),
        originalRecipe: originalRecipe || "",
        convertedRecipe: convertedRecipe || "",
        confidenceScore: confidenceScore || 0,
        category: category || "Main Course",
        hashtags: hashtags
          .split(" ")
          .filter((tag) => tag.trim())
          .map((tag) => (tag.startsWith("#") ? tag : `#${tag}`)),
        mediaUrls: mediaUrls,
        isPublic: sharePublicly,
        ingredients: expandedIssues,
        instructions: description.trim()
      };

      // If authenticated, post to API (both public and private); otherwise fall back to localStorage
      let savedRecipe;
      if (isAuthenticated()) {
        try {
          // Post to API whether public or private
          savedRecipe = await createRecipe(recipeData);
          // Mark as API-saved for App.jsx to handle correctly
          savedRecipe._fromAPI = true;
        } catch (apiError) {
          logger.error("Error creating recipe via API:", apiError);
          // Fall back to localStorage if API fails
          savedRecipe = {
            id: `local_${Date.now()}`,
            ...recipeData,
            userId: getUserData()?.id || "current_user",
            username: displayName || "You",
            mediaType: "image",
            likes: 0,
            comments: 0,
            shares: 0,
            isLiked: false,
            isSaved: false,
            createdAt: new Date().toISOString(),
            _fromAPI: false
          };
        }
      } else {
        // Not authenticated - use localStorage fallback (guest mode)
        savedRecipe = {
          id: `local_${Date.now()}`,
          ...recipeData,
          userId: "guest_user",
          username: displayName || "Guest",
          mediaType: "image",
          likes: 0,
          comments: 0,
          shares: 0,
          isLiked: false,
          isSaved: false,
          createdAt: new Date().toISOString(),
          _fromAPI: false
        };
      }

      if (onPost) {
        onPost(savedRecipe);
      }

      // Reset form
      setTitle("");
      setDescription("");
      setHashtags("");
      setCategory("");
      setMediaFiles([]);
      setSharePublicly(false);
      onClose();
    } catch (err) {
      logger.error("Error creating recipe:", err);
      setError(err.error || "Failed to create recipe. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="create-post-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Share to Community</h2>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close">
            <X className="close-icon" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="post-form">
          <div className="form-group">
            <label htmlFor="post-title">Recipe Title *</label>
            <input
              type="text"
              id="post-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Halal Chicken Biryani"
              required
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="post-description">Description</label>
            <textarea
              id="post-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tell the community about your recipe conversion..."
              rows="4"
              className="form-textarea"
            />
          </div>

          <div className="form-group">
            <label htmlFor="post-category">Category</label>
            <select
              id="post-category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="form-select"
            >
              <option value="">Select category</option>
              <option value="Main Course">Main Course</option>
              <option value="Dessert">Dessert</option>
              <option value="Appetizer">Appetizer</option>
              <option value="Breakfast">Breakfast</option>
              <option value="Snack">Snack</option>
              <option value="Beverage">Beverage</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="post-hashtags">
              <Hash className="label-icon" />
              Hashtags
            </label>
            <input
              type="text"
              id="post-hashtags"
              value={hashtags}
              onChange={(e) => setHashtags(e.target.value)}
              placeholder="#HalalCooking #NoAlcohol (space-separated)"
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label>Media (Images/Videos)</label>
            <MediaUploader
              files={mediaFiles}
              onFilesChange={setMediaFiles}
              maxFiles={5}
            />
          </div>

          {(originalRecipe || convertedRecipe) && (
            <div className="recipe-preview">
              <h3>Recipe Preview</h3>
              {originalRecipe && (
                <div className="preview-section">
                  <strong>Original:</strong>
                  <pre>{originalRecipe}</pre>
                </div>
              )}
              {convertedRecipe && (
                <div className="preview-section">
                  <strong>Halal Converted:</strong>
                  <pre>{convertedRecipe}</pre>
                </div>
              )}
              {confidenceScore > 0 && (
                <div className="preview-section">
                  <strong>Halal Confidence:</strong> {confidenceScore}%
                </div>
              )}
            </div>
          )}

          {error && (
            <div className="form-error-message">
              {error}
            </div>
          )}
          
          {!isAuthenticated() && (
            <div className="form-info-message">
              <strong>Guest Mode:</strong> You can save recipes locally. <a href="#" onClick={(e) => { e.preventDefault(); window.dispatchEvent(new CustomEvent("showAuthModal", { detail: { mode: "register" } })); }}>Log in or register</a> to post publicly and sync across devices.
            </div>
          )}

          <div className="form-group checkbox-group">
            <label htmlFor="share-publicly" className="checkbox-label">
              <input
                type="checkbox"
                id="share-publicly"
                checked={sharePublicly}
                onChange={(e) => {
                  if (e.target.checked && !isAuthenticated()) {
                    // Prompt login if trying to post publicly without auth
                    setError("Please log in to post recipes publicly");
                    setTimeout(() => {
                      window.dispatchEvent(new CustomEvent("showAuthModal", { detail: { mode: "login" } }));
                    }, 500);
                    return;
                  }
                  setSharePublicly(e.target.checked);
                }}
                className="checkbox-input"
                disabled={!isAuthenticated()}
              />
              <span>{sharePublicly ? "✅ Post Publicly" : "🔒 Keep Private"}</span>
            </label>
            <p className="checkbox-help-text">
              {sharePublicly 
                ? "This recipe will be visible to everyone in the community feed"
                : isAuthenticated()
                ? "This recipe will be saved privately to your profile"
                : "This recipe will be saved locally. Log in to post publicly or sync across devices."}
            </p>
            {!isAuthenticated() && (
              <p className="checkbox-help-text" style={{ color: "var(--accent-gold)", marginTop: "0.5rem" }}>
                💡 <a href="#" onClick={(e) => { e.preventDefault(); window.dispatchEvent(new CustomEvent("showAuthModal", { detail: { mode: "register" } })); }} style={{ textDecoration: "underline" }}>Create an account</a> to post publicly and sync your recipes
              </p>
            )}
          </div>

          <div className="form-actions">
            <button type="button" className="cancel-btn" onClick={onClose}>
              Cancel
            </button>
                    <button type="submit" className="submit-btn" disabled={isSubmitting}>
                      <Send className="submit-icon" />
                      {isSubmitting ? "Posting..." : sharePublicly ? "Post to Feed" : "Save Privately"}
                    </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreatePostModal;
