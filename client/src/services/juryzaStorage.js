import * as XLSX from "xlsx";

/**
 * Juryza Resilient Client-Side Storage Engine
 * Ensures 100% reliable functionality for Participant, Judge, and Admin portals
 * even if the backend server is offline, unreachable, or running on a different port/device.
 */

// Simple browser-native SHA-256 password hashing
export const hashPassword = async (password) => {
  if (!window.crypto || !window.crypto.subtle) {
    // Fallback simple hash for older environments
    let hash = 0;
    for (let i = 0; i < password.length; i++) {
      hash = (hash << 5) - hash + password.charCodeAt(i);
      hash |= 0;
    }
    return `hash_${Math.abs(hash)}`;
  }
  const msgBuffer = new TextEncoder().encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
};

/**
 * IndexedDB Media Blob Storage for Large Pitch Videos & Proposals
 * Guarantees that uploaded videos persist across page refreshes and browser reopens.
 */
const MEDIA_DB_NAME = "JuryzaMediaDB";
const MEDIA_STORE_NAME = "mediaBlobs";

const openMediaDB = () => {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !window.indexedDB) {
      return reject(new Error("IndexedDB not supported"));
    }
    const request = window.indexedDB.open(MEDIA_DB_NAME, 1);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(MEDIA_STORE_NAME)) {
        db.createObjectStore(MEDIA_STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const storeMediaBlob = async (key, fileOrBlob) => {
  if (!key || !fileOrBlob) return false;
  try {
    const db = await openMediaDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(MEDIA_STORE_NAME, "readwrite");
      const store = tx.objectStore(MEDIA_STORE_NAME);
      const req = store.put(fileOrBlob, key);
      req.onsuccess = () => resolve(true);
      req.onerror = () => reject(req.error);
    });
  } catch (e) {
    console.warn("Failed to store media in IndexedDB:", e);
    return false;
  }
};

export const getMediaBlob = async (key) => {
  if (!key) return null;
  try {
    const db = await openMediaDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(MEDIA_STORE_NAME, "readonly");
      const store = tx.objectStore(MEDIA_STORE_NAME);
      const req = store.get(key);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  } catch (e) {
    console.warn("Failed to get media from IndexedDB:", e);
    return null;
  }
};

export const getMediaBlobUrl = async (key) => {
  try {
    const blob = await getMediaBlob(key);
    if (blob && (blob instanceof Blob || blob instanceof File)) {
      return URL.createObjectURL(blob);
    }
    return null;
  } catch (e) {
    return null;
  }
};

const USERS_KEY = "juryza_users_store";
const SUBMISSIONS_KEY = "juryza_submissions_store";

// Initial Seed Users
const DEFAULT_USERS = [
  {
    id: "user-admin-default",
    name: "Vision Mysuru Admin",
    email: "vision2050@sdmimd.ac.in",
    passwordHash: null, // Will be initialized upon first admin signup or password setup
    role: "admin",
    organization: "SDMIMD Mysuru",
    createdAt: new Date().toISOString(),
  },
  {
    id: "user-judge-default",
    name: "Dr. K. Srinivas",
    email: "judge.srinivas@gmail.com",
    passwordHash: null,
    role: "judge",
    organization: "SDMIMD Panel",
    specialization: "Sustainability & Clean Tech",
    allotedTeams: ["VM2-ST-88F4A1"],
    createdAt: new Date().toISOString(),
  },
];

// Initial Seed Submissions
const DEFAULT_SUBMISSIONS = [
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
      originalName: "EcoFlow_Kukkarahalli_Pitch.mp4",
      size: 14500000,
      url: "/speech.mp4",
      webViewLink: "/speech.mp4",
    },
    document: {
      name: "EcoFlow_Lake_Restoration_Report.pdf",
      originalName: "EcoFlow_Lake_Restoration_Report.pdf",
      size: 2400000,
      url: "/sample_proposal.pdf",
      webViewLink: "/sample_proposal.pdf",
      driveFileId: null,
    },
    members: [
      {
        name: "Aditi Rao",
        email: "participant.aditi@gmail.com",
        phone: "+91 98451 12345",
        isLeader: true,
        college: "The National Institute of Engineering, Mysuru",
      },
    ],
    stage: "allocated to a judge",
    allotedJudges: ["judge.srinivas@gmail.com"],
    allotedJudgeNames: ["Dr. K. Srinivas"],
    rubricAverage: 38.5,
    eloRating: 1248,
    createdAt: new Date().toISOString(),
  },
];

