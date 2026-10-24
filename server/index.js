import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import dotenv from "dotenv";
import submissionRoutes from "./routes/submissionRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import juryzaRoutes from "./routes/juryzaRoutes.js";
import mongoose from "mongoose";

dotenv.config();

const PORT = process.env.PORT || 5001;
const app = express();
// app.set("trust proxy", 1);
app.use(
  cors({
    origin: [
      "https://www.visionmysuru2050.in",
      "http://localhost:5001",
      "http://localhost:5000",
      "http://localhost:5173",
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
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

// Edition 2 Juryza Platform Routes
app.use("/api/v2", juryzaRoutes);

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
