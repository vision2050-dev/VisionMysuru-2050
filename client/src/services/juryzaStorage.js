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
    // Ensure we store a pure Blob to prevent DataCloneError on WebKit/Safari
    let dataToStore = fileOrBlob;
    if (typeof File !== "undefined" && fileOrBlob instanceof File) {
      dataToStore = fileOrBlob.slice(0, fileOrBlob.size, fileOrBlob.type);
    }
    return new Promise((resolve, reject) => {
      const tx = db.transaction(MEDIA_STORE_NAME, "readwrite");
      const store = tx.objectStore(MEDIA_STORE_NAME);
      const req = store.put(dataToStore, key);
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

export const clearMediaDB = async () => {
  try {
    const db = await openMediaDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(MEDIA_STORE_NAME, "readwrite");
      const store = tx.objectStore(MEDIA_STORE_NAME);
      const req = store.clear();
      req.onsuccess = () => resolve(true);
      req.onerror = () => reject(req.error);
    });
  } catch (e) {
    console.warn("Failed to clear media DB:", e);
    return false;
  }
};

const USERS_KEY = "juryza_users_store";
const SUBMISSIONS_KEY = "juryza_submissions_store";
const PURGE_VERSION_KEY = "juryza_purge_v3_clean";

// Initial Seed Users (Admin Only)
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
];

// Initial Seed Submissions (Clean Slate: 0 teams)
const DEFAULT_SUBMISSIONS = [];

// Automatic one-time migration to wipe cached test teams/judges in returning browsers
if (typeof window !== "undefined") {
  try {
    if (!localStorage.getItem(PURGE_VERSION_KEY)) {
      localStorage.setItem(SUBMISSIONS_KEY, JSON.stringify([]));
      const existingUsers = JSON.parse(localStorage.getItem(USERS_KEY) || "[]");
      const cleanedUsers = existingUsers.filter((u) => u.role === "admin");
      if (cleanedUsers.length === 0) {
        cleanedUsers.push(DEFAULT_USERS[0]);
      }
      localStorage.setItem(USERS_KEY, JSON.stringify(cleanedUsers));
      localStorage.setItem(PURGE_VERSION_KEY, "true");
      clearMediaDB();
    }
  } catch {
    // ignore
  }
}

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
 * Cloud State Engine: Multi-Device Synchronization
 * Keeps teams and judges perfectly synced across any phone, laptop, or desktop.
 */
export const CLOUD_SYNC_OBJECT_ID = "ff808181a09d98f701a17c2200a22144";
export const CLOUD_SYNC_ENDPOINT = `https://api.restful-api.dev/objects/${CLOUD_SYNC_OBJECT_ID}`;

let isSyncing = false;

/**
 * Merge two lists of submissions, deduplicating by teamId and keeping newer or richer versions
 */
