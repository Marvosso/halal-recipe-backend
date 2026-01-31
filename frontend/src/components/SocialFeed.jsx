import React, { useState, useEffect, useRef } from "react";
import RecipePost from "./RecipePost";
import { getRecipes } from "../api/recipesApi";
import logger from "../utils/logger";
import "./SocialFeed.css";

function SocialFeed() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const observerRef = useRef(null);
  const pageRef = useRef(1);

  // Load posts from API with localStorage fallback
  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    setLoading(true);
    
    try {
      // Try to fetch from API first (public recipes endpoint)
      try {
        const axios = await import("../api/axiosConfig").then(m => m.getAxiosInstance());
        const response = await axios.get("/api/recipes/public");
        const apiPosts = response.data.recipes || [];
        
        if (apiPosts.length > 0) {
          // Map API format to UI format
          const formattedPosts = apiPosts.map(post => ({
            ...post,
            isPublic: post.isPublic !== undefined ? post.isPublic : post.is_public !== undefined ? post.is_public : true,
            mediaUrls: post.mediaUrls || (post.media_url ? [post.media_url] : []),
            createdAt: post.createdAt || post.created_at,
            confidenceScore: post.confidenceScore || post.confidence_score || 0,
          }));
          setPosts(formattedPosts);
          setLoading(false);
          return;
        }
      } catch (apiError) {
        logger.error("Error fetching from API, falling back to localStorage:", apiError);
      }

      // Fallback to localStorage
      try {
        const savedPosts = localStorage.getItem("halalKitchenPosts");
        const allPosts = savedPosts ? JSON.parse(savedPosts) : [];
        
        // For demo, add some sample posts if empty
        if (allPosts.length === 0) {
          const samplePosts = generateSamplePosts();
          setPosts(samplePosts);
          localStorage.setItem("halalKitchenPosts", JSON.stringify(samplePosts));
        } else {
          // Filter to only show public posts (isPublic === true or undefined for backward compatibility)
          const publicPosts = allPosts.filter(post => post.isPublic === true || post.isPublic === undefined);
          setPosts(publicPosts);
        }
      } catch (localError) {
        logger.error("Error loading from localStorage:", localError);
      }
    } catch (error) {
      logger.error("Error loading posts:", error);
    } finally {
      setLoading(false);
    }
  };

  const generateSamplePosts = () => {
    return [
      {
        id: "1",
        userId: "demo_user",
        username: "HalalChef",
        avatar: null,
        title: "Chicken Biryani - Halal Style",
        description: "Converted this amazing biryani recipe to be fully halal! Used halal chicken stock instead of wine. 🍗✨",
        originalRecipe: "Chicken, rice, spices, white wine",
        convertedRecipe: "Chicken, rice, spices, halal chicken stock",
        mediaUrls: [],
        mediaType: "image",
        likes: 42,
        comments: 8,
        shares: 5,
        confidenceScore: 98,
        createdAt: new Date().toISOString(),
        category: "Main Course",
        hashtags: ["#HalalBiryani", "#HalalCooking"],
        isLiked: false,
        isSaved: false
      },
      {
        id: "2",
        userId: "demo_user2",
        username: "HalalBaker",
        avatar: null,
        title: "Vanilla Cake - Alcohol-Free",
        description: "Perfect halal vanilla cake using vanilla powder instead of extract! 🎂",
        originalRecipe: "Flour, sugar, eggs, vanilla extract",
        convertedRecipe: "Flour, sugar, eggs, vanilla powder",
        mediaUrls: [],
        mediaType: "image",
        likes: 67,
        comments: 12,
        shares: 9,
        confidenceScore: 95,
        createdAt: new Date(Date.now() - 3600000).toISOString(),
        category: "Dessert",
        hashtags: ["#HalalDessert", "#NoAlcohol"],
        isLiked: false,
        isSaved: false
      }
    ];
  };

  const handleLike = (postId) => {
    setPosts((prevPosts) =>
      prevPosts.map((post) =>
        post.id === postId
          ? {
              ...post,
              isLiked: !post.isLiked,
              likes: post.isLiked ? post.likes - 1 : post.likes + 1,
            }
          : post
      )
    );
    // Save to localStorage
    savePostsToStorage();
  };

  const handleSave = (postId) => {
    setPosts((prevPosts) =>
      prevPosts.map((post) =>
        post.id === postId
          ? { ...post, isSaved: !post.isSaved }
          : post
      )
    );
    savePostsToStorage();
  };

  const handleComment = (postId, commentText) => {
    setPosts((prevPosts) =>
      prevPosts.map((post) =>
        post.id === postId
          ? { ...post, comments: post.comments + 1 }
          : post
      )
    );
    savePostsToStorage();
  };

  const savePostsToStorage = () => {
    // Only save to localStorage for offline fallback
    // API posts are managed by backend
    try {
      const localPosts = posts.filter(post => !post.id || post.id.startsWith("local_"));
      if (localPosts.length > 0) {
        localStorage.setItem("halalKitchenPosts", JSON.stringify(localPosts));
      }
    } catch (error) {
      logger.error("Error saving posts:", error);
    }
  };

  if (loading && posts.length === 0) {
    return (
      <div className="social-feed">
        <div className="feed-loading">
          <div className="loading-skeleton"></div>
          <div className="loading-skeleton"></div>
          <div className="loading-skeleton"></div>
        </div>
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="social-feed">
        <div className="empty-feed">
          <div className="empty-feed-icon">🍽️</div>
          <h2>No recipes yet</h2>
          <p>Be the first to share a halal recipe conversion!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="social-feed">
      <div className="feed-header">
        <h2>Halal Kitchen Feed</h2>
        <button className="refresh-feed-btn" onClick={loadPosts} aria-label="Refresh feed">
          ↻
        </button>
      </div>
      
      <div className="posts-container">
        {posts.map((post) => (
          <RecipePost
            key={post.id}
            post={post}
            onLike={handleLike}
            onSave={handleSave}
            onComment={handleComment}
          />
        ))}
      </div>

      {loading && (
        <div className="feed-loading-more">
          <div className="loading-spinner"></div>
          <p>Loading more recipes...</p>
        </div>
      )}
    </div>
  );
}

export default SocialFeed;
