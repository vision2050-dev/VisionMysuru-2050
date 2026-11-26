import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-hot-toast";
import {
  FiShield,
  FiUsers,
  FiAward,
  FiDownload,
  FiExternalLink,
  FiRefreshCw,
  FiUserCheck,
  FiVideo,
  FiFileText,
  FiLogOut,
  FiArrowLeft,
  FiCheckCircle,
  FiAlertTriangle,
  FiPlus,
  FiX,
  FiMail,
  FiLock,
  FiEye,
  FiEyeOff,
  FiArrowRight,
  FiAlertCircle,
  FiFolder,
  FiTrash2,
  FiEdit2,
  FiKey,
  FiUpload,
} from "react-icons/fi";
import api from "../utils/api";
import {
  getStoredSubmissions,
  saveStoredSubmissions,
  getStoredUsers,
  saveStoredUsers,
  updateStoredSubmissionStage,
  allocateStoredSubmission,
  autoAllocateStoredSubmissions,
  exportClientSpreadsheetCsv,
  exportClientSpreadsheetXlsx,
  clientSignIn,
  clientCreateJudge,
  getMediaBlobUrl,
  deleteStoredSubmission,
  deleteStoredJudge,
  updateStoredSubmissionDetails,
  updateStoredJudgeDetails,
  clearAllPortalData,
  syncCloudPortalState,
  pushCloudState,
  fetchDriveMasterState,
  importSubmissionsFromFile,
  getMasterSpreadsheetUrl,
  resolveSubmissionMedia,
  sanitizeSubmissionForStorage,
  mergeSubmissions,
  saveStoredRoundAllocations,
  getAllocatedJudgesForRound,
  getActiveAllocatedJudges,
  normalizeRoundNumber,
  normalizeStageLabel,
} from "../services/juryzaStorage";
import ThemeToggle from "../Components/ThemeToggle";

const ADMIN_EMAIL = "vision2050@sdmimd.ac.in";