export const getStoredUsers = () => {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    if (!raw) {
      localStorage.setItem(USERS_KEY, JSON.stringify(DEFAULT_USERS));
      return DEFAULT_USERS;
    }
    return JSON.parse(raw);
  } catch {
    return DEFAULT_USERS;
  }
};

export const saveStoredUsers = (users) => {
  try {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  } catch (e) {
    console.warn("Storage warning:", e);
  }
};

export const getStoredSubmissions = () => {
  try {
    const raw = localStorage.getItem(SUBMISSIONS_KEY);
    if (!raw) {
      localStorage.setItem(SUBMISSIONS_KEY, JSON.stringify(DEFAULT_SUBMISSIONS));
      return DEFAULT_SUBMISSIONS;
    }
    return JSON.parse(raw);
  } catch {
    return DEFAULT_SUBMISSIONS;
  }
};

export const saveStoredSubmissions = (subs) => {
  try {
    localStorage.setItem(SUBMISSIONS_KEY, JSON.stringify(subs));
  } catch (e) {
    console.warn("Storage warning:", e);
  }
};

/**
 * Client-Side Auth: Sign Up (Strictly for Participants)
 */
export const clientSignUp = async ({
  name,
  email,
  password,
  role = "participant",
  phone = "",
  organization = "",
  specialization = "",
}) => {
  if (role && role !== "participant") {
    throw new Error("Public account creation is strictly restricted to participants.");
  }

  if (!password || password.length < 8) {
    throw new Error("Password must be at least 8 characters long.");
  }

  const cleanEmail = email.toLowerCase().trim();
  const users = getStoredUsers();

  const existing = users.find((u) => u.email === cleanEmail);
  if (existing && existing.passwordHash) {
    throw new Error("An account with this email already exists. Please sign in.");
  }

  const passwordHash = await hashPassword(password);

  let newUser;
  if (existing) {
    existing.name = name || existing.name;
    existing.passwordHash = passwordHash;
    existing.phone = phone || existing.phone;
    existing.organization = organization || existing.organization;
    existing.specialization = specialization || existing.specialization;
    existing.role = "participant";
    newUser = existing;
  } else {
    newUser = {
      id: `user-${Date.now()}-${Math.round(Math.random() * 1000)}`,
      name,
      email: cleanEmail,
      passwordHash,
      role: "participant",
      phone,
      organization: organization || "Participant",
      specialization: specialization || "General",
      allotedTeams: [],
      createdAt: new Date().toISOString(),
    };
    users.push(newUser);
  }

  saveStoredUsers(users);

  const token = `token-${newUser.id}-${Date.now()}`;
  return {
    token,
    user: {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
    },
  };
};

/**
 * Client-Side Admin Action: Generate Judge Account
 */
export const clientCreateJudge = async ({
  name,
  email,
  password,
  organization = "SDMIMD Panel",
  specialization = "All Tracks",
}) => {
  const cleanEmail = email.toLowerCase().trim();
  const users = getStoredUsers();

  const existing = users.find((u) => u.email === cleanEmail);
  if (existing && existing.passwordHash) {
    throw new Error("An account with this email already exists.");
  }

  const passwordHash = await hashPassword(password);

  let judgeUser;
  if (existing) {
    existing.name = name.trim();
    existing.passwordHash = passwordHash;
    existing.role = "judge";
    existing.organization = organization.trim();
    existing.specialization = specialization;
    judgeUser = existing;
  } else {
    judgeUser = {
      id: `user-judge-${Date.now()}`,
      name: name.trim(),
      email: cleanEmail,
      passwordHash,
      role: "judge",
      organization: organization.trim(),
      specialization,
      allotedTeams: [],
      createdAt: new Date().toISOString(),
    };
    users.push(judgeUser);
  }

  saveStoredUsers(users);

  return {
    message: "Judge account generated successfully!",
    judge: {
      id: judgeUser.id,
      name: judgeUser.name,
      email: judgeUser.email,
      role: "judge",
      organization: judgeUser.organization,
      specialization: judgeUser.specialization,
      createdAt: judgeUser.createdAt,
    },
  };
};

export const OFFICIAL_ADMIN_PASSWORD = "Vision2050@edition2";

/**
 * Client-Side Auth: Sign In (Any role: participant, judge, admin)
 */
