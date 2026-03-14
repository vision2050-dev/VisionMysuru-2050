import express from "express";
import {
  createSubmission,
  getWinners,
} from "../controllers/submissionController.js";
import upload from "../middlewares/upload.js";

const router = express.Router();

// router.post("/", upload.single("pdfFile"), createSubmission);
router.get("/winners", getWinners);

export default router;
