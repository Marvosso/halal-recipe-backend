import express from "express";
import cors from "cors";
import convertRouter from "./routes/convert.js";

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

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// Conversion route
app.use("/convert", convertRouter);

export default app;
