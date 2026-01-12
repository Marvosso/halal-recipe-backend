import express from "express";
import cors from "cors";
import convertRouter from "./routes/convert.js";

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// Conversion route
app.use("/convert", convertRouter);

export default app;