export const AdminJuryzaPlatform = () => {
  const navigate = useNavigate();
  const [isAdminAuth, setIsAdminAuth] = useState(false);
  const [adminEmail, setAdminEmail] = useState(ADMIN_EMAIL);
  const [adminName, setAdminName] = useState("Administrator");

  // Admin Login States
  const [loginPassword, setLoginPassword] = useState("");
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState("");

  const [submissions, setSubmissions] = useState([]);
  const [judges, setJudges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("submissions"); // "submissions" | "judges"

  // Allocation state
  const [allocating, setAllocating] = useState(false);
  const [autoAllocateRound, setAutoAllocateRound] = useState("round1");
  const [allocatingTeamModal, setAllocatingTeamModal] = useState(null);
  const [roundAllocationForm, setRoundAllocationForm] = useState({
    round1: [],
    round2: [],
    round3: [],
  });

  // Media Inspection Modal State
  const [previewingSubmission, setPreviewingSubmission] = useState(null);

  // Add Judge Modal States
  const [showAddJudgeModal, setShowAddJudgeModal] = useState(false);
  const [judgeFormName, setJudgeFormName] = useState("");
  const [judgeFormEmail, setJudgeFormEmail] = useState("");
  const [judgeFormPassword, setJudgeFormPassword] = useState("");
  const [judgeFormOrg, setJudgeFormOrg] = useState("SDMIMD Panel");
  const [judgeFormTrack, setJudgeFormTrack] = useState("All Tracks");
  const [creatingJudge, setCreatingJudge] = useState(false);
  const [judgeCreationSuccess, setJudgeCreationSuccess] = useState(null);

  // Edit Submission Modal States
  const [editingSubmission, setEditingSubmission] = useState(null);
  const [submissionEditForm, setSubmissionEditForm] = useState({
    teamId: "",
    teamName: "",
    category: "students",
    theme: "",
    solutionName: "",
    shortDescription: "",
    detailedProposal: "",
    leadName: "",
    leadEmail: "",
    leadPhone: "",
    institution: "",
    stage: "submitted",
    rubricAverage: 0,
    password: "",
    videoFileName: "",
    videoUrl: "",
    documentFileName: "",
    documentUrl: "",
    allotedJudge: "",
    roundAllocations: { round1: [], round2: [], round3: [] },
    createdAt: "",
  });

  // Edit Judge Modal States
  const [editingJudge, setEditingJudge] = useState(null);
  const [judgeEditForm, setJudgeEditForm] = useState({
    originalEmail: "",
    name: "",
    email: "",
    organization: "SDMIMD Panel",
    specialization: "All Tracks",
    password: "",
    allotedTeams: [],
    createdAt: "",
  });

  // Password visibility maps
  const [showTeamPasswords, setShowTeamPasswords] = useState({});
  const [showJudgePasswords, setShowJudgePasswords] = useState({});
  const [editLoading, setEditLoading] = useState(false);

  useEffect(() => {
    const token =
      localStorage.getItem("juryzaAdminToken") ||
      (localStorage.getItem("juryzaRole") === "admin" ? localStorage.getItem("juryzaToken") : null) ||
      localStorage.getItem("adminToken");
    const role = localStorage.getItem("juryzaAdminRole") || localStorage.getItem("juryzaRole");
    const email = (
      localStorage.getItem("juryzaAdminEmail") ||
      localStorage.getItem("juryzaEmail") ||
      ""
    ).toLowerCase().trim();

    if (token && (role === "admin" || !role) && (email === ADMIN_EMAIL || !email)) {
      setIsAdminAuth(true);
      setAdminEmail(ADMIN_EMAIL);
      setAdminName("Administrator");
      fetchData();
    } else {
      setIsAdminAuth(false);
      setLoading(false);
    }
  }, []);

  // Background live synchronization with Master Google Sheet & Cloud every 25 seconds
  useEffect(() => {
    if (!isAdminAuth) return;
    const interval = setInterval(() => {
      syncCloudPortalState()
        .then((synced) => {
          if (synced?.submissions && synced.submissions.length > 0) {
            setSubmissions((prev) =>
              mergeSubmissions(
                prev.map(sanitizeSubmissionForStorage),
                synced.submissions,
              ),
            );
            if (synced.judges && synced.judges.length > 0) {
              setJudges(synced.judges);
            }
          }
        })
        .catch(() => {});
    }, 25000);
    return () => clearInterval(interval);
  }, [isAdminAuth]);

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setLoginError("");

    if (!loginPassword) {
      setLoginError("Please enter the administrator password.");
      return;
    }

    setLoginLoading(true);

    try {
      let authData = null;
      try {
        const res = await api.post("/api/v2/auth/signin", {
          email: ADMIN_EMAIL,
          password: loginPassword,
          requestedRole: "admin",
        });
        authData = res.data;
      } catch (apiErr) {
        // Fallback to local client storage authentication
        try {
          authData = await clientSignIn({
            email: ADMIN_EMAIL,
            password: loginPassword,
            requestedRole: "admin",
          });
        } catch (clientErr) {
          const sMsg = apiErr.response?.data?.message;
          setLoginError(sMsg || clientErr.message || "Invalid administrator password.");
          setLoginLoading(false);
          return;
        }
      }

      if (authData && (authData.token || authData.user)) {
        const user = authData.user || {};
        const token = authData.token || `admin-session-${Date.now()}`;

        localStorage.setItem("juryzaAdminToken", token);
        localStorage.setItem("juryzaAdminRole", "admin");
        localStorage.setItem("juryzaAdminEmail", ADMIN_EMAIL);
        localStorage.setItem("juryzaAdminName", user.name || "Administrator");
        localStorage.setItem("adminToken", token);

        localStorage.setItem("juryzaToken", token);
        localStorage.setItem("juryzaRole", "admin");
        localStorage.setItem("juryzaEmail", ADMIN_EMAIL);
        localStorage.setItem("juryzaName", user.name || "Administrator");

        setIsAdminAuth(true);
        toast.success("Welcome, Administrator!");
        fetchData();
      }
    } catch (err) {
      setLoginError(err.message || "Authentication failed. Please verify your password.");
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("juryzaAdminToken");
    localStorage.removeItem("juryzaAdminRole");
    localStorage.removeItem("juryzaAdminEmail");
    localStorage.removeItem("juryzaAdminName");
    localStorage.removeItem("adminToken");
    if (localStorage.getItem("juryzaRole") === "admin") {
      localStorage.removeItem("juryzaToken");
      localStorage.removeItem("juryzaRole");
      localStorage.removeItem("juryzaEmail");
      localStorage.removeItem("juryzaName");
    }
    setIsAdminAuth(false);
    setLoginPassword("");
    toast.success("Signed out from Admin Console.");
  };

  const [syncingCloud, setSyncingCloud] = useState(false);
  const [importingFile, setImportingFile] = useState(false);
  const fileInputRef = useRef(null);

  const handleSyncCloud = async () => {
    setSyncingCloud(true);
    try {
      const synced = await syncCloudPortalState();
      setSubmissions(synced.submissions || []);
      setJudges(synced.judges || []);
      toast.success(
        `Synchronized with Google Drive & Cloud! Active: ${synced.submissions?.length || 0} teams, ${
          synced.judges?.length || 0
        } judges.`
      );
    } catch (err) {
      toast.error("Cloud sync note: " + (err.message || "Failed to sync."));
    } finally {
      setSyncingCloud(false);
    }
  };

  const handleImportFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setImportingFile(true);
      const res = await importSubmissionsFromFile(file);
      setSubmissions(res.submissions);
      toast.success(`Successfully imported ${res.count} teams from spreadsheet!`);
    } catch (err) {
      toast.error("Import error: " + (err.message || "Failed to parse file."));
    } finally {
      setImportingFile(false);
      if (e.target) e.target.value = "";
    }
  };

  const hydrateSubmissionMediaBlobs = (list = []) => {
    for (const s of list) {
      if (!s?.teamId) continue;
      getMediaBlobUrl(`doc_${s.teamId}`).then((url) => {
        if (url) {
          setSubmissions((prev) =>
            prev.map((sub) =>
              sub.teamId === s.teamId
                ? { ...sub, docBlobUrl: url, _blobsVerified: true }
                : sub,
            ),
          );
          setPreviewingSubmission((prev) =>
            prev && prev.teamId === s.teamId
              ? { ...prev, docBlobUrl: url, _blobsVerified: true }
              : prev,
          );
        }
      });
      getMediaBlobUrl(`video_${s.teamId}`).then((url) => {
        if (url) {
          setSubmissions((prev) =>
            prev.map((sub) =>
              sub.teamId === s.teamId
                ? { ...sub, videoBlobUrl: url, _blobsVerified: true }
                : sub,
            ),
          );
          setPreviewingSubmission((prev) =>
            prev && prev.teamId === s.teamId
              ? { ...prev, videoBlobUrl: url, _blobsVerified: true }
              : prev,
          );
        }
      });
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const [subRes, judgeRes] = await Promise.all([
        api.get("/api/v2/submissions"),
        api.get("/api/v2/admin/judges"),
      ]);

      const rawSubs = Array.isArray(subRes.data) ? subRes.data : [];
      const judgeList = Array.isArray(judgeRes.data) ? judgeRes.data : [];
      const cleanBackendSubs = rawSubs.map(sanitizeSubmissionForStorage);

      const synced = await syncCloudPortalState().catch(() => null);
      const cloudSubs = synced?.submissions || [];
      const mergedSubs = mergeSubmissions(
        getStoredSubmissions().map(sanitizeSubmissionForStorage),
        mergeSubmissions(cloudSubs, cleanBackendSubs),
      );
      const mergedJudges = judgeList.length > 0 ? judgeList : synced?.judges || [];

      setSubmissions(mergedSubs);
      setJudges(mergedJudges);

      saveStoredSubmissions(mergedSubs);
      if (mergedJudges.length > 0) {
        const otherUsers = getStoredUsers().filter((u) => u.role !== "judge");
        saveStoredUsers([...otherUsers, ...mergedJudges]);
      }
      hydrateSubmissionMediaBlobs(mergedSubs);
    } catch (err) {
      console.warn("Backend API unreachable, synchronizing with cloud state:", err.message);
      const synced = await syncCloudPortalState();
      const activeSubs = mergeSubmissions(
        getStoredSubmissions().map(sanitizeSubmissionForStorage),
        synced.submissions || [],
      );
      const activeJudges = synced.judges || [];
      setSubmissions(activeSubs);
      setJudges(activeJudges);
      hydrateSubmissionMediaBlobs(activeSubs);
    } finally {
      setLoading(false);
    }
  };

  // Status Change (Admin Exclusive: manages Round 1/2/3 transitions and Selected/Not Selected)
  const handleStageChange = async (teamId, newStage) => {
    try {
      await api.patch(`/api/v2/submissions/${teamId}/status`, { stage: newStage });
      toast.success(`Submission status updated to '${newStage}'!`);
    } catch {
      console.warn("API unavailable, updating locally...");
      toast.success(`Submission status updated to '${newStage}'.`);
    }

    const updatedSub = updateStoredSubmissionStage(teamId, newStage);
    const syncedSubs = getStoredSubmissions();
    const syncedJudges = getStoredUsers().filter((u) => u.role === "judge");
    if (syncedSubs.length > 0) {
      setSubmissions(syncedSubs);
    } else if (updatedSub) {
      setSubmissions((prev) =>
        prev.map((s) => (s.teamId === teamId ? { ...s, ...updatedSub, stage: newStage } : s)),
      );
    }
    if (syncedJudges.length > 0) {
      setJudges(syncedJudges);
    }
  };

  // Round-Wise Judge Allocation (Supports single dropdown or panel array per round)
  const handleAllocateRound = async (teamId, roundKey, judgeEmailOrEmails) => {
    const rawArr = Array.isArray(judgeEmailOrEmails)
      ? judgeEmailOrEmails
      : [judgeEmailOrEmails];
    const cleanEmails = Array.from(
      new Set(
        rawArr
          .map((e) => String(e || "").toLowerCase().trim())
          .filter((e) => Boolean(e) && e !== "unallocated"),
      ),
    );
    const isUnallocating = cleanEmails.length === 0;
    const roundLabel =
      roundKey === "round3" ? "Round 3" : roundKey === "round2" ? "Round 2" : "Round 1";

    try {
      setAllocating(true);
      await api.post("/api/v2/admin/allocate", {
        teamId,
        round: roundKey,
        judgeEmail: cleanEmails[0] || "",
        judgeEmails: cleanEmails,
      });
      if (isUnallocating) {
        toast.success(`${roundLabel} judge cleared for team ${teamId}.`);
      } else {
        toast.success(`${roundLabel} judge assignment updated!`);
      }
    } catch {
      console.warn("API unavailable, allocating locally...");
      toast.success(
        isUnallocating
          ? `${roundLabel} judge cleared.`
          : `${roundLabel} judge assignment updated!`,
      );
    }

    const res = allocateStoredSubmission(teamId, cleanEmails, roundKey);
    if (res?.subs) {
      setSubmissions([...res.subs]);
    }
    if (res?.users) {
      setJudges([...res.users.filter((u) => u.role === "judge")]);
    }

    setAllocating(false);
  };

  const handleOpenPanelAllocation = (sub) => {
    setRoundAllocationForm({
      round1: getAllocatedJudgesForRound(sub, 1),
      round2: getAllocatedJudgesForRound(sub, 2),
      round3: getAllocatedJudgesForRound(sub, 3),
    });
    setAllocatingTeamModal(sub);
  };

  const handleToggleRoundPanelJudge = (roundKey, judgeEmail) => {
    const cleanEmail = (judgeEmail || "").toLowerCase().trim();
    if (!cleanEmail) return;
    setRoundAllocationForm((prev) => {
      const current = Array.isArray(prev[roundKey]) ? prev[roundKey] : [];
      const exists = current.includes(cleanEmail);
      return {
        ...prev,
        [roundKey]: exists
          ? current.filter((e) => e !== cleanEmail)
          : [...current, cleanEmail],
      };
    });
  };

  const handleSavePanelAllocation = async (e) => {
    e.preventDefault();
    if (!allocatingTeamModal) return;
    setAllocating(true);
    try {
      await api.post("/api/v2/admin/allocate", {
        teamId: allocatingTeamModal.teamId,
        roundAllocations: roundAllocationForm,
      });
    } catch {
      console.warn("API unavailable, saving round-wise allocations locally...");
    }

    const res = saveStoredRoundAllocations(allocatingTeamModal.teamId, roundAllocationForm);
    if (res?.subs) setSubmissions([...res.subs]);
    if (res?.users) setJudges([...res.users.filter((u) => u.role === "judge")]);
    toast.success(`Round-wise judge panel saved for ${allocatingTeamModal.teamName}!`);
    setAllocatingTeamModal(null);
    setAllocating(false);
  };

  // Automated Round-Robin Allocation for Selected Target Round
  const handleAutoAllocate = async () => {
    if (judges.length === 0) {
      toast.error("No judges available in roster to allocate teams!");
      return;
    }
    const targetLabel =
      autoAllocateRound === "round3"
        ? "Round 3"
        : autoAllocateRound === "round2"
          ? "Round 2"
          : "Round 1";

    try {
      await api.post("/api/v2/admin/allocate", {
        mode: "auto",
        round: autoAllocateRound,
      });
    } catch {
      console.warn("API unavailable, auto-allocating locally...");
    }

    const res = autoAllocateStoredSubmissions(autoAllocateRound);
    if (!res?.success || res.allocatedCount === 0) {
      toast.error(res?.message || `No teams found in ${targetLabel} to allocate.`);
      return;
    }
    if (res?.subs) {
      setSubmissions([...res.subs]);
    }
    if (res?.users) {
      setJudges([...res.users.filter((u) => u.role === "judge")]);
    }
    toast.success(
      `Allocated ${res.allocatedCount} ${targetLabel} teams evenly across ${judges.length} judges!`,
    );
  };

  // Create Judge Action
  const handleCreateJudgeSubmit = async (e) => {
    e.preventDefault();
    if (!judgeFormName.trim() || !judgeFormEmail.trim() || !judgeFormPassword) {
      toast.error("Name, Gmail ID, and temporary password are required.");
      return;
    }

    setCreatingJudge(true);
    setJudgeCreationSuccess(null);

    const payload = {
      name: judgeFormName.trim(),
      email: judgeFormEmail.toLowerCase().trim(),
      password: judgeFormPassword,
      organization: judgeFormOrg.trim() || "SDMIMD Panel",
      specialization: judgeFormTrack,
    };

    try {
      let createdJudge = null;
      try {
        const res = await api.post("/api/v2/admin/create-judge", payload);
        createdJudge = res.data?.judge;
      } catch (apiErr) {
        // Fallback to local storage
        const localRes = await clientCreateJudge(payload);
        createdJudge = localRes.judge;
      }

      if (createdJudge) {
        setJudges((prev) => {
          const filtered = prev.filter((j) => j.email !== createdJudge.email);
          return [...filtered, createdJudge];
        });

        setJudgeCreationSuccess({
          email: createdJudge.email,
          password: judgeFormPassword,
          name: createdJudge.name,
        });

        toast.success(`Judge account generated for ${createdJudge.name}!`);
        // Reset form
        setJudgeFormName("");
        setJudgeFormEmail("");
        setJudgeFormPassword("");
      }
    } catch (err) {
      toast.error(err.message || "Failed to generate judge account.");
    } finally {
      setCreatingJudge(false);
    }
  };

  const handleDownloadCsv = () => {
    exportClientSpreadsheetCsv();
    toast.success("Master Spreadsheet CSV downloaded!");
  };

  const handleDownloadXlsx = () => {
    exportClientSpreadsheetXlsx();
    toast.success("Master Spreadsheet Excel (XLSX) downloaded!");
  };

  // Delete a single submission
  const handleDeleteSubmission = async (teamId, teamName) => {
    if (
      !window.confirm(
        `Are you sure you want to delete team "${teamName}" (${teamId})? This will remove the submission and its records.`
      )
    ) {
      return;
    }
    try {
      await api.delete(`/api/v2/admin/submissions/${teamId}`);
    } catch {
      console.warn("Backend unavailable, deleting locally...");
    }
    deleteStoredSubmission(teamId);
    setSubmissions((prev) => prev.filter((s) => s.teamId !== teamId));
    toast.success(`Team "${teamName}" deleted.`);
  };

  const getTeamPassword = (sub) => {
    if (sub.plainPassword) return sub.plainPassword;
    const clean = (sub.participantEmail || "").toLowerCase().trim();
    const users = getStoredUsers();
    const u = users.find((user) => (user.email || "").toLowerCase() === clean);
    return u?.plainPassword || "";
  };

  const getJudgePassword = (judge) => {
    if (judge.plainPassword) return judge.plainPassword;
    const clean = (judge.email || "").toLowerCase().trim();
    const users = getStoredUsers();
    const u = users.find((user) => (user.email || "").toLowerCase() === clean);
    return u?.plainPassword || "";
  };

  // Open Edit Submission Modal
  const handleEditSubmissionOpen = (sub) => {
    const leader = sub.members?.find((m) => m.isLeader) || sub.members?.[0] || {};
    setSubmissionEditForm({
      teamId: sub.teamId,
      teamName: sub.teamName || "",
      category: sub.category || "students",
      theme: sub.theme || sub.thematicArea || "",
      solutionName: sub.solutionName || "",
      shortDescription: sub.shortDescription || "",
      detailedProposal: sub.detailedProposal || sub.shortDescription || "",
      leadName: leader.name || sub.leadName || "",
      leadEmail: leader.email || sub.participantEmail || "",
      leadPhone: leader.phone || sub.leadPhone || "",
      institution: sub.institution || leader.college || sub.organizationDetails?.institution || "",
      stage: sub.stage || "submitted",
      rubricAverage: sub.rubricAverage ?? 0,
      password: getTeamPassword(sub),
      videoFileName: sub.video?.originalName || "",
      videoUrl: sub.video?.url || sub.video?.webViewLink || "",
      documentFileName: sub.document?.name || sub.document?.originalName || "",
      documentUrl: sub.document?.url || sub.document?.webViewLink || "",
      allotedJudge: getActiveAllocatedJudges(sub)[0] || "",
      roundAllocations: {
        round1: getAllocatedJudgesForRound(sub, 1),
        round2: getAllocatedJudgesForRound(sub, 2),
        round3: getAllocatedJudgesForRound(sub, 3),
      },
      createdAt: sub.createdAt ? new Date(sub.createdAt).toISOString().split("T")[0] : "",
    });
    setEditingSubmission(sub);
  };

  // Save Submission Edits
  const handleSaveSubmissionEdit = async (e) => {
    e.preventDefault();
    if (!submissionEditForm.teamName.trim()) {
      toast.error("Team name is required.");
      return;
    }
    setEditLoading(true);
    try {
      try {
        await api.put(`/api/v2/admin/submissions/${submissionEditForm.teamId}`, submissionEditForm);
      } catch {
        console.warn("Backend unavailable, saving locally...");
      }
      const updated = await updateStoredSubmissionDetails(submissionEditForm.teamId, submissionEditForm);
      setSubmissions((prev) =>
        prev.map((s) => (s.teamId === submissionEditForm.teamId ? { ...s, ...updated } : s))
      );
      setJudges(getStoredUsers().filter((u) => u.role === "judge"));
      toast.success(`Team "${submissionEditForm.teamName}" updated successfully!`);
      setEditingSubmission(null);
    } catch (err) {
      toast.error(err.message || "Failed to update submission.");
    } finally {
      setEditLoading(false);
    }
  };

  // Open Edit Judge Modal
  const handleEditJudgeOpen = (judge) => {
    const jEmail = (judge.email || "").toLowerCase().trim();
    const currentAlloted = (judge.allotedTeams && judge.allotedTeams.length > 0)
      ? judge.allotedTeams
      : submissions
          .filter((s) => Array.isArray(s.allotedJudges) && s.allotedJudges.map(e => e.toLowerCase()).includes(jEmail))
          .map((s) => s.teamId);

    setJudgeEditForm({
      originalEmail: judge.email,
      name: judge.name || "",
      email: judge.email || "",
      organization: judge.organization || "SDMIMD Panel",
      specialization: judge.specialization || "All Tracks",
      password: getJudgePassword(judge),
      allotedTeams: currentAlloted,
      createdAt: judge.createdAt ? new Date(judge.createdAt).toISOString().split("T")[0] : "",
    });
    setEditingJudge(judge);
  };

  // Save Judge Edits
  const handleSaveJudgeEdit = async (e) => {
    e.preventDefault();
    if (!judgeEditForm.name.trim() || !judgeEditForm.email.trim()) {
      toast.error("Judge name and email are required.");
      return;
    }
    setEditLoading(true);
    try {
      try {
        await api.put(
          `/api/v2/admin/judges/${encodeURIComponent(judgeEditForm.originalEmail)}`,
          judgeEditForm
        );
      } catch {
        console.warn("Backend unavailable, saving locally...");
      }
      const updated = await updateStoredJudgeDetails(judgeEditForm.originalEmail, judgeEditForm);
      setJudges((prev) =>
        prev.map((j) => (j.email === judgeEditForm.originalEmail ? { ...j, ...updated } : j))
      );
      setSubmissions(getStoredSubmissions());
      toast.success(`Judge "${judgeEditForm.name}" updated successfully!`);
      setEditingJudge(null);
    } catch (err) {
      toast.error(err.message || "Failed to update judge.");
    } finally {
      setEditLoading(false);
    }
  };

  // Delete Judge
  const handleDeleteJudge = async (judgeEmail, judgeName) => {
    if (
      !window.confirm(
        `Are you sure you want to delete judge "${judgeName}" (${judgeEmail})? This will revoke their account and free their alloted teams.`
      )
    ) {
      return;
    }
    try {
      await api.delete(`/api/v2/admin/judges/${encodeURIComponent(judgeEmail)}`);
    } catch {
      console.warn("Backend unavailable, deleting locally...");
    }
    deleteStoredJudge(judgeEmail);
    setJudges((prev) => prev.filter((j) => (j.email || "").toLowerCase() !== judgeEmail.toLowerCase()));
    setSubmissions((prev) =>
      prev.map((s) => {
        if (Array.isArray(s.allotedJudges) && s.allotedJudges.includes(judgeEmail)) {
          return {
            ...s,
            allotedJudges: s.allotedJudges.filter((e) => e !== judgeEmail),
            stage: s.stage === "allocated to a judge" ? "submitted" : s.stage,
          };
        }
        return s;
      })
    );
    toast.success(`Judge "${judgeName}" deleted.`);
  };

  // Purge all portal data (teams & judges) and Google Drive files/sheets
  const handlePurgeAll = async () => {
    const confirmation = window.prompt(
      'DANGER: You are about to DELETE ALL teams, judges, Google Sheet entries, and uploaded files from the portal AND Google Drive.\n\nType "RESET" to confirm and proceed:'
    );
    if (confirmation !== "RESET") {
      if (confirmation !== null) {
        toast.error('Reset cancelled: You must type "RESET" exactly.');
      }
      return;
    }

    const resetToast = toast.loading("Purging portal data and cleaning Google Drive...");

    try {
      await api.post("/api/v2/admin/purge-all");
    } catch {
      console.warn("Backend unavailable, purging resilient client data and Drive...");
    }

    await clearAllPortalData();
    setSubmissions([]);
    setJudges([]);
    toast.dismiss(resetToast);
    toast.success("All teams, judges, Google Sheet rows, and Google Drive files have been deleted.");
  };

  const getDocHref = (sub) => {
    const { document: doc } = resolveSubmissionMedia(sub, api.defaults.baseURL);
    return doc.directUrl || doc.embedUrl || doc.downloadUrl || "";
  };

  const getVideoHref = (sub) => {
    const { video: vid } = resolveSubmissionMedia(sub, api.defaults.baseURL);
    return vid.directUrl || vid.embedUrl || vid.downloadUrl || "";
  };

  // Render Login Card if not authenticated as Admin
  if (!isAdminAuth) {
    return (
      <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] dm-sans selection:bg-[var(--accent)] selection:text-white flex flex-col">
        {/* Top Header */}
        <header className="border-b border-[var(--border)] bg-[var(--surface)]/80 backdrop-blur-md sticky top-0 z-40">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
            <Link
              to="/"
              className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-[var(--muted)] hover:text-[var(--text)] transition"
            >
              <FiArrowLeft className="h-4 w-4" />
              <span>Back to Site</span>
            </Link>
            <ThemeToggle size="sm" />
          </div>
        </header>

        {/* Center Container */}
        <main className="flex-1 flex items-center justify-center px-4 py-12 sm:px-6">
          <div className="w-full max-w-md rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 sm:p-8 shadow-xl">
            <div className="text-center mb-6">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 mb-3">
                <FiShield className="h-6 w-6" />
              </div>
              <h1 className="text-xl font-bold text-[var(--text)]">
                Admin Console
              </h1>
            </div>

            {loginError && (
              <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-red-500/30 bg-red-500/10 p-3.5 text-xs text-red-600 dark:text-red-400">
                <FiAlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span className="font-semibold leading-relaxed">{loginError}</span>
              </div>
            )}

            <form onSubmit={handleAdminLogin} className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-xs font-semibold text-[var(--text)]">
                    Authorized Admin Email ID
                  </label>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                    Fixed ID
                  </span>
                </div>
                <div className="relative">
                  <FiMail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-emerald-600 dark:text-emerald-400 h-4 w-4" />
                  <input
                    type="email"
                    readOnly
                    value={ADMIN_EMAIL}
                    className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-2)]/60 pl-10 pr-3.5 py-2.5 text-sm text-[var(--text)] font-mono font-medium cursor-not-allowed select-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text)] mb-1.5">
                  Admin Password
                </label>
                <div className="relative">
                  <FiLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--muted)] h-4 w-4" />
                  <input
                    type={showLoginPassword ? "text" : "password"}
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="Enter admin password"
                    className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-2)] pl-10 pr-10 py-2.5 text-sm text-[var(--text)] placeholder-[var(--muted)] focus:border-emerald-500 focus:outline-none transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword((prev) => !prev)}
                    tabIndex={-1}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--muted)] hover:text-[var(--text)] transition cursor-pointer"
                  >
                    {showLoginPassword ? <FiEyeOff className="h-4 w-4" /> : <FiEye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loginLoading}
                className="w-full mt-2 inline-flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold text-white shadow-md bg-emerald-600 hover:bg-emerald-700 transition-all duration-200 cursor-pointer disabled:opacity-60"
              >
                {loginLoading ? <span>Authenticating Admin...</span> : (
                  <>
                    <span>Authenticate Admin Console</span>
                    <FiArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg)] text-[var(--text)] dm-sans selection:bg-[var(--accent)] selection:text-white">
      {/* Top Header */}
      <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-[var(--surface)]/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-[var(--muted)] hover:text-[var(--text)] transition"
            >
              <FiArrowLeft className="h-4 w-4" />
              <span>Back to Site</span>
            </Link>
            <span className="text-[var(--border)]">|</span>
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded-full bg-emerald-600 flex items-center justify-center text-white text-xs">
                <FiShield className="h-3.5 w-3.5" />
              </div>
              <span className="text-xs sm:text-sm font-bold text-[var(--text)]">
                Admin Console • Vision Mysuru 2050
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="https://drive.google.com/drive/folders/1UKXUmqcMewEhw_KG7L1Fe740yCd6fX2e"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] text-xs font-semibold text-[var(--primary)] hover:border-[var(--primary)] transition cursor-pointer"
            >
              <FiFolder className="h-3.5 w-3.5" />
              <span>Drive Folder</span>
              <FiExternalLink className="h-3 w-3" />
            </a>

            <a
              href={getMasterSpreadsheetUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 transition cursor-pointer"
              title="Open the permanent Master Google Sheet in Google Drive"
            >
              <FiFileText className="h-3.5 w-3.5 text-emerald-500" />
              <span>Live Master Sheet</span>
              <FiExternalLink className="h-3 w-3" />
            </a>

            <button
              type="button"
              onClick={handleDownloadXlsx}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] text-xs font-semibold text-[var(--accent)] hover:border-[var(--accent)] transition cursor-pointer"
              title="Download Master Spreadsheet as Excel (.xlsx)"
            >
              <FiDownload className="h-3.5 w-3.5 text-[var(--accent)]" />
              <span>Export XLSX</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadCsv}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] text-xs font-semibold text-[var(--text)] hover:border-[var(--accent)] transition cursor-pointer"
              title="Download Master Spreadsheet as CSV"
            >
              <FiDownload className="h-3.5 w-3.5 text-[var(--muted)]" />
              <span>Export CSV</span>
            </button>

            <input
              type="file"
              ref={fileInputRef}
              accept=".xlsx,.csv"
              onChange={handleImportFile}
              className="hidden"
            />

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={importingFile}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-sky-500/30 bg-sky-500/10 text-sky-600 dark:text-sky-400 text-xs font-semibold hover:bg-sky-500/20 transition cursor-pointer disabled:opacity-60"
              title="Upload VisionMysuru_2050_Edition2_MasterData.xlsx or .csv from Google Drive"
            >
              <FiUpload className={`h-3.5 w-3.5 ${importingFile ? "animate-bounce" : ""}`} />
              <span className="hidden sm:inline">{importingFile ? "Importing..." : "Import Sheet from Drive"}</span>
              <span className="sm:hidden">{importingFile ? "..." : "Import"}</span>
            </button>

            <button
              type="button"
              onClick={handleSyncCloud}
              disabled={syncingCloud}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-semibold hover:bg-emerald-500/20 transition cursor-pointer disabled:opacity-60"
              title="Synchronize all teams, judges, and passwords across multiple devices"
            >
              <FiRefreshCw className={`h-3.5 w-3.5 ${syncingCloud ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">{syncingCloud ? "Syncing..." : "Sync Multi-Device"}</span>
              <span className="sm:hidden">{syncingCloud ? "..." : "Sync"}</span>
            </button>

            <button
              type="button"
              onClick={fetchData}
              className="p-2 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] text-[var(--muted)] hover:text-[var(--text)] transition cursor-pointer"
              title="Refresh master data"
            >
              <FiRefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </button>

            <button
              type="button"
              onClick={handlePurgeAll}
              className="hidden lg:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-600/10 hover:bg-red-600/20 text-red-600 dark:text-red-400 text-xs font-bold transition cursor-pointer border border-red-500/20"
              title="Purge all teams, judges, and media files from portal"
            >
              <FiTrash2 className="h-3.5 w-3.5" />
              <span>Reset Portal</span>
            </button>

            <ThemeToggle size="sm" />

            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 text-xs font-bold transition cursor-pointer border border-red-500/20"
            >
              <FiLogOut className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 space-y-8">
        {/* Metric Cards Banner */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">
              Total Submissions
            </span>
            <div className="oswald text-2xl sm:text-3xl font-extrabold text-[var(--text)] mt-1">
              {submissions.length}
            </div>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-1 block font-medium">
              Live & Synced
            </span>
          </div>

          <div className="p-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">
              Registered Judges
            </span>
            <div className="oswald text-2xl sm:text-3xl font-extrabold text-[var(--primary)] mt-1">
              {judges.length}
            </div>
            <span className="text-[10px] text-[var(--muted)] mt-1 block">
              Active on Jury panel
            </span>
          </div>

          <div className="p-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">
              Rounds in Progress
            </span>
            <div className="oswald text-2xl sm:text-3xl font-extrabold text-[var(--accent)] mt-1">
              {submissions.filter((s) => {
                const st = (s.stage || "").toLowerCase();
                return st.includes("round") || st === "submitted" || st.includes("allocated") || st.includes("evaluation");
              }).length}
            </div>
            <span className="text-[10px] text-[var(--muted)] mt-1 block">
              Round 1 • Round 2 • Round 3
            </span>
          </div>

          <div className="p-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">
              Selected / Not Selected
            </span>
            <div className="oswald text-2xl sm:text-3xl font-extrabold text-amber-500 mt-1">
              {submissions.filter((s) => {
                const st = (s.stage || "").toLowerCase();
                return (st.includes("selected") && !st.includes("not")) || (st.includes("shortlisted") && !st.includes("not"));
              }).length}
              <span className="text-sm font-normal text-[var(--muted)]">
                {" "}/ {submissions.filter((s) => {
                  const st = (s.stage || "").toLowerCase();
                  return st.includes("not selected") || st.includes("not shortlisted");
                }).length}
              </span>
            </div>
            <span className="text-[10px] text-amber-600 dark:text-amber-400 mt-1 block font-medium">
              Selected / Not Selected
            </span>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-[var(--border)] gap-6">
          <button
            type="button"
            onClick={() => setActiveTab("submissions")}
            className={`pb-3 text-xs sm:text-sm font-bold border-b-2 transition cursor-pointer ${
              activeTab === "submissions"
                ? "border-[var(--primary)] text-[var(--text)]"
                : "border-transparent text-[var(--muted)] hover:text-[var(--text)]"
            }`}
          >
            Master Submissions Table ({submissions.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("judges")}
            className={`pb-3 text-xs sm:text-sm font-bold border-b-2 transition cursor-pointer ${
              activeTab === "judges"
                ? "border-[var(--primary)] text-[var(--text)]"
                : "border-transparent text-[var(--muted)] hover:text-[var(--text)]"
            }`}
          >
            Judges Roster & Generation ({judges.length})
          </button>
        </div>

        {/* Tab 1: Master Submissions Table */}
        {activeTab === "submissions" ? (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-sm text-[var(--text)]">Team Submissions & Round-Wise Judge Allocation</h3>
                <p className="text-xs text-[var(--muted)]">Assign different judges per round (R1, R2, R3), inspect media, and manage round progression.</p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={autoAllocateRound}
                  onChange={(e) => setAutoAllocateRound(e.target.value)}
                  className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-xs font-bold text-[var(--text)] focus:border-[var(--accent)] focus:outline-none cursor-pointer"
                  aria-label="Target Round for Auto-Allocation"
                >
                  <option value="round1">For Round 1</option>
                  <option value="round2">For Round 2</option>
                  <option value="round3">For Round 3</option>
                </select>
                <button
                  type="button"
                  onClick={handleAutoAllocate}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-white text-xs font-bold shadow-md hover:brightness-110 transition cursor-pointer"
                >
                  <FiUserCheck className="h-3.5 w-3.5" />
                  <span>Auto-Allocate Round</span>
                </button>
              </div>
            </div>

            <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] shadow-md overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[var(--surface-2)] text-[var(--muted)] uppercase tracking-wider text-[10px] border-b border-[var(--border)]">
                    <tr>
                      <th className="px-4 py-3">Team Details</th>
                      <th className="px-4 py-3">Focus Area & Leader</th>
                      <th className="px-4 py-3">Compulsory Files</th>
                      <th className="px-4 py-3">Round-Wise Judges (R1 / R2 / R3)</th>
                      <th className="px-4 py-3">Submission Stage</th>
                      <th className="px-4 py-3">Score</th>
                      <th className="px-4 py-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)]">
                    {submissions.length === 0 && (
                      <tr>
                        <td colSpan={7} className="text-center py-12 text-[var(--muted)]">
                          No team submissions registered yet.
                        </td>
                      </tr>
                    )}
                    {submissions.map((sub) => {
                      const activeRoundNum = normalizeRoundNumber(sub.stage);
                      const r1Judges = getAllocatedJudgesForRound(sub, 1);
                      const r2Judges = getAllocatedJudgesForRound(sub, 2);
                      const r3Judges = getAllocatedJudgesForRound(sub, 3);
                      const leader = sub.members?.find((m) => m.isLeader) || sub.members?.[0] || {};
                      const leaderName = leader.name || sub.leadName || sub.leaderName || sub.teamLeadName || "Team Leader";
                      const leaderEmail = leader.email || sub.leadEmail || sub.participantEmail || sub.teamLeadEmail || "N/A";
                      const focusArea = sub.theme || sub.thematicArea || "Focus Area";
                      const resolvedMedia = resolveSubmissionMedia(sub, api.defaults.baseURL);
                      const hasSubVideo = resolvedMedia.video.hasVideo;
                      const hasSubDoc = resolvedMedia.document.hasDoc;
                      const videoName = resolvedMedia.video.fileName;
                      const docName = resolvedMedia.document.fileName;
                      const videoHref = resolvedMedia.video.directUrl || resolvedMedia.video.embedUrl;
                      const docHref = resolvedMedia.document.directUrl || resolvedMedia.document.embedUrl;

                      return (
                        <tr key={sub.teamId} className="hover:bg-[var(--surface-2)]/50 transition">
                          {/* Team Info */}
                          <td className="px-4 py-3.5">
                            <div className="font-bold text-[var(--text)] text-sm">
                              {sub.teamName}
                            </div>
                            <span className="font-mono text-[10px] text-[var(--muted)]">
                              ID: {sub.teamId}
                            </span>
                            <div className="text-[11px] text-[var(--muted)] mt-0.5 line-clamp-1">
                              {sub.solutionName}
                            </div>
                          </td>

                          {/* Focus Area & Team Leader & Password */}
                          <td className="px-4 py-3.5">
                            <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-[var(--accent)] border border-amber-500/30">
                              {focusArea}
                            </span>
                            <div className="text-[11px] text-[var(--text)] font-medium mt-1">
                              {leaderName}
                            </div>
                            <div className="text-[10px] text-[var(--muted)] font-mono">
                              {leaderEmail}
                            </div>
                            <div className="mt-1 flex items-center gap-1.5 text-[10px]">
                              <FiKey className="h-3 w-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
                              <span className="font-mono text-[var(--muted)]">PW:</span>
                              <span className="font-mono font-bold text-[var(--text)]">
                                {showTeamPasswords[sub.teamId]
                                  ? getTeamPassword(sub) || "None set"
                                  : "••••••••"}
                              </span>
                              <button
                                type="button"
                                onClick={() =>
                                  setShowTeamPasswords((prev) => ({
                                    ...prev,
                                    [sub.teamId]: !prev[sub.teamId],
                                  }))
                                }
                                className="text-[var(--muted)] hover:text-[var(--text)] ml-0.5 cursor-pointer"
                                title={showTeamPasswords[sub.teamId] ? "Hide password" : "Show password"}
                              >
                                {showTeamPasswords[sub.teamId] ? (
                                  <FiEyeOff className="h-3 w-3" />
                                ) : (
                                  <FiEye className="h-3 w-3" />
                                )}
                              </button>
                            </div>
                          </td>

                          {/* Media Uploads */}
                          <td className="px-4 py-3.5 space-y-1.5">
                            {hasSubVideo ? (
                              <div className="flex items-center gap-1.5 text-[11px]">
                                <FiVideo className="h-3 w-3 text-red-500 shrink-0" />
                                <a
                                  href={videoHref}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="truncate max-w-[130px] text-[var(--primary)] font-semibold hover:underline inline-flex items-center gap-1"
                                  title={`Open Video: ${videoName}`}
                                >
                                  <span className="truncate">{videoName}</span>
                                  <FiExternalLink className="h-2.5 w-2.5 shrink-0" />
                                </a>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1.5 text-[11px] text-[var(--muted)]">
                                <FiVideo className="h-3 w-3 shrink-0 opacity-40" />
                                <span className="italic">No video uploaded</span>
                              </div>
                            )}

                            {hasSubDoc ? (
                              <div className="flex items-center gap-1.5 text-[11px]">
                                <FiFileText className="h-3 w-3 text-amber-500 shrink-0" />
                                <a
                                  href={docHref}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="truncate max-w-[130px] text-[var(--accent)] font-semibold hover:underline inline-flex items-center gap-1"
                                  title={`Open PDF: ${docName}`}
                                >
                                  <span className="truncate">{docName}</span>
                                  <FiExternalLink className="h-2.5 w-2.5 shrink-0" />
                                </a>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1.5 text-[11px] text-[var(--muted)]">
                                <FiFileText className="h-3 w-3 shrink-0 opacity-40" />
                                <span className="italic">No PDF uploaded</span>
                              </div>
                            )}

                            {(hasSubVideo || hasSubDoc) && (
                              <button
                                type="button"
                                onClick={() => setPreviewingSubmission(sub)}
                                className="mt-1 inline-flex items-center gap-1 rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-2 py-1 text-[10px] font-bold text-[var(--text)] hover:border-[var(--primary)] hover:text-[var(--primary)] transition cursor-pointer"
                              >
                                <FiEye className="h-3 w-3" />
                                <span>Preview Media</span>
                              </button>
                            )}
                          </td>

                          {/* Round-Wise Judge Allocation Controls */}
                          <td className="px-4 py-3.5">
                            <div className="space-y-1.5 min-w-[205px]">
                              {[
                                { key: "round1", num: 1, label: "R1", list: r1Judges },
                                { key: "round2", num: 2, label: "R2", list: r2Judges },
                                { key: "round3", num: 3, label: "R3", list: r3Judges },
                              ].map((rMeta) => {
                                const isActiveRound =
                                  activeRoundNum === rMeta.num &&
                                  !["Selected", "Not Selected"].includes(normalizeStageLabel(sub.stage));
                                const selectVal =
                                  rMeta.list.length > 1
                                    ? "__MULTI__"
                                    : rMeta.list[0] || "";
                                return (
                                  <div key={rMeta.key} className="flex items-center gap-1.5">
                                    <span
                                      className={`w-6 text-center rounded px-1 py-0.5 text-[10px] font-bold shrink-0 ${
                                        isActiveRound
                                          ? "bg-[var(--primary)] text-white"
                                          : "bg-[var(--surface-2)] text-[var(--muted)] border border-[var(--border)]"
                                      }`}
                                      title={isActiveRound ? `Active Round (${rMeta.label})` : `${rMeta.label} Allocation`}
                                    >
                                      {rMeta.label}
                                    </span>
                                    <select
                                      value={selectVal}
                                      disabled={allocating}
                                      onChange={(e) => {
                                        if (e.target.value !== "__MULTI__") {
                                          handleAllocateRound(sub.teamId, rMeta.key, e.target.value);
                                        }
                                      }}
                                      className="flex-1 min-w-0 rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-2 py-1 text-[11px] text-[var(--text)] focus:border-[var(--accent)] focus:outline-none transition cursor-pointer"
                                    >
                                      <option value="">Unallocated</option>
                                      {rMeta.list.length > 1 && (
                                        <option value="__MULTI__" disabled>
                                          {rMeta.list.length} Judges Assigned (Panel)
                                        </option>
                                      )}
                                      {judges.map((j) => (
                                        <option key={j.email} value={(j.email || "").toLowerCase().trim()}>
                                          {j.name}
                                        </option>
                                      ))}
                                    </select>
                                  </div>
                                );
                              })}
                              <button
                                type="button"
                                onClick={() => handleOpenPanelAllocation(sub)}
                                className="inline-flex items-center gap-1 text-[10px] font-bold text-[var(--primary)] hover:underline cursor-pointer"
                              >
                                <FiUsers className="h-3 w-3" />
                                <span>Manage Multi-Judge Panel</span>
                              </button>
                            </div>
                          </td>

                          {/* Stage Dropdown */}
                          <td className="px-4 py-3.5">
                            <select
                              value={(() => {
                                const st = sub.stage || "Round 1";
                                const s = st.toLowerCase();
                                if (s.includes("not selected") || s.includes("not shortlisted")) return "Not Selected";
                                if (s.includes("selected") || s.includes("shortlisted") || s.includes("winner")) return "Selected";
                                if (s.includes("round 3")) return "Round 3";
                                if (s.includes("round 2")) return "Round 2";
                                return "Round 1";
                              })()}
                              onChange={(e) => handleStageChange(sub.teamId, e.target.value)}
                              className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-2.5 py-1.5 text-xs font-semibold text-[var(--text)] focus:border-[var(--accent)] focus:outline-none transition cursor-pointer"
                            >
                              <option value="Round 1">Round 1</option>
                              <option value="Round 2">Round 2</option>
                              <option value="Round 3">Round 3</option>
                              <option value="Selected">Selected</option>
                              <option value="Not Selected">Not Selected</option>
                            </select>
                          </td>

                          {/* Score */}
                          <td className="px-4 py-3.5 font-mono font-bold text-[var(--text)]">
                            {typeof sub.rubricAverage === "number" && sub.rubricAverage > 0
                              ? `${sub.rubricAverage.toFixed(1)}/50`
                              : "Pending"}
                          </td>

                          {/* Action (Edit & Delete Submission) */}
                          <td className="px-4 py-3.5 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                type="button"
                                onClick={() => handleEditSubmissionOpen(sub)}
                                title="Edit Submission Details"
                                className="p-1.5 rounded-lg text-blue-500 hover:bg-blue-500/10 transition cursor-pointer"
                              >
                                <FiEdit2 className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteSubmission(sub.teamId, sub.teamName)}
                                title="Delete Submission"
                                className="p-1.5 rounded-lg text-red-500 hover:bg-red-500/10 transition cursor-pointer"
                              >
                                <FiTrash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          /* Tab 2: Registered Judges Roster */
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-sm text-[var(--text)]">Jury Evaluation Panel</h3>
                <p className="text-xs text-[var(--muted)]">Judges can log in at <span className="font-mono text-[var(--text)]">/jury</span> with the credentials generated below.</p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setShowAddJudgeModal(true);
                  setJudgeCreationSuccess(null);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[var(--primary)] text-white text-xs font-bold hover:bg-[var(--primary-hover)] transition cursor-pointer shadow-sm"
              >
                <FiPlus className="h-4 w-4" />
                <span>Generate Judge Account</span>
              </button>
            </div>

            {/* Judge Credentials Banner if just created */}
            {judgeCreationSuccess && (
              <div className="p-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <strong className="block text-sm font-bold">Judge Account Created Successfully!</strong>
                  <span className="mt-0.5 block">
                    Judge: <strong>{judgeCreationSuccess.name}</strong> • Email: <code className="bg-emerald-500/20 px-1.5 py-0.5 rounded font-mono">{judgeCreationSuccess.email}</code> • Password: <code className="bg-emerald-500/20 px-1.5 py-0.5 rounded font-mono">{judgeCreationSuccess.password}</code>
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setJudgeCreationSuccess(null)}
                  className="self-start sm:self-center px-3 py-1 rounded-lg bg-emerald-600 text-white font-bold text-xs"
                >
                  Dismiss
                </button>
              </div>
            )}

            <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] shadow-md overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[var(--surface-2)] text-[var(--muted)] uppercase tracking-wider text-[10px] border-b border-[var(--border)]">
                    <tr>
                      <th className="px-4 py-3">Judge Name</th>
                      <th className="px-4 py-3">Gmail / Email ID</th>
                      <th className="px-4 py-3">Password</th>
                      <th className="px-4 py-3">Organization</th>
                      <th className="px-4 py-3">Specialization Track</th>
                      <th className="px-4 py-3">Alloted Teams</th>
                      <th className="px-4 py-3">Registered Date</th>
                      <th className="px-4 py-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)]">
                    {judges.length === 0 && (
                      <tr>
                        <td colSpan={8} className="text-center py-12 text-[var(--muted)]">
                          No judges registered yet. Click &apos;Generate Judge Account&apos; above.
                        </td>
                      </tr>
                    )}
                    {judges.map((judge) => {
                      const jEmail = (judge.email || "").toLowerCase().trim();
                      const r1Count = submissions.filter((s) => getAllocatedJudgesForRound(s, 1).includes(jEmail)).length;
                      const r2Count = submissions.filter((s) => getAllocatedJudgesForRound(s, 2).includes(jEmail)).length;
                      const r3Count = submissions.filter((s) => getAllocatedJudgesForRound(s, 3).includes(jEmail)).length;
                      const allotedCount = submissions.filter((s) =>
                        getActiveAllocatedJudges(s).includes(jEmail),
                      ).length;

                      return (
                        <tr key={judge.email} className="hover:bg-[var(--surface-2)]/50 transition">
                          <td className="px-4 py-3.5 font-bold text-[var(--text)]">
                            {judge.name}
                          </td>
                          <td className="px-4 py-3.5 font-mono text-[var(--muted)]">
                            {judge.email}
                          </td>
                          {/* Account Password */}
                          <td className="px-4 py-3.5">
                            <div className="flex items-center gap-1.5 text-xs">
                              <span className="font-mono font-bold text-[var(--text)]">
                                {showJudgePasswords[judge.email]
                                  ? getJudgePassword(judge) || "None set"
                                  : "••••••••"}
                              </span>
                              <button
                                type="button"
                                onClick={() =>
                                  setShowJudgePasswords((prev) => ({
                                    ...prev,
                                    [judge.email]: !prev[judge.email],
                                  }))
                                }
                                className="text-[var(--muted)] hover:text-[var(--text)] cursor-pointer"
                                title={showJudgePasswords[judge.email] ? "Hide password" : "Show password"}
                              >
                                {showJudgePasswords[judge.email] ? (
                                  <FiEyeOff className="h-3 w-3" />
                                ) : (
                                  <FiEye className="h-3 w-3" />
                                )}
                              </button>
                            </div>
                          </td>
                          <td className="px-4 py-3.5 text-[var(--text)]">
                            {judge.organization || "SDMIMD Panel"}
                          </td>
                          <td className="px-4 py-3.5 text-[var(--primary)] font-semibold">
                            {judge.specialization || "All Tracks"}
                          </td>
                          <td className="px-4 py-3.5">
                            <div className="space-y-1">
                              <span className="font-bold text-xs font-mono bg-[var(--surface-2)] px-2 py-0.5 rounded border border-[var(--border)] inline-block">
                                {allotedCount} active {allotedCount === 1 ? "team" : "teams"}
                              </span>
                              <div className="flex items-center gap-1 text-[10px] font-mono text-[var(--muted)]">
                                <span>R1:{r1Count}</span>
                                <span>|</span>
                                <span>R2:{r2Count}</span>
                                <span>|</span>
                                <span>R3:{r3Count}</span>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3.5 text-[var(--muted)]">
                            {judge.createdAt
                              ? new Date(judge.createdAt).toLocaleDateString("en-IN")
                              : "Active"}
                          </td>
                          {/* Action (Edit & Delete Judge) */}
                          <td className="px-4 py-3.5 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                type="button"
                                onClick={() => handleEditJudgeOpen(judge)}
                                title="Edit Judge Details"
                                className="p-1.5 rounded-lg text-blue-500 hover:bg-blue-500/10 transition cursor-pointer"
                              >
                                <FiEdit2 className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteJudge(judge.email, judge.name)}
                                title="Delete Judge Account"
                                className="p-1.5 rounded-lg text-red-500 hover:bg-red-500/10 transition cursor-pointer"
                              >
                                <FiTrash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Add Judge Modal */}
      <AnimatePresence>
        {showAddJudgeModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 sm:p-8 shadow-2xl relative"
            >
              <button
                type="button"
                onClick={() => setShowAddJudgeModal(false)}
                className="absolute top-5 right-5 text-[var(--muted)] hover:text-[var(--text)] p-1 rounded-lg transition"
              >
                <FiX className="h-5 w-5" />
              </button>

              <div className="mb-6">
                <h3 className="text-lg font-bold text-[var(--text)] flex items-center gap-2">
                  <FiAward className="text-[var(--primary)]" />
                  <span>Generate Judge Login Account</span>
                </h3>
                <p className="text-xs text-[var(--muted)] mt-1">
                  Create credentials for an appointed jury member. The judge can immediately use these to sign in at <code className="bg-[var(--surface-2)] px-1.5 py-0.5 rounded font-mono">/jury</code>.
                </p>
              </div>

              <form onSubmit={handleCreateJudgeSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[var(--text)] mb-1">
                    Judge Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={judgeFormName}
                    onChange={(e) => setJudgeFormName(e.target.value)}
                    placeholder="e.g. Dr. A. Sharma"
                    className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-3.5 py-2 text-sm text-[var(--text)] placeholder-[var(--muted)] focus:border-[var(--primary)] focus:outline-none transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--text)] mb-1">
                    Gmail / Email ID (Judge Login)
                  </label>
                  <input
                    type="email"
                    required
                    value={judgeFormEmail}
                    onChange={(e) => setJudgeFormEmail(e.target.value)}
                    placeholder="judge.sharma@gmail.com"
                    className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-3.5 py-2 text-sm text-[var(--text)] placeholder-[var(--muted)] focus:border-[var(--primary)] focus:outline-none transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--text)] mb-1">
                    Temporary Password
                  </label>
                  <input
                    type="text"
                    required
                    value={judgeFormPassword}
                    onChange={(e) => setJudgeFormPassword(e.target.value)}
                    placeholder="e.g. Judge@2050"
                    className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-3.5 py-2 text-sm text-[var(--text)] font-mono placeholder-[var(--muted)] focus:border-[var(--primary)] focus:outline-none transition"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[var(--text)] mb-1">
                      Organization
                    </label>
                    <input
                      type="text"
                      value={judgeFormOrg}
                      onChange={(e) => setJudgeFormOrg(e.target.value)}
                      placeholder="e.g. SDMIMD / Tech Mahindra"
                      className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-3.5 py-2 text-sm text-[var(--text)] placeholder-[var(--muted)] focus:border-[var(--primary)] focus:outline-none transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[var(--text)] mb-1">
                      Specialization Track
                    </label>
                    <select
                      value={judgeFormTrack}
                      onChange={(e) => setJudgeFormTrack(e.target.value)}
                      className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-sm text-[var(--text)] focus:border-[var(--primary)] focus:outline-none transition"
                    >
                      <option value="All Tracks">All Tracks</option>
                      <option value="Environmental Sustainability">Environmental Sustainability</option>
                      <option value="Urban Infrastructure & Mobility">Urban Infrastructure & Mobility</option>
                      <option value="Heritage & Tourism">Heritage & Tourism</option>
                      <option value="Smart Governance & Digital Tech">Smart Governance & Digital Tech</option>
                      <option value="Healthcare & Wellbeing">Healthcare & Wellbeing</option>
                      <option value="Education & Skill Development">Education & Skill Development</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setShowAddJudgeModal(false)}
                    className="px-4 py-2 rounded-xl border border-[var(--border)] text-xs font-semibold text-[var(--muted)] hover:text-[var(--text)] transition cursor-pointer"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={creatingJudge}
                    className="px-5 py-2 rounded-xl bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white text-xs font-bold shadow-md transition cursor-pointer disabled:opacity-60"
                  >
                    {creatingJudge ? "Generating..." : "Save Judge Credentials"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* Edit Team Submission Modal */}
        {editingSubmission && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 sm:p-8 shadow-2xl relative space-y-5"
            >
              <button
                type="button"
                onClick={() => setEditingSubmission(null)}
                className="absolute top-5 right-5 text-[var(--muted)] hover:text-[var(--text)] p-1 rounded-lg transition cursor-pointer"
              >
                <FiX className="h-5 w-5" />
              </button>

              <div className="flex items-center gap-3 pb-3 border-b border-[var(--border)]">
                <div className="h-10 w-10 rounded-2xl bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <FiEdit2 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[var(--text)]">Edit Team Submission</h3>
                  <p className="text-xs text-[var(--muted)] font-mono">ID: {submissionEditForm.teamId}</p>
                </div>
              </div>

              <form onSubmit={handleSaveSubmissionEdit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[var(--text)] mb-1">
                      Team Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={submissionEditForm.teamName}
                      onChange={(e) =>
                        setSubmissionEditForm((prev) => ({ ...prev, teamName: e.target.value }))
                      }
                      className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-xs text-[var(--text)] focus:border-[var(--accent)] focus:outline-none transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[var(--text)] mb-1">
                      Category Track
                    </label>
                    <select
                      value={submissionEditForm.category}
                      onChange={(e) =>
                        setSubmissionEditForm((prev) => ({ ...prev, category: e.target.value }))
                      }
                      className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-xs text-[var(--text)] focus:border-[var(--accent)] focus:outline-none transition cursor-pointer"
                    >
                      <option value="students">Students</option>
                      <option value="citizens">Citizens</option>
                      <option value="corporates">Corporates</option>
                      <option value="ngos">NGOs</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[var(--text)] mb-1">
                      Theme / Focus Area
                    </label>
                    <input
                      type="text"
                      value={submissionEditForm.theme}
                      onChange={(e) =>
                        setSubmissionEditForm((prev) => ({ ...prev, theme: e.target.value }))
                      }
                      className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-xs text-[var(--text)] focus:border-[var(--accent)] focus:outline-none transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[var(--text)] mb-1">
                      Solution Name
                    </label>
                    <input
                      type="text"
                      value={submissionEditForm.solutionName}
                      onChange={(e) =>
                        setSubmissionEditForm((prev) => ({ ...prev, solutionName: e.target.value }))
                      }
                      className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-xs text-[var(--text)] focus:border-[var(--accent)] focus:outline-none transition"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[var(--text)] mb-1">
                      Team Leader Name
                    </label>
                    <input
                      type="text"
                      value={submissionEditForm.leadName}
                      onChange={(e) =>
                        setSubmissionEditForm((prev) => ({ ...prev, leadName: e.target.value }))
                      }
                      className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-xs text-[var(--text)] focus:border-[var(--accent)] focus:outline-none transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[var(--text)] mb-1">
                      Leader Gmail / Email
                    </label>
                    <input
                      type="email"
                      value={submissionEditForm.leadEmail}
                      onChange={(e) =>
                        setSubmissionEditForm((prev) => ({ ...prev, leadEmail: e.target.value }))
                      }
                      className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-xs text-[var(--text)] focus:border-[var(--accent)] focus:outline-none transition"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[var(--text)] mb-1">
                      Leader Contact Phone
                    </label>
                    <input
                      type="tel"
                      value={submissionEditForm.leadPhone}
                      onChange={(e) =>
                        setSubmissionEditForm((prev) => ({ ...prev, leadPhone: e.target.value }))
                      }
                      className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-xs text-[var(--text)] focus:border-[var(--accent)] focus:outline-none transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[var(--text)] mb-1">
                      College / Organization
                    </label>
                    <input
                      type="text"
                      value={submissionEditForm.institution}
                      onChange={(e) =>
                        setSubmissionEditForm((prev) => ({ ...prev, institution: e.target.value }))
                      }
                      className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-xs text-[var(--text)] focus:border-[var(--accent)] focus:outline-none transition"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Account Password */}
                  <div>
                    <label className="block text-xs font-semibold text-emerald-600 dark:text-emerald-400 mb-1 flex items-center gap-1">
                      <FiKey className="h-3 w-3" />
                      <span>Account Password</span>
                    </label>
                    <input
                      type="text"
                      value={submissionEditForm.password}
                      onChange={(e) =>
                        setSubmissionEditForm((prev) => ({ ...prev, password: e.target.value }))
                      }
                      placeholder="e.g. Pass@1234"
                      className="w-full rounded-xl border border-emerald-500/40 bg-[var(--surface-2)] px-3 py-2 text-xs font-mono font-bold text-[var(--text)] focus:border-emerald-500 focus:outline-none transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[var(--text)] mb-1">
                      Stage / Round
                    </label>
                    <select
                      value={(() => {
                        const st = submissionEditForm.stage || "Round 1";
                        const s = st.toLowerCase();
                        if (s.includes("not selected") || s.includes("not shortlisted")) return "Not Selected";
                        if (s.includes("selected") || s.includes("shortlisted") || s.includes("winner")) return "Selected";
                        if (s.includes("round 3")) return "Round 3";
                        if (s.includes("round 2")) return "Round 2";
                        return "Round 1";
                      })()}
                      onChange={(e) =>
                        setSubmissionEditForm((prev) => ({ ...prev, stage: e.target.value }))
                      }
                      className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-xs font-semibold text-[var(--text)] focus:border-[var(--accent)] focus:outline-none transition cursor-pointer"
                    >
                      <option value="Round 1">Round 1</option>
                      <option value="Round 2">Round 2</option>
                      <option value="Round 3">Round 3</option>
                      <option value="Selected">Selected</option>
                      <option value="Not Selected">Not Selected</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[var(--text)] mb-1">
                      Rubric Average (/50)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="50"
                      step="0.5"
                      value={submissionEditForm.rubricAverage}
                      onChange={(e) =>
                        setSubmissionEditForm((prev) => ({
                          ...prev,
                          rubricAverage: parseFloat(e.target.value) || 0,
                        }))
                      }
                      className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-xs font-mono font-bold text-[var(--text)] focus:border-[var(--accent)] focus:outline-none transition"
                    />
                  </div>
                </div>

                {/* Round-Wise Judge Allocation & Registered Date */}
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-[var(--text)] mb-1">
                      Registered Date
                    </label>
                    <input
                      type="date"
                      value={submissionEditForm.createdAt || ""}
                      onChange={(e) =>
                        setSubmissionEditForm((prev) => ({ ...prev, createdAt: e.target.value }))
                      }
                      className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-xs text-[var(--text)] focus:border-[var(--accent)] focus:outline-none transition"
                    />
                  </div>

                  <div className="p-3.5 rounded-2xl border border-[var(--border)] bg-[var(--surface-2)]/60 space-y-3">
                    <h4 className="text-xs font-bold text-[var(--text)]">
                      Round-Wise Judge Assignments (Rounds 1, 2 & 3)
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {[
                        { key: "round1", label: "Round 1 Judges" },
                        { key: "round2", label: "Round 2 Judges" },
                        { key: "round3", label: "Round 3 Judges" },
                      ].map((r) => (
                        <div key={r.key} className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-2.5 space-y-1.5 max-h-36 overflow-y-auto">
                          <span className="text-[11px] font-bold text-[var(--primary)] block">
                            {r.label}
                          </span>
                          {judges.length === 0 ? (
                            <span className="text-[10px] text-[var(--muted)]">No judges created</span>
                          ) : (
                            judges.map((j) => {
                              const jEmail = (j.email || "").toLowerCase().trim();
                              const selected = (submissionEditForm.roundAllocations?.[r.key] || []).includes(jEmail);
                              return (
                                <label key={`${r.key}-${jEmail}`} className="flex items-center gap-1.5 text-[11px] text-[var(--text)] cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={selected}
                                    onChange={() =>
                                      setSubmissionEditForm((prev) => {
                                        const ra = prev.roundAllocations || { round1: [], round2: [], round3: [] };
                                        const cur = Array.isArray(ra[r.key]) ? ra[r.key] : [];
                                        const next = cur.includes(jEmail)
                                          ? cur.filter((x) => x !== jEmail)
                                          : [...cur, jEmail];
                                        return {
                                          ...prev,
                                          roundAllocations: { ...ra, [r.key]: next },
                                        };
                                      })
                                    }
                                    className="rounded border-[var(--border)] text-[var(--primary)]"
                                  />
                                  <span className="truncate">{j.name}</span>
                                </label>
                              );
                            })
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Compulsory Uploaded Files & Links */}
                <div className="p-3.5 rounded-2xl border border-[var(--border)] bg-[var(--surface-2)]/60 space-y-3">
                  <h4 className="text-xs font-bold text-[var(--text)] flex items-center gap-1.5">
                    <FiFileText className="text-[var(--primary)]" />
                    <span>Compulsory Uploaded Files & Links</span>
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-[var(--muted)] mb-1 flex items-center gap-1">
                        <FiVideo className="h-3 w-3 text-red-500" />
                        <span>Pitch Video File Name</span>
                      </label>
                      <input
                        type="text"
                        value={submissionEditForm.videoFileName || ""}
                        onChange={(e) =>
                          setSubmissionEditForm((prev) => ({ ...prev, videoFileName: e.target.value }))
                        }
                        placeholder="e.g. Mysuru_Pitch.mp4"
                        className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-xs text-[var(--text)] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-[var(--muted)] mb-1 flex items-center gap-1">
                        <FiExternalLink className="h-3 w-3 text-red-500" />
                        <span>Pitch Video URL</span>
                      </label>
                      <input
                        type="text"
                        value={submissionEditForm.videoUrl || ""}
                        onChange={(e) =>
                          setSubmissionEditForm((prev) => ({ ...prev, videoUrl: e.target.value }))
                        }
                        placeholder="Google Drive or direct video URL"
                        className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-xs font-mono text-[var(--primary)] focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-[var(--muted)] mb-1 flex items-center gap-1">
                        <FiFileText className="h-3 w-3 text-amber-500" />
                        <span>Proposal PDF File Name</span>
                      </label>
                      <input
                        type="text"
                        value={submissionEditForm.documentFileName || ""}
                        onChange={(e) =>
                          setSubmissionEditForm((prev) => ({ ...prev, documentFileName: e.target.value }))
                        }
                        placeholder="e.g. Mysuru_Proposal.pdf"
                        className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-xs text-[var(--text)] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-[var(--muted)] mb-1 flex items-center gap-1">
                        <FiExternalLink className="h-3 w-3 text-amber-500" />
                        <span>Proposal PDF URL</span>
                      </label>
                      <input
                        type="text"
                        value={submissionEditForm.documentUrl || ""}
                        onChange={(e) =>
                          setSubmissionEditForm((prev) => ({ ...prev, documentUrl: e.target.value }))
                        }
                        placeholder="Google Drive or direct PDF URL"
                        className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-xs font-mono text-[var(--accent)] focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--text)] mb-1">
                    Short Description
                  </label>
                  <textarea
                    rows={2}
                    value={submissionEditForm.shortDescription}
                    onChange={(e) =>
                      setSubmissionEditForm((prev) => ({ ...prev, shortDescription: e.target.value }))
                    }
                    className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-xs text-[var(--text)] focus:border-[var(--accent)] focus:outline-none transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--text)] mb-1">
                    Detailed Proposal Summary
                  </label>
                  <textarea
                    rows={3}
                    value={submissionEditForm.detailedProposal}
                    onChange={(e) =>
                      setSubmissionEditForm((prev) => ({ ...prev, detailedProposal: e.target.value }))
                    }
                    className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-xs text-[var(--text)] focus:border-[var(--accent)] focus:outline-none transition"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-[var(--border)]">
                  <button
                    type="button"
                    onClick={() => setEditingSubmission(null)}
                    className="px-4 py-2 rounded-xl border border-[var(--border)] text-xs font-semibold text-[var(--muted)] hover:text-[var(--text)] transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={editLoading}
                    className="px-5 py-2 rounded-xl bg-[var(--accent)] hover:brightness-110 text-white text-xs font-bold shadow-md transition cursor-pointer disabled:opacity-60"
                  >
                    {editLoading ? "Saving..." : "Save Submission Changes"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* Edit Judge Account Modal */}
        {editingJudge && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 sm:p-8 shadow-2xl relative space-y-5"
            >
              <button
                type="button"
                onClick={() => setEditingJudge(null)}
                className="absolute top-5 right-5 text-[var(--muted)] hover:text-[var(--text)] p-1 rounded-lg transition cursor-pointer"
              >
                <FiX className="h-5 w-5" />
              </button>

              <div className="flex items-center gap-3 pb-3 border-b border-[var(--border)]">
                <div className="h-10 w-10 rounded-2xl bg-[var(--primary)]/15 text-[var(--primary)] flex items-center justify-center">
                  <FiAward className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[var(--text)]">Edit Judge Account</h3>
                  <p className="text-xs text-[var(--muted)] font-mono">{judgeEditForm.originalEmail}</p>
                </div>
              </div>

              <form onSubmit={handleSaveJudgeEdit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[var(--text)] mb-1">
                    Judge Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={judgeEditForm.name}
                    onChange={(e) => setJudgeEditForm((prev) => ({ ...prev, name: e.target.value }))}
                    className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-xs text-[var(--text)] focus:border-[var(--primary)] focus:outline-none transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--text)] mb-1">
                    Gmail / Email ID *
                  </label>
                  <input
                    type="email"
                    required
                    value={judgeEditForm.email}
                    onChange={(e) => setJudgeEditForm((prev) => ({ ...prev, email: e.target.value }))}
                    className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-xs text-[var(--text)] focus:border-[var(--primary)] focus:outline-none transition"
                  />
                </div>

                {/* Judge Account Password */}
                <div>
                  <label className="block text-xs font-semibold text-emerald-600 dark:text-emerald-400 mb-1 flex items-center gap-1">
                    <FiKey className="h-3 w-3" />
                    <span>Account Password</span>
                  </label>
                  <input
                    type="text"
                    value={judgeEditForm.password}
                    onChange={(e) => setJudgeEditForm((prev) => ({ ...prev, password: e.target.value }))}
                    placeholder="e.g. Judge@2050"
                    className="w-full rounded-xl border border-emerald-500/40 bg-[var(--surface-2)] px-3 py-2 text-xs font-mono font-bold text-[var(--text)] focus:border-emerald-500 focus:outline-none transition"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[var(--text)] mb-1">
                      Organization
                    </label>
                    <input
                      type="text"
                      value={judgeEditForm.organization}
                      onChange={(e) =>
                        setJudgeEditForm((prev) => ({ ...prev, organization: e.target.value }))
                      }
                      className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-xs text-[var(--text)] focus:border-[var(--primary)] focus:outline-none transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[var(--text)] mb-1">
                      Specialization Track
                    </label>
                    <select
                      value={judgeEditForm.specialization}
                      onChange={(e) =>
                        setJudgeEditForm((prev) => ({ ...prev, specialization: e.target.value }))
                      }
                      className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-xs text-[var(--text)] focus:border-[var(--primary)] focus:outline-none transition cursor-pointer"
                    >
                      <option value="All Tracks">All Tracks</option>
                      <option value="Environmental Sustainability">Environmental Sustainability</option>
                      <option value="Urban Infrastructure & Mobility">Urban Infrastructure & Mobility</option>
                      <option value="Heritage & Tourism">Heritage & Tourism</option>
                      <option value="Smart Governance & Digital Tech">Smart Governance & Digital Tech</option>
                      <option value="Healthcare & Wellbeing">Healthcare & Wellbeing</option>
                      <option value="Education & Skill Development">Education & Skill Development</option>
                    </select>
                  </div>
                </div>

                {/* Alloted Teams Selector */}
                <div>
                  <label className="block text-xs font-semibold text-[var(--text)] mb-1">
                    Alloted Teams ({judgeEditForm.allotedTeams?.length || 0} assigned)
                  </label>
                  <div className="max-h-36 overflow-y-auto rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-2 space-y-1">
                    {submissions.length === 0 ? (
                      <p className="text-xs text-[var(--muted)] p-1">No submissions registered yet.</p>
                    ) : (
                      submissions.map((sub) => {
                        const isAssigned = (judgeEditForm.allotedTeams || []).includes(sub.teamId);
                        return (
                          <label
                            key={sub.teamId}
                            className="flex items-center gap-2 p-1.5 hover:bg-[var(--surface)] rounded cursor-pointer text-xs text-[var(--text)]"
                          >
                            <input
                              type="checkbox"
                              checked={isAssigned}
                              onChange={(e) => {
                                const checked = e.target.checked;
                                setJudgeEditForm((prev) => ({
                                  ...prev,
                                  allotedTeams: checked
                                    ? [...(prev.allotedTeams || []), sub.teamId]
                                    : (prev.allotedTeams || []).filter((id) => id !== sub.teamId),
                                }));
                              }}
                              className="rounded text-[var(--primary)] focus:ring-0"
                            />
                            <span className="font-semibold">{sub.teamName}</span>
                            <span className="font-mono text-[10px] text-[var(--muted)]">({sub.teamId})</span>
                          </label>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Registered Date */}
                <div>
                  <label className="block text-xs font-semibold text-[var(--text)] mb-1">
                    Registered Date
                  </label>
                  <input
                    type="date"
                    value={judgeEditForm.createdAt || ""}
                    onChange={(e) =>
                      setJudgeEditForm((prev) => ({ ...prev, createdAt: e.target.value }))
                    }
                    className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-xs text-[var(--text)] focus:border-[var(--primary)] focus:outline-none transition"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-[var(--border)]">
                  <button
                    type="button"
                    onClick={() => setEditingJudge(null)}
                    className="px-4 py-2 rounded-xl border border-[var(--border)] text-xs font-semibold text-[var(--muted)] hover:text-[var(--text)] transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={editLoading}
                    className="px-5 py-2 rounded-xl bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white text-xs font-bold shadow-md transition cursor-pointer disabled:opacity-60"
                  >
                    {editLoading ? "Saving..." : "Save Judge Changes"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Round-Wise Multi-Judge Panel Modal */}
      <AnimatePresence>
        {allocatingTeamModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="w-full max-w-2xl rounded-3xl border border-[var(--border)] bg-[var(--surface)] shadow-2xl p-6 space-y-5"
            >
              <div className="flex items-start justify-between gap-4 border-b border-[var(--border)] pb-3">
                <div>
                  <span className="font-mono text-xs font-bold text-[var(--primary)]">
                    {allocatingTeamModal.teamId}
                  </span>
                  <h3 className="oswald text-lg font-bold text-[var(--text)]">
                    Round-Wise Judge Panel: {allocatingTeamModal.teamName}
                  </h3>
                  <p className="text-xs text-[var(--muted)]">
                    Assign one or multiple judges specifically to Round 1, Round 2, and Round 3.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setAllocatingTeamModal(null)}
                  className="p-2 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] text-[var(--muted)] hover:text-[var(--text)] cursor-pointer"
                >
                  <FiX className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handleSavePanelAllocation} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {[
                    { key: "round1", title: "Round 1 Panel" },
                    { key: "round2", title: "Round 2 Panel" },
                    { key: "round3", title: "Round 3 Panel" },
                  ].map((r) => (
                    <div key={r.key} className="rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] p-3.5 space-y-2 max-h-60 overflow-y-auto">
                      <div className="flex items-center justify-between pb-1.5 border-b border-[var(--border)]">
                        <span className="text-xs font-bold text-[var(--text)]">{r.title}</span>
                        <span className="text-[10px] font-mono text-[var(--primary)] font-bold">
                          {(roundAllocationForm[r.key] || []).length}
                        </span>
                      </div>
                      {judges.length === 0 ? (
                        <p className="text-[11px] text-[var(--muted)]">No judges available.</p>
                      ) : (
                        judges.map((j) => {
                          const jEmail = (j.email || "").toLowerCase().trim();
                          const isChecked = (roundAllocationForm[r.key] || []).includes(jEmail);
                          return (
                            <label key={`${r.key}-${jEmail}`} className="flex items-start gap-2 text-xs text-[var(--text)] cursor-pointer py-1">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => handleToggleRoundPanelJudge(r.key, jEmail)}
                                className="mt-0.5 rounded border-[var(--border)] text-[var(--primary)]"
                              />
                              <span className="min-w-0">
                                <span className="font-semibold block truncate">{j.name}</span>
                                <span className="text-[10px] font-mono text-[var(--muted)] block truncate">{j.email}</span>
                              </span>
                            </label>
                          );
                        })
                      )}
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-[var(--border)]">
                  <button
                    type="button"
                    onClick={() => setAllocatingTeamModal(null)}
                    className="px-4 py-2 rounded-xl border border-[var(--border)] text-xs font-semibold text-[var(--muted)] hover:text-[var(--text)] cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={allocating}
                    className="px-5 py-2 rounded-xl bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white text-xs font-bold shadow-md transition cursor-pointer disabled:opacity-60"
                  >
                    {allocating ? "Saving..." : "Save Round-Wise Allocations"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Admin Media Inspection Modal */}
      <AnimatePresence>
        {previewingSubmission && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-3xl border border-[var(--border)] bg-[var(--surface)] shadow-2xl p-6 space-y-5"
            >
              {(() => {
                const media = resolveSubmissionMedia(previewingSubmission, api.defaults.baseURL);
                const vid = media.video;
                const doc = media.document;
                return (
                  <>
                    <div className="flex items-start justify-between gap-4 border-b border-[var(--border)] pb-4">
                      <div>
                        <span className="font-mono text-xs font-bold text-[var(--primary)]">
                          {previewingSubmission.teamId}
                        </span>
                        <h3 className="oswald text-xl font-bold text-[var(--text)]">
                          {previewingSubmission.teamName} - {previewingSubmission.solutionName}
                        </h3>
                        <p className="text-xs text-[var(--muted)] mt-1">
                          {previewingSubmission.shortDescription}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setPreviewingSubmission(null)}
                        className="p-2 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] text-[var(--muted)] hover:text-[var(--text)] cursor-pointer"
                      >
                        <FiX className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                      {/* Pitch Video Preview */}
                      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] p-4 space-y-3">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 text-xs font-bold text-[var(--text)]">
                            <FiVideo className="h-4 w-4 text-red-500" />
                            <span className="truncate max-w-[200px]">{vid.fileName}</span>
                          </div>
                          {vid.hasVideo && (vid.directUrl || vid.embedUrl) && (
                            <a
                              href={vid.directUrl || vid.embedUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-[11px] font-bold text-[var(--primary)] hover:underline"
                            >
                              <span>Open Tab</span>
                              <FiExternalLink className="h-3 w-3" />
                            </a>
                          )}
                        </div>

                        {!vid.hasVideo ? (
                          <div className="aspect-video rounded-xl border border-dashed border-[var(--border)] bg-[var(--surface)] flex items-center justify-center text-xs text-[var(--muted)]">
                            No Pitch Video Uploaded
                          </div>
                        ) : vid.type === "blob" || vid.type === "mp4" ? (
                          <div className="aspect-video rounded-xl overflow-hidden bg-black">
                            <video
                              src={vid.embedUrl}
                              controls
                              preload="metadata"
                              playsInline
                              className="h-full w-full object-contain"
                            />
                          </div>
                        ) : vid.type === "drive" && vid.embedUrl ? (
                          <div className="aspect-video rounded-xl overflow-hidden bg-black">
                            <iframe
                              src={vid.embedUrl}
                              title="Admin Pitch Video Preview"
                              className="h-full w-full border-0"
                              allow="autoplay; fullscreen"
                            />
                          </div>
                        ) : (
                          <div className="aspect-video rounded-xl border border-[var(--border)] bg-[var(--surface)] flex flex-col items-center justify-center gap-2 p-4 text-center">
                            <p className="text-xs text-[var(--muted)]">External Video Link</p>
                            <a
                              href={vid.directUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[var(--primary)] text-white text-xs font-bold"
                            >
                              <span>Open Video</span>
                              <FiExternalLink className="h-3 w-3" />
                            </a>
                          </div>
                        )}
                      </div>

                      {/* Proposal PDF Preview */}
                      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] p-4 space-y-3">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 text-xs font-bold text-[var(--text)]">
                            <FiFileText className="h-4 w-4 text-amber-500" />
                            <span className="truncate max-w-[180px]">{doc.fileName}</span>
                          </div>
                          {doc.hasDoc && (
                            <div className="flex items-center gap-2">
                              {doc.downloadUrl && (
                                <a
                                  href={doc.downloadUrl}
                                  download={doc.fileName}
                                  target={doc.type === "blob" ? undefined : "_blank"}
                                  rel={doc.type === "blob" ? undefined : "noopener noreferrer"}
                                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-[var(--text)] hover:text-[var(--primary)]"
                                >
                                  <FiDownload className="h-3 w-3" />
                                  <span>Download</span>
                                </a>
                              )}
                              {(doc.directUrl || doc.embedUrl) && (
                                <a
                                  href={doc.directUrl || doc.embedUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-[11px] font-bold text-[var(--accent)] hover:underline"
                                >
                                  <span>Open PDF</span>
                                  <FiExternalLink className="h-3 w-3" />
                                </a>
                              )}
                            </div>
                          )}
                        </div>

                        {!doc.hasDoc ? (
                          <div className="aspect-[4/3] rounded-xl border border-dashed border-[var(--border)] bg-[var(--surface)] flex items-center justify-center text-xs text-[var(--muted)]">
                            No Proposal Document Uploaded
                          </div>
                        ) : (
                          <div className="aspect-[4/3] rounded-xl overflow-hidden border border-[var(--border)] bg-[var(--surface)]">
                            <iframe
                              src={
                                doc.type === "blob" || doc.type === "pdf"
                                  ? `${doc.embedUrl}#toolbar=0&navpanes=0`
                                  : doc.embedUrl
                              }
                              title="Admin Proposal PDF Preview"
                              className="h-full w-full border-0"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                );
              })()}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminJuryzaPlatform;
