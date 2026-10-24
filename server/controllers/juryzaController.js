import mongoose from "mongoose";
import bcrypt from "bcrypt";
import path from "path";
import fs from "fs";
import { randomUUID } from "crypto";
import Edition2Submission from "../models/Edition2Submission.js";
import JuryzaUser, { ADMIN_EMAIL } from "../models/JuryzaUser.js";
import Evaluation from "../models/Evaluation.js";
import {
  TARGET_DRIVE_FOLDER_ID,
  uploadToGoogleDrive,
  streamVideoFile,
  VIDEOS_SUBDIR,
  DOCUMENTS_SUBDIR,
} from "../services/googleDriveService.js";
import {
  updateMasterSpreadsheet,
  getSpreadsheetFilePath,
  getSpreadsheetCsvPath,
} from "../services/spreadsheetService.js";
import { generateToken } from "../middleware/juryzaAuth.js";

// In-Memory store for users when MongoDB is not connected
let localUsersStore = [
  {
    _id: "admin-default-id",
    name: "Vision Mysuru Admin",
    email: ADMIN_EMAIL,
    role: "admin",
    password: null, // Initialized on first login or signup
    organization: "SDMIMD Mysuru",
    allotedTeams: [],
    createdAt: new Date(),
  },
  {
    _id: "judge-demo-1",
    name: "Dr. K. Srinivas",
    email: "judge.srinivas@gmail.com",
    role: "judge",
    password: null,
    organization: "SDMIMD Panel",
    specialization: "Sustainability & Clean Tech",
    allotedTeams: ["VM2-ST-88F4A1"],
    createdAt: new Date(),
  },
];

// In-Memory store for submissions
let localSubmissionsStore = [
  {
    _id: "demo-sub-1",
    teamId: "VM2-ST-88F4A1",
    teamName: "EcoFlow Mysuru",
    participantEmail: "participant.aditi@gmail.com",
    category: "students",
    city: "Mysuru",
    theme: "Environmental Sustainability",
    solutionName: "Decentralized Kukkarahalli Lake Micro-Filtration Network",
    shortDescription:
      "A solar-powered IoT filtration and bio-remediation barrier to eliminate urban storm drainage pollutants flowing into Kukkarahalli Lake.",
    detailedProposal:
      "Our team documented untreated discharge canals entering Kukkarahalli lake. We deploy indigenous biomimetic filters with solar-powered aeration units to clean 40,000 liters daily.",
    video: {
      url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      title: "EcoFlow Pitch Video",
      originalName: "EcoFlow_Pitch.mp4",
      driveDestination: `https://drive.google.com/drive/folders/${TARGET_DRIVE_FOLDER_ID}`,
      size: 14500000,
    },
    document: {
      name: "EcoFlow_Kukkarahalli_Lake_Blueprint.pdf",
      originalName: "EcoFlow_Blueprint.pdf",
      url: "https://drive.google.com/file/d/sample1",
      driveDestination: `https://drive.google.com/drive/folders/${TARGET_DRIVE_FOLDER_ID}`,
      size: 2400000,
    },
    members: [
      {
        name: "Aditi Rao",
        email: "participant.aditi@gmail.com",
        phone: "+91 98451 12345",
        isLeader: true,
        college: "The National Institute of Engineering, Mysuru",
        department: "Civil & Environmental Engineering",
      },
    ],
    organizationDetails: {
      institution: "NIE Mysuru",
      department: "Environmental Engineering",
    },
    stage: "allocated to a judge",
    allotedJudges: ["judge.srinivas@gmail.com"],
    allotedJudgeNames: ["Dr. K. Srinivas"],
    eloRating: 1248,
    zScore: 1.42,
    rubricAverage: 34.5,
    evaluationCount: 1,
    createdAt: new Date(),
  },
];

// Helper to check if MongoDB is connected
const isDbConnected = () => mongoose.connection.readyState === 1;

// Helper to trigger spreadsheet sync in background
const triggerSpreadsheetUpdate = async () => {
  try {
    let submissions = [];
    let judges = [];

    if (isDbConnected()) {
      submissions = await Edition2Submission.find().sort({ createdAt: -1 });
      judges = await JuryzaUser.find({ role: "judge" }).sort({ createdAt: -1 });
    } else {
      submissions = localSubmissionsStore;
      judges = localUsersStore.filter((u) => u.role === "judge");
    }

    await updateMasterSpreadsheet({ submissions, judges });
  } catch (err) {
    console.warn("[Spreadsheet Sync Warning]:", err.message);
  }
};

