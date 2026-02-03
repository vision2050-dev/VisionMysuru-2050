import express from "express";
import {
  getAllSubmissions,
  updateSubmissionStatus,
  adminLogin,
  registerAdmin,
} from "../controllers/adminController.js";
import auth from "../middlewares/auth.js";
import { loginLimiter } from "../middlewares/rateLimiters.js";

const router = express.Router();

// Public route for login and registration
router.post("/login", loginLimiter, adminLogin);
router.post("/register", loginLimiter, registerAdmin);

// Protected routes
router.get("/submissions", auth, getAllSubmissions);
router.patch("/submissions/:id/status", auth, updateSubmissionStatus);

export default router;