export const mergeSubmissions = (localSubs = [], remoteSubs = []) => {
  const map = new Map();
  for (const s of localSubs) {
    if (s && s.teamId) map.set(s.teamId, s);
  }
  for (const r of remoteSubs) {
    if (!r || !r.teamId) continue;
    if (!map.has(r.teamId)) {
      map.set(r.teamId, r);
    } else {
      const existing = map.get(r.teamId);
      const rTime = new Date(r.updatedAt || r.createdAt || 0).getTime();
      const eTime = new Date(existing.updatedAt || existing.createdAt || 0).getTime();
      if (rTime >= eTime) {
        map.set(r.teamId, {
          ...r,
          videoBlobUrl: existing.videoBlobUrl || r.videoBlobUrl,
          docBlobUrl: existing.docBlobUrl || r.docBlobUrl,
          plainPassword: r.plainPassword || existing.plainPassword,
        });
      } else {
        map.set(r.teamId, {
          ...existing,
          plainPassword: existing.plainPassword || r.plainPassword,
        });
      }
    }
  }
  return Array.from(map.values()).sort(
    (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
  );
};

/**
 * Merge two lists of users, deduplicating by email or id
 */
export const mergeUsers = (localUsers = [], remoteUsers = []) => {
  const map = new Map();
  for (const u of localUsers) {
    const key = (u.email || u.id || "").toLowerCase().trim();
    if (key) map.set(key, u);
  }
  for (const r of remoteUsers) {
    const key = (r.email || r.id || "").toLowerCase().trim();
    if (!key) continue;
    if (!map.has(key)) {
      map.set(key, r);
    } else {
      const existing = map.get(key);
      map.set(key, {
        ...existing,
        ...r,
        plainPassword: r.plainPassword || existing.plainPassword,
        passwordHash: r.passwordHash || existing.passwordHash,
      });
    }
  }
  return Array.from(map.values());
};

/**
 * Parse raw rows from Google Drive Master Spreadsheet (CSV or JSON) into submission objects
 */
export const parseSubmissionsFromRows = (rows) => {
  if (!Array.isArray(rows) || rows.length === 0) return [];

  return rows.map((row, idx) => {
    const teamId = row["Team ID"] || row["teamId"] || `VM2-TEAM-${idx + 1}`;
    const teamName = row["Team Name"] || row["teamName"] || "Unnamed Team";
    const category = row["Category"] || row["category"] || "General / Citizen";
    const theme =
      row["Focus Area / Theme"] ||
      row["Theme / Focus Area"] ||
      row["theme"] ||
      "General";
    const solutionName = row["Solution Name"] || row["solutionName"] || "Solution";
    const leaderName = row["Leader Name"] || row["leadName"] || "Team Lead";
    const leaderEmail = (row["Leader Email"] || row["participantEmail"] || "").toLowerCase().trim();
    const leaderPhone = row["Leader Phone"] || row["leadPhone"] || "";
    const institution = row["Institution"] || row["college"] || "";
    const stage = row["Current Stage"] || row["stage"] || "submitted";
    const allotedJudgesStr = row["Alloted Judge(s)"] || row["allotedJudges"] || "";
    const allotedJudges =
      typeof allotedJudgesStr === "string" && allotedJudgesStr.trim()
        ? allotedJudgesStr
            .split(",")
            .map((s) => s.trim().toLowerCase())
            .filter(Boolean)
        : Array.isArray(allotedJudgesStr)
        ? allotedJudgesStr
        : [];
    const rubricAverage = parseFloat(
      row["Rubric Average"] || row["Rubric Score"] || row["rubricAverage"] || 0
    );
    const videoUrl =
      row["Pitch Video Drive URL"] ||
      row["Pitch Video Link"] ||
      row["Pitch Video URL"] ||
      row["videoUrl"] ||
      "";
    const docUrl =
      row["Proposal PDF Drive URL"] ||
      row["Proposal PDF Link"] ||
      row["Proposal PDF URL"] ||
      row["docUrl"] ||
      "";
    const registeredAt =
      row["Registered At"] ||
      row["Registration Timestamp"] ||
      row["createdAt"] ||
      new Date().toISOString();

    return {
      _id: `sub-imported-${teamId}`,
      teamId,
      teamName,
      participantEmail: leaderEmail,
      category,
      city: "Mysuru",
      theme,
      solutionName,
      shortDescription: solutionName,
      detailedProposal: solutionName,
      video: {
        originalName: `${teamName}_Video.mp4`,
        size: 15000000,
        url: videoUrl,
        webViewLink: videoUrl,
      },
      document: {
        name: `${teamName}_Proposal.pdf`,
        originalName: `${teamName}_Proposal.pdf`,
        size: 2000000,
        url: docUrl,
        webViewLink: docUrl,
      },
      members: [
        {
          name: leaderName,
          email: leaderEmail,
          phone: leaderPhone,
          college: institution,
          isLeader: true,
        },
      ],
      organizationDetails: { institution },
      stage,
      allotedJudges,
      allotedJudgeNames: [],
      rubricAverage,
      eloRating: 1200,
      createdAt: registeredAt,
    };
  });
};

/**
 * Fetch Master State & Submissions directly from Google Drive Webhook
 */
export const fetchDriveMasterState = async () => {
  try {
    const res = await fetch(`${APPS_SCRIPT_DRIVE_URL}?action=get_state`, {
      redirect: "follow",
    });

    if (!res.ok) {
      throw new Error(`Google Drive webhook responded with status ${res.status}`);
    }

    const data = await res.json();
    let driveSubs = [];
    let driveUsers = [];

    if (data?.spreadsheetUrl) {
      localStorage.setItem("vm2_drive_spreadsheet_url", data.spreadsheetUrl);
    }

    if (data && Array.isArray(data.submissions) && data.submissions.length > 0) {
      driveSubs = data.submissions;
      driveUsers = Array.isArray(data.users) ? data.users : [];
    } else if (data && typeof data.csv === "string" && data.csv.trim().length > 0) {
      const workbook = XLSX.read(data.csv, { type: "string" });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(firstSheet, { defval: "" });
      driveSubs = parseSubmissionsFromRows(rows);
    } else if (data && Array.isArray(data.sheetRows) && data.sheetRows.length > 0) {
      driveSubs = parseSubmissionsFromRows(data.sheetRows);
    }

    if (driveSubs.length > 0) {
      const localSubs = getStoredSubmissions();
      const localUsers = getStoredUsers();
      const mergedSubs = mergeSubmissions(localSubs, driveSubs);
      const mergedUsers = mergeUsers(localUsers, driveUsers);

      saveStoredSubmissions(mergedSubs);
      if (driveUsers.length > 0) {
        saveStoredUsers(mergedUsers);
      }

      return {
        success: true,
        submissions: mergedSubs,
        users: mergedUsers,
        count: driveSubs.length,
      };
    }

    return { success: false, submissions: getStoredSubmissions(), count: 0 };
  } catch (err) {
    console.warn("Could not fetch master state from Google Drive webhook:", err.message);
    return {
      success: false,
      submissions: getStoredSubmissions(),
      count: 0,
      error: err.message,
    };
  }
};

/**
 * Get direct URL to the live Master Google Sheet in Google Drive
 */
export const getMasterSpreadsheetUrl = () => {
  return (
    localStorage.getItem("vm2_drive_spreadsheet_url") ||
    "https://drive.google.com/drive/folders/1UKXUmqcMewEhw_KG7L1Fe740yCd6fX2e"
  );
};

/**
 * Import Submissions from an Excel (.xlsx) or .csv file downloaded from Google Drive
 */
export const importSubmissionsFromFile = async (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: "array" });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const rows = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

        const imported = parseSubmissionsFromRows(rows);
        if (imported.length === 0) {
          throw new Error("No valid team submission rows found in this file.");
        }

        const localSubs = getStoredSubmissions();
        const merged = mergeSubmissions(localSubs, imported);
        saveStoredSubmissions(merged);
        await pushCloudState({ submissions: merged });

        resolve({ count: imported.length, submissions: merged });
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = (err) => reject(err);
    reader.readAsArrayBuffer(file);
  });
};