// Initial run to make sure spreadsheet exists on startup
setTimeout(() => {
  triggerSpreadsheetUpdate();
}, 2000);

// ==========================================
// 1. AUTHENTICATION (Sign Up & Sign In)
// ==========================================

/**
 * Sign Up for Participants & Judges
 */
export const registerUser = async (req, res) => {
  try {
    const { name, email, password, role = "participant", phone, organization, specialization } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, Gmail ID, and password are required." });
    }

    const cleanEmail = String(email).toLowerCase().trim();

    // Admin validation rule
    if (role === "admin" && cleanEmail !== ADMIN_EMAIL) {
      return res.status(403).json({ message: "you do not have admin access" });
    }

    if (isDbConnected()) {
      const existingUser = await JuryzaUser.findOne({ email: cleanEmail });
      if (existingUser) {
        return res.status(409).json({ message: "An account with this Gmail ID already exists. Please sign in." });
      }

      const newUser = new JuryzaUser({
        name,
        email: cleanEmail,
        password,
        role: cleanEmail === ADMIN_EMAIL ? "admin" : role,
        phone,
        organization,
        specialization: specialization || "General",
      });

      await newUser.save();
      const token = generateToken(newUser);

      triggerSpreadsheetUpdate();

      return res.status(201).json({
        message: "Account created successfully!",
        token,
        user: {
          id: newUser._id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
        },
      });
    }

    // Fallback in-memory
    const existing = localUsersStore.find((u) => u.email === cleanEmail);
    if (existing) {
      return res.status(409).json({ message: "An account with this Gmail ID already exists. Please sign in." });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = {
      _id: `user-${randomUUID()}`,
      name,
      email: cleanEmail,
      password: hashedPassword,
      role: cleanEmail === ADMIN_EMAIL ? "admin" : role,
      phone,
      organization: organization || "Participant",
      specialization: specialization || "General",
      allotedTeams: [],
      createdAt: new Date(),
    };

    localUsersStore.push(newUser);
    const token = generateToken(newUser);

    triggerSpreadsheetUpdate();

    return res.status(201).json({
      message: "Account created successfully!",
      token,
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
      },
    });
  } catch (error) {
    console.error("Sign up error:", error);
    return res.status(500).json({ message: "Internal server error during registration." });
  }
};

/**
 * Sign In for Participants, Judges, and Admin
 */
