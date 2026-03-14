import express from "express";
import {
  getAllSubmissions,
  updateSubmissionStatus,
  adminLogin,
  registerAdmin,
  getShortlist,
} from "../controllers/adminController.js";
import auth from "../middlewares/auth.js";

const router = express.Router();

// Public routes
router.post("/login", adminLogin);
router.post("/register", registerAdmin);

// Public shortlist route — ?round=1|2|3|finale
router.get("/shortlist", getShortlist);

// Protected routes
router.get("/submissions", auth, getAllSubmissions);
router.patch("/submissions/:id/status", auth, updateSubmissionStatus);

export default router;
