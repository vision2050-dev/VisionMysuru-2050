import express from "express";
import {
  registerEdition2Submission,
  getEdition2Submissions,
  streamSubmissionVideo,
  previewSubmissionDocument,
  getDriveSyncStatus,
  submitRubricEvaluation,
  submitPairwiseDuelVote,
  getDuelPair,
  updateSubmissionStatus,
} from "../controllers/juryzaController.js";
import { submissionUpload } from "../middleware/upload.js";

const router = express.Router();

// Participant Portal: Direct File Upload to Google Drive
router.post("/submissions", submissionUpload, registerEdition2Submission);
router.get("/submissions", getEdition2Submissions);

// Team-wise Media Streaming & Preview (Isolated for Jury, no direct folder access)
router.get("/submissions/:id/video-stream", streamSubmissionVideo);
router.get("/submissions/:id/document-preview", previewSubmissionDocument);
router.get("/drive/status", getDriveSyncStatus);

// Jury Evaluation Hub
router.post("/jury/rubric", submitRubricEvaluation);
router.post("/jury/duel", submitPairwiseDuelVote);
router.get("/jury/duel/pair", getDuelPair);
router.patch("/submissions/:id/status", updateSubmissionStatus);

export default router;
