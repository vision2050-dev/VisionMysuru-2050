import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import dotenv from "dotenv";
import submissionRoutes from "./routes/submissionRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import mongoose from "mongoose";

dotenv.config();

const PORT = process.env.PORT || 5000;
const app = express();
// app.set("trust proxy", 1);
app.use(
  cors({
    origin: [
      "https://www.visionmysuru2050.in",
      "http://localhost:5000",
      "http://localhost:5173",
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);
app.use(helmet());
app.use(morgan("dev"));
app.use(express.json());
const MONGO_URI = process.env.MONGO_URI;

app.use("/api/v1", adminRoutes);
app.use("/api/v1/winners", submissionRoutes);
app.use("/api/v1/admin", adminRoutes);
mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log("Connected to MongoDB");
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("MongoDB connection error", err);
    process.exit(1);
  });

export default app;
