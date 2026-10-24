import mongoose from "mongoose";
import Edition2Submission from "../models/Edition2Submission.js";
import Judge from "../models/Judge.js";
import Evaluation from "../models/Evaluation.js";
import { randomUUID } from "crypto";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import fs from "fs";
import path from "path";
import {
  TARGET_DRIVE_FOLDER_ID,
  createTeamDriveFolder,
  uploadToGoogleDrive,
  streamVideoFile,
  getDriveClient,
} from "../services/googleDriveService.js";

// In-memory fallback dataset for offline/local testing without MongoDB Atlas
let localSubmissionsStore = [
  {
    _id: "demo-sub-1",
    teamId: "VM2-ST-88F4A1",
    teamName: "EcoFlow Mysuru",
    category: "students",
    city: "Mysuru",
    theme: "Environmental Sustainability",
    solutionName: "Decentralized Kukkarahalli Lake Micro-Filtration Network",
    shortDescription:
      "A solar-powered IoT filtration and bio-remediation barrier to eliminate urban storm drainage pollutants flowing into Kukkarahalli Lake.",
    detailedProposal:
      "Our team documented 4 untreated discharge canals entering Kukkarahalli lake. We deploy indigenous biomimetic filters with solar-powered aeration units to clean 40,000 liters daily.",
    video: {
      url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      title: "EcoFlow 2-Minute On-Ground Video Pitch",
      type: "youtube",
      driveDestination: "https://drive.google.com/drive/folders/visionmysuru2050_edition2_submissions",
    },
    document: {
      name: "EcoFlow_Kukkarahalli_Lake_Blueprint.pdf",
      url: "https://drive.google.com/file/d/sample1",
    },
    members: [
      {
        name: "Aditi Rao",
        email: "aditi.rao@nie.ac.in",
        phone: "+91 98451 12345",
        isLeader: true,
        college: "The National Institute of Engineering, Mysuru",
        department: "Civil & Environmental Engineering",
      },
      {
        name: "Kiran Kumar",
        email: "kiran.k@nie.ac.in",
        phone: "+91 98452 67890",
        isLeader: false,
        college: "The National Institute of Engineering, Mysuru",
        department: "Mechanical Engineering",
      },
    ],
    organizationDetails: {
      institution: "NIE Mysuru",
      department: "Environmental Engineering",
    },
    status: "round_2_shortlisted",
    eloRating: 1248,
    zScore: 1.42,
    rubricAverage: 34.5,
    evaluationCount: 3,
  },
  {
    _id: "demo-sub-2",
    teamId: "VM2-CT-19B2C3",
    teamName: "Heritage Pulse",
    category: "citizens",
    city: "Mysuru",
    theme: "Heritage Conservation",
    solutionName: "Devaraja Market Adaptive Restoration & Artisan Collective",
    shortDescription:
      "Balancing historical wooden and stone architectural preservation with modern fire-safe electrical grids and hygienic vegetable vendor stalls.",
    detailedProposal:
      "Collaborative intervention designed by Mysuru resident architects and heritage stall owners to preserve the facade while modernizing internal infrastructure.",
    video: {
      url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      title: "Devaraja Market Ground Survey & Pitch",
      type: "youtube",
      driveDestination: "https://drive.google.com/drive/folders/visionmysuru2050_edition2_submissions",
    },
    document: {
      name: "Devaraja_Restoration_Report.pdf",
      url: "https://drive.google.com/file/d/sample2",
    },
    members: [
      {
        name: "S. Rangaswamy",
        email: "rangaswamy.mys@gmail.com",
        phone: "+91 94480 33221",
        isLeader: true,
        designation: "Resident Architect & Civic Historian",
      },
    ],
    status: "round_1_shortlisted",
    eloRating: 1216,
    zScore: 0.85,
    rubricAverage: 31.0,
    evaluationCount: 2,
  },
  {
    _id: "demo-sub-3",
    teamId: "VM2-ST-4C5D6E",
    teamName: "RapidRoute Mysuru",
    category: "students",
    city: "Mysuru",
    theme: "Urban Infrastructure & Mobility",
    solutionName: "Smart feeder mini-EV transit corridors for Outer Ring Road",
    shortDescription:
      "Optimizing KSRTC and private bus feeder routes with electric shared vans connecting Hebbal and Vijayanagar to city center.",
    detailedProposal:
      "Data gathered from 1,200 commuters traveling across Hunsur road and Ring Road junctions, showing a 35-minute wait time reduction.",
    video: {
      url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      title: "Transit Feeder Demonstration",
      type: "youtube",
      driveDestination: "https://drive.google.com/drive/folders/visionmysuru2050_edition2_submissions",
    },
    document: {
      name: "RapidRoute_Simulation_Data.pdf",
      url: "https://drive.google.com/file/d/sample3",
    },
    members: [
      {
        name: "Chirag Hegde",
        email: "chirag.hegde@sdmimd.ac.in",
        phone: "+91 97412 88765",
        isLeader: true,
        college: "SDMIMD, Mysuru",
        department: "PGDM / Operations & Analytics",
      },
    ],
    organizationDetails: {
      institution: "SDMIMD Mysuru",
      department: "Management / Operations",
    },
    status: "registered",
    eloRating: 1190,
    zScore: -0.15,
    rubricAverage: 27.0,
    evaluationCount: 1,
  },
];

