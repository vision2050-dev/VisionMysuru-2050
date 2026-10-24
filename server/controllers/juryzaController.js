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

export const ADMIN_EMAIL = "visionmysuru2050@sdmimd.ac.in";
const JWT_SECRET = process.env.JWT_SECRET || "visionmysuru2050_edition2_secret_key";

// Helper to determine if DB is connected
const isDbConnected = () => {
  return mongoose.connection && mongoose.connection.readyState === 1;
};

// In-memory fallback dataset for offline/local testing without MongoDB Atlas
let localJudgesStore = [
  {
    _id: "judge-1",
    name: "Dr. N.R. Parasuraman",
    email: "parasuraman@sdmimd.ac.in",
    role: "judge",
    organization: "SDMIMD Senior Panel",
    assignedDomain: "All",
    active: true,
  },
  {
    _id: "judge-2",
    name: "Dr. S. Sridhar",
    email: "sridhar.jury@gmail.com",
    role: "judge",
    organization: "Urban Mobility Advisory Board",
    assignedDomain: "Urban Infrastructure & Mobility",
    active: true,
  },
  {
    _id: "judge-3",
    name: "Dr. H. Gayathri",
    email: "gayathri.jury@gmail.com",
    role: "judge",
    organization: "Mysuru Environmental Forum",
    assignedDomain: "Environmental Sustainability",
    active: true,
  },
  {
    _id: "judge-4",
    name: "Prof. Malathi S.",
    email: "malathi.jury@gmail.com",
    role: "judge",
    organization: "Heritage Architecture Trust",
    assignedDomain: "Heritage Conservation",
    active: true,
  },
];

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
      driveDestination: "https://drive.google.com/drive/folders/1UKXUmqcMewEhw_KG7L1Fe740yCd6fX2e",
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
    createdByEmail: "aditi.rao@nie.ac.in",
    assignedJudgeEmail: "gayathri.jury@gmail.com",
    assignedJudgeName: "Dr. H. Gayathri",
    assignedJudgeId: "judge-3",
    allocatedAt: new Date(Date.now() - 3600000 * 24),
    progressState: "round_2_shortlisted",
    status: "round_2_shortlisted",
    eloRating: 1248,
    zScore: 1.42,
    rubricAverage: 34.5,
    evaluationCount: 3,
    createdAt: new Date(Date.now() - 3600000 * 48),
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
      driveDestination: "https://drive.google.com/drive/folders/1UKXUmqcMewEhw_KG7L1Fe740yCd6fX2e",
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
    createdByEmail: "rangaswamy.mys@gmail.com",
    assignedJudgeEmail: "malathi.jury@gmail.com",
    assignedJudgeName: "Prof. Malathi S.",
    assignedJudgeId: "judge-4",
    allocatedAt: new Date(Date.now() - 3600000 * 18),
    progressState: "round_1_shortlisted",
    status: "round_1_shortlisted",
    eloRating: 1216,
    zScore: 0.85,
    rubricAverage: 31.0,
    evaluationCount: 2,
    createdAt: new Date(Date.now() - 3600000 * 36),
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
      driveDestination: "https://drive.google.com/drive/folders/1UKXUmqcMewEhw_KG7L1Fe740yCd6fX2e",
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
    createdByEmail: "chirag.hegde@sdmimd.ac.in",
    assignedJudgeEmail: "sridhar.jury@gmail.com",
    assignedJudgeName: "Dr. S. Sridhar",
    assignedJudgeId: "judge-2",
    allocatedAt: new Date(Date.now() - 3600000 * 6),
    progressState: "under_evaluation",
    status: "under_evaluation",
    eloRating: 1190,
    zScore: -0.15,
    rubricAverage: 27.0,
    evaluationCount: 1,
    createdAt: new Date(Date.now() - 3600000 * 20),
  },
];