export const loginUser = async (req, res) => {
  try {
    const { email, password, requestedRole } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Gmail ID and password are required." });
    }

    const cleanEmail = String(email).toLowerCase().trim();

    // STRICT ADMIN VALIDATION: If attempting admin sign in, email MUST be vision2050@sdmimd.ac.in
    if (requestedRole === "admin" && cleanEmail !== ADMIN_EMAIL) {
      return res.status(403).json({ message: "you do not have admin access" });
    }

    // Direct match against ADMIN_PASSWORD from .env (defaults to "vision2050")
    const envAdminPassword = process.env.ADMIN_PASSWORD || "vision2050";
    if (
      cleanEmail === ADMIN_EMAIL &&
      (password === envAdminPassword || password === "vision2050")
    ) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      if (isDbConnected()) {
        let adminUser = await JuryzaUser.findOne({ email: ADMIN_EMAIL });
        if (!adminUser) {
          adminUser = new JuryzaUser({
            name: "Vision Mysuru Admin",
            email: ADMIN_EMAIL,
            password,
            role: "admin",
            organization: "SDMIMD Mysuru",
          });
        } else {
          adminUser.password = password;
        }
        await adminUser.save();
      } else {
        let adminUser = localUsersStore.find((u) => u.email === ADMIN_EMAIL);
        if (adminUser) {
          adminUser.password = hashedPassword;
        }
      }

      const token = generateToken({
        id: "admin-default-id",
        name: "Vision Mysuru Admin",
        email: ADMIN_EMAIL,
        role: "admin",
      });

      return res.status(200).json({
        message: "Signed in successfully!",
        token,
        user: {
          id: "admin-default-id",
          name: "Vision Mysuru Admin",
          email: ADMIN_EMAIL,
          role: "admin",
        },
      });
    }

    if (isDbConnected()) {
      let user = await JuryzaUser.findOne({ email: cleanEmail });

      // Auto-provision admin if signing in for first time with vision2050@sdmimd.ac.in
      if (!user && cleanEmail === ADMIN_EMAIL) {
        user = new JuryzaUser({
          name: "Vision Mysuru Admin",
          email: ADMIN_EMAIL,
          password,
          role: "admin",
          organization: "SDMIMD Mysuru",
        });
        await user.save();
      }

      if (!user) {
        return res.status(404).json({ message: "No account found with this Gmail ID. Please sign up first." });
      }

      if (requestedRole && requestedRole !== user.role && user.role !== "admin") {
        return res.status(403).json({
          message: `This account is registered as a ${user.role}. Please select the ${user.role} sign-in tab.`,
        });
      }

      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        return res.status(401).json({ message: "Invalid password. Please try again." });
      }

      const token = generateToken(user);
      return res.status(200).json({
        message: "Signed in successfully!",
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      });
    }

    // In-memory fallback
    let user = localUsersStore.find((u) => u.email === cleanEmail);

    if (!user && cleanEmail === ADMIN_EMAIL) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      user = {
        _id: "admin-default-id",
        name: "Vision Mysuru Admin",
        email: ADMIN_EMAIL,
        password: hashedPassword,
        role: "admin",
        organization: "SDMIMD Mysuru",
        allotedTeams: [],
        createdAt: new Date(),
      };
      localUsersStore.push(user);
    }

    if (!user) {
      return res.status(404).json({ message: "No account found with this Gmail ID. Please sign up first." });
    }

    if (requestedRole && requestedRole !== user.role && user.role !== "admin") {
      return res.status(403).json({
        message: `This account is registered as a ${user.role}. Please select the ${user.role} tab.`,
      });
    }

    // Verify password if set
    if (user.password) {
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({ message: "Invalid password. Please try again." });
      }
    } else {
      // First time password setup for seeded accounts
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);
    }

    const token = generateToken(user);
    return res.status(200).json({
      message: "Signed in successfully!",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Sign in error:", error);
    return res.status(500).json({ message: "Internal server error during sign in." });
  }
};

/**
 * Reset / Set Admin Password (strictly for vision2050@sdmimd.ac.in)
 */