/**
 * Push current master state (submissions + users) to cloud storage and Google Drive backup
 */
export const pushCloudState = async ({ submissions, users } = {}) => {
  try {
    let currentSubs = submissions;
    let currentUsers = users;

    // Safety: If submissions not passed, use stored submissions ONLY IF stored submissions has data
    if (currentSubs === undefined) {
      const stored = getStoredSubmissions();
      if (stored && stored.length > 0) {
        currentSubs = stored;
      }
    }

    if (currentUsers === undefined) {
      currentUsers = getStoredUsers();
    }

    // Protect existing submissions: merge with remote state before pushing so nothing is accidentally overwritten
    try {
      const checkRes = await fetch(CLOUD_SYNC_ENDPOINT);
      if (checkRes.ok) {
        const checkJson = await checkRes.json();
        const remoteData = checkJson?.data;
        if (
          remoteData &&
          Array.isArray(remoteData.submissions) &&
          remoteData.submissions.length > 0
        ) {
          if (!currentSubs || currentSubs.length === 0) {
            currentSubs = remoteData.submissions;
            saveStoredSubmissions(currentSubs);
          } else {
            currentSubs = mergeSubmissions(currentSubs, remoteData.submissions);
          }
        }
        if (
          remoteData &&
          Array.isArray(remoteData.users) &&
          remoteData.users.length > 0
        ) {
          currentUsers = mergeUsers(currentUsers || getStoredUsers(), remoteData.users);
        }
      }
    } catch {
      // ignore
    }

    currentSubs = currentSubs || getStoredSubmissions();
    currentUsers = currentUsers || getStoredUsers();

    const payload = {
      name: "VisionMysuru_2050_MasterState",
      data: {
        lastUpdated: new Date().toISOString(),
        submissions: currentSubs,
        users: currentUsers,
      },
    };

    // 1. Primary Cloud State (REST KV)
    await fetch(CLOUD_SYNC_ENDPOINT, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    // 2. Backup to Google Drive Webhook (updates master sheet & JSON in place)
    if (APPS_SCRIPT_DRIVE_URL) {
      try {
        const stateBase64 = btoa(unescape(encodeURIComponent(JSON.stringify(payload.data))));
        fetch(APPS_SCRIPT_DRIVE_URL, {
          method: "POST",
          headers: { "Content-Type": "text/plain;charset=utf-8" },
          body: JSON.stringify({
            action: "sync_master_state",
            stateData: payload.data,
            fileName: "VisionMysuru_2050_MasterState.json",
            mimeType: "application/json",
            base64Data: stateBase64,
            folderType: "Spreadsheets",
          }),
        }).catch(() => {});
      } catch (err) {
        console.warn("Drive state backup warning:", err);
      }
    }

    return true;
  } catch (err) {
    console.warn("Cloud state push note:", err.message);
    return false;
  }
};

/**
 * Synchronize state between current browser localStorage, Google Drive, and Cloud Master State
 */
export const syncCloudPortalState = async () => {
  if (isSyncing) {
    const subs = getStoredSubmissions();
    const users = getStoredUsers();
    return { submissions: subs, users, judges: users.filter((u) => u.role === "judge") };
  }

  isSyncing = true;
  try {
    // 1. First priority: Check Google Drive Master State via Google Apps Script
    let remoteSubs = [];
    let remoteUsers = [];

    try {
      const driveRes = await fetchDriveMasterState();
      if (driveRes.success && driveRes.submissions?.length > 0) {
        remoteSubs = driveRes.submissions;
        remoteUsers = driveRes.users || [];
      }
    } catch (driveErr) {
      console.warn("Drive sync check note:", driveErr.message);
    }

    // 2. Second priority: Check Cloud REST KV
    try {
      const res = await fetch(CLOUD_SYNC_ENDPOINT);
      if (res.ok) {
        const json = await res.json();
        const data = json?.data;
        if (data && typeof data === "object") {
          const kvSubs = Array.isArray(data.submissions) ? data.submissions : [];
          const kvUsers = Array.isArray(data.users) ? data.users : [];
          remoteSubs = mergeSubmissions(remoteSubs, kvSubs);
          remoteUsers = mergeUsers(remoteUsers, kvUsers);
        }
      }
    } catch (e) {
      console.warn("Could not fetch remote cloud state:", e.message);
    }

    const localSubs = getStoredSubmissions();
    const localUsers = getStoredUsers();

    const mergedSubs = mergeSubmissions(localSubs, remoteSubs);
    const mergedUsers = mergeUsers(localUsers, remoteUsers);

    saveStoredSubmissions(mergedSubs);
    saveStoredUsers(mergedUsers);

    // If we recovered teams from Drive or local, persist back to cloud KV so all clients stay fast
    if (mergedSubs.length > 0) {
      pushCloudState({ submissions: mergedSubs, users: mergedUsers }).catch(() => {});
    }

    const judges = mergedUsers.filter((u) => u.role === "judge");
    return { submissions: mergedSubs, users: mergedUsers, judges };
  } catch (err) {
    console.warn("syncCloudPortalState error:", err);
    const subs = getStoredSubmissions();
    const users = getStoredUsers();
    return { submissions: subs, users, judges: users.filter((u) => u.role === "judge") };
  } finally {
    isSyncing = false;
  }
};

export const deleteStoredSubmission = (teamId) => {
  const subs = getStoredSubmissions().filter((s) => s.teamId !== teamId);
  saveStoredSubmissions(subs);
  const users = getStoredUsers();
  users.forEach((u) => {
    if (u.role === "judge" && Array.isArray(u.allotedTeams)) {
      u.allotedTeams = u.allotedTeams.filter((id) => id !== teamId);
    }
  });
  saveStoredUsers(users);
  pushCloudState({ submissions: subs, users }).catch(() => {});
  return subs;
};

export const deleteStoredJudge = (judgeEmailOrId) => {
  const clean = (judgeEmailOrId || "").toLowerCase().trim();
  const users = getStoredUsers().filter(
    (u) => u.id !== judgeEmailOrId && (u.email || "").toLowerCase() !== clean,
  );
  saveStoredUsers(users);

  const subs = getStoredSubmissions();
  subs.forEach((s) => {
    if (Array.isArray(s.allotedJudges)) {
      s.allotedJudges = s.allotedJudges.filter((email) => email.toLowerCase() !== clean);
      if (s.allotedJudges.length === 0 && s.stage === "allocated to a judge") {
        s.stage = "submitted";
      }
    }
  });
  saveStoredSubmissions(subs);
  pushCloudState({ submissions: subs, users }).catch(() => {});
  return users.filter((u) => u.role === "judge");
};

export const clearAllPortalData = async () => {
  try {
    await clearMediaDB();
    saveStoredSubmissions([]);
    const users = getStoredUsers().filter((u) => u.role === "admin");
    if (users.length === 0) {
      users.push(DEFAULT_USERS[0]);
    }
    saveStoredUsers(users);
    await pushCloudState({ submissions: [], users });
    return true;
  } catch (e) {
    console.warn("Failed to clear portal data:", e);
    return false;
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
    existing.plainPassword = password;
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
      plainPassword: password,
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
  pushCloudState({ users }).catch(() => {});

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
    existing.plainPassword = password;
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
      plainPassword: password,
      role: "judge",
      organization: organization.trim(),
      specialization,
      allotedTeams: [],
      createdAt: new Date().toISOString(),
    };
    users.push(judgeUser);
  }

  saveStoredUsers(users);
  pushCloudState({ users }).catch(() => {});

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
  let users = getStoredUsers();

  let user = users.find((u) => u.email === cleanEmail);
  if (!user && cleanEmail !== "vision2050@sdmimd.ac.in") {
    // Attempt cloud synchronization before failing
    try {
      const synced = await syncCloudPortalState();
      users = synced.users || getStoredUsers();
      user = users.find((u) => u.email === cleanEmail);
    } catch {
      // ignore
    }
  }

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
 * Client-Side Participant Password Reset by Gmail ID
 */
export const clientResetParticipantPassword = async ({ email, newPassword }) => {
  const cleanEmail = (email || "").toLowerCase().trim();
  if (!cleanEmail) {
    throw new Error("Please enter your Gmail / Email ID.");
  }
  if (!newPassword || newPassword.length < 8) {
    throw new Error("New password must be at least 8 characters long.");
  }

  const users = getStoredUsers();
  let user = users.find((u) => (u.email || "").toLowerCase() === cleanEmail);
  const passwordHash = await hashPassword(newPassword);

  if (!user) {
    const subs = getStoredSubmissions();
    const teamWithEmail = subs.find(
      (s) =>
        (s.participantEmail || "").toLowerCase() === cleanEmail ||
        (s.members || []).some((m) => (m.email || "").toLowerCase() === cleanEmail)
    );

    const leader =
      teamWithEmail?.members?.find((m) => m.isLeader) || teamWithEmail?.members?.[0] || {};
    const userName = leader.name || teamWithEmail?.leadName || "Participant";

    user = {
      id: `user-${Date.now()}-${Math.round(Math.random() * 1000)}`,
      name: userName,
      email: cleanEmail,
      passwordHash,
      plainPassword: newPassword,
      role: "participant",
      organization:
        leader.college || teamWithEmail?.organizationDetails?.institution || "Participant",
      specialization: "General",
      allotedTeams: teamWithEmail ? [teamWithEmail.teamId] : [],
      createdAt: new Date().toISOString(),
    };
    users.push(user);
  } else {
    user.passwordHash = passwordHash;
    user.plainPassword = newPassword;
  }

  saveStoredUsers(users);
  pushCloudState({ users }).catch(() => {});

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
 * Send 6-digit Password Reset OTP via Google Apps Script Webhook
 */
export const sendPasswordResetOtp = async (email) => {
  const cleanEmail = (email || "").toLowerCase().trim();
  if (!cleanEmail) {
    throw new Error("Please enter your Gmail / Email ID.");
  }

  const users = getStoredUsers();
  const subs = getStoredSubmissions();

  const foundUser = users.find((u) => (u.email || "").toLowerCase() === cleanEmail);
  const foundSub = subs.find(
    (s) =>
      (s.participantEmail || "").toLowerCase() === cleanEmail ||
      (s.members || []).some((m) => (m.email || "").toLowerCase() === cleanEmail)
  );

  if (!foundUser && !foundSub) {
    throw new Error(
      "No registered team or participant found with this email. Please verify your email or click Sign Up."
    );
  }

  const leader =
    foundSub?.members?.find((m) => m.isLeader) || foundSub?.members?.[0] || {};
  const participantName =
    foundUser?.name || leader?.name || foundSub?.leadName || "Participant";

  // Generate 6-digit random numeric OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

  // Store in sessionStorage for verification
  sessionStorage.setItem(
    "juryza_reset_otp",
    JSON.stringify({
      email: cleanEmail,
      otp,
      expiresAt,
    })
  );

  // Dispatch to Google Apps Script Webhook
  try {
    const res = await fetch(APPS_SCRIPT_DRIVE_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({
        action: "send_otp",
        email: cleanEmail,
        otp,
        name: participantName,
      }),
    });

    const data = await res.json().catch(() => ({}));
    if (data && data.success === false && data.error) {
      if (data.error.includes("permission") || data.error.includes("MailApp")) {
        throw new Error(
          "Google Apps Script requires email authorization. Please click 'Run' on authorizeEmail() in Apps Script."
        );
      }
      throw new Error(data.error);
    }
  } catch (err) {
    console.warn("Apps Script OTP dispatch warning:", err.message);
    if (err.message.includes("Google Apps Script requires email authorization")) {
      throw err;
    }
  }

  return { success: true, email: cleanEmail, expiresAt };
};

/**
 * Verify 6-digit Password Reset OTP
 */
export const verifyPasswordResetOtp = ({ email, otp }) => {
  const cleanEmail = (email || "").toLowerCase().trim();
  const raw = sessionStorage.getItem("juryza_reset_otp");
  if (!raw) {
    throw new Error("No verification code found. Please click 'Send OTP' first.");
  }

  const record = JSON.parse(raw);
  if (record.email !== cleanEmail) {
    throw new Error("The entered email does not match the OTP recipient.");
  }
  if (Date.now() > record.expiresAt) {
    throw new Error("The verification code has expired. Please request a new OTP.");
  }
  if (String(record.otp).trim() !== String(otp).trim()) {
    throw new Error("Incorrect verification code. Please check your email.");
  }

  return true;
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
  pushCloudState({ submissions: subs }).catch(() => {});
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
    pushCloudState({ submissions: subs }).catch(() => {});
    return subs[index];
  }
  return null;
};