export const clientSignIn = async ({ email, password, requestedRole }) => {
  const cleanEmail = email.toLowerCase().trim();
  const users = getStoredUsers();

  const user = users.find((u) => u.email === cleanEmail);
  if (!user) {
    throw new Error("No account found with this email. Please verify your credentials.");
  }

  if (requestedRole === "admin" && user.role !== "admin") {
    throw new Error("you do not have admin access");
  }

  if (requestedRole && requestedRole !== user.role && user.role !== "admin") {
    throw new Error(`This account is registered as a ${user.role}. Please access the appropriate portal.`);
  }

  const inputHash = await hashPassword(password);

  // Admin Account Authentication (with official password support)
  if (cleanEmail === "vision2050@sdmimd.ac.in" || user.role === "admin") {
    if (password === OFFICIAL_ADMIN_PASSWORD) {
      user.passwordHash = inputHash;
      saveStoredUsers(users);
      const token = `admin-token-${Date.now()}`;
      return {
        token,
        user: {
          id: user.id || "user-admin-default",
          name: user.name || "Vision Mysuru Admin",
          email: "vision2050@sdmimd.ac.in",
          role: "admin",
        },
      };
    }
  }

  // If user has not set a password yet (seeded account), initialize it with their entered password
  if (!user.passwordHash) {
    user.passwordHash = inputHash;
    saveStoredUsers(users);
  } else if (user.passwordHash !== inputHash) {
    throw new Error("Invalid password. Please try again or verify your credentials.");
  }

  const token = `token-${user.id}-${Date.now()}`;
  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  };
};

export const clientResetAdminPassword = async (newPassword) => {
  const users = getStoredUsers();
  const admin = users.find((u) => u.email === "vision2050@sdmimd.ac.in");
  const passwordHash = await hashPassword(newPassword);

  if (admin) {
    admin.passwordHash = passwordHash;
  } else {
    users.push({
      id: "user-admin-default",
      name: "Vision Mysuru Admin",
      email: "vision2050@sdmimd.ac.in",
      passwordHash,
      role: "admin",
      organization: "SDMIMD Mysuru",
      createdAt: new Date().toISOString(),
    });
  }
  saveStoredUsers(users);

  const token = `admin-token-${Date.now()}`;
  return {
    token,
    user: {
      id: "user-admin-default",
      name: "Vision Mysuru Admin",
      email: "vision2050@sdmimd.ac.in",
      role: "admin",
    },
  };
};

/**
 * Client-Side Submission Registration
 */
export const clientRegisterSubmission = ({
  teamName,
  category,
  theme,
  solutionName,
  shortDescription,
  detailedProposal,
  participantEmail,
  leadName,
  leadPhone,
  institution,
  members,
  videoFileName,
  documentFileName,
  videoBlobUrl,
  docBlobUrl,
}) => {
  const subs = getStoredSubmissions();
  const teamId = `VM2-${category.substring(0, 2).toUpperCase()}-${Math.random()
    .toString(36)
    .substring(2, 8)
    .toUpperCase()}`;

  const cleanTeamName = teamName.replace(/[^a-zA-Z0-9_-]/g, "_");
  const videoName = `[${teamId}]_${cleanTeamName}_Video.mp4`;
  const docName = `[${teamId}]_${cleanTeamName}_Proposal.pdf`;

  const newSub = {
    _id: `sub-${Date.now()}`,
    teamId,
    teamName,
    participantEmail: participantEmail.toLowerCase().trim(),
    category,
    city: "Mysuru",
    theme,
    solutionName,
    shortDescription,
    detailedProposal: detailedProposal || shortDescription,
    video: {
      originalName: videoFileName || videoName,
      size: 15000000,
      url: "",
      webViewLink: "",
    },
    document: {
      name: documentFileName || docName,
      originalName: documentFileName || docName,
      size: 2000000,
      url: "",
      webViewLink: "",
    },
    videoBlobUrl: videoBlobUrl || null,
    docBlobUrl: docBlobUrl || null,
    members: members || [
      {
        name: leadName || "Team Lead",
        email: participantEmail,
        phone: leadPhone || "N/A",
        college: institution || "N/A",
        isLeader: true,
      },
    ],
    organizationDetails: { institution: institution || "N/A" },
    stage: "submitted",
    allotedJudges: [],
    allotedJudgeNames: [],
    rubricAverage: 0,
    eloRating: 1200,
    createdAt: new Date().toISOString(),
  };

  subs.unshift(newSub);
  saveStoredSubmissions(subs);
  return newSub;
};