// ----------------------------------------------------
// 0. Gmail Authentication & Role Gateway
// ----------------------------------------------------
export const loginWithGmail = async (req, res) => {
  try {
    const { email, name, roleAttempt } = req.body;

    if (!email || !email.includes("@")) {
      return res.status(400).json({ message: "Valid Gmail address is required." });
    }

    const cleanEmail = email.toLowerCase().trim();
    const cleanName = name?.trim() || cleanEmail.split("@")[0];

    // Rule 1: Admin portal strictly restricted to visionmysuru2050@sdmimd.ac.in
    if (roleAttempt === "admin") {
      if (cleanEmail !== ADMIN_EMAIL.toLowerCase()) {
        return res.status(403).json({
          message: `Access Denied: The Admin Portal is strictly restricted to ${ADMIN_EMAIL}.`,
        });
      }

      const token = jwt.sign(
        { email: cleanEmail, name: "SDMIMD Vision Admin", role: "admin" },
        JWT_SECRET,
        { expiresIn: "7d" },
      );

      return res.status(200).json({
        message: "Admin authentication successful",
        token,
        user: { email: cleanEmail, name: "SDMIMD Vision Admin", role: "admin" },
      });
    }

    // Rule 2: Jury Member (Judge) authentication
    if (roleAttempt === "judge") {
      // Find judge in DB or in-memory store
      let judge;
      if (isDbConnected()) {
        judge = await Judge.findOne({ email: cleanEmail, active: true }).lean();
      } else {
        judge = localJudgesStore.find(
          (j) => j.email.toLowerCase() === cleanEmail && j.active !== false,
        );
      }

      if (!judge) {
        return res.status(403).json({
          message: `Access Denied: ${cleanEmail} is not registered on the official Jury Panel. Please contact the administrator.`,
        });
      }

      const token = jwt.sign(
        {
          id: judge._id,
          email: cleanEmail,
          name: judge.name,
          role: "judge",
          organization: judge.organization,
        },
        JWT_SECRET,
        { expiresIn: "7d" },
      );

      return res.status(200).json({
        message: "Jury panel authentication successful",
        token,
        user: {
          id: judge._id,
          email: cleanEmail,
          name: judge.name,
          role: "judge",
          organization: judge.organization,
          assignedDomain: judge.assignedDomain,
        },
      });
    }

    // Rule 3: Participant authentication
    const token = jwt.sign(
      { email: cleanEmail, name: cleanName, role: "participant" },
      JWT_SECRET,
      { expiresIn: "7d" },
    );

    return res.status(200).json({
      message: "Participant authentication successful",
      token,
      user: { email: cleanEmail, name: cleanName, role: "participant" },
    });
  } catch (err) {
    console.error("Gmail login error:", err);
    return res.status(500).json({ message: "Authentication failed", error: err.message });
  }
};

export const getMe = async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ message: "Not authenticated" });
  }
  return res.status(200).json({ user: req.user });
};

// ----------------------------------------------------
// 0b. Judge Management & Allocation Services (Admin Only)
// ----------------------------------------------------
export const getJudgesList = async (req, res) => {
  try {
    let judges;
    let submissions;

    if (isDbConnected()) {
      judges = await Judge.find({ active: true }).sort({ name: 1 }).lean();
      submissions = await Edition2Submission.find({}).select("assignedJudgeEmail status").lean();
    } else {
      judges = [...localJudgesStore];
      submissions = [...localSubmissionsStore];
    }

    // Attach current allocation count to each judge
    const annotated = judges.map((j) => {
      const alloted = submissions.filter(
        (s) => s.assignedJudgeEmail?.toLowerCase() === j.email.toLowerCase(),
      );
      return {
        ...j,
        allocatedCount: alloted.length,
      };
    });

    const unallocatedCount = submissions.filter((s) => !s.assignedJudgeEmail).length;

    return res.status(200).json({
      count: annotated.length,
      unallocatedCount,
      totalSubmissions: submissions.length,
      data: annotated,
    });
  } catch (err) {
    return res.status(500).json({ message: "Failed to fetch judges", error: err.message });
  }
};

export const registerJudge = async (req, res) => {
  try {
    const { name, email, organization = "SDMIMD Panel", assignedDomain = "All" } = req.body;

    if (!name || !email) {
      return res.status(400).json({ message: "Judge name and valid Gmail ID are required" });
    }

    const cleanEmail = email.toLowerCase().trim();

    if (isDbConnected()) {
      const exists = await Judge.findOne({ email: cleanEmail });
      if (exists) {
        return res.status(400).json({ message: "Judge with this Gmail ID already registered" });
      }
      const newJudge = new Judge({
        name: name.trim(),
        email: cleanEmail,
        organization,
        assignedDomain,
        role: "judge",
        active: true,
      });
      await newJudge.save();
      return res.status(201).json({ message: "Judge added successfully", judge: newJudge });
    } else {
      const exists = localJudgesStore.find((j) => j.email.toLowerCase() === cleanEmail);
      if (exists) {
        return res.status(400).json({ message: "Judge with this Gmail ID already registered" });
      }
      const newJudge = {
        _id: `judge-${Date.now()}`,
        name: name.trim(),
        email: cleanEmail,
        organization,
        assignedDomain,
        role: "judge",
        active: true,
      };
      localJudgesStore.push(newJudge);
      return res.status(201).json({ message: "Judge added (Local Mode)", judge: newJudge });
    }
  } catch (err) {
    return res.status(500).json({ message: "Failed to register judge", error: err.message });
  }
};