/**
 * Client-Side Full Submission Details Updater (Admin)
 */
export const updateStoredSubmissionDetails = async (teamId, patchData) => {
  const subs = getStoredSubmissions();
  const index = subs.findIndex((s) => s.teamId === teamId);
  if (index === -1) return null;

  const current = subs[index];
  const updated = { ...current, ...patchData, updatedAt: new Date().toISOString() };

  // 1. Compulsory Files: Video and PDF Document names/URLs
  if (patchData.videoFileName || patchData.videoUrl) {
    if (!updated.video) updated.video = {};
    if (patchData.videoFileName) updated.video.originalName = patchData.videoFileName;
    if (patchData.videoUrl) {
      updated.video.url = patchData.videoUrl;
      updated.video.webViewLink = patchData.videoUrl;
    }
  }

  if (patchData.documentFileName || patchData.documentUrl) {
    if (!updated.document) updated.document = {};
    if (patchData.documentFileName) {
      updated.document.name = patchData.documentFileName;
      updated.document.originalName = patchData.documentFileName;
    }
    if (patchData.documentUrl) {
      updated.document.url = patchData.documentUrl;
      updated.document.webViewLink = patchData.documentUrl;
    }
  }

  // 2. Alloted Judge synchronization
  if (patchData.allotedJudge !== undefined) {
    const cleanJudge = (patchData.allotedJudge || "").toLowerCase().trim();
    const users = getStoredUsers();
    if (!cleanJudge) {
      updated.allotedJudges = [];
      updated.allotedJudgeNames = [];
      if (updated.stage === "allocated to a judge") updated.stage = "submitted";
      users.forEach((u) => {
        if (u.role === "judge" && Array.isArray(u.allotedTeams)) {
          u.allotedTeams = u.allotedTeams.filter((id) => id !== teamId);
        }
      });
    } else {
      const targetJudge = users.find((u) => u.email === cleanJudge && u.role === "judge");
      const jName = targetJudge ? targetJudge.name : cleanJudge;
      updated.allotedJudges = [cleanJudge];
      updated.allotedJudgeNames = [jName];
      if (updated.stage === "submitted") updated.stage = "allocated to a judge";
      users.forEach((u) => {
        if (u.role === "judge") {
          if (!Array.isArray(u.allotedTeams)) u.allotedTeams = [];
          if (u.email === cleanJudge) {
            if (!u.allotedTeams.includes(teamId)) u.allotedTeams.push(teamId);
          } else {
            u.allotedTeams = u.allotedTeams.filter((id) => id !== teamId);
          }
        }
      });
    }
    saveStoredUsers(users);
  }

  // 3. Sync leader fields with members array
  if (patchData.leadName || patchData.leadEmail || patchData.leadPhone || patchData.institution) {
    if (!Array.isArray(updated.members) || updated.members.length === 0) {
      updated.members = [{ isLeader: true }];
    }
    const leaderIdx = updated.members.findIndex((m) => m.isLeader);
    const targetIdx = leaderIdx !== -1 ? leaderIdx : 0;
    updated.members[targetIdx] = {
      ...updated.members[targetIdx],
      name: patchData.leadName ?? updated.members[targetIdx].name,
      email: patchData.leadEmail ?? updated.members[targetIdx].email,
      phone: patchData.leadPhone ?? updated.members[targetIdx].phone,
      college: patchData.institution ?? updated.members[targetIdx].college,
      isLeader: true,
    };
    if (patchData.leadEmail) {
      updated.participantEmail = patchData.leadEmail.toLowerCase().trim();
    }
  }

  // 4. Team Password update
  if (patchData.password) {
    updated.plainPassword = patchData.password;
    const users = getStoredUsers();
    const cleanEmail = (updated.participantEmail || "").toLowerCase().trim();
    let user = users.find((u) => (u.email || "").toLowerCase() === cleanEmail);
    const passwordHash = await hashPassword(patchData.password);
    if (user) {
      user.passwordHash = passwordHash;
      user.plainPassword = patchData.password;
      if (patchData.leadName) user.name = patchData.leadName;
    } else {
      user = {
        id: `user-${Date.now()}`,
        name: patchData.leadName || updated.teamName || "Participant",
        email: cleanEmail,
        passwordHash,
        plainPassword: patchData.password,
        role: "participant",
        organization: patchData.institution || "Participant",
        specialization: "General",
        allotedTeams: [teamId],
        createdAt: new Date().toISOString(),
      };
      users.push(user);
    }
    saveStoredUsers(users);
  }

  subs[index] = updated;
  saveStoredSubmissions(subs);
  pushCloudState({ submissions: subs, users: getStoredUsers() }).catch(() => {});

  // Sync master spreadsheet in background
  syncSubmissionFilesToCloudDrive({ submission: updated }).catch(() => {});
  return updated;
};