// Helper to determine if DB is connected
const isDbConnected = () => {
  return mongoose.connection && mongoose.connection.readyState === 1;
};

// ----------------------------------------------------
// 1. Participant Portal: Register & Direct File Upload to Drive
// ----------------------------------------------------
export const registerEdition2Submission = async (req, res) => {
  try {
    const {
      teamName,
      category,
      city = "Mysuru",
      theme,
      solutionName,
      shortDescription,
      detailedProposal,
      videoUrl,
      videoTitle,
      videoType = "gdrive",
      documentName,
      documentUrl,
      members,
      organizationDetails = {},
    } = req.body;

    const videoFile = req.files?.videoFile?.[0];
    const documentFile = req.files?.documentFile?.[0];

    if (!teamName || !category || !theme || !solutionName || !shortDescription) {
      return res.status(400).json({ message: "Missing required submission fields" });
    }

    if (!videoFile && !videoUrl) {
      return res.status(400).json({
        message:
          "Please select and upload your explainer pitch video file directly to our evaluation drive.",
      });
    }

    let parsedMembers = members;
    if (typeof members === "string") {
      try {
        parsedMembers = JSON.parse(members);
      } catch {
        return res.status(400).json({ message: "Invalid members format" });
      }
    }

    if (!Array.isArray(parsedMembers) || parsedMembers.length === 0) {
      return res.status(400).json({ message: "At least one team member is required" });
    }

    let parsedOrgDetails = organizationDetails;
    if (typeof organizationDetails === "string") {
      try {
        parsedOrgDetails = JSON.parse(organizationDetails);
      } catch {
        parsedOrgDetails = {};
      }
    }

    // Prefix: VM2-ST (Student), VM2-CO (Corporate), VM2-NG (NGO), VM2-CT (Citizen)
    const categoryCode =
      category === "students"
        ? "ST"
        : category === "corporates"
          ? "CO"
          : category === "ngos"
            ? "NG"
            : "CT";

    const teamId = `VM2-${categoryCode}-${randomUUID().slice(0, 6).toUpperCase()}`;

    // Target Google Drive Folder Destination
    const defaultDriveDestination = `https://drive.google.com/drive/folders/${TARGET_DRIVE_FOLDER_ID}`;

    let videoPayload = {
      url: videoUrl || "",
      title: videoTitle || `${teamName} - Vision Pitch`,
      type: videoType,
      driveDestination: defaultDriveDestination,
    };

    let documentPayload = {
      name: documentName || "Project_Summary.pdf",
      url: documentUrl || "",
      driveDestination: defaultDriveDestination,
    };

    // Process Direct Uploaded Pitch Video to Team Drive Folder
    if (videoFile) {
      const teamFolder = await createTeamDriveFolder({ teamId, teamName });
      const ext = path.extname(videoFile.originalname) || ".mp4";
      const sanitizedName = `${teamId}_PitchVideo${ext}`;
      const destVideoPath = path.join(teamFolder.localPath || path.dirname(videoFile.path), sanitizedName);

      try {
        fs.copyFileSync(videoFile.path, destVideoPath);
        fs.unlinkSync(videoFile.path);
      } catch (err) {
        console.warn("Could not move video file:", err.message);
      }

      // Sync to Google Drive Folder in the background
      const driveUploadRes = await uploadToGoogleDrive({
        filePath: destVideoPath,
        fileName: `${teamId} - ${videoFile.originalname}`,
        mimeType: videoFile.mimetype || "video/mp4",
        parentFolderId:
          teamFolder.folderId && !teamFolder.folderId.startsWith("local-dir")
            ? teamFolder.folderId
            : TARGET_DRIVE_FOLDER_ID,
      });

      videoPayload = {
        url: `/api/v2/submissions/${teamId}/video-stream`,
        title: `${teamName} - Explainer Video Pitch`,
        type: "direct_upload",
        driveDestination: defaultDriveDestination,
        driveFileId: driveUploadRes?.fileId || null,
        localPath: destVideoPath,
        originalName: videoFile.originalname,
        size: videoFile.size,
      };
    }

    // Process Supplementary Proposal Document if provided
    if (documentFile) {
      const teamFolder = await createTeamDriveFolder({ teamId, teamName });
      const ext = path.extname(documentFile.originalname) || ".pdf";
      const sanitizedDocName = `${teamId}_ProposalDocument${ext}`;
      const destDocPath = path.join(teamFolder.localPath || path.dirname(documentFile.path), sanitizedDocName);

      try {
        fs.copyFileSync(documentFile.path, destDocPath);
        fs.unlinkSync(documentFile.path);
      } catch (err) {
        console.warn("Could not move document file:", err.message);
      }

      // Sync to Google Drive Folder
      const docUploadRes = await uploadToGoogleDrive({
        filePath: destDocPath,
        fileName: `${teamId} - ${documentFile.originalname}`,
        mimeType: documentFile.mimetype || "application/pdf",
        parentFolderId:
          teamFolder.folderId && !teamFolder.folderId.startsWith("local-dir")
            ? teamFolder.folderId
            : TARGET_DRIVE_FOLDER_ID,
      });

      documentPayload = {
        name: documentFile.originalname,
        url: `/api/v2/submissions/${teamId}/document-preview`,
        driveDestination: defaultDriveDestination,
        driveFileId: docUploadRes?.fileId || null,
        localPath: destDocPath,
        size: documentFile.size,
      };
    }

    const submissionPayload = {
      teamId,
      teamName,
      category,
      city,
      theme,
      solutionName,
      shortDescription,
      detailedProposal: detailedProposal || shortDescription,
      video: videoPayload,
      document: documentPayload,
      members: parsedMembers,
      organizationDetails: parsedOrgDetails,
      status: "registered",
      eloRating: 1200,
      zScore: 0,
      rubricAverage: 0,
      evaluationCount: 0,
    };

    if (isDbConnected()) {
      const newSubmission = new Edition2Submission(submissionPayload);
      await newSubmission.save();
      return res.status(201).json({
        message: "Registration & idea submission uploaded directly to drive successfully!",
        submission: newSubmission,
        driveFolderId: TARGET_DRIVE_FOLDER_ID,
      });
    } else {
      // Local fallback
      const mockDoc = { _id: `local-${Date.now()}`, ...submissionPayload, createdAt: new Date() };
      localSubmissionsStore.unshift(mockDoc);
      return res.status(201).json({
        message: "Registration & idea submission uploaded directly to drive successfully (Local Dev Mode)!",
        submission: mockDoc,
        driveFolderId: TARGET_DRIVE_FOLDER_ID,
      });
    }
  } catch (error) {
    console.error("Edition 2 submission error:", error);
    return res.status(500).json({ message: "Submission failed", error: error.message });
  }
};