export const deleteJudge = async (req, res) => {
  try {
    const { id } = req.params;

    if (isDbConnected()) {
      const judge = await Judge.findById(id);
      if (judge) {
        // Unallocate their submissions
        await Edition2Submission.updateMany(
          { assignedJudgeEmail: judge.email },
          {
            $set: {
              assignedJudgeEmail: null,
              assignedJudgeName: null,
              assignedJudgeId: null,
              progressState: "submitted",
              status: "submitted",
            },
          },
        );
        await Judge.findByIdAndDelete(id);
      }
    } else {
      const judge = localJudgesStore.find((j) => j._id === id || j.email === id);
      if (judge) {
        localSubmissionsStore.forEach((s) => {
          if (s.assignedJudgeEmail === judge.email) {
            s.assignedJudgeEmail = null;
            s.assignedJudgeName = null;
            s.assignedJudgeId = null;
            s.progressState = "submitted";
            s.status = "submitted";
          }
        });
        localJudgesStore = localJudgesStore.filter((j) => j._id !== id && j.email !== id);
      }
    }

    return res.status(200).json({ message: "Judge removed and submissions unassigned" });
  } catch (err) {
    return res.status(500).json({ message: "Failed to remove judge", error: err.message });
  }
};

export const allocateSubmission = async (req, res) => {
  try {
    const { id } = req.params;
    const { judgeEmail, judgeName } = req.body;

    if (!judgeEmail) {
      return res.status(400).json({ message: "Target judge email is required" });
    }

    const cleanEmail = judgeEmail.toLowerCase().trim();

    if (isDbConnected()) {
      const submission =
        (await Edition2Submission.findById(id)) ||
        (await Edition2Submission.findOne({ teamId: id }));

      if (!submission) {
        return res.status(404).json({ message: "Submission not found" });
      }

      submission.assignedJudgeEmail = cleanEmail;
      submission.assignedJudgeName = judgeName || cleanEmail;
      submission.allocatedAt = new Date();
      submission.progressState = "allocated";
      submission.status = "allocated";
      await submission.save();

      return res.status(200).json({ message: "Submission successfully allocated to judge", submission });
    } else {
      const sub = localSubmissionsStore.find((s) => s._id === id || s.teamId === id);
      if (!sub) {
        return res.status(404).json({ message: "Submission not found" });
      }

      sub.assignedJudgeEmail = cleanEmail;
      sub.assignedJudgeName = judgeName || cleanEmail;
      sub.allocatedAt = new Date();
      sub.progressState = "allocated";
      sub.status = "allocated";

      return res.status(200).json({ message: "Submission successfully allocated (Local)", submission: sub });
    }
  } catch (err) {
    return res.status(500).json({ message: "Allocation failed", error: err.message });
  }
};