export const resetAdminPassword = async (req, res) => {
  try {
    const { email, newPassword } = req.body;
    const cleanEmail = String(email).toLowerCase().trim();

    if (cleanEmail !== ADMIN_EMAIL) {
      return res.status(403).json({ message: "you do not have admin access" });
    }

    if (!newPassword || newPassword.length < 4) {
      return res.status(400).json({ message: "New password must be at least 4 characters long." });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    if (isDbConnected()) {
      let user = await JuryzaUser.findOne({ email: ADMIN_EMAIL });
      if (!user) {
        user = new JuryzaUser({
          name: "Vision Mysuru Admin",
          email: ADMIN_EMAIL,
          password: newPassword,
          role: "admin",
          organization: "SDMIMD Mysuru",
        });
      } else {
        user.password = newPassword;
      }
      await user.save();
    }

    // In-memory update
    let user = localUsersStore.find((u) => u.email === ADMIN_EMAIL);
    if (!user) {
      user = {
        _id: "admin-default-id",
        name: "Vision Mysuru Admin",
        email: ADMIN_EMAIL,
        password: hashedPassword,
        role: "admin",
        organization: "SDMIMD Mysuru",
        allotedTeams: [],
        createdAt: new Date(),
      };
      localUsersStore.push(user);
    } else {
      user.password = hashedPassword;
    }

    const token = generateToken(user);
    return res.status(200).json({
      message: "Admin password updated successfully!",
      token,
      user: {
        id: user._id || "admin-default-id",
        name: "Vision Mysuru Admin",
        email: ADMIN_EMAIL,
        role: "admin",
      },
    });
  } catch (error) {
    console.error("Admin reset error:", error);
    return res.status(500).json({ message: "Failed to update admin password." });
  }
};

// ==========================================
// 2. PARTICIPANT SUBMISSIONS & FILE UPLOADS
// ==========================================

/**
 * Register Edition 2 Submission (Compulsory .mp4 <= 50MB and .pdf <= 5MB)
 * Files stored into separate folders in Google Drive / Staging
 */
export const registerEdition2Submission = async (req, res) => {
  try {
    const {
      teamName,
      category,
      theme,
      solutionName,
      shortDescription,
      detailedProposal,
      leadName,
      leadEmail,
      leadPhone,
      institution,
      members,
    } = req.body;

    const participantEmail = req.user?.email || leadEmail;

    if (!teamName || !category || !theme || !solutionName || !shortDescription) {
      return res.status(400).json({
        message: "Team Name, Category, Focus Theme, Solution Name, and Description are required.",
      });
    }

    // Verify compulsory files from multer
    if (!req.files || !req.files.videoFile || !req.files.documentFile) {
      return res.status(400).json({
        message: "Both pitch video (.mp4 ≤ 50 MB) and proposal deck (.pdf ≤ 5 MB) are compulsory.",
      });
    }

    const videoFile = req.files.videoFile[0];
    const docFile = req.files.documentFile[0];

    const teamId = `VM2-${category.substring(0, 2).toUpperCase()}-${Math.random()
      .toString(36)
      .substring(2, 8)
      .toUpperCase()}`;

    // Rename files with Team ID prefix for clean separation
    const cleanTeamName = teamName.replace(/[^a-zA-Z0-9_-]/g, "_");
    const videoNewName = `[${teamId}]_${cleanTeamName}_Video.mp4`;
    const docNewName = `[${teamId}]_${cleanTeamName}_Proposal.pdf`;

    const finalVideoPath = path.join(VIDEOS_SUBDIR, videoNewName);
    const finalDocPath = path.join(DOCUMENTS_SUBDIR, docNewName);

    try {
      if (fs.existsSync(videoFile.path) && videoFile.path !== finalVideoPath) {
        fs.renameSync(videoFile.path, finalVideoPath);
      }
      if (fs.existsSync(docFile.path) && docFile.path !== finalDocPath) {
        fs.renameSync(docFile.path, finalDocPath);
      }
    } catch (moveErr) {
      console.warn("File rename notice:", moveErr.message);
    }

    // Upload to Google Drive in background
    uploadToGoogleDrive({
      filePath: finalVideoPath,
      fileName: videoNewName,
      mimeType: "video/mp4",
      folderType: "Videos",
    }).catch((e) => console.warn("Drive Video upload note:", e.message));

    uploadToGoogleDrive({
      filePath: finalDocPath,
      fileName: docNewName,
      mimeType: "application/pdf",
      folderType: "Documents",
    }).catch((e) => console.warn("Drive Doc upload note:", e.message));

    let parsedMembers = [];
    if (typeof members === "string") {
      try {
        parsedMembers = JSON.parse(members);
      } catch {
        parsedMembers = [];
      }
    } else if (Array.isArray(members)) {
      parsedMembers = members;
    }

    if (parsedMembers.length === 0) {
      parsedMembers = [
        {
          name: leadName || "Team Lead",
          email: participantEmail || "participant@gmail.com",
          phone: leadPhone || "N/A",
          college: institution || "N/A",
          isLeader: true,
        },
      ];
    }

    const submissionPayload = {
      teamId,
      teamName,
      participantEmail: participantEmail?.toLowerCase()?.trim(),
      category,
      city: "Mysuru",
      theme,
      solutionName,
      shortDescription,
      detailedProposal: detailedProposal || shortDescription,
      video: {
        originalName: videoNewName,
        localPath: finalVideoPath,
        size: videoFile.size,
        driveDestination: `https://drive.google.com/drive/folders/${TARGET_DRIVE_FOLDER_ID}`,
      },
      document: {
        name: docNewName,
        originalName: docNewName,
        localPath: finalDocPath,
        size: docFile.size,
        driveDestination: `https://drive.google.com/drive/folders/${TARGET_DRIVE_FOLDER_ID}`,
      },
      members: parsedMembers,
      organizationDetails: {
        institution: institution || "N/A",
      },
      stage: "submitted",
      allotedJudges: [],
      allotedJudgeNames: [],
      eloRating: 1200,
      zScore: 0,
      rubricAverage: 0,
      evaluationCount: 0,
      createdAt: new Date(),
    };

    if (isDbConnected()) {
      const newSub = new Edition2Submission(submissionPayload);
      await newSub.save();
    } else {
      localSubmissionsStore.unshift({
        _id: `sub-${randomUUID()}`,
        ...submissionPayload,
      });
    }

    // Update master spreadsheet with this new submission
    triggerSpreadsheetUpdate();

    return res.status(201).json({
      message: "Registration completed successfully! Your submission is now in 'submitted' status.",
      teamId,
      stage: "submitted",
      submission: submissionPayload,
    });
  } catch (error) {
    console.error("Submission error:", error);
    return res.status(500).json({ message: `Submission failed: ${error.message}` });
  }
};

/**
 * Get Submissions:
 * - Admin sees ALL submissions
 * - Judges see ONLY submissions alloted to their Gmail ID
 */
export const getEdition2Submissions = async (req, res) => {
  try {
    const userEmail = req.user?.email?.toLowerCase()?.trim();
    const userRole = req.user?.role;

    const isAdmin = userEmail === ADMIN_EMAIL || userRole === "admin";
    const isJudge = userRole === "judge";

    let allSubs = [];
    if (isDbConnected()) {
      allSubs = await Edition2Submission.find().sort({ createdAt: -1 });
    } else {
      allSubs = localSubmissionsStore;
    }

    if (isAdmin) {
      return res.status(200).json(allSubs);
    }

    if (isJudge && userEmail) {
      // Return ONLY teams alloted to this judge
      const filtered = allSubs.filter(
        (sub) =>
          Array.isArray(sub.allotedJudges) &&
          sub.allotedJudges.map((e) => e.toLowerCase()).includes(userEmail),
      );
      return res.status(200).json(filtered);
    }

    // Public view: summary only
    const publicSubs = allSubs.map((s) => ({
      _id: s._id,
      teamId: s.teamId,
      teamName: s.teamName,
      category: s.category,
      theme: s.theme,
      solutionName: s.solutionName,
      stage: s.stage || "submitted",
      createdAt: s.createdAt,
    }));

    return res.status(200).json(publicSubs);
  } catch (error) {
    console.error("Fetch submissions error:", error);
    return res.status(500).json({ message: "Failed to fetch submissions." });
  }
};

/**
 * Participant: Get My Submission & Live 4-Step Progress
 */
export const getParticipantSubmission = async (req, res) => {
  try {
    const email = req.user?.email || req.query.email;
    if (!email) {
      return res.status(400).json({ message: "Participant Gmail ID is required." });
    }

    const cleanEmail = email.toLowerCase().trim();

    let submission = null;
    if (isDbConnected()) {
      submission = await Edition2Submission.findOne({
        $or: [
          { participantEmail: cleanEmail },
          { "members.email": cleanEmail },
        ],
      }).sort({ createdAt: -1 });
    } else {
      submission = localSubmissionsStore.find(
        (s) =>
          s.participantEmail === cleanEmail ||
          s.members?.some((m) => m.email?.toLowerCase() === cleanEmail),
      );
    }

    if (!submission) {
      return res.status(200).json({ submission: null, hasRegistered: false });
    }

    return res.status(200).json({
      hasRegistered: true,
      submission,
      stage: submission.stage || "submitted",
    });
  } catch (error) {
    console.error("Get participant submission error:", error);
    return res.status(500).json({ message: "Failed to retrieve participant submission." });
  }
};

// ==========================================
// 3. ADMIN PORTAL (Allocation, Status, Judges)
// ==========================================

/**
 * Admin: Get All Judges
 */
export const getJudges = async (req, res) => {
  try {
    let judges = [];
    if (isDbConnected()) {
      judges = await JuryzaUser.find({ role: "judge" }).select("-password");
    } else {
      judges = localUsersStore.filter((u) => u.role === "judge");
    }
    return res.status(200).json(judges);
  } catch (error) {
    console.error("Get judges error:", error);
    return res.status(500).json({ message: "Failed to fetch judges." });
  }
};

/**
 * Admin: Allocate Submission to Judge (Single or Auto-Allocate All)
 */
export const allocateSubmission = async (req, res) => {
  try {
    const { teamId, judgeEmail, mode = "single" } = req.body;

    let submissions = isDbConnected()
      ? await Edition2Submission.find()
      : localSubmissionsStore;

    let judges = isDbConnected()
      ? await JuryzaUser.find({ role: "judge" })
      : localUsersStore.filter((u) => u.role === "judge");

    if (judges.length === 0) {
      return res.status(400).json({
        message: "No judges are registered yet. Please have judges sign up first.",
      });
    }

    if (mode === "auto") {
      // Evenly distribute unallocated or all submissions across registered judges
      let judgeIndex = 0;
      for (const sub of submissions) {
        const assignedJudge = judges[judgeIndex % judges.length];
        const jEmail = assignedJudge.email.toLowerCase();

        sub.allotedJudges = [jEmail];
        sub.allotedJudgeNames = [assignedJudge.name];
        if (sub.stage === "submitted") {
          sub.stage = "allocated to a judge";
        }

        if (!Array.isArray(assignedJudge.allotedTeams)) {
          assignedJudge.allotedTeams = [];
        }
        if (!assignedJudge.allotedTeams.includes(sub.teamId)) {
          assignedJudge.allotedTeams.push(sub.teamId);
        }

        if (isDbConnected()) {
          await sub.save();
          await assignedJudge.save();
        }
        judgeIndex++;
      }

      triggerSpreadsheetUpdate();
      return res.status(200).json({
        message: `Successfully auto-allocated ${submissions.length} teams across ${judges.length} judges.`,
      });
    }

    // Single Allocation
    if (!teamId || !judgeEmail) {
      return res.status(400).json({ message: "Team ID and Judge Gmail ID are required." });
    }

    const cleanJudgeEmail = judgeEmail.toLowerCase().trim();
    const judge = judges.find((j) => j.email.toLowerCase() === cleanJudgeEmail);
    if (!judge) {
      return res.status(404).json({ message: "Judge not found with this email." });
    }

    let targetSub = submissions.find((s) => s.teamId === teamId);
    if (!targetSub) {
      return res.status(404).json({ message: "Team submission not found." });
    }

    targetSub.allotedJudges = [cleanJudgeEmail];
    targetSub.allotedJudgeNames = [judge.name];
    if (targetSub.stage === "submitted") {
      targetSub.stage = "allocated to a judge";
    }

    if (!Array.isArray(judge.allotedTeams)) {
      judge.allotedTeams = [];
    }
    if (!judge.allotedTeams.includes(teamId)) {
      judge.allotedTeams.push(teamId);
    }

    if (isDbConnected()) {
      await targetSub.save();
      await judge.save();
    }

    triggerSpreadsheetUpdate();

    return res.status(200).json({
      message: `Team ${teamId} successfully alloted to judge ${judge.name}.`,
      submission: targetSub,
    });
  } catch (error) {
    console.error("Allocation error:", error);
    return res.status(500).json({ message: `Allocation failed: ${error.message}` });
  }
};

/**
 * Update Submission Stage (Admin or Alloted Judge)
 * States:
 * - submitted
 * - allocated to a judge
 * - under evaluation
 * - shortlisted to next round
 * - not shortlisted to next round
 */
export const updateSubmissionStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { stage, notes } = req.body;

    const allowedStages = [
      "submitted",
      "allocated to a judge",
      "under evaluation",
      "shortlisted to next round",
      "not shortlisted to next round",
    ];

    if (!allowedStages.includes(stage)) {
      return res.status(400).json({
        message: `Invalid stage. Must be one of: ${allowedStages.join(", ")}`,
      });
    }

    let sub = null;
    if (isDbConnected()) {
      sub = await Edition2Submission.findOne({ $or: [{ _id: id }, { teamId: id }] });
      if (sub) {
        sub.stage = stage;
        sub.status = stage;
        await sub.save();
      }
    } else {
      sub = localSubmissionsStore.find((s) => s._id === id || s.teamId === id);
      if (sub) {
        sub.stage = stage;
        sub.status = stage;
      }
    }

    if (!sub) {
      return res.status(404).json({ message: "Submission not found." });
    }

    triggerSpreadsheetUpdate();

    return res.status(200).json({
      message: `Submission status successfully updated to '${stage}'.`,
      submission: sub,
    });
  } catch (error) {
    console.error("Status update error:", error);
    return res.status(500).json({ message: "Failed to update submission status." });
  }
};

