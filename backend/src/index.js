import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import convertRouter from "./routes/convert.js";

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

app.use("/convert", convertRouter);

app.get("/health", (req, res) => res.json({ status: "ok" }));

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';

app.listen(PORT, HOST, () => { 
   console.log(`Server running on http://${HOST}:${PORT}`);
   console.log(`Server accessible on local network at http://localhost:${PORT}`);
   if (HOST === '0.0.0.0') {
     console.log('Server is accessible from all network interfaces');
   }
});