// ----------------------------------------------------
// 1b. Team-Specific Media Streaming & Isolated Previews (Jury Only)
// ----------------------------------------------------
export const streamSubmissionVideo = async (req, res) => {
  try {
    const { id } = req.params;
    let submission;

    if (isDbConnected()) {
      submission =
        (await Edition2Submission.findById(id)) ||
        (await Edition2Submission.findOne({ teamId: id }));
    } else {
      submission = localSubmissionsStore.find(
        (s) => s._id === id || s.teamId === id,
      );
    }

    if (!submission || !submission.video) {
      return res.status(404).json({ message: "Submission or video not found" });
    }

    // 1. If local cached / staged file exists, stream with HTTP 206 Range
    if (submission.video.localPath && fs.existsSync(submission.video.localPath)) {
      return streamVideoFile(submission.video.localPath, req, res);
    }

    // 2. If it's a remote URL (e.g. YouTube or direct link)
    if (submission.video.url && !submission.video.url.includes("/video-stream")) {
      return res.redirect(submission.video.url);
    }

    return res.status(404).json({ message: "Video media file is currently processing or unavailable" });
  } catch (err) {
    console.error("Video stream error:", err);
    return res.status(500).json({ message: "Error streaming video", error: err.message });
  }
};

export const previewSubmissionDocument = async (req, res) => {
  try {
    const { id } = req.params;
    let submission;

    if (isDbConnected()) {
      submission =
        (await Edition2Submission.findById(id)) ||
        (await Edition2Submission.findOne({ teamId: id }));
    } else {
      submission = localSubmissionsStore.find(
        (s) => s._id === id || s.teamId === id,
      );
    }

    if (!submission || !submission.document) {
      return res.status(404).json({ message: "Submission document not found" });
    }

    if (submission.document.localPath && fs.existsSync(submission.document.localPath)) {
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `inline; filename="${submission.document.name || "Proposal.pdf"}"`,
      );
      return fs.createReadStream(submission.document.localPath).pipe(res);
    }

    if (submission.document.url && !submission.document.url.includes("/document-preview")) {
      return res.redirect(submission.document.url);
    }

    return res.status(404).json({ message: "Document file not found" });
  } catch (err) {
    console.error("Document preview error:", err);
    return res.status(500).json({ message: "Error previewing document", error: err.message });
  }
};