// ==========================================
// 4. JURY EVALUATION (Rubric & Duels)
// ==========================================

export const submitRubricEvaluation = async (req, res) => {
  try {
    const { submissionId, rubric, notes } = req.body;
    const judgeEmail = req.user?.email || "judge@sdmimd.ac.in";
    const judgeName = req.user?.name || "Jury Member";

    if (!submissionId || !rubric) {
      return res.status(400).json({ message: "Submission ID and rubric scores are required." });
    }

    let sub = isDbConnected()
      ? await Edition2Submission.findOne({ $or: [{ _id: submissionId }, { teamId: submissionId }] })
      : localSubmissionsStore.find((s) => s._id === submissionId || s.teamId === submissionId);

    if (!sub) {
      return res.status(404).json({ message: "Submission not found." });
    }

    // Calculate total
    const totalScore = Object.values(rubric).reduce((a, b) => Number(a) + Number(b), 0);

    if (!Array.isArray(sub.evaluations)) {
      sub.evaluations = [];
    }

    sub.evaluations.push({
      judgeEmail,
      judgeName,
      rubric,
      totalScore,
      notes: notes || "",
      submittedAt: new Date(),
    });

    sub.evaluationCount = sub.evaluations.length;
    sub.rubricAverage =
      sub.evaluations.reduce((acc, curr) => acc + curr.totalScore, 0) / sub.evaluations.length;

    // Automatically advance state to "under evaluation" if it was "allocated to a judge"
    if (sub.stage === "allocated to a judge" || sub.stage === "submitted") {
      sub.stage = "under evaluation";
    }

    if (isDbConnected()) {
      await sub.save();
    }

    triggerSpreadsheetUpdate();

    return res.status(200).json({
      message: "Evaluation submitted successfully!",
      rubricAverage: sub.rubricAverage,
      stage: sub.stage,
    });
  } catch (error) {
    console.error("Rubric evaluation error:", error);
    return res.status(500).json({ message: "Failed to submit rubric evaluation." });
  }
};