/**
 * Client-Side Stage Updater (Both Admin and Jury can change stage)
 */
export const updateStoredSubmissionStage = (teamId, newStage) => {
  const subs = getStoredSubmissions();
  const index = subs.findIndex((s) => s.teamId === teamId);
  if (index !== -1) {
    subs[index].stage = newStage;
    subs[index].updatedAt = new Date().toISOString();
    saveStoredSubmissions(subs);
    return subs[index];
  }
  return null;
};

/**
 * Client-Side Judge Allocation & Unallocation
 */
export const allocateStoredSubmission = (teamId, judgeEmail) => {
  const cleanEmail = (judgeEmail || "").toLowerCase().trim();
  const subs = getStoredSubmissions();
  const users = getStoredUsers();

  const subIndex = subs.findIndex((s) => s.teamId === teamId);

  // If unallocating
  if (!cleanEmail || cleanEmail === "unallocated") {
    if (subIndex !== -1) {
      subs[subIndex].allotedJudges = [];
      subs[subIndex].allotedJudgeNames = [];
      if (subs[subIndex].stage === "allocated to a judge") {
        subs[subIndex].stage = "submitted";
      }
      saveStoredSubmissions(subs);
    }

    // Remove teamId from all judges' allotedTeams
    users.forEach((u) => {
      if (u.role === "judge" && Array.isArray(u.allotedTeams)) {
        u.allotedTeams = u.allotedTeams.filter((id) => id !== teamId);
      }
    });
    saveStoredUsers(users);

    return { success: true, teamId, unallocated: true, subs, users };
  }

  // Allocating to a specific judge
  const targetJudge = users.find((u) => u.email === cleanEmail && u.role === "judge");
  const judgeName = targetJudge ? targetJudge.name : cleanEmail;

  if (subIndex !== -1) {
    subs[subIndex].allotedJudges = [cleanEmail];
    subs[subIndex].allotedJudgeNames = [judgeName];
    if (subs[subIndex].stage === "submitted") {
      subs[subIndex].stage = "allocated to a judge";
    }
    saveStoredSubmissions(subs);
  }

  // Remove teamId from all other judges, and add to target judge
  users.forEach((u) => {
    if (u.role === "judge") {
      if (!Array.isArray(u.allotedTeams)) u.allotedTeams = [];
      if (u.email === cleanEmail) {
        if (!u.allotedTeams.includes(teamId)) {
          u.allotedTeams.push(teamId);
        }
      } else {
        u.allotedTeams = u.allotedTeams.filter((id) => id !== teamId);
      }
    }
  });
  saveStoredUsers(users);

  return { success: true, teamId, judgeEmail: cleanEmail, subs, users };
};

/**
 * Client-Side Auto-Allocation of All Teams
 */
export const autoAllocateStoredSubmissions = () => {
  const subs = getStoredSubmissions();
  const users = getStoredUsers();
  const judges = users.filter((u) => u.role === "judge");

  if (judges.length === 0) return { success: false, message: "No judges registered yet." };

  // Clear previous allocations
  judges.forEach((j) => {
    j.allotedTeams = [];
  });

  subs.forEach((sub, idx) => {
    const judge = judges[idx % judges.length];
    sub.allotedJudges = [judge.email];
    sub.allotedJudgeNames = [judge.name];
    if (sub.stage === "submitted") {
      sub.stage = "allocated to a judge";
    }

    if (!judge.allotedTeams.includes(sub.teamId)) {
      judge.allotedTeams.push(sub.teamId);
    }
  });

  saveStoredSubmissions(subs);
  saveStoredUsers(users);
  return { success: true, count: subs.length, subs, users };
};

/**
 * Client-Side Rubric Score Submission
 */
export const submitStoredRubricScore = ({ teamId, judgeEmail, totalScore, feedback }) => {
  const subs = getStoredSubmissions();
  const index = subs.findIndex((s) => s.teamId === teamId);
  if (index !== -1) {
    subs[index].rubricAverage = totalScore;
    subs[index].stage = "under evaluation";
    subs[index].judgeFeedback = feedback;
    saveStoredSubmissions(subs);
    return subs[index];
  }
  return null;
};