export const autoAllocateSubmissions = async (req, res) => {
  try {
    let judges;
    let submissions;

    if (isDbConnected()) {
      judges = await Judge.find({ active: true }).lean();
      submissions = await Edition2Submission.find({
        $or: [{ assignedJudgeEmail: null }, { assignedJudgeEmail: "" }, { assignedJudgeEmail: { $exists: false } }],
      });
    } else {
      judges = localJudgesStore.filter((j) => j.active !== false);
      submissions = localSubmissionsStore.filter((s) => !s.assignedJudgeEmail);
    }

    if (judges.length === 0) {
      return res.status(400).json({ message: "No active judges registered. Add judges before auto-allocating." });
    }

    if (submissions.length === 0) {
      return res.status(200).json({ message: "All submissions are already allocated!", allocatedCount: 0 });
    }

    let judgeIndex = 0;
    const distribution = {};
    judges.forEach((j) => (distribution[j.email] = 0));

    if (isDbConnected()) {
      for (const sub of submissions) {
        const assignedJudge = judges[judgeIndex % judges.length];
        sub.assignedJudgeEmail = assignedJudge.email;
        sub.assignedJudgeName = assignedJudge.name;
        sub.assignedJudgeId = assignedJudge._id;
        sub.allocatedAt = new Date();
        sub.progressState = "allocated";
        sub.status = "allocated";
        await sub.save();

        distribution[assignedJudge.email] = (distribution[assignedJudge.email] || 0) + 1;
        judgeIndex++;
      }
    } else {
      submissions.forEach((sub) => {
        const assignedJudge = judges[judgeIndex % judges.length];
        sub.assignedJudgeEmail = assignedJudge.email;
        sub.assignedJudgeName = assignedJudge.name;
        sub.assignedJudgeId = assignedJudge._id;
        sub.allocatedAt = new Date();
        sub.progressState = "allocated";
        sub.status = "allocated";

        distribution[assignedJudge.email] = (distribution[assignedJudge.email] || 0) + 1;
        judgeIndex++;
      });
    }

    return res.status(200).json({
      message: `Successfully distributed ${submissions.length} submissions evenly among ${judges.length} judges.`,
      allocatedCount: submissions.length,
      distribution,
    });
  } catch (err) {
    return res.status(500).json({ message: "Auto allocation failed", error: err.message });
  }
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

    // Determine createdByEmail
    const leader = parsedMembers.find((m) => m.isLeader) || parsedMembers[0];
    const createdByEmail = (req.user?.email || leader?.email || "").toLowerCase().trim();

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
      createdByEmail,
      assignedJudgeEmail: null,
      assignedJudgeName: null,
      assignedJudgeId: null,
      allocatedAt: null,
      progressState: "submitted",
      status: "submitted",
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
// 2. Fetch Submissions (with Role-based Isolation)
// - Admin sees everything
// - Judge sees ONLY alloted submissions
// - Participant sees their own submission
// ----------------------------------------------------
export const getEdition2Submissions = async (req, res) => {
  try {
    const { category, theme, status, assignedJudgeEmail } = req.query;
    const user = req.user;

    let filter = {};
    if (category && category !== "All") filter.category = category;
    if (theme && theme !== "All") filter.theme = theme;
    if (status && status !== "All") filter.status = status;

    // Strict Role Enforcement
    if (user?.role === "judge") {
      // Judge only sees submissions allocated to their Gmail
      filter.assignedJudgeEmail = user.email.toLowerCase();
    } else if (user?.role === "admin") {
      // Admin can view all or filter by specific judge
      if (assignedJudgeEmail && assignedJudgeEmail !== "All") {
        if (assignedJudgeEmail === "unassigned") {
          filter.$or = [{ assignedJudgeEmail: null }, { assignedJudgeEmail: "" }];
        } else {
          filter.assignedJudgeEmail = assignedJudgeEmail.toLowerCase();
        }
      }
    } else if (user?.role === "participant") {
      // Participant sees their own
      filter.$or = [
        { createdByEmail: user.email.toLowerCase() },
        { "members.email": user.email.toLowerCase() },
      ];
    }

    if (isDbConnected()) {
      const submissions = await Edition2Submission.find(filter)
        .sort({ eloRating: -1, zScore: -1, createdAt: -1 })
        .lean();
      return res.status(200).json({ count: submissions.length, data: submissions });
    } else {
      let filtered = [...localSubmissionsStore];

      // Filter by role
      if (user?.role === "judge") {
        filtered = filtered.filter(
          (s) => s.assignedJudgeEmail?.toLowerCase() === user.email.toLowerCase(),
        );
      } else if (user?.role === "participant") {
        filtered = filtered.filter(
          (s) =>
            s.createdByEmail?.toLowerCase() === user.email.toLowerCase() ||
            s.members?.some((m) => m.email?.toLowerCase() === user.email.toLowerCase()),
        );
      } else if (user?.role === "admin" && assignedJudgeEmail && assignedJudgeEmail !== "All") {
        if (assignedJudgeEmail === "unassigned") {
          filtered = filtered.filter((s) => !s.assignedJudgeEmail);
        } else {
          filtered = filtered.filter(
            (s) => s.assignedJudgeEmail?.toLowerCase() === assignedJudgeEmail.toLowerCase(),
          );
        }
      }

      if (category && category !== "All") filtered = filtered.filter((s) => s.category === category);
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
// 2b. Participant Live Submission & Progress Tracker
// ----------------------------------------------------
export const getMySubmission = async (req, res) => {
  try {
    const email = (req.user?.email || req.query.email || "").toLowerCase().trim();

    if (!email) {
      return res.status(400).json({ message: "Participant Gmail ID required" });
    }

    let submission;
    if (isDbConnected()) {
      submission = await Edition2Submission.findOne({
        $or: [{ createdByEmail: email }, { "members.email": email }],
      })
        .sort({ createdAt: -1 })
        .lean();
    } else {
      submission = localSubmissionsStore.find(
        (s) =>
          s.createdByEmail?.toLowerCase() === email ||
          s.members?.some((m) => m.email?.toLowerCase() === email),
      );
    }

    if (!submission) {
      return res.status(200).json({
        found: false,
        message: "No active submission registered for this Gmail address yet.",
        submission: null,
      });
    }

    // Progress timeline calculation
    // States: submitted -> allocated -> under_evaluation -> shortlisted/rejected -> winner
    const currentState = submission.progressState || submission.status || "submitted";

    const isSubmitted = true;
    const isAllocated = Boolean(
      submission.assignedJudgeEmail ||
        ["allocated", "under_evaluation", "round_1_shortlisted", "round_1_rejected", "round_2_shortlisted", "grand_finale_shortlisted", "winner"].includes(currentState),
    );
    const isUnderEvaluation = [
      "under_evaluation",
      "round_1_shortlisted",
      "round_1_rejected",
      "round_2_shortlisted",
      "grand_finale_shortlisted",
      "winner",
    ].includes(currentState);
    const isShortlisted = [
      "round_1_shortlisted",
      "round_2_shortlisted",
      "grand_finale_shortlisted",
      "winner",
    ].includes(currentState);
    const isRejected = ["round_1_rejected", "round_2_rejected"].includes(currentState);
    const isWinner = currentState === "winner";

    return res.status(200).json({
      found: true,
      submission,
      progressTimeline: {
        currentState,
        isSubmitted,
        isAllocated,
        assignedJudgeName: submission.assignedJudgeName || null,
        allocatedAt: submission.allocatedAt || null,
        isUnderEvaluation,
        isShortlisted,
        isRejected,
        isWinner,
      },
    });
  } catch (err) {
    return res.status(500).json({ message: "Failed to fetch submission progress", error: err.message });
  }
};

// ----------------------------------------------------
// 3. Jury Evaluation: 4-Factor Rubric Scoring + Z-Score Normalization
// ----------------------------------------------------
export const submitRubricEvaluation = async (req, res) => {
  try {
    const {
      submissionId,
      scores,
      feedback = "",
      round = 1,
    } = req.body;

    const judgeId = req.user?.id || req.body.judgeId || "judge-sdmimd-01";
    const judgeEmail = req.user?.email || "judge@sdmimd.ac.in";

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
        if (submission.progressState === "allocated") {
          submission.progressState = "under_evaluation";
          submission.status = "under_evaluation";
        }
        await submission.save();
      }

      return res.status(200).json({
        message: "Rubric evaluation submitted & normalized successfully",
        totalRawScore,
        zScore: computedZScore,
      });
    } else {
      // Local fallback
      const target = localSubmissionsStore.find((s) => s._id === submissionId || s.teamId === submissionId);
      if (target) {
        target.rubricAverage = totalRawScore;
        target.zScore = Number(((totalRawScore - 20) / 7.5).toFixed(2));
        target.evaluationCount = (target.evaluationCount || 0) + 1;
        if (target.progressState === "allocated" || target.progressState === "submitted") {
          target.progressState = "under_evaluation";
          target.status = "under_evaluation";
        }
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
    const { winnerId, loserId } = req.body;
    const judgeId = req.user?.id || req.body.judgeId || "judge-sdmimd-01";

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

      const expectedA = 1 / (1 + Math.pow(10, (teamB.eloRating - teamA.eloRating) / 400));
      const expectedB = 1 / (1 + Math.pow(10, (teamA.eloRating - teamB.eloRating) / 400));

      teamA.eloRating = Math.round(teamA.eloRating + K * (1 - expectedA));
      teamB.eloRating = Math.round(teamB.eloRating + K * (0 - expectedB));

      await Promise.all([teamA.save(), teamB.save()]);

      const duelRecord = new Evaluation({
        judgeId,
        type: "duel",
        duel: {
          teamAId: winnerId,
          teamBId: loserId,
          winnerId,
          eloChangeA: Math.round(K * (1 - expectedA)),
          eloChangeB: Math.round(K * (0 - expectedB)),
        },
      });
      await duelRecord.save();

      return res.status(200).json({
        message: "Duel recorded and Elo ratings updated",
        winner: { id: teamA._id, newElo: teamA.eloRating },
        loser: { id: teamB._id, newElo: teamB.eloRating },
      });
    } else {
      const teamA = localSubmissionsStore.find((s) => s._id === winnerId || s.teamId === winnerId);
      const teamB = localSubmissionsStore.find((s) => s._id === loserId || s.teamId === loserId);

      if (!teamA || !teamB) {
        return res.status(404).json({ message: "One or both teams not found in local store" });
      }

      const expectedA = 1 / (1 + Math.pow(10, ((teamB.eloRating || 1200) - (teamA.eloRating || 1200)) / 400));
      teamA.eloRating = Math.round((teamA.eloRating || 1200) + K * (1 - expectedA));
      teamB.eloRating = Math.round((teamB.eloRating || 1200) - K * (1 - expectedA));

      return res.status(200).json({
        message: "Duel recorded and Elo ratings updated (Local Mode)",
        winner: { id: teamA._id, newElo: teamA.eloRating },
        loser: { id: teamB._id, newElo: teamB.eloRating },
      });
    }
  } catch (error) {
    console.error("Duel vote error:", error);
    return res.status(500).json({ message: "Failed to record duel vote", error: error.message });
  }
};

export const getDuelPair = async (req, res) => {
  try {
    const user = req.user;
    let pool;

    if (isDbConnected()) {
      let filter = {};
      if (user?.role === "judge") {
        filter.assignedJudgeEmail = user.email.toLowerCase();
      }
      pool = await Edition2Submission.find(filter).lean();
    } else {
      pool = [...localSubmissionsStore];
      if (user?.role === "judge") {
        pool = pool.filter(
          (s) => s.assignedJudgeEmail?.toLowerCase() === user.email.toLowerCase(),
        );
      }
    }

    if (pool.length < 2) {
      return res.status(400).json({
        message: "At least 2 submissions are required in your alloted pool to initiate a duel comparison.",
      });
    }

    const shuffled = pool.sort(() => 0.5 - Math.random());
    return res.status(200).json({ teamA: shuffled[0], teamB: shuffled[1] });
  } catch (error) {
    return res.status(500).json({ message: "Failed to get duel pair", error: error.message });
  }
};

// ----------------------------------------------------
// 6. Advance / Update Progress State
// Both Admin and assigned Jury can update team state
// ----------------------------------------------------
export const updateSubmissionStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, progressState } = req.body;
    const targetState = progressState || status;

    if (!targetState) {
      return res.status(400).json({ message: "Target status or progressState is required" });
    }

    if (isDbConnected()) {
      const submission =
        (await Edition2Submission.findById(id)) ||
        (await Edition2Submission.findOne({ teamId: id }));

      if (!submission) {
        return res.status(404).json({ message: "Submission not found" });
      }

      // Check judge permission if not admin
      if (
        req.user?.role === "judge" &&
        submission.assignedJudgeEmail?.toLowerCase() !== req.user.email.toLowerCase()
      ) {
        return res.status(403).json({
          message: "Access Denied: You can only update submissions alloted to you.",
        });
      }

      submission.progressState = targetState;
      submission.status = targetState;
      await submission.save();

      return res.status(200).json({ message: "Submission progress state updated successfully", submission });
    } else {
      const found = localSubmissionsStore.find((s) => s._id === id || s.teamId === id);
      if (!found) {
        return res.status(404).json({ message: "Submission not found" });
      }

      if (
        req.user?.role === "judge" &&
        found.assignedJudgeEmail?.toLowerCase() !== req.user.email.toLowerCase()
      ) {
        return res.status(403).json({
          message: "Access Denied: You can only update submissions alloted to you.",
        });
      }

      found.progressState = targetState;
      found.status = targetState;
      return res.status(200).json({ message: "Status updated (Local)", submission: found });
    }
  } catch (error) {
    return res.status(500).json({ message: "Update status failed", error: error.message });
  }
};