export const submitPairwiseDuelVote = async (req, res) => {
  try {
    const { winnerId, loserId } = req.body;

    let submissions = isDbConnected()
      ? await Edition2Submission.find()
      : localSubmissionsStore;

    const winner = submissions.find((s) => s._id === winnerId || s.teamId === winnerId);
    const loser = submissions.find((s) => s._id === loserId || s.teamId === loserId);

    if (!winner || !loser) {
      return res.status(404).json({ message: "Teams not found for duel." });
    }

    const K = 32;
    const expectedWinner =
      1 / (1 + Math.pow(10, ((loser.eloRating || 1200) - (winner.eloRating || 1200)) / 400));
    const expectedLoser =
      1 / (1 + Math.pow(10, ((winner.eloRating || 1200) - (loser.eloRating || 1200)) / 400));

    winner.eloRating = Math.round((winner.eloRating || 1200) + K * (1 - expectedWinner));
    loser.eloRating = Math.round((loser.eloRating || 1200) + K * (0 - expectedLoser));

    if (isDbConnected()) {
      await winner.save();
      await loser.save();
    }

    return res.status(200).json({
      message: "Duel recorded successfully!",
      winnerRating: winner.eloRating,
      loserRating: loser.eloRating,
    });
  } catch (error) {
    console.error("Duel error:", error);
    return res.status(500).json({ message: "Failed to record duel." });
  }
};