export const APPS_SCRIPT_DRIVE_URL =
  "https://script.google.com/macros/s/AKfycby7S5N7UfxKKFmAKvJ-y5yww2NP9iSdRZkHXdwYLTMqO8bjup8B_KstzYmh5BHy0uF1/exec";

export const getDriveFileId = (url) => {
  if (!url || typeof url !== "string") return null;
  const fileMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (fileMatch) return fileMatch[1];
  const idMatch = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (idMatch) return idMatch[1];
  const dMatch = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (dMatch) return dMatch[1];
  return null;
};

export const getDrivePreviewUrl = (url) => {
  const fileId = getDriveFileId(url);
  if (fileId) {
    return `https://drive.google.com/file/d/${fileId}/preview`;
  }
  return url || "";
};

export const generateSubmissionsCsvContent = (subs = getStoredSubmissions()) => {
  const headers = [
    "Sl No",
    "Team ID",
    "Team Name",
    "Category",
    "Theme / Focus Area",
    "Solution Name",
    "Leader Name",
    "Leader Email",
    "Leader Phone",
    "Institution",
    "Current Stage",
    "Alloted Judge(s)",
    "Rubric Score",
    "Pitch Video Link",
    "Proposal PDF Link",
    "Registration Timestamp",
  ];

  const rows = subs.map((s, idx) => {
    const leader = s.members?.find((m) => m.isLeader) || s.members?.[0] || {};
    return [
      idx + 1,
      s.teamId,
      `"${(s.teamName || "").replace(/"/g, '""')}"`,
      s.category,
      `"${(s.theme || "").replace(/"/g, '""')}"`,
      `"${(s.solutionName || "").replace(/"/g, '""')}"`,
      `"${(leader.name || s.leadName || "").replace(/"/g, '""')}"`,
      leader.email || s.participantEmail || "",
      leader.phone || s.leadPhone || "",
      `"${(leader.college || s.organizationDetails?.institution || "").replace(/"/g, '""')}"`,
      s.stage || "submitted",
      `"${(s.allotedJudges || []).join(", ")}"`,
      s.rubricAverage || 0,
      s.video?.url || s.video?.webViewLink || "",
      s.document?.url || s.document?.webViewLink || "",
      new Date(s.createdAt).toLocaleString("en-IN"),
    ];
  });

  return [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
};

export const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result;
      const base64 = typeof result === "string" ? result.split(",")[1] : "";
      resolve(base64);
    };
    reader.onerror = (error) => reject(error);
  });
};

