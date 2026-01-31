import React, { useState } from "react";
import { Heart, MessageCircle, Share2, Bookmark, MoreVertical, Clock, ChefHat } from "lucide-react";
import { formatIngredientName } from "../lib/ingredientDisplay";
import CommentSection from "./CommentSection";
import "./RecipePost.css";

function RecipePost({ post, onLike, onSave, onComment }) {
  const [showComments, setShowComments] = useState(false);
  const [isLiked, setIsLiked] = useState(post.isLiked || false);
  const [isSaved, setIsSaved] = useState(post.isSaved || false);
  const [likeAnimation, setLikeAnimation] = useState(false);

  const handleLike = (e) => {
    e.preventDefault();
    setIsLiked(!isLiked);
    setLikeAnimation(true);
    setTimeout(() => setLikeAnimation(false), 600);
    if (onLike) onLike(post.id);
  };

  const handleSave = (e) => {
    e.preventDefault();
    setIsSaved(!isSaved);
    if (onSave) onSave(post.id);
  };

  const handleDoubleClick = () => {
    if (!isLiked) {
      setIsLiked(true);
      setLikeAnimation(true);
      setTimeout(() => setLikeAnimation(false), 600);
      if (onLike) onLike(post.id);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  const getConfidenceColor = (score) => {
    if (score >= 95) return "#0A9D58";
    if (score >= 80) return "#FFD166";
    return "#FF6B6B";
  };

  return (
    <article className="recipe-post" aria-label={`Recipe post by ${post.username}`}>
      {/* Post Header */}
      <div className="post-header">
        <div className="post-user-info">
          <div className="user-avatar">
            {post.avatar ? (
              <img src={post.avatar} alt={post.username} />
            ) : (
              <div className="avatar-placeholder">
                {post.username.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <div className="user-details">
            <strong className="username">{post.username}</strong>
            <span className="post-time">{formatDate(post.createdAt)}</span>
          </div>
        </div>
      </div>

      {/* Media Section */}
      <div className="post-media" onDoubleClick={handleDoubleClick}>
        {post.mediaUrls && post.mediaUrls.length > 0 ? (
          <div className="media-container">
            {post.mediaUrls.map((url, idx) => (
              <img
                key={idx}
                src={url}
                alt={`${post.title} - Image ${idx + 1}`}
                className="post-image"
                loading="lazy"
              />
            ))}
          </div>
        ) : (
          <div className="media-placeholder">
            <ChefHat className="placeholder-icon" />
            <p>Recipe Image</p>
          </div>
        )}
        
        {likeAnimation && (
          <div className="like-animation">
            <Heart className="like-heart" fill="currentColor" />
          </div>
        )}
      </div>

      {/* Actions Bar */}
      <div className="post-actions">
        <div className="actions-left">
          <button
            className={`action-btn like-btn ${isLiked ? "liked" : ""}`}
            onClick={handleLike}
            aria-label={isLiked ? "Unlike" : "Like"}
          >
            <Heart className="action-icon" fill={isLiked ? "currentColor" : "none"} />
          </button>
          <button
            className="action-btn"
            onClick={() => setShowComments(!showComments)}
            aria-label="Comment"
          >
            <MessageCircle className="action-icon" />
          </button>
          <button className="action-btn" aria-label="Share">
            <Share2 className="action-icon" />
          </button>
        </div>
        <button
          className={`action-btn save-btn ${isSaved ? "saved" : ""}`}
          onClick={handleSave}
          aria-label={isSaved ? "Unsave" : "Save"}
        >
          <Bookmark className="action-icon" fill={isSaved ? "currentColor" : "none"} />
        </button>
      </div>

      {/* Engagement Stats */}
      <div className="post-stats">
        <div className="likes-count">
          <strong>{post.likes}</strong> {post.likes === 1 ? "like" : "likes"}
        </div>
        {post.comments > 0 && (
          <button
            className="comments-preview"
            onClick={() => setShowComments(!showComments)}
          >
            View all {post.comments} {post.comments === 1 ? "comment" : "comments"}
          </button>
        )}
      </div>

      {/* Post Content */}
      <div className="post-content">
        <div className="post-title-section">
          <h3 className="post-title">{post.title}</h3>
          <div className="post-meta">
            {post.category && (
              <span className="post-category">
                <ChefHat className="meta-icon" />
                {post.category}
              </span>
            )}
            <span className="post-confidence" style={{ color: getConfidenceColor(post.confidenceScore) }}>
              Halal Score: {post.confidenceScore}%
            </span>
          </div>
        </div>

        <p className="post-description">
          <strong>{post.username}</strong> {post.description}
        </p>

        {/* Hashtags */}
        {post.hashtags && post.hashtags.length > 0 && (
          <div className="post-hashtags">
            {post.hashtags.map((tag, idx) => (
              <span key={idx} className="hashtag">
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Recipe Comparison */}
        <div className="recipe-comparison">
          <details className="comparison-details">
            <summary className="comparison-summary">
              See Original → Converted Recipe
            </summary>
            <div className="comparison-content">
              <div className="recipe-section">
                <h4>Original Recipe:</h4>
                <pre className="recipe-text original">{post.originalRecipe}</pre>
              </div>
              <div className="recipe-section">
                <h4>Halal Converted:</h4>
                <pre className="recipe-text converted">{post.convertedRecipe}</pre>
              </div>
            </div>
          </details>
        </div>

        {/* Ingredient Details from Knowledge Model */}
        {post.ingredients && Array.isArray(post.ingredients) && post.ingredients.length > 0 && (
          <div className="ingredient-details-section">
            <details className="ingredient-details">
              <summary className="ingredient-details-summary">
                Ingredient Details & Alternatives
              </summary>
              <div className="ingredient-details-content">
                {post.ingredients.map((ingredient, idx) => {
                  const ingredientName = ingredient?.ingredient || `ingredient-${idx}`;
                  const status = ingredient?.status || ingredient?.hkmResult?.status || "unknown";
                  const getStatusColor = () => {
                    if (status === "halal") return "#0A9D58";
                    if (status === "conditional" || status === "questionable") return "#FFD166";
                    if (status === "haram") return "#FF6B6B";
                    return "#9CA3AF";
                  };

                  return (
                    <div key={idx} className="post-ingredient-card">
                      <div className="post-ingredient-header">
                        <strong className="post-ingredient-name">{ingredientName}</strong>
                        <span 
                          className="post-ingredient-status" 
                          style={{ color: getStatusColor() }}
                        >
                          {status === "halal" && "✅ Halal"}
                          {status === "conditional" && "⚠️ Conditional"}
                          {status === "questionable" && "⚠️ Questionable"}
                          {status === "haram" && "❌ Haram"}
                          {status === "unknown" && "❓ Unknown"}
                        </span>
                      </div>

                      {ingredient?.inheritedFrom && (
                        <div className="post-ingredient-row">
                          <span className="post-ingredient-label">Inherited From:</span>
                          <span className="post-ingredient-value">{ingredient.inheritedFrom}</span>
                        </div>
                      )}

                      {ingredient?.replacement && (
                        <div className="post-ingredient-row">
                          <span className="post-ingredient-label">Halal Replacement:</span>
                          <span className="post-ingredient-value">{ingredient.replacement}</span>
                        </div>
                      )}

                      {ingredient?.alternatives && Array.isArray(ingredient.alternatives) && ingredient.alternatives.length > 0 && (
                        <div className="post-ingredient-row">
                          <span className="post-ingredient-label">Alternatives:</span>
                          <ul className="post-ingredient-alternatives">
                            {ingredient.alternatives.map((alt, altIdx) => (
                              <li key={altIdx}>{formatIngredientName(alt)}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {ingredient?.notes && (
                        <div className="post-ingredient-row">
                          <span className="post-ingredient-label">Notes:</span>
                          <span className="post-ingredient-value">{ingredient.notes}</span>
                        </div>
                      )}

                      {ingredient?.eli5 && (
                        <div className="post-ingredient-row">
                          <span className="post-ingredient-label">Simple Explanation:</span>
                          <span className="post-ingredient-value eli5-text">{ingredient.eli5}</span>
                        </div>
                      )}

                      {ingredient?.trace && Array.isArray(ingredient.trace) && ingredient.trace.length > 1 && (
                        <details className="post-ingredient-trace">
                          <summary className="post-ingredient-trace-summary">Show Ingredient Breakdown</summary>
                          <ul className="post-ingredient-trace-list">
                            {ingredient.trace.map((t, traceIdx) => (
                              <li key={traceIdx}>{t}</li>
                            ))}
                          </ul>
                        </details>
                      )}
                    </div>
                  );
                })}
              </div>
            </details>
          </div>
        )}
      </div>

      {/* Comments Section */}
      {showComments && (
        <CommentSection
          postId={post.id}
          onComment={onComment}
        />
      )}
    </article>
  );
}

export default RecipePost;