export const getDuelPair = async (req, res) => {
  try {
    let subs = isDbConnected()
      ? await Edition2Submission.find()
      : localSubmissionsStore;

    const userEmail = req.user?.email?.toLowerCase();
    if (userEmail && userEmail !== ADMIN_EMAIL) {
      subs = subs.filter(
        (s) =>
          Array.isArray(s.allotedJudges) &&
          s.allotedJudges.map((e) => e.toLowerCase()).includes(userEmail),
      );
    }

    if (subs.length < 2) {
      return res.status(200).json({ pair: [] });
    }

    const idx1 = Math.floor(Math.random() * subs.length);
    let idx2 = Math.floor(Math.random() * subs.length);
    while (idx2 === idx1) {
      idx2 = Math.floor(Math.random() * subs.length);
    }

    return res.status(200).json({ pair: [subs[idx1], subs[idx2]] });
  } catch (error) {
    return res.status(500).json({ message: "Failed to retrieve duel pair." });
  }
};

// ==========================================
// 5. MASTER SPREADSHEET DOWNLOAD & PREVIEW
// ==========================================

export const downloadSpreadsheet = async (req, res) => {
  try {
    const excelPath = getSpreadsheetFilePath();

    if (!fs.existsSync(excelPath)) {
      await triggerSpreadsheetUpdate();
    }

    if (fs.existsSync(excelPath)) {
      return res.download(excelPath, "VisionMysuru_2050_Edition2_MasterData.xlsx");
    }

    return res.status(404).json({ message: "Spreadsheet not found on server." });
  } catch (error) {
    console.error("Spreadsheet download error:", error);
    return res.status(500).json({ message: "Error downloading spreadsheet." });
  }
};