export const getDriveSyncStatus = async (req, res) => {
  const isCloudSynced = Boolean(getDriveClient());
  res.json({
    targetDriveFolderId: TARGET_DRIVE_FOLDER_ID,
    driveFolderUrl: `https://drive.google.com/drive/folders/${TARGET_DRIVE_FOLDER_ID}`,
    syncEngine: isCloudSynced
      ? "Google Drive API v3 (Direct Cloud Connected)"
      : "Secure Team Isolation & Local Drive Staging Active",
    status: "healthy",
  });
};

// ----------------------------------------------------
// 2. Fetch All Submissions (with Juryza Metrics)
// ----------------------------------------------------
export const getEdition2Submissions = async (req, res) => {
  try {
    const { category, theme, status } = req.query;

    let filter = {};
    if (category && category !== "All") filter.category = category;
    if (theme && theme !== "All") filter.theme = theme;
    if (status && status !== "All") filter.status = status;

    if (isDbConnected()) {
      const submissions = await Edition2Submission.find(filter)
        .sort({ eloRating: -1, zScore: -1 })
        .lean();
      return res.status(200).json({ count: submissions.length, data: submissions });
    } else {
      let filtered = [...localSubmissionsStore];
      if (category && category !== "All")
        filtered = filtered.filter((s) => s.category === category);
      if (theme && theme !== "All") filtered = filtered.filter((s) => s.theme === theme);
      if (status && status !== "All") filtered = filtered.filter((s) => s.status === status);

      filtered.sort((a, b) => (b.eloRating || 0) - (a.eloRating || 0));
      return res.status(200).json({ count: filtered.length, data: filtered });
    }
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch submissions", error: error.message });
  }
};

