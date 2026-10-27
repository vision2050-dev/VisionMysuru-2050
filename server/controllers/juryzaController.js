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

export const OFFICIAL_ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "Vision2050@edition2";
const ADMIN_INITIAL_HASH = bcrypt.hashSync(OFFICIAL_ADMIN_PASSWORD, 10);

// In-Memory store for users when MongoDB is not connected
let localUsersStore = [
  {
    _id: "admin-default-id",
    name: "Vision Mysuru Admin",
    email: ADMIN_EMAIL,
    role: "admin",
    password: ADMIN_INITIAL_HASH, // Initialized with official password Vision2050@edition2
    organization: "SDMIMD Mysuru",
    allotedTeams: [],
    createdAt: new Date(),
  },
];

// In-Memory store for submissions
let localSubmissionsStore = [];

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
 * Public Sign Up strictly for Participants
 */
export const registerUser = async (req, res) => {
  try {
    const { name, email, password, role = "participant", phone, organization, specialization } = req.body;

    // Public registration is restricted strictly to participants
    if (role && role !== "participant") {
      return res.status(403).json({
        message: "Public sign up is only available for participants. Judge accounts are issued directly by the admin team.",
      });
    }

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, Email ID, and password are required." });
    }

    if (password.length < 8) {
      return res.status(400).json({ message: "Password must be at least 8 characters long." });
    }

    const cleanEmail = String(email).toLowerCase().trim();

    if (isDbConnected()) {
      const existingUser = await JuryzaUser.findOne({ email: cleanEmail });
      if (existingUser) {
        return res.status(409).json({ message: "An account with this Email already exists. Please sign in." });
      }

      const newUser = new JuryzaUser({
        name,
        email: cleanEmail,
        password,
        role: "participant",
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

    // In-memory fallback
    const existing = localUsersStore.find((u) => u.email === cleanEmail);
    if (existing && existing.password) {
      return res.status(409).json({ message: "An account with this Email already exists. Please sign in." });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    let newUser = existing;
    if (newUser) {
      newUser.name = name;
      newUser.password = hashedPassword;
      newUser.role = role;
      newUser.phone = phone;
      newUser.organization = organization;
      newUser.specialization = specialization || "General";
    } else {
      newUser = {
        _id: `user-${randomUUID()}`,
        name,
        email: cleanEmail,
        password: hashedPassword,
        role,
        phone,
        organization: organization || (role === "admin" ? "SDMIMD Admin Panel" : "Participant"),
        specialization: specialization || "General",
        allotedTeams: [],
        createdAt: new Date(),
      };
      localUsersStore.push(newUser);
    }

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
 * Sign In for Participants, Judges, and Admin (Secure bcrypt authentication)
 */
export const loginUser = async (req, res) => {
  try {
    const { email, password, requestedRole } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email ID and password are required." });
    }

    const cleanEmail = String(email).toLowerCase().trim();

    if (isDbConnected()) {
      let user = await JuryzaUser.findOne({ email: cleanEmail });

      if (!user) {
        return res.status(404).json({ message: "No account found with this email. Please sign up first." });
      }

      if (requestedRole === "admin" && user.role !== "admin") {
        return res.status(403).json({ message: "you do not have admin access" });
      }

      if (requestedRole && requestedRole !== user.role && user.role !== "admin") {
        return res.status(403).json({
          message: `This account is registered as a ${user.role}. Please select the ${user.role} sign-in tab.`,
        });
      }

      let isMatch = false;
      if (cleanEmail === ADMIN_EMAIL && password === OFFICIAL_ADMIN_PASSWORD) {
        isMatch = true;
      } else {
        isMatch = await user.comparePassword(password);
      }

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

    if (!user) {
      return res.status(404).json({ message: "No account found with this email. Please sign up first." });
    }

    if (requestedRole === "admin" && user.role !== "admin") {
      return res.status(403).json({ message: "you do not have admin access" });
    }

    if (requestedRole && requestedRole !== user.role && user.role !== "admin") {
      return res.status(403).json({
        message: `This account is registered as a ${user.role}. Please select the ${user.role} tab.`,
      });
    }

    // Verify password for admin, judge, or participant
    let isMatch = false;
    if (cleanEmail === ADMIN_EMAIL && password === OFFICIAL_ADMIN_PASSWORD) {
      isMatch = true;
      user.password = ADMIN_INITIAL_HASH;
    } else if (user.password) {
      isMatch = await bcrypt.compare(password, user.password);
    } else {
      // First time password initialization for judge without password
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);
      isMatch = true;
    }

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

/**
 * Participant Forgot / Reset Password
 */
export const resetParticipantPassword = async (req, res) => {
  try {
    const { email, newPassword } = req.body;
    const cleanEmail = String(email || "").toLowerCase().trim();

    if (!cleanEmail) {
      return res.status(400).json({ message: "Gmail / Email ID is required." });
    }
    if (!newPassword || newPassword.length < 8) {
      return res.status(400).json({ message: "New password must be at least 8 characters long." });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    if (isDbConnected()) {
      let user = await JuryzaUser.findOne({ email: cleanEmail });
      if (!user) {
        const sub = await Edition2Submission.findOne({ participantEmail: cleanEmail });
        const lead = sub?.members?.find((m) => m.isLeader) || sub?.members?.[0] || {};
        user = new JuryzaUser({
          name: lead.name || sub?.leadName || "Participant",
          email: cleanEmail,
          password: newPassword,
          role: "participant",
          organization: lead.college || sub?.organizationDetails?.institution || "Participant",
        });
      } else {
        user.password = newPassword;
      }
      await user.save();
      const token = generateToken(user);
      return res.status(200).json({
        message: "Password reset successfully! Please sign in.",
        token,
        user: { id: user._id, name: user.name, email: user.email, role: user.role },
      });
    }

    // In-memory fallback
    let user = localUsersStore.find((u) => u.email === cleanEmail);
    if (!user) {
      const sub = localSubmissionsStore.find((s) => s.participantEmail === cleanEmail);
      const lead = sub?.members?.find((m) => m.isLeader) || sub?.members?.[0] || {};
      user = {
        _id: `user-${Date.now()}`,
        name: lead.name || sub?.leadName || "Participant",
        email: cleanEmail,
        password: hashedPassword,
        role: "participant",
        organization: lead.college || sub?.organizationDetails?.institution || "Participant",
        allotedTeams: sub ? [sub.teamId] : [],
        createdAt: new Date(),
      };
      localUsersStore.push(user);
    } else {
      user.password = hashedPassword;
    }

    const token = generateToken(user);
    return res.status(200).json({
      message: "Password reset successfully! Please sign in.",
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (error) {
    console.error("Participant reset error:", error);
    return res.status(500).json({ message: "Failed to reset password." });
  }
};

/**
 * Admin-Generated Judge Account Creation
 * (Only callable by authenticated Admin)
 */
export const createJudgeAccount = async (req, res) => {
  try {
    const { name, email, password, organization, specialization } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Judge Name, Gmail ID, and temporary password are required." });
    }

    const cleanEmail = String(email).toLowerCase().trim();

    if (isDbConnected()) {
      const existing = await JuryzaUser.findOne({ email: cleanEmail });
      if (existing) {
        return res.status(409).json({ message: "An account with this email already exists." });
      }

      const newJudge = new JuryzaUser({
        name: name.trim(),
        email: cleanEmail,
        password, // hashed in pre-save hook
        role: "judge",
        organization: organization?.trim() || "SDMIMD Panel",
        specialization: specialization || "All Tracks",
      });

      await newJudge.save();
      triggerSpreadsheetUpdate();

      return res.status(201).json({
        message: "Judge account generated successfully!",
        judge: {
          id: newJudge._id,
          name: newJudge.name,
          email: newJudge.email,
          role: "judge",
          organization: newJudge.organization,
          specialization: newJudge.specialization,
          createdAt: newJudge.createdAt,
        },
      });
    }

    // In-memory fallback
    const existing = localUsersStore.find((u) => u.email === cleanEmail);
    if (existing && existing.password) {
      return res.status(409).json({ message: "An account with this email already exists." });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    let newJudge = existing;
    if (newJudge) {
      newJudge.name = name.trim();
      newJudge.password = hashedPassword;
      newJudge.role = "judge";
      newJudge.organization = organization?.trim() || "SDMIMD Panel";
      newJudge.specialization = specialization || "All Tracks";
    } else {
      newJudge = {
        _id: `user-judge-${randomUUID()}`,
        name: name.trim(),
        email: cleanEmail,
        password: hashedPassword,
        role: "judge",
        organization: organization?.trim() || "SDMIMD Panel",
        specialization: specialization || "All Tracks",
        allotedTeams: [],
        createdAt: new Date(),
      };
      localUsersStore.push(newJudge);
    }

    triggerSpreadsheetUpdate();

    return res.status(201).json({
      message: "Judge account generated successfully!",
      judge: {
        id: newJudge._id,
        name: newJudge.name,
        email: newJudge.email,
        role: "judge",
        organization: newJudge.organization,
        specialization: newJudge.specialization,
        createdAt: newJudge.createdAt,
      },
    });
  } catch (error) {
    console.error("Create judge error:", error);
    return res.status(500).json({ message: "Failed to generate judge account." });
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

    // Single Allocation or Unallocation
    const { judgeEmails } = req.body;
    const targetEmail = (judgeEmail || (Array.isArray(judgeEmails) && judgeEmails[0]) || "").toLowerCase().trim();

    if (!teamId) {
      return res.status(400).json({ message: "Team ID is required." });
    }

    let targetSub = submissions.find((s) => s.teamId === teamId);
    if (!targetSub) {
      return res.status(404).json({ message: "Team submission not found." });
    }

    // If Unallocated
    if (!targetEmail || targetEmail === "unallocated") {
      // Remove teamId from all judges
      for (const j of judges) {
        if (Array.isArray(j.allotedTeams)) {
          j.allotedTeams = j.allotedTeams.filter((id) => id !== teamId);
          if (isDbConnected()) await j.save();
        }
      }

      targetSub.allotedJudges = [];
      targetSub.allotedJudgeNames = [];
      if (targetSub.stage === "allocated to a judge") {
        targetSub.stage = "submitted";
      }

      if (isDbConnected()) {
        await targetSub.save();
      }

      triggerSpreadsheetUpdate();

      return res.status(200).json({
        message: `Team ${teamId} has been unallocated.`,
        submission: targetSub,
        unallocated: true,
      });
    }

    // Allocate to specific judge
    const judge = judges.find((j) => j.email.toLowerCase() === targetEmail);
    if (!judge) {
      return res.status(404).json({ message: "Judge not found with this email." });
    }

    // Remove from other judges first so team is not duplicated
    for (const j of judges) {
      if (j.email.toLowerCase() !== targetEmail && Array.isArray(j.allotedTeams)) {
        j.allotedTeams = j.allotedTeams.filter((id) => id !== teamId);
        if (isDbConnected()) await j.save();
      }
    }

    targetSub.allotedJudges = [targetEmail];
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

    const judgeAllowedStages = [
      "under evaluation",
      "shortlisted to next round",
      "not shortlisted to next round",
    ];

    const adminAllowedStages = [
      "submitted",
      "allocated to a judge",
      ...judgeAllowedStages,
    ];

    const isJudge = req.user?.role === "judge";
    if (isJudge && !judgeAllowedStages.includes(stage)) {
      return res.status(403).json({
        message: "Judges can only change the state to under evaluation, shortlisted to next round, or not shortlisted to next round.",
      });
    }

    if (!adminAllowedStages.includes(stage)) {
      return res.status(400).json({
        message: `Invalid stage. Must be one of: ${adminAllowedStages.join(", ")}`,
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

/**
 * Admin Action: Delete a single submission and its associated files
 */
export const deleteSubmission = async (req, res) => {
  try {
    const { id } = req.params;
    if (isDbConnected()) {
      await Edition2Submission.deleteOne({ teamId: id });
      await JuryzaUser.updateMany({}, { $pull: { allotedTeams: id } });
    }

    localSubmissionsStore = localSubmissionsStore.filter((s) => s.teamId !== id);
    localUsersStore.forEach((u) => {
      if (Array.isArray(u.allotedTeams)) {
        u.allotedTeams = u.allotedTeams.filter((t) => t !== id);
      }
    });

    await triggerSpreadsheetUpdate();
    return res.status(200).json({ success: true, message: `Submission ${id} deleted successfully.` });
  } catch (error) {
    console.error("Delete submission error:", error);
    return res.status(500).json({ message: "Failed to delete submission.", error: error.message });
  }
};

/**
 * Admin Action: Edit / Update Submission details
 */
export const updateSubmissionDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const patchData = req.body;

    if (isDbConnected()) {
      const sub = await Edition2Submission.findOne({ teamId: id });
      if (sub) {
        Object.assign(sub, patchData);
        await sub.save();
      }
      if (patchData.password && patchData.participantEmail) {
        let user = await JuryzaUser.findOne({
          email: patchData.participantEmail.toLowerCase().trim(),
        });
        if (user) {
          user.password = patchData.password;
          await user.save();
        }
      }
    }

    const idx = localSubmissionsStore.findIndex((s) => s.teamId === id);
    if (idx !== -1) {
      localSubmissionsStore[idx] = { ...localSubmissionsStore[idx], ...patchData };
      if (patchData.password && patchData.participantEmail) {
        const cleanEmail = patchData.participantEmail.toLowerCase().trim();
        let user = localUsersStore.find((u) => u.email === cleanEmail);
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(patchData.password, salt);
        if (user) {
          user.password = hashedPassword;
        }
      }
    }

    await triggerSpreadsheetUpdate();
    return res.status(200).json({ success: true, message: "Submission updated successfully." });
  } catch (error) {
    console.error("Update submission error:", error);
    return res.status(500).json({ message: "Failed to update submission.", error: error.message });
  }
};

/**
 * Admin Action: Edit / Update Judge details
 */
export const updateJudgeDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, organization, specialization, password } = req.body;
    const cleanId = String(id).toLowerCase().trim();

    if (isDbConnected()) {
      const judge = await JuryzaUser.findOne({
        $or: [{ _id: mongoose.isValidObjectId(id) ? id : null }, { email: cleanId }],
        role: "judge",
      });
      if (judge) {
        if (name) judge.name = name.trim();
        if (email) judge.email = email.toLowerCase().trim();
        if (organization) judge.organization = organization.trim();
        if (specialization) judge.specialization = specialization;
        if (password) judge.password = password;
        await judge.save();
      }
    }

    const targetJudge = localUsersStore.find(
      (u) => (u._id === id || u.email?.toLowerCase() === cleanId) && u.role === "judge"
    );
    if (targetJudge) {
      if (name) targetJudge.name = name.trim();
      if (email) targetJudge.email = email.toLowerCase().trim();
      if (organization) targetJudge.organization = organization.trim();
      if (specialization) targetJudge.specialization = specialization;
      if (password) {
        const salt = await bcrypt.genSalt(10);
        targetJudge.password = await bcrypt.hash(password, salt);
      }
    }

    await triggerSpreadsheetUpdate();
    return res.status(200).json({ success: true, message: "Judge updated successfully." });
  } catch (error) {
    console.error("Update judge error:", error);
    return res.status(500).json({ message: "Failed to update judge.", error: error.message });
  }
};

/**
 * Admin Action: Delete a single judge
 */
export const deleteJudge = async (req, res) => {
  try {
    const { id } = req.params;
    const cleanId = String(id).toLowerCase().trim();

    if (isDbConnected()) {
      const judge = await JuryzaUser.findOne({
        $or: [{ _id: mongoose.isValidObjectId(id) ? id : null }, { email: cleanId }],
        role: "judge",
      });
      if (judge) {
        await Edition2Submission.updateMany(
          {},
          { $pull: { allotedJudges: judge.email, allotedJudgeNames: judge.name } }
        );
        await JuryzaUser.deleteOne({ _id: judge._id });
      }
    }

    const targetJudge = localUsersStore.find(
      (u) => (u._id === id || u.email?.toLowerCase() === cleanId) && u.role === "judge"
    );
    if (targetJudge) {
      localSubmissionsStore.forEach((s) => {
        if (Array.isArray(s.allotedJudges)) {
          s.allotedJudges = s.allotedJudges.filter((e) => e !== targetJudge.email);
        }
      });
      localUsersStore = localUsersStore.filter(
        (u) => u._id !== targetJudge._id && u.email !== targetJudge.email
      );
    }

    await triggerSpreadsheetUpdate();
    return res.status(200).json({ success: true, message: "Judge deleted successfully." });
  } catch (error) {
    console.error("Delete judge error:", error);
    return res.status(500).json({ message: "Failed to delete judge.", error: error.message });
  }
};

/**
 * Admin Action: Purge all submissions, judges, and uploaded files from the portal
 */
export const purgeAllPortalData = async (req, res) => {
  try {
    // 1. Database purge
    if (isDbConnected()) {
      await Edition2Submission.deleteMany({});
      await JuryzaUser.deleteMany({ role: "judge" });
      await Evaluation.deleteMany({});
    }

    // 2. Memory store purge
    localSubmissionsStore = [];
    localUsersStore = localUsersStore.filter((u) => u.role === "admin");

    // 3. Purge uploaded files from disk
    const videosDir = path.join(
      process.cwd(),
      "server/uploads/drive_sync/1UKXUmqcMewEhw_KG7L1Fe740yCd6fX2e/Videos"
    );
    const docsDir = path.join(
      process.cwd(),
      "server/uploads/drive_sync/1UKXUmqcMewEhw_KG7L1Fe740yCd6fX2e/Documents"
    );

    [videosDir, docsDir].forEach((dir) => {
      if (fs.existsSync(dir)) {
        const files = fs.readdirSync(dir);
        files.forEach((file) => {
          if (file !== ".gitkeep") {
            try {
              fs.unlinkSync(path.join(dir, file));
            } catch (e) {
              console.warn(`Could not delete file ${file}:`, e.message);
            }
          }
        });
      }
    });

    // 4. Reset master spreadsheets (both XLSX and CSV)
    await triggerSpreadsheetUpdate();

    return res.status(200).json({
      success: true,
      message: "All teams, judges, and uploaded media files have been purged from the portal.",
    });
  } catch (error) {
    console.error("Purge error:", error);
    return res.status(500).json({ message: "Failed to purge portal data.", error: error.message });
  }
};