export const syncSubmissionFilesToCloudDrive = async ({
  submission,
  videoFile,
  documentFile,
}) => {
  if (!submission) return null;

  const cleanTeamName = (submission.teamName || "Team").replace(/[^a-zA-Z0-9_-]/g, "_");
  const videoName = `[${submission.teamId}]_${cleanTeamName}_Video.mp4`;
  const docName = `[${submission.teamId}]_${cleanTeamName}_Proposal.pdf`;

  // 1. Upload Document to Google Drive (text/plain avoids CORS preflight)
  if (documentFile) {
    try {
      const docBase64 = await fileToBase64(documentFile);
      const res = await fetch(APPS_SCRIPT_DRIVE_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({
          fileName: docName,
          mimeType: "application/pdf",
          base64Data: docBase64,
          folderType: "Documents",
        }),
      });
      const data = await res.json();
      if (data?.fileId) {
        if (!submission.document) submission.document = {};
        submission.document.url = data.webViewLink || `https://drive.google.com/file/d/${data.fileId}/view?usp=drivesdk`;
        submission.document.webViewLink = submission.document.url;
        submission.document.driveFileId = data.fileId;
        submission.document.name = docName;
      }
    } catch (e) {
      console.warn("Cloud Drive Doc sync warning:", e);
    }
  }

  // 2. Upload Pitch Video to Google Drive (text/plain avoids CORS preflight)
  if (videoFile) {
    try {
      const videoBase64 = await fileToBase64(videoFile);
      const res = await fetch(APPS_SCRIPT_DRIVE_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({
          fileName: videoName,
          mimeType: "video/mp4",
          base64Data: videoBase64,
          folderType: "Videos",
        }),
      });
      const data = await res.json();
      if (data?.fileId) {
        if (!submission.video) submission.video = {};
        submission.video.url = data.webViewLink || `https://drive.google.com/file/d/${data.fileId}/view?usp=drivesdk`;
        submission.video.webViewLink = submission.video.url;
        submission.video.driveFileId = data.fileId;
        submission.video.originalName = videoFile.name || videoName;
      }
    } catch (e) {
      console.warn("Cloud Drive Video sync warning:", e);
    }
  }

  // Save updated URLs to storage immediately
  const allSubs = getStoredSubmissions();
  const idx = allSubs.findIndex((s) => s.teamId === submission.teamId);
  if (idx !== -1) {
    allSubs[idx] = { ...allSubs[idx], ...submission };
    saveStoredSubmissions(allSubs);
  }

  // 3. Upload updated Master Spreadsheet (both CSV and XLSX) to Google Drive
  try {
    const currentSubs = getStoredSubmissions();
    const csvContent = generateSubmissionsCsvContent(currentSubs);
    const csvBase64 = btoa(unescape(encodeURIComponent(csvContent)));

    // Upload CSV
    await fetch(APPS_SCRIPT_DRIVE_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({
        fileName: "VisionMysuru_2050_Edition2_MasterData.csv",
        mimeType: "text/csv",
        base64Data: csvBase64,
        folderType: "Spreadsheets",
      }),
    });

    // Upload XLSX
    try {
      const rows = currentSubs.map((s, i) => {
        const leader = s.members?.find((m) => m.isLeader) || s.members?.[0] || {};
        return {
          "Sl No": i + 1,
          "Team ID": s.teamId,
          "Team Name": s.teamName,
          "Category": s.category,
          "Focus Area / Theme": s.theme,
          "Solution Name": s.solutionName,
          "Leader Name": leader.name || s.leadName || "",
          "Leader Email": leader.email || s.participantEmail || "",
          "Leader Phone": leader.phone || s.leadPhone || "",
          "Institution": leader.college || s.organizationDetails?.institution || "",
          "Current Stage": s.stage || "submitted",
          "Alloted Judge(s)": (s.allotedJudges || []).join(", "),
          "Rubric Average": s.rubricAverage || 0,
          "Pitch Video Drive URL": s.video?.url || s.video?.webViewLink || "",
          "Proposal PDF Drive URL": s.document?.url || s.document?.webViewLink || "",
          "Registered At": new Date(s.createdAt).toLocaleString("en-IN"),
        };
      });
      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Master Data");
      const xlsxBase64 = XLSX.write(wb, { type: "base64", bookType: "xlsx" });

      await fetch(APPS_SCRIPT_DRIVE_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({
          fileName: "VisionMysuru_2050_Edition2_MasterData.xlsx",
          mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          base64Data: xlsxBase64,
          folderType: "Spreadsheets",
        }),
      });
    } catch (xlsxErr) {
      console.warn("Cloud XLSX sync warning:", xlsxErr);
    }
  } catch (e) {
    console.warn("Cloud Spreadsheet sync warning:", e);
  }

  return submission;
};

/**
 * Export Master Data as CSV directly in the browser
 */
export const exportClientSpreadsheetCsv = () => {
  const subs = getStoredSubmissions();
  const csvContent = generateSubmissionsCsvContent(subs);
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", "VisionMysuru_2050_Edition2_MasterData.csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Export Master Data as Excel XLSX directly in the browser
 */
export const exportClientSpreadsheetXlsx = () => {
  const subs = getStoredSubmissions();
  const rows = subs.map((s, i) => {
    const leader = s.members?.find((m) => m.isLeader) || s.members?.[0] || {};
    return {
      "Sl No": i + 1,
      "Team ID": s.teamId,
      "Team Name": s.teamName,
      "Category": s.category,
      "Focus Area / Theme": s.theme,
      "Solution Name": s.solutionName,
      "Leader Name": leader.name || s.leadName || "",
      "Leader Email": leader.email || s.participantEmail || "",
      "Leader Phone": leader.phone || s.leadPhone || "",
      "Institution": leader.college || s.organizationDetails?.institution || "",
      "Current Stage": s.stage || "submitted",
      "Alloted Judge(s)": (s.allotedJudges || []).join(", "),
      "Rubric Average": s.rubricAverage || 0,
      "Pitch Video URL": s.video?.url || s.video?.webViewLink || "",
      "Proposal PDF URL": s.document?.url || s.document?.webViewLink || "",
      "Registered At": new Date(s.createdAt).toLocaleString("en-IN"),
    };
  });
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Master Data");
  XLSX.writeFile(wb, "VisionMysuru_2050_Edition2_MasterData.xlsx");
};