// ----------------------------------------------------
// 3. Jury Evaluation: 4-Factor Rubric Scoring + Z-Score Normalization
// ----------------------------------------------------
export const submitRubricEvaluation = async (req, res) => {
  try {
    const {
      submissionId,
      judgeId = "judge-sdmimd-01",
      scores,
      feedback = "",
      round = 1,
    } = req.body;

    if (!submissionId || !scores) {
      return res.status(400).json({ message: "Submission ID and score rubric are required" });
    }

    const {
      problemClarity = 5,
      innovationImpact = 5,
      feasibilityScalability = 5,
      videoPitchDelivery = 5,
    } = scores;

    const totalRawScore =
      Number(problemClarity) +
      Number(innovationImpact) +
      Number(feasibilityScalability) +
      Number(videoPitchDelivery);

    if (isDbConnected()) {
      // Save Evaluation
      const evaluation = new Evaluation({
        submissionId,
        judgeId,
        round,
        type: "rubric",
        scores: {
          problemClarity,
          innovationImpact,
          feasibilityScalability,
          videoPitchDelivery,
        },
        totalRawScore,
        feedback,
      });
      await evaluation.save();

      // Recalculate average and Z-score for this judge's evaluations
      const judgeEvaluations = await Evaluation.find({ judgeId, type: "rubric" });
      const rawScores = judgeEvaluations.map((e) => e.totalRawScore);
      const mean = rawScores.reduce((a, b) => a + b, 0) / rawScores.length;
      const variance =
        rawScores.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / (rawScores.length || 1);
      const stdDev = Math.sqrt(variance) || 1;

      // Normalization: Z = (X - Mean) / StdDev
      const computedZScore = Number(((totalRawScore - mean) / stdDev).toFixed(2));

      // Update submission record
      const submission = await Edition2Submission.findById(submissionId);
      if (submission) {
        submission.rubricAverage = totalRawScore;
        submission.zScore = computedZScore;
        submission.evaluationCount = (submission.evaluationCount || 0) + 1;
        await submission.save();
      }

      return res.status(200).json({
        message: "Rubric evaluation submitted & normalized successfully",
        totalRawScore,
        zScore: computedZScore,
      });
    } else {
      // Local fallback
      const target = localSubmissionsStore.find((s) => s._id === submissionId);
      if (target) {
        target.rubricAverage = totalRawScore;
        target.zScore = Number(((totalRawScore - 20) / 7.5).toFixed(2)); // mock normalization
        target.evaluationCount = (target.evaluationCount || 0) + 1;
      }

      return res.status(200).json({
        message: "Rubric evaluation recorded (Local Mode)",
        totalRawScore,
        zScore: target?.zScore || 0,
      });
    }
  } catch (error) {
    console.error("Rubric evaluation error:", error);
    return res.status(500).json({ message: "Evaluation failed", error: error.message });
  }
};

