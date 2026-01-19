import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import convertRouter from "./routes/convert.js";
import authRouter from "./routes/auth.js";
import profileRouter from "./routes/profile.js";
import recipesRouter from "./routes/recipes.js";
import healthRouter from "./routes/health.js";
import devRouter from "./routes/dev.js";
import { testConnection, initializeDatabase, closePool } from "./database.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();
const app = express();

// Configure CORS to allow all origins (for development and mobile access)
app.use(cors({
  origin: '*', // Allow all origins
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: false
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from uploads directory
const UPLOAD_DIR = path.resolve(__dirname, "../uploads");
app.use("/uploads", express.static(UPLOAD_DIR));

// Routes
// Verify all routers are imported correctly
if (!convertRouter) {
  throw new Error("convertRouter is missing - check routes/convert.js");
}
if (!authRouter) {
  throw new Error("authRouter is missing - check routes/auth.js");
}
if (!profileRouter) {
  throw new Error("profileRouter is missing - check routes/profile.js");
}
if (!recipesRouter) {
  throw new Error("recipesRouter is missing - check routes/recipes.js");
}
if (!healthRouter) {
  throw new Error("healthRouter is missing - check routes/health.js");
}

// Mount routes
app.use("/convert", convertRouter);
app.use("/api/auth", authRouter);
app.use("/api/profile", profileRouter);
app.use("/api/recipes", recipesRouter);
app.use("/api/health", healthRouter);
app.use("/api/dev", devRouter); // ⚠️ Dev-only routes - remove or protect in production

app.get("/health", (req, res) => res.json({ status: "ok" }));

// Log all registered routes on startup
function logRegisteredRoutes() {
  console.log("\n📋 Registered Routes:");
  console.log("   GET    /health");
  console.log("   POST   /convert");
  console.log("   GET    /api/auth/test");
  console.log("   POST   /api/auth/register");
  console.log("   POST   /api/auth/login");
  console.log("   GET    /api/auth/me");
  console.log("   GET    /api/profile/*");
  console.log("   GET    /api/recipes/*");
  console.log("   GET    /api/health/*");
  console.log("   GET    /api/dev/*");
  console.log("   Static /uploads/*");
}

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';

// Initialize database connection and start server
async function startServer() {
  // Test database connection
  const dbConnected = await testConnection();
  
  if (dbConnected) {
    // Initialize database schema
    await initializeDatabase();
  } else {
    console.warn("⚠️  Server starting without database connection. Some features may be unavailable.");
  }
  
  // Log registered routes
  logRegisteredRoutes();
  
  // Start Express server
  app.listen(PORT, HOST, () => { 
    console.log(`\n🚀 Server running on http://${HOST}:${PORT}`);
    console.log(`   Server accessible on local network at http://localhost:${PORT}`);
    if (HOST === '0.0.0.0') {
      console.log('   Server is accessible from all network interfaces');
    }
    if (dbConnected) {
      console.log(`   ✅ Database: Connected`);
    } else {
      console.log(`   ⚠️  Database: Not connected`);
    }
    console.log(`\n✅ Auth routes available at:`);
    console.log(`   POST   http://${HOST}:${PORT}/api/auth/register`);
    console.log(`   POST   http://${HOST}:${PORT}/api/auth/login`);
    console.log(`   GET    http://${HOST}:${PORT}/api/auth/test`);
  });
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('\n🛑 SIGTERM received, shutting down gracefully...');
  await closePool();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('\n🛑 SIGINT received, shutting down gracefully...');
  await closePool();
  process.exit(0);
});

// Start the server
startServer().catch((error) => {
  console.error("❌ Failed to start server:", error);
  console.error("Error details:", error.stack);
  process.exit(1);
});

