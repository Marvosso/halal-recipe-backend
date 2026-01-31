import jwt from "jsonwebtoken";
import { getUserById } from "../db/users.js";

const JWT_SECRET = process.env.JWT_SECRET || "halal-kitchen-secret-key-change-in-production";

/**
 * Middleware to verify JWT token and load full user from database
 * Adds req.user with full user object (id, email, display_name, etc.)
 */
export const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Load full user from database
    const user = await getUserById(decoded.userId);

    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }

    // Attach full user object to request
    req.user = {
      userId: user.id, // Keep for backward compatibility
      id: user.id,
      email: user.email,
      displayName: user.display_name || user.email.split("@")[0],
      username: user.display_name || user.email.split("@")[0],
      profile_image_url: user.profile_image_url,
    };

    next();
  } catch (error) {
    if (error.name === "JsonWebTokenError" || error.name === "TokenExpiredError") {
      return res.status(403).json({ error: "Invalid or expired token" });
    }
    console.error("Auth middleware error:", error);
    return res.status(500).json({ error: "Authentication error" });
  }
};

/**
 * Optional authentication middleware
 * Sets req.user if token is present but doesn't fail if missing
 */
export const optionalAuth = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (token) {
    jwt.verify(token, JWT_SECRET, (err, user) => {
      if (!err) {
        req.user = user;
      }
    });
  }
  next();
};

export { JWT_SECRET };