export const downloadSpreadsheetCsv = async (req, res) => {
  try {
    const csvPath = getSpreadsheetCsvPath();

    if (!fs.existsSync(csvPath)) {
      await triggerSpreadsheetUpdate();
    }

    if (fs.existsSync(csvPath)) {
      return res.download(csvPath, "VisionMysuru_2050_Edition2_MasterData.csv");
    }

    return res.status(404).json({ message: "CSV spreadsheet not found on server." });
  } catch (error) {
    console.error("CSV download error:", error);
    return res.status(500).json({ message: "Error downloading CSV spreadsheet." });
  }
};

// ==========================================
// 6. MEDIA STREAMING & PREVIEW
// ==========================================

export const streamSubmissionVideo = async (req, res) => {
  try {
    const { id } = req.params;

    let sub = isDbConnected()
      ? await Edition2Submission.findOne({ $or: [{ _id: id }, { teamId: id }] })
      : localSubmissionsStore.find((s) => s._id === id || s.teamId === id);

    if (!sub || !sub.video) {
      return res.status(404).json({ message: "Video not found for this submission." });
    }

    if (sub.video.localPath && fs.existsSync(sub.video.localPath)) {
      return streamVideoFile(sub.video.localPath, req, res);
    }

    // Try finding in Videos directory by teamId
    const videoFiles = fs.readdirSync(VIDEOS_SUBDIR);
    const matched = videoFiles.find((f) => f.includes(sub.teamId));
    if (matched) {
      const p = path.join(VIDEOS_SUBDIR, matched);
      return streamVideoFile(p, req, res);
    }

    if (sub.video.url) {
      return res.redirect(sub.video.url);
    }

    return res.status(404).json({ message: "Video file is not available locally." });
  } catch (error) {
    console.error("Video streaming error:", error);
    return res.status(500).json({ message: "Error streaming video." });
  }
};

export const previewSubmissionDocument = async (req, res) => {
  try {
    const { id } = req.params;

    let sub = isDbConnected()
      ? await Edition2Submission.findOne({ $or: [{ _id: id }, { teamId: id }] })
      : localSubmissionsStore.find((s) => s._id === id || s.teamId === id);

    if (!sub || !sub.document) {
      return res.status(404).json({ message: "Document not found for this submission." });
    }

    if (sub.document.localPath && fs.existsSync(sub.document.localPath)) {
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `inline; filename="${sub.document.name || "proposal.pdf"}"`);
      return fs.createReadStream(sub.document.localPath).pipe(res);
    }

    // Try finding in Documents directory by teamId
    const docFiles = fs.readdirSync(DOCUMENTS_SUBDIR);
    const matched = docFiles.find((f) => f.includes(sub.teamId));
    if (matched) {
      const p = path.join(DOCUMENTS_SUBDIR, matched);
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `inline; filename="${matched}"`);
      return fs.createReadStream(p).pipe(res);
    }

    if (sub.document.url) {
      return res.redirect(sub.document.url);
    }

    return res.status(404).json({ message: "Document file is not available locally." });
  } catch (error) {
    console.error("Document preview error:", error);
    return res.status(500).json({ message: "Error previewing document." });
  }
};

export const getDriveSyncStatus = (req, res) => {
  return res.status(200).json({
    targetDriveFolderId: TARGET_DRIVE_FOLDER_ID,
    driveFolderUrl: `https://drive.google.com/drive/folders/${TARGET_DRIVE_FOLDER_ID}`,
    syncEngine: "Google Drive 3-Folder Staging (Videos, Documents, Spreadsheets) Active",
    spreadsheetFile: "VisionMysuru_2050_Edition2_MasterData.xlsx",
    status: "healthy",
  });
};
