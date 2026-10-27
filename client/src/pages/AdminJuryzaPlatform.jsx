import { useState, useEffect } from "react";
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
  FiBriefcase,
  FiFolder,
  FiTrash2,
  FiEdit2,
  FiKey,
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

  // Inline Editing States for Tables
  const [inlineEditingJudgeEmail, setInlineEditingJudgeEmail] = useState(null);
  const [showJudgeTeamsDropdown, setShowJudgeTeamsDropdown] = useState(false);
  const [inlineJudgeForm, setInlineJudgeForm] = useState({
    originalEmail: "",
    name: "",
    email: "",
    password: "",
    organization: "SDMIMD Panel",
    specialization: "All Tracks",
    allotedTeams: [],
    createdAt: "",
  });

  const [inlineEditingTeamId, setInlineEditingTeamId] = useState(null);
  const [inlineSubmissionForm, setInlineSubmissionForm] = useState({
    teamId: "",
    teamName: "",
    category: "students",
    solutionName: "",
    theme: "",
    leadName: "",
    leadEmail: "",
    leadPhone: "",
    institution: "",
    password: "",
    videoFileName: "",
    videoUrl: "",
    documentFileName: "",
    documentUrl: "",
    allotedJudge: "",
    stage: "submitted",
    rubricAverage: 0,
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

  const handleSyncCloud = async () => {
    setSyncingCloud(true);
    try {
      const synced = await syncCloudPortalState();
      setSubmissions(synced.submissions || []);
      setJudges(synced.judges || []);
      toast.success(
        `Cloud synchronized! Active: ${synced.submissions?.length || 0} teams, ${
          synced.judges?.length || 0
        } judges.`
      );
    } catch (err) {
      toast.error("Cloud sync note: " + (err.message || "Failed to sync."));
    } finally {
      setSyncingCloud(false);
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const [subRes, judgeRes] = await Promise.all([
        api.get("/api/v2/submissions"),
        api.get("/api/v2/admin/judges"),
      ]);

      const subList = Array.isArray(subRes.data) ? subRes.data : [];
      const judgeList = Array.isArray(judgeRes.data) ? judgeRes.data : [];

      setSubmissions(subList);
      setJudges(judgeList);

      saveStoredSubmissions(subList);
      const otherUsers = getStoredUsers().filter((u) => u.role !== "judge");
      saveStoredUsers([...otherUsers, ...judgeList]);
    } catch (err) {
      console.warn("Backend API unreachable, synchronizing with cloud state:", err.message);
      const synced = await syncCloudPortalState();
      const activeSubs = synced.submissions || [];
      const activeJudges = synced.judges || [];
      setSubmissions(activeSubs);
      setJudges(activeJudges);

      // Enrich with local IndexedDB media if available
      for (const s of activeSubs) {
        if (!s.docBlobUrl) {
          getMediaBlobUrl(`doc_${s.teamId}`).then((url) => {
            if (url) {
              setSubmissions((prev) =>
                prev.map((sub) => (sub.teamId === s.teamId ? { ...sub, docBlobUrl: url } : sub)),
              );
            }
          });
        }
        if (!s.videoBlobUrl) {
          getMediaBlobUrl(`video_${s.teamId}`).then((url) => {
            if (url) {
              setSubmissions((prev) =>
                prev.map((sub) => (sub.teamId === s.teamId ? { ...sub, videoBlobUrl: url } : sub)),
              );
            }
          });
        }
      }
    } finally {
      setLoading(false);
    }
  };

  // Status Change (Both Admin and Jury can change stage)
  const handleStageChange = async (teamId, newStage) => {
    try {
      await api.patch(`/api/v2/submissions/${teamId}/status`, { stage: newStage });
      toast.success(`Submission status updated to '${newStage}'!`);
    } catch {
      console.warn("API unavailable, updating locally...");
    }

    updateStoredSubmissionStage(teamId, newStage);
    setSubmissions((prev) =>
      prev.map((s) => (s.teamId === teamId ? { ...s, stage: newStage } : s)),
    );
  };

  // Manual Allocation & Unallocation
  const handleAllocate = async (teamId, judgeEmailToAssign) => {
    const cleanEmail = (judgeEmailToAssign || "").toLowerCase().trim();
    const isUnallocating = !cleanEmail;

    try {
      setAllocating(true);
      await api.post("/api/v2/admin/allocate", {
        teamId,
        judgeEmail: cleanEmail,
        judgeEmails: isUnallocating ? [] : [cleanEmail],
      });
      if (isUnallocating) {
        toast.success("Team marked as unallocated.");
      } else {
        toast.success("Team assigned to judge successfully!");
      }
    } catch {
      console.warn("API unavailable, allocating locally...");
    }

    allocateStoredSubmission(teamId, cleanEmail);

    // Update submissions state reactively
    setSubmissions((prev) =>
      prev.map((s) => {
        if (s.teamId !== teamId) return s;
        if (isUnallocating) {
          return {
            ...s,
            allotedJudges: [],
            allotedJudgeNames: [],
            stage: s.stage === "allocated to a judge" ? "submitted" : s.stage,
          };
        }
        const targetJudge = judges.find((j) => j.email.toLowerCase() === cleanEmail);
        return {
          ...s,
          allotedJudges: [cleanEmail],
          allotedJudgeNames: [targetJudge?.name || cleanEmail],
          stage: s.stage === "submitted" ? "allocated to a judge" : s.stage,
        };
      }),
    );

    // Update judges state as well
    setJudges((prev) =>
      prev.map((j) => {
        const jEmail = (j.email || "").toLowerCase().trim();
        const currentTeams = Array.isArray(j.allotedTeams) ? j.allotedTeams : [];
        if (isUnallocating) {
          return { ...j, allotedTeams: currentTeams.filter((id) => id !== teamId) };
        }
        if (jEmail === cleanEmail) {
          return {
            ...j,
            allotedTeams: currentTeams.includes(teamId) ? currentTeams : [...currentTeams, teamId],
          };
        } else {
          return { ...j, allotedTeams: currentTeams.filter((id) => id !== teamId) };
        }
      }),
    );

    setAllocating(false);
  };

  // Automated Round-Robin Allocation
  const handleAutoAllocate = async () => {
    if (judges.length === 0) {
      toast.error("No judges available in roster to allocate teams!");
      return;
    }
    try {
      await api.post("/api/v2/admin/allocate", { mode: "auto" });
    } catch {
      console.warn("API unavailable, auto-allocating locally...");
    }

    const res = autoAllocateStoredSubmissions();
    if (res?.subs) {
      setSubmissions([...res.subs]);
    }
    if (res?.users) {
      setJudges([...res.users.filter((u) => u.role === "judge")]);
    }
    toast.success(`Allocated teams evenly across ${judges.length} judges!`);
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
      institution: leader.college || sub.organizationDetails?.institution || "",
      stage: sub.stage || "submitted",
      rubricAverage: sub.rubricAverage ?? 0,
      password: getTeamPassword(sub),
      videoFileName: sub.video?.originalName || "",
      videoUrl: sub.video?.url || sub.video?.webViewLink || "",
      documentFileName: sub.document?.name || sub.document?.originalName || "",
      documentUrl: sub.document?.url || sub.document?.webViewLink || "",
      allotedJudge: (sub.allotedJudges || [])[0] || "",
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

  // --- Inline Submission Editing Handlers ---
  const handleStartInlineSubmissionEdit = (sub) => {
    const leader = sub.members?.find((m) => m.isLeader) || sub.members?.[0] || {};
    setInlineSubmissionForm({
      teamId: sub.teamId,
      teamName: sub.teamName || "",
      category: sub.category || "students",
      solutionName: sub.solutionName || "",
      theme: sub.theme || sub.thematicArea || "",
      leadName: leader.name || sub.leadName || "",
      leadEmail: leader.email || sub.participantEmail || "",
      leadPhone: leader.phone || sub.leadPhone || "",
      institution: leader.college || sub.organizationDetails?.institution || "",
      password: getTeamPassword(sub),
      videoFileName: sub.video?.originalName || "",
      videoUrl: sub.video?.url || sub.video?.webViewLink || "",
      documentFileName: sub.document?.name || sub.document?.originalName || "",
      documentUrl: sub.document?.url || sub.document?.webViewLink || "",
      allotedJudge: (sub.allotedJudges || [])[0] || "",
      stage: sub.stage || "submitted",
      rubricAverage: sub.rubricAverage ?? 0,
      createdAt: sub.createdAt ? new Date(sub.createdAt).toISOString().split("T")[0] : "",
    });
    setInlineEditingTeamId(sub.teamId);
  };

  const handleCancelInlineSubmissionEdit = () => {
    setInlineEditingTeamId(null);
  };

  const handleSaveInlineSubmissionEdit = async (teamId) => {
    if (!inlineSubmissionForm.teamName.trim()) {
      toast.error("Team name is required.");
      return;
    }
    setEditLoading(true);
    try {
      try {
        await api.put(`/api/v2/admin/submissions/${teamId}`, inlineSubmissionForm);
      } catch {
        console.warn("Backend unavailable, saving locally...");
      }

      const updated = await updateStoredSubmissionDetails(teamId, inlineSubmissionForm);
      setSubmissions((prev) =>
        prev.map((s) => (s.teamId === teamId ? { ...s, ...updated } : s))
      );
      setJudges(getStoredUsers().filter((u) => u.role === "judge"));
      toast.success(`Team "${inlineSubmissionForm.teamName}" updated successfully!`);
      setInlineEditingTeamId(null);
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

  // --- Inline Judge Editing Handlers ---
  const handleStartInlineJudgeEdit = (judge) => {
    const jEmail = (judge.email || "").toLowerCase().trim();
    const currentAlloted = (judge.allotedTeams && judge.allotedTeams.length > 0)
      ? judge.allotedTeams
      : submissions
          .filter((s) => Array.isArray(s.allotedJudges) && s.allotedJudges.map(e => e.toLowerCase()).includes(jEmail))
          .map((s) => s.teamId);

    setInlineJudgeForm({
      originalEmail: judge.email,
      name: judge.name || "",
      email: judge.email || "",
      password: getJudgePassword(judge),
      organization: judge.organization || "SDMIMD Panel",
      specialization: judge.specialization || "All Tracks",
      allotedTeams: currentAlloted,
      createdAt: judge.createdAt ? new Date(judge.createdAt).toISOString().split("T")[0] : "",
    });
    setInlineEditingJudgeEmail(judge.email);
    setShowJudgeTeamsDropdown(false);
  };

  const handleCancelInlineJudgeEdit = () => {
    setInlineEditingJudgeEmail(null);
    setShowJudgeTeamsDropdown(false);
  };

  const handleSaveInlineJudgeEdit = async (judgeEmail) => {
    if (!inlineJudgeForm.name.trim() || !inlineJudgeForm.email.trim()) {
      toast.error("Judge name and email are required.");
      return;
    }
    setEditLoading(true);
    try {
      try {
        await api.put(
          `/api/v2/admin/judges/${encodeURIComponent(inlineJudgeForm.originalEmail || judgeEmail)}`,
          inlineJudgeForm
        );
      } catch {
        console.warn("Backend unavailable, saving locally...");
      }

      const updated = await updateStoredJudgeDetails(inlineJudgeForm.originalEmail || judgeEmail, inlineJudgeForm);
      setJudges((prev) =>
        prev.map((j) =>
          j.email === (inlineJudgeForm.originalEmail || judgeEmail) ? { ...j, ...updated } : j
        )
      );
      setSubmissions(getStoredSubmissions());
      toast.success(`Judge "${inlineJudgeForm.name}" updated successfully!`);
      setInlineEditingJudgeEmail(null);
      setShowJudgeTeamsDropdown(false);
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

  // Purge all portal data (teams & judges)
  const handlePurgeAll = async () => {
    const confirmation = window.prompt(
      '⚠️ DANGER: You are about to DELETE ALL teams, judges, and uploaded files from the portal.\n\nType "RESET" to confirm and proceed:'
    );
    if (confirmation !== "RESET") {
      if (confirmation !== null) {
        toast.error('Reset cancelled: You must type "RESET" exactly.');
      }
      return;
    }

    try {
      await api.post("/api/v2/admin/purge-all");
    } catch {
      console.warn("Backend unavailable, purging resilient client data...");
    }

    await clearAllPortalData();
    setSubmissions([]);
    setJudges([]);
    toast.success("All teams, judges, and uploaded files have been deleted from the portal.");
  };

  const getDocHref = (sub) => {
    if (!sub) return "/sample_proposal.pdf";
    if (sub.docBlobUrl) return sub.docBlobUrl;
    if (sub.document?.url && sub.document.url.toLowerCase().endsWith(".pdf")) return sub.document.url;
    if (sub.document?.webViewLink && sub.document.webViewLink.toLowerCase().endsWith(".pdf")) return sub.document.webViewLink;
    const base = api.defaults.baseURL || "";
    if (base && sub.teamId) {
      return `${base}/api/v2/submissions/${sub.teamId}/document-preview`;
    }
    return "/sample_proposal.pdf";
  };

  const getVideoHref = (sub) => {
    if (!sub) return "/speech.mp4";
    if (sub.videoBlobUrl) return sub.videoBlobUrl;
    if (sub.video?.url && sub.video.url.toLowerCase().endsWith(".mp4")) return sub.video.url;
    if (sub.video?.webViewLink && sub.video.webViewLink.toLowerCase().endsWith(".mp4")) return sub.video.webViewLink;
    const base = api.defaults.baseURL || "";
    if (base && sub.teamId) {
      return `${base}/api/v2/submissions/${sub.teamId}/video-stream`;
    }
    return "/speech.mp4";
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
              <span>Event Drive Folder</span>
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
              Alloted Teams
            </span>
            <div className="oswald text-2xl sm:text-3xl font-extrabold text-[var(--accent)] mt-1">
              {submissions.filter((s) => s.allotedJudges?.filter((j) => Boolean(j && j.trim())).length > 0).length}
            </div>
            <span className="text-[10px] text-[var(--muted)] mt-1 block">
              Assigned to a judge
            </span>
          </div>

          <div className="p-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">
              Shortlisted
            </span>
            <div className="oswald text-2xl sm:text-3xl font-extrabold text-amber-500 mt-1">
              {submissions.filter((s) => (s.stage || "").includes("shortlisted")).length}
            </div>
            <span className="text-[10px] text-amber-600 dark:text-amber-400 mt-1 block font-medium">
              Advanced to next round
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
                <h3 className="font-bold text-sm text-[var(--text)]">Team Submissions & Allocations</h3>
                <p className="text-xs text-[var(--muted)]">Assign judges, inspect uploads, and update competition rounds.</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleAutoAllocate}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-white text-xs font-bold shadow-md hover:brightness-110 transition cursor-pointer"
                >
                  <FiUserCheck className="h-3.5 w-3.5" />
                  <span>Auto-Allocate All Teams</span>
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
                      <th className="px-4 py-3">Alloted Judge</th>
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
                      const alloted = (sub.allotedJudges || [])[0] || "";
                      const leader = sub.members?.find((m) => m.isLeader) || sub.members?.[0] || {};
                      const leaderName = leader.name || sub.leadName || sub.leaderName || sub.teamLeadName || "Team Leader";
                      const leaderEmail = leader.email || sub.leadEmail || sub.participantEmail || sub.teamLeadEmail || "N/A";
                      const focusArea = sub.theme || sub.thematicArea || "Focus Area";
                      const videoName = sub.video?.originalName || sub.videoFileName || "Pitch Video (.mp4)";
                      const docName = sub.document?.name || sub.document?.originalName || sub.proposalDeckFileName || sub.docFileName || "Proposal (.pdf)";

                      if (inlineEditingTeamId === sub.teamId) {
                        return (
                          <tr key={sub.teamId} className="bg-blue-500/5 dark:bg-blue-500/10 border-2 border-blue-500/40">
                            {/* 1. Team Details */}
                            <td className="px-4 py-3 space-y-1.5 min-w-[170px]">
                              <input
                                type="text"
                                required
                                value={inlineSubmissionForm.teamName}
                                onChange={(e) =>
                                  setInlineSubmissionForm((prev) => ({ ...prev, teamName: e.target.value }))
                                }
                                placeholder="Team Name"
                                className="w-full px-2.5 py-1.5 text-xs font-bold rounded-xl border border-blue-500 bg-[var(--surface)] text-[var(--text)] focus:ring-2 focus:ring-blue-500/30 focus:outline-none"
                              />
                              <div className="flex items-center gap-1.5">
                                <span className="font-mono text-[10px] text-[var(--muted)]">ID: {sub.teamId}</span>
                                <select
                                  value={inlineSubmissionForm.category}
                                  onChange={(e) =>
                                    setInlineSubmissionForm((prev) => ({ ...prev, category: e.target.value }))
                                  }
                                  className="px-2 py-0.5 text-[10px] font-bold uppercase rounded-lg border border-[var(--border)] bg-[var(--surface-2)] text-[var(--text)] focus:outline-none cursor-pointer"
                                >
                                  <option value="students">Students</option>
                                  <option value="citizens">Citizens</option>
                                  <option value="corporates">Corporates</option>
                                  <option value="ngos">NGOs</option>
                                </select>
                              </div>
                              <input
                                type="text"
                                value={inlineSubmissionForm.solutionName}
                                onChange={(e) =>
                                  setInlineSubmissionForm((prev) => ({ ...prev, solutionName: e.target.value }))
                                }
                                placeholder="Solution / Innovation Name"
                                className="w-full px-2 py-1 text-[11px] rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] focus:outline-none"
                              />
                            </td>

                            {/* 2. Focus Area & Leader & Password */}
                            <td className="px-4 py-3 space-y-1.5 min-w-[180px]">
                              <input
                                type="text"
                                value={inlineSubmissionForm.theme}
                                onChange={(e) =>
                                  setInlineSubmissionForm((prev) => ({ ...prev, theme: e.target.value }))
                                }
                                placeholder="Focus Area / Theme"
                                className="w-full px-2.5 py-1 text-[11px] font-bold rounded-xl border border-amber-500 bg-[var(--surface)] text-[var(--accent)] focus:outline-none"
                              />
                              <input
                                type="text"
                                value={inlineSubmissionForm.leadName}
                                onChange={(e) =>
                                  setInlineSubmissionForm((prev) => ({ ...prev, leadName: e.target.value }))
                                }
                                placeholder="Leader Name"
                                className="w-full px-2 py-1 text-xs rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] focus:outline-none"
                              />
                              <input
                                type="email"
                                value={inlineSubmissionForm.leadEmail}
                                onChange={(e) =>
                                  setInlineSubmissionForm((prev) => ({ ...prev, leadEmail: e.target.value }))
                                }
                                placeholder="Leader Gmail / Email"
                                className="w-full px-2 py-1 text-[10px] font-mono rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--muted)] focus:outline-none"
                              />
                              <div className="flex items-center gap-1">
                                <FiKey className="h-3 w-3 text-emerald-500 shrink-0" />
                                <input
                                  type="text"
                                  value={inlineSubmissionForm.password}
                                  onChange={(e) =>
                                    setInlineSubmissionForm((prev) => ({ ...prev, password: e.target.value }))
                                  }
                                  placeholder="Password"
                                  className="w-full px-2 py-0.5 text-[10px] font-mono font-bold rounded-lg border border-emerald-500 bg-[var(--surface)] text-emerald-600 dark:text-emerald-400 focus:outline-none"
                                />
                              </div>
                            </td>

                            {/* 3. Compulsory Files */}
                            <td className="px-4 py-3 space-y-1.5 min-w-[190px]">
                              <div>
                                <label className="text-[10px] font-semibold text-[var(--muted)] flex items-center gap-1 mb-0.5">
                                  <FiVideo className="h-3 w-3 text-red-500 shrink-0" />
                                  <span>Pitch Video Name / URL:</span>
                                </label>
                                <input
                                  type="text"
                                  value={inlineSubmissionForm.videoFileName}
                                  onChange={(e) =>
                                    setInlineSubmissionForm((prev) => ({ ...prev, videoFileName: e.target.value }))
                                  }
                                  placeholder="Video File Name"
                                  className="w-full px-2 py-1 text-[10px] rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] focus:outline-none mb-1"
                                />
                                <input
                                  type="text"
                                  value={inlineSubmissionForm.videoUrl}
                                  onChange={(e) =>
                                    setInlineSubmissionForm((prev) => ({ ...prev, videoUrl: e.target.value }))
                                  }
                                  placeholder="Video URL"
                                  className="w-full px-2 py-0.5 text-[9px] font-mono rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--primary)] focus:outline-none"
                                />
                              </div>
                              <div>
                                <label className="text-[10px] font-semibold text-[var(--muted)] flex items-center gap-1 mb-0.5">
                                  <FiFileText className="h-3 w-3 text-amber-500 shrink-0" />
                                  <span>Proposal PDF / URL:</span>
                                </label>
                                <input
                                  type="text"
                                  value={inlineSubmissionForm.documentFileName}
                                  onChange={(e) =>
                                    setInlineSubmissionForm((prev) => ({ ...prev, documentFileName: e.target.value }))
                                  }
                                  placeholder="Proposal PDF Name"
                                  className="w-full px-2 py-1 text-[10px] rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] focus:outline-none mb-1"
                                />
                                <input
                                  type="text"
                                  value={inlineSubmissionForm.documentUrl}
                                  onChange={(e) =>
                                    setInlineSubmissionForm((prev) => ({ ...prev, documentUrl: e.target.value }))
                                  }
                                  placeholder="PDF URL"
                                  className="w-full px-2 py-0.5 text-[9px] font-mono rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--accent)] focus:outline-none"
                                />
                              </div>
                            </td>

                            {/* 4. Alloted Judge */}
                            <td className="px-4 py-3">
                              <select
                                value={inlineSubmissionForm.allotedJudge}
                                onChange={(e) =>
                                  setInlineSubmissionForm((prev) => ({ ...prev, allotedJudge: e.target.value }))
                                }
                                className="w-full rounded-xl border border-blue-500 bg-[var(--surface)] px-2.5 py-1.5 text-xs text-[var(--text)] focus:ring-2 focus:ring-blue-500/30 focus:outline-none cursor-pointer max-w-[150px]"
                              >
                                <option value="">Unallocated</option>
                                {judges.map((j) => (
                                  <option key={j.email} value={j.email}>
                                    {j.name} ({j.email})
                                  </option>
                                ))}
                              </select>
                            </td>

                            {/* 5. Submission Stage */}
                            <td className="px-4 py-3">
                              <select
                                value={inlineSubmissionForm.stage}
                                onChange={(e) =>
                                  setInlineSubmissionForm((prev) => ({ ...prev, stage: e.target.value }))
                                }
                                className="w-full rounded-xl border border-blue-500 bg-[var(--surface)] px-2.5 py-1.5 text-xs font-semibold text-[var(--text)] focus:ring-2 focus:ring-blue-500/30 focus:outline-none cursor-pointer"
                              >
                                <option value="submitted">1. Submitted</option>
                                <option value="allocated to a judge">2. Allocated to Judge</option>
                                <option value="under evaluation">3. Under Evaluation</option>
                                <option value="shortlisted to next round">4. Shortlisted 🏆</option>
                                <option value="not shortlisted to next round">4. Not Shortlisted ❌</option>
                              </select>
                            </td>

                            {/* 6. Score */}
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-1">
                                <input
                                  type="number"
                                  min="0"
                                  max="50"
                                  step="0.5"
                                  value={inlineSubmissionForm.rubricAverage}
                                  onChange={(e) =>
                                    setInlineSubmissionForm((prev) => ({
                                      ...prev,
                                      rubricAverage: parseFloat(e.target.value) || 0,
                                    }))
                                  }
                                  className="w-16 px-2 py-1 text-xs font-mono font-bold rounded-xl border border-blue-500 bg-[var(--surface)] text-[var(--text)] focus:outline-none"
                                />
                                <span className="font-mono text-xs text-[var(--muted)]">/50</span>
                              </div>
                            </td>

                            {/* 7. Action (Save & Cancel) */}
                            <td className="px-4 py-3 text-right whitespace-nowrap">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleSaveInlineSubmissionEdit(sub.teamId)}
                                  disabled={editLoading}
                                  title="Save Team Changes"
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition cursor-pointer disabled:opacity-60"
                                >
                                  <FiCheck className="h-3.5 w-3.5" />
                                  <span>Save</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={handleCancelInlineSubmissionEdit}
                                  title="Cancel Edit"
                                  className="p-1.5 rounded-xl border border-[var(--border)] text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--surface-2)] transition cursor-pointer"
                                >
                                  <FiX className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      }

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
                            <div className="flex items-center gap-1.5 text-[11px]">
                              <FiVideo className="h-3 w-3 text-red-500 shrink-0" />
                              <a
                                href={getVideoHref(sub)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="truncate max-w-[130px] text-[var(--primary)] font-semibold hover:underline inline-flex items-center gap-1"
                                title={`Open Video: ${videoName}`}
                              >
                                <span className="truncate">{videoName}</span>
                                <FiExternalLink className="h-2.5 w-2.5 shrink-0" />
                              </a>
                            </div>
                            <div className="flex items-center gap-1.5 text-[11px]">
                              <FiFileText className="h-3 w-3 text-amber-500 shrink-0" />
                              <a
                                href={getDocHref(sub)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="truncate max-w-[130px] text-[var(--accent)] font-semibold hover:underline inline-flex items-center gap-1"
                                title={`Open PDF: ${docName}`}
                              >
                                <span className="truncate">{docName}</span>
                                <FiExternalLink className="h-2.5 w-2.5 shrink-0" />
                              </a>
                            </div>
                          </td>

                          {/* Judge Allocation Dropdown */}
                          <td className="px-4 py-3.5">
                            <select
                              value={alloted}
                              disabled={allocating}
                              onChange={(e) => handleAllocate(sub.teamId, e.target.value)}
                              className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-2.5 py-1.5 text-xs text-[var(--text)] focus:border-[var(--accent)] focus:outline-none transition cursor-pointer max-w-[160px]"
                            >
                              <option value="">Unallocated</option>
                              {judges.map((j) => (
                                <option key={j.email} value={j.email}>
                                  {j.name} ({j.email})
                                </option>
                              ))}
                            </select>
                          </td>

                          {/* Stage Dropdown */}
                          <td className="px-4 py-3.5">
                            <select
                              value={sub.stage || "submitted"}
                              onChange={(e) => handleStageChange(sub.teamId, e.target.value)}
                              className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-2.5 py-1.5 text-xs font-semibold text-[var(--text)] focus:border-[var(--accent)] focus:outline-none transition cursor-pointer"
                            >
                              <option value="submitted">1. Submitted</option>
                              <option value="allocated to a judge">2. Allocated to Judge</option>
                              <option value="under evaluation">3. Under Evaluation</option>
                              <option value="shortlisted to next round">4. Shortlisted 🏆</option>
                              <option value="not shortlisted to next round">4. Not Shortlisted ❌</option>
                            </select>
                          </td>

                          {/* Score */}
                          <td className="px-4 py-3.5 font-mono font-bold text-[var(--text)]">
                            {typeof sub.rubricAverage === "number" && sub.rubricAverage > 0
                              ? `${sub.rubricAverage.toFixed(1)}/50`
                              : "Pending"}
                          </td>

                          {/* Action (Inline Edit, Modal Edit & Delete Submission) */}
                          <td className="px-4 py-3.5 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                type="button"
                                onClick={() => handleStartInlineSubmissionEdit(sub)}
                                title="Quick Edit (Inline in Table)"
                                className="p-1.5 rounded-lg text-blue-500 hover:bg-blue-500/10 transition cursor-pointer"
                              >
                                <FiEdit2 className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleEditSubmissionOpen(sub)}
                                title="Edit Full Details Modal"
                                className="p-1.5 rounded-lg text-amber-500 hover:bg-amber-500/10 transition cursor-pointer"
                              >
                                <FiBriefcase className="h-3.5 w-3.5" />
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
                <span>➕ Generate Judge Account</span>
              </button>
            </div>

            {/* Judge Credentials Banner if just created */}
            {judgeCreationSuccess && (
              <div className="p-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <strong className="block text-sm font-bold">🎉 Judge Account Created Successfully!</strong>
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
                      const allotedCount = submissions.filter((s) =>
                        Array.isArray(s.allotedJudges) &&
                        s.allotedJudges
                          .map((e) => (e || "").toLowerCase().trim())
                          .includes(jEmail)
                      ).length;

                      if (inlineEditingJudgeEmail === judge.email) {
                        return (
                          <tr key={judge.email} className="bg-blue-500/5 dark:bg-blue-500/10 border-2 border-blue-500/40">
                            {/* 1. Judge Name */}
                            <td className="px-4 py-3 min-w-[150px]">
                              <input
                                type="text"
                                required
                                value={inlineJudgeForm.name}
                                onChange={(e) =>
                                  setInlineJudgeForm((prev) => ({ ...prev, name: e.target.value }))
                                }
                                placeholder="Judge Name"
                                className="w-full px-2.5 py-1.5 text-xs font-bold rounded-xl border border-blue-500 bg-[var(--surface)] text-[var(--text)] focus:ring-2 focus:ring-blue-500/30 focus:outline-none"
                              />
                            </td>

                            {/* 2. Gmail / Email ID */}
                            <td className="px-4 py-3 min-w-[170px]">
                              <input
                                type="email"
                                required
                                value={inlineJudgeForm.email}
                                onChange={(e) =>
                                  setInlineJudgeForm((prev) => ({ ...prev, email: e.target.value }))
                                }
                                placeholder="judge@gmail.com"
                                className="w-full px-2.5 py-1.5 text-xs font-mono rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] focus:border-blue-500 focus:outline-none"
                              />
                            </td>

                            {/* 3. Password */}
                            <td className="px-4 py-3 min-w-[140px]">
                              <div className="flex items-center gap-1">
                                <FiKey className="h-3 w-3 text-emerald-500 shrink-0" />
                                <input
                                  type="text"
                                  value={inlineJudgeForm.password}
                                  onChange={(e) =>
                                    setInlineJudgeForm((prev) => ({ ...prev, password: e.target.value }))
                                  }
                                  placeholder="Password"
                                  className="w-full px-2 py-1 text-xs font-mono font-bold rounded-lg border border-emerald-500 bg-[var(--surface)] text-emerald-600 dark:text-emerald-400 focus:outline-none"
                                />
                              </div>
                            </td>

                            {/* 4. Organization */}
                            <td className="px-4 py-3 min-w-[140px]">
                              <input
                                type="text"
                                value={inlineJudgeForm.organization}
                                onChange={(e) =>
                                  setInlineJudgeForm((prev) => ({ ...prev, organization: e.target.value }))
                                }
                                placeholder="Organization"
                                className="w-full px-2 py-1.5 text-xs rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] focus:border-blue-500 focus:outline-none"
                              />
                            </td>

                            {/* 5. Specialization Track */}
                            <td className="px-4 py-3 min-w-[160px]">
                              <select
                                value={inlineJudgeForm.specialization}
                                onChange={(e) =>
                                  setInlineJudgeForm((prev) => ({ ...prev, specialization: e.target.value }))
                                }
                                className="w-full rounded-xl border border-blue-500 bg-[var(--surface)] px-2 py-1.5 text-xs text-[var(--primary)] font-semibold focus:outline-none cursor-pointer"
                              >
                                <option value="All Tracks">All Tracks</option>
                                <option value="Environmental Sustainability">Environmental Sustainability</option>
                                <option value="Urban Infrastructure & Mobility">Urban Infrastructure & Mobility</option>
                                <option value="Heritage & Tourism">Heritage & Tourism</option>
                                <option value="Smart Governance & Digital Tech">Smart Governance & Digital Tech</option>
                                <option value="Healthcare & Wellbeing">Healthcare & Wellbeing</option>
                                <option value="Education & Skill Development">Education & Skill Development</option>
                              </select>
                            </td>

                            {/* 6. Alloted Teams */}
                            <td className="px-4 py-3 min-w-[150px]">
                              <div className="relative">
                                <button
                                  type="button"
                                  onClick={() => setShowJudgeTeamsDropdown(!showJudgeTeamsDropdown)}
                                  className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl border border-blue-500 bg-[var(--surface)] text-xs font-mono font-bold text-[var(--text)] hover:bg-[var(--surface-2)] transition cursor-pointer"
                                >
                                  <span>
                                    {inlineJudgeForm.allotedTeams?.length || 0}{" "}
                                    {inlineJudgeForm.allotedTeams?.length === 1 ? "team" : "teams"}
                                  </span>
                                  <span className="text-[10px]">▼</span>
                                </button>

                                {showJudgeTeamsDropdown && (
                                  <div className="absolute left-0 mt-1 w-64 max-h-48 overflow-y-auto rounded-xl border border-[var(--border)] bg-[var(--surface)] p-2 shadow-2xl z-40 space-y-1">
                                    <div className="text-[11px] font-bold text-[var(--muted)] px-1 pb-1 border-b border-[var(--border)]">
                                      Select Assigned Teams:
                                    </div>
                                    {submissions.length === 0 ? (
                                      <div className="text-[11px] text-[var(--muted)] p-1">No submissions registered</div>
                                    ) : (
                                      submissions.map((sub) => {
                                        const isAssigned = (inlineJudgeForm.allotedTeams || []).includes(sub.teamId);
                                        return (
                                          <label
                                            key={sub.teamId}
                                            className="flex items-center gap-2 p-1.5 hover:bg-[var(--surface-2)] rounded cursor-pointer text-xs text-[var(--text)]"
                                          >
                                            <input
                                              type="checkbox"
                                              checked={isAssigned}
                                              onChange={(e) => {
                                                const checked = e.target.checked;
                                                setInlineJudgeForm((prev) => ({
                                                  ...prev,
                                                  allotedTeams: checked
                                                    ? [...(prev.allotedTeams || []), sub.teamId]
                                                    : (prev.allotedTeams || []).filter((id) => id !== sub.teamId),
                                                }));
                                              }}
                                              className="rounded text-[var(--primary)] focus:ring-0"
                                            />
                                            <div className="truncate">
                                              <div className="font-semibold truncate">{sub.teamName}</div>
                                              <div className="font-mono text-[9px] text-[var(--muted)] truncate">ID: {sub.teamId}</div>
                                            </div>
                                          </label>
                                        );
                                      })
                                    )}
                                  </div>
                                )}
                              </div>
                            </td>

                            {/* 7. Registered Date */}
                            <td className="px-4 py-3 min-w-[130px]">
                              <input
                                type="date"
                                value={inlineJudgeForm.createdAt}
                                onChange={(e) =>
                                  setInlineJudgeForm((prev) => ({ ...prev, createdAt: e.target.value }))
                                }
                                className="w-full px-2 py-1 text-xs rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] focus:border-blue-500 focus:outline-none"
                              />
                            </td>

                            {/* 8. Action (Save & Cancel) */}
                            <td className="px-4 py-3 text-right whitespace-nowrap">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleSaveInlineJudgeEdit(judge.email)}
                                  disabled={editLoading}
                                  title="Save Judge Changes"
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition cursor-pointer disabled:opacity-60"
                                >
                                  <FiCheck className="h-3.5 w-3.5" />
                                  <span>Save</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={handleCancelInlineJudgeEdit}
                                  title="Cancel Edit"
                                  className="p-1.5 rounded-xl border border-[var(--border)] text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--surface-2)] transition cursor-pointer"
                                >
                                  <FiX className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      }

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
                            <span className="font-bold text-xs font-mono bg-[var(--surface-2)] px-2 py-0.5 rounded border border-[var(--border)]">
                              {allotedCount} {allotedCount === 1 ? "team" : "teams"}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 text-[var(--muted)]">
                            {judge.createdAt
                              ? new Date(judge.createdAt).toLocaleDateString("en-IN")
                              : "Active"}
                          </td>
                          {/* Action (Inline Edit, Modal Edit & Delete Judge) */}
                          <td className="px-4 py-3.5 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                type="button"
                                onClick={() => handleStartInlineJudgeEdit(judge)}
                                title="Quick Edit (Inline in Table)"
                                className="p-1.5 rounded-lg text-blue-500 hover:bg-blue-500/10 transition cursor-pointer"
                              >
                                <FiEdit2 className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleEditJudgeOpen(judge)}
                                title="Edit Full Details Modal"
                                className="p-1.5 rounded-lg text-amber-500 hover:bg-amber-500/10 transition cursor-pointer"
                              >
                                <FiBriefcase className="h-3.5 w-3.5" />
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
                      value={submissionEditForm.stage}
                      onChange={(e) =>
                        setSubmissionEditForm((prev) => ({ ...prev, stage: e.target.value }))
                      }
                      className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-xs font-semibold text-[var(--text)] focus:border-[var(--accent)] focus:outline-none transition cursor-pointer"
                    >
                      <option value="submitted">1. Submitted</option>
                      <option value="allocated to a judge">2. Allocated to Judge</option>
                      <option value="under evaluation">3. Under Evaluation</option>
                      <option value="shortlisted to next round">4. Shortlisted 🏆</option>
                      <option value="not shortlisted to next round">4. Not Shortlisted ❌</option>
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

                {/* Alloted Judge & Registered Date */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[var(--text)] mb-1">
                      Alloted Judge
                    </label>
                    <select
                      value={submissionEditForm.allotedJudge || ""}
                      onChange={(e) =>
                        setSubmissionEditForm((prev) => ({ ...prev, allotedJudge: e.target.value }))
                      }
                      className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-xs text-[var(--text)] focus:border-[var(--accent)] focus:outline-none transition cursor-pointer"
                    >
                      <option value="">Unallocated</option>
                      {judges.map((j) => (
                        <option key={j.email} value={j.email}>
                          {j.name} ({j.email})
                        </option>
                      ))}
                    </select>
                  </div>

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
    </div>
  );
};

export default AdminJuryzaPlatform;
