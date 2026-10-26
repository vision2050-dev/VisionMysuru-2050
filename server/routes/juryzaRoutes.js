import express from "express";
import {
  registerUser,
  loginUser,
  resetAdminPassword,
  createJudgeAccount,
  registerEdition2Submission,
  getEdition2Submissions,
  getParticipantSubmission,
  getJudges,
  allocateSubmission,
  updateSubmissionStatus,
  submitRubricEvaluation,
  submitPairwiseDuelVote,
  getDuelPair,
  downloadSpreadsheet,
  downloadSpreadsheetCsv,
  streamSubmissionVideo,
  previewSubmissionDocument,
  getDriveSyncStatus,
} from "../controllers/juryzaController.js";
import { submissionUpload } from "../middleware/upload.js";
import {
  verifyAuthToken,
  requireAdmin,
  requireJudge,
} from "../middleware/juryzaAuth.js";

const router = express.Router();

// ==========================================
// 1. AUTHENTICATION (Sign Up & Sign In)
// ==========================================
router.post("/auth/signup", registerUser);
router.post("/auth/signin", loginUser);
router.post("/auth/login", loginUser); // Alias for backwards compatibility
router.post("/auth/admin/reset-password", resetAdminPassword);

// ==========================================
// 2. PARTICIPANT PORTAL
// ==========================================
// Compulsory .mp4 <= 50MB and .pdf <= 5MB
router.post(
  "/submissions",
  (req, res, next) => {
    // Optional auth token verification for participant submissions
    const authHeader = req.headers.authorization || req.headers["x-auth-token"];
    if (authHeader) {
      return verifyAuthToken(req, res, next);
    }
    next();
  },
  submissionUpload,
  registerEdition2Submission,
);

// Participant Live Progress Tracker
router.get("/participant/my-submission", getParticipantSubmission);

// ==========================================
// 3. SUBMISSIONS & MEDIA (Judge / Admin / Public)
// ==========================================
router.get(
  "/submissions",
  (req, res, next) => {
    // If token is provided, extract user to filter for judge; otherwise allow public
    const authHeader = req.headers.authorization || req.headers["x-auth-token"];
    if (authHeader) {
      return verifyAuthToken(req, res, next);
    }
    next();
  },
  getEdition2Submissions,
);

router.get("/submissions/:id/video-stream", streamSubmissionVideo);
router.get("/submissions/:id/document-preview", previewSubmissionDocument);

// Both Admin and Jury can change the state of the submission
router.patch(
  "/submissions/:id/status",
  verifyAuthToken,
  updateSubmissionStatus,
);

// ==========================================
// 4. ADMIN PLATFORM
// ==========================================
router.get("/admin/judges", verifyAuthToken, requireAdmin, getJudges);
router.post("/admin/create-judge", verifyAuthToken, requireAdmin, createJudgeAccount);
router.post("/admin/judges/create", verifyAuthToken, requireAdmin, createJudgeAccount); // Alias
router.post("/admin/allocate", verifyAuthToken, requireAdmin, allocateSubmission);
router.get("/judges", getJudges); // Alias for allocation panels

// Live Master Spreadsheet
router.get("/spreadsheet/download", downloadSpreadsheet);
router.get("/spreadsheet/csv", downloadSpreadsheetCsv);
router.get("/drive/status", getDriveSyncStatus);

// ==========================================
// 5. JURY EVALUATION HUB
// ==========================================
router.post("/jury/rubric", verifyAuthToken, requireJudge, submitRubricEvaluation);
router.post("/jury/duel", verifyAuthToken, requireJudge, submitPairwiseDuelVote);
router.get("/jury/duel/pair", verifyAuthToken, requireJudge, getDuelPair);

export default router;