// ----------------------------------------------------
// 4. Jury Evaluation: Pairwise Duel Arena (Bradley-Terry Elo)
// ----------------------------------------------------
export const submitPairwiseDuelVote = async (req, res) => {
  try {
    const { winnerId, loserId, judgeId = "judge-sdmimd-01" } = req.body;

    if (!winnerId || !loserId) {
      return res.status(400).json({ message: "Winner and loser IDs are required" });
    }

    const K = 32; // Elo sensitivity factor

    if (isDbConnected()) {
      const [teamA, teamB] = await Promise.all([
        Edition2Submission.findById(winnerId),
        Edition2Submission.findById(loserId),
      ]);

      if (!teamA || !teamB) {
        return res.status(404).json({ message: "One or both teams not found" });
      }

      // Expected outcome
      const expectedA = 1 / (1 + Math.pow(10, (teamB.eloRating - teamA.eloRating) / 400));
      const expectedB = 1 / (1 + Math.pow(10, (teamA.eloRating - teamB.eloRating) / 400));

      teamA.eloRating = Math.round(teamA.eloRating + K * (1 - expectedA));
      teamB.eloRating = Math.round(teamB.eloRating + K * (0 - expectedB));

      await Promise.all([teamA.save(), teamB.save()]);

      return res.status(200).json({
        message: "Pairwise duel recorded successfully!",
        winner: { id: teamA._id, name: teamA.teamName, newElo: teamA.eloRating },
        loser: { id: teamB._id, name: teamB.teamName, newElo: teamB.eloRating },
      });
    } else {
      const teamA = localSubmissionsStore.find((s) => s._id === winnerId);
      const teamB = localSubmissionsStore.find((s) => s._id === loserId);

      if (teamA && teamB) {
        const expectedA = 1 / (1 + Math.pow(10, ((teamB.eloRating || 1200) - (teamA.eloRating || 1200)) / 400));
        const expectedB = 1 / (1 + Math.pow(10, ((teamA.eloRating || 1200) - (teamB.eloRating || 1200)) / 400));

        teamA.eloRating = Math.round((teamA.eloRating || 1200) + K * (1 - expectedA));
        teamB.eloRating = Math.round((teamB.eloRating || 1200) + K * (0 - expectedB));
      }

      return res.status(200).json({
        message: "Pairwise duel recorded (Local Mode)!",
        winner: { id: teamA?._id, name: teamA?.teamName, newElo: teamA?.eloRating },
        loser: { id: teamB?._id, name: teamB?.teamName, newElo: teamB?.eloRating },
      });
    }
  } catch (error) {
    return res.status(500).json({ message: "Duel vote failed", error: error.message });
  }
};

// ----------------------------------------------------
// 5. Matchmaking for Duels: Pick Two Balanced Teams
// ----------------------------------------------------
export const getDuelPair = async (req, res) => {
  try {
    const { category, theme } = req.query;

    let pool = isDbConnected()
      ? await Edition2Submission.find(category && category !== "All" ? { category } : {}).lean()
      : [...localSubmissionsStore];

    if (pool.length < 2) {
      return res.status(200).json({ pair: pool });
    }

    // Pick two teams randomly or closest in Elo
    const indexA = Math.floor(Math.random() * pool.length);
    let indexB = (indexA + 1 + Math.floor(Math.random() * (pool.length - 1))) % pool.length;

    return res.status(200).json({ pair: [pool[indexA], pool[indexB]] });
  } catch (error) {
    return res.status(500).json({ message: "Failed to get duel pair", error: error.message });
  }
};

// ----------------------------------------------------
// 6. Advance / Update Status (Shortlist Command)
// ----------------------------------------------------
export const updateSubmissionStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (isDbConnected()) {
      const updated = await Edition2Submission.findByIdAndUpdate(
        id,
        { status },
        { returnDocument: "after" },
      );
      return res.status(200).json({ message: "Status updated", submission: updated });
    } else {
      const found = localSubmissionsStore.find((s) => s._id === id);
      if (found) found.status = status;
      return res.status(200).json({ message: "Status updated (Local)", submission: found });
    }
  } catch (error) {
    return res.status(500).json({ message: "Update status failed", error: error.message });
  }
};
