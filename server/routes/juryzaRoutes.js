import express from "express";
import {
  loginWithGmail,
  getMe,
  getJudgesList,
  registerJudge,
  deleteJudge,
  allocateSubmission,
  autoAllocateSubmissions,
  registerEdition2Submission,
  getEdition2Submissions,
  getMySubmission,
  streamSubmissionVideo,
  previewSubmissionDocument,
  getDriveSyncStatus,
  submitRubricEvaluation,
  submitPairwiseDuelVote,
  getDuelPair,
  updateSubmissionStatus,
} from "../controllers/juryzaController.js";
import { submissionUpload } from "../middleware/upload.js";
import {
  extractUser,
  requireAuth,
  requireAdmin,
  requireJudgeOrAdmin,
} from "../middleware/juryzaAuth.js";

const router = express.Router();

// Extract authentication context on all v2 requests
router.use(extractUser);

// ----------------------------------------------------
// 0. Gmail Authentication & Profile
// ----------------------------------------------------
router.post("/auth/login", loginWithGmail);
router.get("/auth/me", requireAuth, getMe);

// ----------------------------------------------------
// 1. Judge Management & Allocation (Admin Portal)
// ----------------------------------------------------
router.get("/judges", getJudgesList);
router.post("/judges", requireAdmin, registerJudge);
router.delete("/judges/:id", requireAdmin, deleteJudge);
router.patch("/submissions/:id/allocate", requireAdmin, allocateSubmission);
router.post("/submissions/auto-allocate", requireAdmin, autoAllocateSubmissions);

// ----------------------------------------------------
// 2. Participant Portal
// ----------------------------------------------------
router.post("/submissions", submissionUpload, registerEdition2Submission);
router.get("/participant/my-submission", getMySubmission);

// ----------------------------------------------------
// 3. Submissions (Role-isolated: Admin sees all, Judge sees only alloted)
// ----------------------------------------------------
router.get("/submissions", getEdition2Submissions);

// ----------------------------------------------------
// 4. Media Streaming & Isolated Previews
// ----------------------------------------------------
router.get("/submissions/:id/video-stream", streamSubmissionVideo);
router.get("/submissions/:id/document-preview", previewSubmissionDocument);
router.get("/drive/status", getDriveSyncStatus);

// ----------------------------------------------------
// 5. Jury Evaluation Engine (Jury & Admin)
// ----------------------------------------------------
router.post("/jury/rubric", requireJudgeOrAdmin, submitRubricEvaluation);
router.post("/jury/duel", requireJudgeOrAdmin, submitPairwiseDuelVote);
router.get("/jury/duel/pair", requireJudgeOrAdmin, getDuelPair);
router.patch("/submissions/:id/status", requireJudgeOrAdmin, updateSubmissionStatus);

export default router;
