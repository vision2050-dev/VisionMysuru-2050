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
    },
    document: {
      name: "EcoFlow_Lake_Restoration_Report.pdf",
      size: 2400000,
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
 * Client-Side Auth: Sign Up (Any role: participant, judge, admin)
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
    existing.role = role || existing.role;
    newUser = existing;
  } else {
    newUser = {
      id: `user-${Date.now()}-${Math.round(Math.random() * 1000)}`,
      name,
      email: cleanEmail,
      passwordHash,
      role,
      phone,
      organization: organization || (role === "admin" ? "SDMIMD Admin Panel" : "Participant"),
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
 * Client-Side Auth: Sign In (Any role: participant, judge, admin)
 */
export const clientSignIn = async ({ email, password, requestedRole }) => {
  const cleanEmail = email.toLowerCase().trim();
  const users = getStoredUsers();

  const user = users.find((u) => u.email === cleanEmail);
  if (!user) {
    throw new Error("No account found with this email. Please click Sign Up first.");
  }

  if (requestedRole === "admin" && user.role !== "admin") {
    throw new Error("you do not have admin access");
  }

  if (requestedRole && requestedRole !== user.role && user.role !== "admin") {
    throw new Error(`This email is registered as a ${user.role}. Please switch to the ${user.role} tab.`);
  }

  const inputHash = await hashPassword(password);

  // If user has not set a password yet (seeded account), initialize it with their entered password
  if (!user.passwordHash) {
    user.passwordHash = inputHash;
    saveStoredUsers(users);
  } else if (user.passwordHash !== inputHash) {
    throw new Error("Invalid password. Please try again or create a new account.");
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
    },
    document: {
      name: documentFileName || docName,
      originalName: documentFileName || docName,
      size: 2000000,
    },
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
 * Client-Side Judge Allocation
 */
export const allocateStoredSubmission = (teamId, judgeEmail) => {
  const cleanEmail = judgeEmail.toLowerCase().trim();
  const subs = getStoredSubmissions();
  const users = getStoredUsers();

  const subIndex = subs.findIndex((s) => s.teamId === teamId);
  if (subIndex !== -1) {
    if (!subs[subIndex].allotedJudges) subs[subIndex].allotedJudges = [];
    if (!subs[subIndex].allotedJudges.includes(cleanEmail)) {
      subs[subIndex].allotedJudges.push(cleanEmail);
    }
    subs[subIndex].stage = "allocated to a judge";
    saveStoredSubmissions(subs);
  }

  const judgeIndex = users.findIndex((u) => u.email === cleanEmail && u.role === "judge");
  if (judgeIndex !== -1) {
    if (!users[judgeIndex].allotedTeams) users[judgeIndex].allotedTeams = [];
    if (!users[judgeIndex].allotedTeams.includes(teamId)) {
      users[judgeIndex].allotedTeams.push(teamId);
    }
    saveStoredUsers(users);
  }

  return { success: true, teamId, judgeEmail: cleanEmail };
};

/**
 * Client-Side Auto-Allocation of All Teams
 */
export const autoAllocateStoredSubmissions = () => {
  const subs = getStoredSubmissions();
  const users = getStoredUsers();
  const judges = users.filter((u) => u.role === "judge");

  if (judges.length === 0) return { success: false, message: "No judges registered yet." };

  subs.forEach((sub, idx) => {
    const judge = judges[idx % judges.length];
    sub.allotedJudges = [judge.email];
    sub.allotedJudgeNames = [judge.name];
    sub.stage = "allocated to a judge";

    if (!judge.allotedTeams) judge.allotedTeams = [];
    if (!judge.allotedTeams.includes(sub.teamId)) {
      judge.allotedTeams.push(sub.teamId);
    }
  });

  saveStoredSubmissions(subs);
  saveStoredUsers(users);
  return { success: true, count: subs.length };
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

/**
 * Export Master Data as CSV directly in the browser
 */
export const exportClientSpreadsheetCsv = () => {
  const subs = getStoredSubmissions();
  const headers = [
    "Sl No",
    "Team ID",
    "Team Name",
    "Category",
    "Theme / Focus Area",
    "Solution Name",
    "Leader Email",
    "Current Stage",
    "Alloted Judge(s)",
    "Rubric Score",
    "Duel Elo Rating",
    "Registration Timestamp",
  ];

  const rows = subs.map((s, idx) => [
    idx + 1,
    s.teamId,
    `"${(s.teamName || "").replace(/"/g, '""')}"`,
    s.category,
    `"${(s.theme || "").replace(/"/g, '""')}"`,
    `"${(s.solutionName || "").replace(/"/g, '""')}"`,
    s.participantEmail,
    s.stage || "submitted",
    `"${(s.allotedJudges || []).join(", ")}"`,
    s.rubricAverage || 0,
    s.eloRating || 1200,
    new Date(s.createdAt).toLocaleString("en-IN"),
  ]);

  const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", "VisionMysuru_2050_Edition2_MasterData.csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
