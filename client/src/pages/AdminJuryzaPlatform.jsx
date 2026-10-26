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
  clientSignIn,
  clientCreateJudge,
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

      if (subList.length > 0) saveStoredSubmissions(subList);
      if (judgeList.length > 0) {
        const otherUsers = getStoredUsers().filter((u) => u.role !== "judge");
        saveStoredUsers([...otherUsers, ...judgeList]);
      }
    } catch (err) {
      console.warn("Backend API unreachable, using resilient client storage:", err.message);
      const localSubs = getStoredSubmissions();
      const localUsers = getStoredUsers();
      const localJudges = localUsers.filter((u) => u.role === "judge");
      setSubmissions(localSubs);
      setJudges(localJudges);
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
            <button
              type="button"
              onClick={handleDownloadCsv}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] text-xs font-semibold text-[var(--text)] hover:border-[var(--accent)] transition cursor-pointer"
            >
              <FiDownload className="h-3.5 w-3.5 text-[var(--accent)]" />
              <span>Export CSV</span>
            </button>

            <button
              type="button"
              onClick={fetchData}
              className="p-2 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] text-[var(--muted)] hover:text-[var(--text)] transition cursor-pointer"
              title="Refresh master data"
            >
              <FiRefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
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
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)]">
                    {submissions.length === 0 && (
                      <tr>
                        <td colSpan={6} className="text-center py-12 text-[var(--muted)]">
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

                          {/* Focus Area & Team Leader */}
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
                          </td>

                          {/* Media Uploads */}
                          <td className="px-4 py-3.5 space-y-1">
                            <div className="flex items-center gap-1.5 text-[11px]">
                              <FiVideo className="h-3 w-3 text-red-500" />
                              <span className="truncate max-w-[120px] text-[var(--text)]" title={videoName}>
                                {videoName}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 text-[11px]">
                              <FiFileText className="h-3 w-3 text-amber-500" />
                              <span className="truncate max-w-[120px] text-[var(--text)]" title={docName}>
                                {docName}
                              </span>
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
                      <th className="px-4 py-3">Organization</th>
                      <th className="px-4 py-3">Specialization Track</th>
                      <th className="px-4 py-3">Alloted Teams Count</th>
                      <th className="px-4 py-3">Registered Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)]">
                    {judges.length === 0 && (
                      <tr>
                        <td colSpan={6} className="text-center py-12 text-[var(--muted)]">
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

                      return (
                        <tr key={judge.email} className="hover:bg-[var(--surface-2)]/50 transition">
                          <td className="px-4 py-3.5 font-bold text-[var(--text)]">
                            {judge.name}
                          </td>
                          <td className="px-4 py-3.5 font-mono text-[var(--muted)]">
                            {judge.email}
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
      </AnimatePresence>
    </div>
  );
};

export default AdminJuryzaPlatform;
