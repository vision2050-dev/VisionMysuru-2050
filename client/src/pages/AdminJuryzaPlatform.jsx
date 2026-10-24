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
} from "../services/juryzaStorage";
import ThemeToggle from "../Components/ThemeToggle";

export const AdminJuryzaPlatform = () => {
  const navigate = useNavigate();
  const [adminEmail, setAdminEmail] = useState("");
  const [adminName, setAdminName] = useState("");
  const [submissions, setSubmissions] = useState([]);
  const [judges, setJudges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("submissions"); // "submissions" | "judges"

  // Allocation state
  const [allocating, setAllocating] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("juryzaToken");
    const role = localStorage.getItem("juryzaRole");
    const email = localStorage.getItem("juryzaEmail");
    const name = localStorage.getItem("juryzaName");

    // Strict role check: Must have admin role
    if (!token || role !== "admin") {
      toast.error("you do not have admin access");
      localStorage.removeItem("juryzaToken");
      localStorage.removeItem("juryzaRole");
      localStorage.removeItem("juryzaEmail");
      localStorage.removeItem("adminToken");
      navigate("/juryza");
      return;
    }

    setAdminEmail(email || "admin@sdmimd.ac.in");
    setAdminName(name || "Administrator");
    fetchData();
  }, [navigate]);

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
    } catch (err) {
      console.warn("Backend API status patch failed, updating local storage:", err.message);
    }

    // Always ensure local state is synced
    updateStoredSubmissionStage(teamId, newStage);
    setSubmissions((prev) =>
      prev.map((s) => (s.teamId === teamId ? { ...s, stage: newStage } : s)),
    );
    toast.success(`Team ${teamId} stage changed to '${newStage}'!`);
  };

  // Single Judge Allocation
  const handleJudgeAllocation = async (teamId, judgeEmail) => {
    try {
      await api.post("/api/v2/admin/allocate", {
        teamId,
        judgeEmail,
        mode: "single",
      });
    } catch (err) {
      console.warn("Backend API allocation failed, updating local storage:", err.message);
    }

    allocateStoredSubmission(teamId, judgeEmail);
    toast.success(`Team ${teamId} alloted to ${judgeEmail}!`);
    fetchData();
  };

  // Auto-Allocate All Teams Evenly Across Judges
  const handleAutoAllocate = async () => {
    if (judges.length === 0) {
      toast.error("No judges are registered yet. Please register judges first.");
      return;
    }

    setAllocating(true);
    try {
      const res = await api.post("/api/v2/admin/allocate", { mode: "auto" });
      toast.success(res.data.message || "All teams automatically alloted across judges!");
      fetchData();
    } catch (err) {
      console.warn("Backend auto-allocate failed, running local auto-allocation:", err.message);
      autoAllocateStoredSubmissions();
      toast.success("All teams automatically alloted across judges!");
      fetchData();
    } finally {
      setAllocating(false);
    }
  };

  const handleDownloadSpreadsheet = () => {
    // Attempt backend file stream or fallback to browser CSV export
    const base = api.defaults.baseURL || "http://localhost:5001";
    try {
      window.open(`${base}/api/v2/spreadsheet/download`, "_blank");
    } catch {
      exportClientSpreadsheetCsv();
    }
  };

  const handleDownloadCsv = () => {
    exportClientSpreadsheetCsv();
    toast.success("Master Spreadsheet CSV downloaded!");
  };

  const handleLogout = () => {
    localStorage.removeItem("juryzaToken");
    localStorage.removeItem("juryzaRole");
    localStorage.removeItem("juryzaEmail");
    localStorage.removeItem("adminToken");
    toast.success("Signed out from Admin Control Room.");
    navigate("/juryza");
  };

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
                Admin Control Room • Vision Mysuru 2050
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-mono font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20 truncate max-w-[200px]">
              {adminEmail}
            </span>

            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-2.5 py-1.5 text-xs font-semibold text-[var(--text)] hover:bg-red-500/10 hover:border-red-500/30 hover:text-red-600 transition cursor-pointer"
              title="Sign Out"
            >
              <FiLogOut className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
            <ThemeToggle size="sm" />
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 space-y-6">
        {/* Top Control Bar & Spreadsheet Download */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-6 rounded-3xl border border-[var(--border)] bg-[var(--surface)] shadow-md">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 mb-2">
              <FiShield className="h-3.5 w-3.5" />
              <span>Master Administrative Console</span>
            </div>
            <h1 className="oswald text-2xl sm:text-3xl font-extrabold uppercase text-[var(--text)]">
              Event Submissions & Jury Allocations
            </h1>
            <p className="text-xs text-[var(--muted)] mt-0.5">
              Manage participant registrations, allocate submissions to judges, and update submission progress states.
            </p>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Auto Allocate Button */}
            <button
              type="button"
              onClick={handleAutoAllocate}
              disabled={allocating || judges.length === 0}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--primary)] text-white px-3.5 py-2 text-xs font-bold shadow-sm hover:bg-[var(--primary-hover)] transition cursor-pointer"
            >
              <FiUserCheck className="h-3.5 w-3.5" />
              <span>{allocating ? "Allocating..." : "Auto-Allocate Teams"}</span>
            </button>

            {/* Download Master Spreadsheet */}
            <button
              type="button"
              onClick={handleDownloadCsv}
              className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 px-3.5 py-2 text-xs font-bold hover:bg-emerald-500/20 transition cursor-pointer"
            >
              <FiDownload className="h-3.5 w-3.5" />
              <span>Export Master Spreadsheet (.CSV)</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadSpreadsheet}
              className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] text-[var(--text)] px-3 py-2 text-xs font-semibold hover:bg-[var(--surface)] transition cursor-pointer"
            >
              <span>Server .xlsx</span>
            </button>

            <a
              href="https://drive.google.com/drive/folders/1UKXUmqcMewEhw_KG7L1Fe740yCd6fX2e"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] text-[var(--text)] px-3 py-2 text-xs font-semibold hover:border-[var(--accent)] transition"
            >
              <span>Google Drive</span>
              <FiExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">
              Total Submissions
            </span>
            <div className="oswald text-2xl sm:text-3xl font-extrabold text-[var(--text)] mt-1">
              {submissions.length}
            </div>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-1 block font-medium">
              Teams registered
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
              {submissions.filter((s) => s.allotedJudges?.length > 0).length}
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
            Registered Judges Roster ({judges.length})
          </button>
        </div>

        {/* Tab 1: Master Submissions Table */}
        {activeTab === "submissions" ? (
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
                  {submissions.map((sub) => {
                    const leader = sub.members?.find((m) => m.isLeader) || sub.members?.[0] || {};
                    const assignedJudgeEmail = sub.allotedJudges?.[0] || "";

                    return (
                      <tr key={sub.teamId} className="hover:bg-[var(--surface-2)]/50 transition">
                        {/* Team Details */}
                        <td className="px-4 py-3.5">
                          <span className="font-mono font-bold text-[10px] text-[var(--accent)] block">
                            {sub.teamId}
                          </span>
                          <strong className="text-sm text-[var(--text)] block mt-0.5">
                            {sub.teamName}
                          </strong>
                          <span className="text-[10px] uppercase text-[var(--muted)] font-semibold">
                            {sub.category}
                          </span>
                        </td>

                        {/* Focus Area & Leader */}
                        <td className="px-4 py-3.5 max-w-[200px]">
                          <span className="text-[11px] font-medium text-[var(--text)] block truncate">
                            {sub.theme}
                          </span>
                          <span className="text-[11px] text-[var(--muted)] block mt-1">
                            {leader.name || "N/A"} ({leader.email || sub.participantEmail || "N/A"})
                          </span>
                        </td>

                        {/* Compulsory Files (.mp4 & .pdf) */}
                        <td className="px-4 py-3.5">
                          <div className="flex flex-col gap-1">
                            <span className="inline-flex items-center gap-1 text-[11px] text-[var(--primary)] font-semibold">
                              <FiVideo className="h-3 w-3" />
                              <span>{sub.video?.originalName || "Pitch.mp4"}</span>
                            </span>
                            <span className="inline-flex items-center gap-1 text-[11px] text-[var(--accent)] font-semibold">
                              <FiFileText className="h-3 w-3" />
                              <span>{sub.document?.originalName || sub.document?.name || "Proposal.pdf"}</span>
                            </span>
                          </div>
                        </td>

                        {/* Alloted Judge Dropdown */}
                        <td className="px-4 py-3.5">
                          <select
                            value={assignedJudgeEmail}
                            onChange={(e) => handleJudgeAllocation(sub.teamId, e.target.value)}
                            className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1 text-xs text-[var(--text)] focus:outline-none"
                          >
                            <option value="">-- Unalloted --</option>
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
                            className="rounded-lg border border-[var(--primary)]/40 bg-[var(--surface-2)] px-2.5 py-1 text-xs font-semibold text-[var(--text)] focus:outline-none"
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
        ) : (
          /* Tab 2: Registered Judges Roster */
          <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[var(--surface-2)] text-[var(--muted)] uppercase tracking-wider text-[10px] border-b border-[var(--border)]">
                  <tr>
                    <th className="px-4 py-3">Judge Name</th>
                    <th className="px-4 py-3">Gmail ID</th>
                    <th className="px-4 py-3">Organization</th>
                    <th className="px-4 py-3">Specialization Track</th>
                    <th className="px-4 py-3">Alloted Teams Count</th>
                    <th className="px-4 py-3">Registration Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {judges.map((judge) => {
                    const allotedCount = Array.isArray(judge.allotedTeams)
                      ? judge.allotedTeams.length
                      : submissions.filter((s) => s.allotedJudges?.includes(judge.email)).length;

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
                            {allotedCount} teams
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-[var(--muted)]">
                          {new Date(judge.createdAt).toLocaleDateString("en-IN")}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminJuryzaPlatform;
