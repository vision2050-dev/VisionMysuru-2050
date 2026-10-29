import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import submissionRoutes from "./routes/submissionRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import juryzaRoutes from "./routes/juryzaRoutes.js";
import instagramRoutes from "./routes/instagramRoutes.js";
import mongoose from "mongoose";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const PORT = process.env.PORT || 5001;
const app = express();
// app.set("trust proxy", 1);
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, server-to-server)
      if (!origin) return callback(null, true);

      // Allow localhost, 127.0.0.1, vercel preview, and institutional domains
      if (
        origin.includes("localhost") ||
        origin.includes("127.0.0.1") ||
        origin.endsWith(".vercel.app") ||
        origin.includes("visionmysuru2050") ||
        origin.includes("sdmimd")
      ) {
        return callback(null, true);
      }
      return callback(null, true);
    },
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization", "x-auth-token", "x-user-email"],
  }),
);
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    crossOriginEmbedderPolicy: false,
  }),
);
app.use(morgan("dev"));
app.use(express.json());
const MONGO_URI = process.env.MONGO_URI;

// Edition 1 Legacy Routes
app.use("/api/v1", adminRoutes);
app.use("/api/v1/winners", submissionRoutes);
app.use("/api/v1/admin", adminRoutes);

// Official Social Feed (Instagram live / cache)
app.use("/api/v1/instagram", instagramRoutes);

// Edition 2 Juryza Platform Routes
app.use("/api/v2", juryzaRoutes);

// Serve static client assets in production if client/dist exists
const clientDistPath = path.join(__dirname, "../client/dist");
if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
  // Catch-all route for SPA navigation (redirects non-API requests to index.html)
  app.use((req, res, next) => {
    if (req.path.startsWith("/api/")) return next();
    res.sendFile(path.join(clientDistPath, "index.html"));
  });
}

const startServer = () => {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
};

if (MONGO_URI) {
  mongoose
    .connect(MONGO_URI)
    .then(() => {
      console.log("Connected to MongoDB");
      startServer();
    })
    .catch((err) => {
      console.warn("MongoDB connection warning:", err.message);
      console.log("Running server in Local Fallback mode...");
      startServer();
    });
} else {
  console.log("MONGO_URI not set. Running in Local Memory Fallback mode...");
  startServer();
}

export default app;