/**
 * Client-Side Full Judge Details Updater (Admin)
 */
export const updateStoredJudgeDetails = async (judgeEmailOrId, patchData) => {
  const clean = (judgeEmailOrId || "").toLowerCase().trim();
  const users = getStoredUsers();
  const index = users.findIndex(
    (u) => u.id === judgeEmailOrId || (u.email || "").toLowerCase() === clean
  );
  if (index === -1) return null;

  const judge = users[index];
  const oldEmail = (judge.email || "").toLowerCase();

  if (patchData.name) judge.name = patchData.name.trim();
  if (patchData.organization) judge.organization = patchData.organization.trim();
  if (patchData.specialization) judge.specialization = patchData.specialization;
  if (patchData.email) judge.email = patchData.email.toLowerCase().trim();
  if (patchData.createdAt) judge.createdAt = patchData.createdAt;

  if (patchData.password) {
    judge.plainPassword = patchData.password;
    judge.passwordHash = await hashPassword(patchData.password);
  }

  // Handle Alloted Teams synchronization
  if (Array.isArray(patchData.allotedTeams)) {
    judge.allotedTeams = patchData.allotedTeams;
    const subs = getStoredSubmissions();
    const jEmail = (patchData.email || judge.email).toLowerCase().trim();
    const jName = patchData.name || judge.name;

    subs.forEach((s) => {
      if (!Array.isArray(s.allotedJudges)) s.allotedJudges = [];
      if (!Array.isArray(s.allotedJudgeNames)) s.allotedJudgeNames = [];

      const shouldBeAssigned = patchData.allotedTeams.includes(s.teamId);
      if (shouldBeAssigned) {
        if (!s.allotedJudges.some((e) => e.toLowerCase() === jEmail)) {
          s.allotedJudges.push(jEmail);
          s.allotedJudgeNames.push(jName);
        }
        if (s.stage === "submitted") {
          s.stage = "allocated to a judge";
        }
      } else {
        s.allotedJudges = s.allotedJudges.filter(
          (e) => e.toLowerCase() !== jEmail && e.toLowerCase() !== oldEmail
        );
        s.allotedJudgeNames = s.allotedJudgeNames.filter(
          (n) => n !== jName && n !== judge.name
        );
        if (s.allotedJudges.length === 0 && s.stage === "allocated to a judge") {
          s.stage = "submitted";
        }
      }
    });
    saveStoredSubmissions(subs);
  }

  users[index] = judge;
  saveStoredUsers(users);

  // If judge email or name changed without allotedTeams patch, update in submissions allocations
  if (patchData.email && patchData.email.toLowerCase().trim() !== oldEmail && !Array.isArray(patchData.allotedTeams)) {
    const newEmail = patchData.email.toLowerCase().trim();
    const subs = getStoredSubmissions();
    subs.forEach((s) => {
      if (Array.isArray(s.allotedJudges)) {
        s.allotedJudges = s.allotedJudges.map((e) =>
          e.toLowerCase() === oldEmail ? newEmail : e
        );
      }
      if (Array.isArray(s.allotedJudgeNames) && patchData.name) {
        s.allotedJudgeNames = s.allotedJudgeNames.map((n) =>
          n === judge.name ? patchData.name : n
        );
      }
    });
    saveStoredSubmissions(subs);
  }

  pushCloudState({ submissions: getStoredSubmissions(), users }).catch(() => {});
  return judge;
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
    pushCloudState({ submissions: subs, users }).catch(() => {});

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
  pushCloudState({ submissions: subs, users }).catch(() => {});

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
  pushCloudState({ submissions: subs, users }).catch(() => {});
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
    pushCloudState({ submissions: subs }).catch(() => {});
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

  // 3. Update the Master Spreadsheet in Google Drive (Same sheet updated in-place)
  try {
    const allUsers = getStoredUsers();
    const currentUser = allUsers.find(
      (u) => u.email?.toLowerCase() === submission.participantEmail?.toLowerCase()
    );

    const res = await fetch(APPS_SCRIPT_DRIVE_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({
        action: "register_submission",
        submission,
        user: currentUser || null,
      }),
    });

    const data = await res.json();
    if (data?.spreadsheetUrl) {
      localStorage.setItem("vm2_drive_spreadsheet_url", data.spreadsheetUrl);
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
