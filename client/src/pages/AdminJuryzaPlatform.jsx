import { useState, useEffect, useMemo, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-hot-toast";
import {
  FiShield,
  FiUsers,
  FiCheckCircle,
  FiVideo,
  FiFileText,
  FiPlus,
  FiTrash2,
  FiRefreshCw,
  FiFilter,
  FiAward,
  FiLogOut,
  FiChevronRight,
  FiEye,
  FiX,
  FiUserCheck,
  FiAlertCircle,
  FiSearch,
} from "react-icons/fi";
import api from "../utils/api";
import ThemeToggle from "../Components/ThemeToggle";
import { TOPIC_OPTIONS, CATEGORY } from "../constants/content";

const ADMIN_EMAIL = "visionmysuru2050@sdmimd.ac.in";

export const AdminJuryzaPlatform = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("allocations"); // "allocations" | "submissions" | "leaderboard"

  // Data states
  const [submissions, setSubmissions] = useState([]);
  const [judges, setJudges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [previewDocument, setPreviewDocument] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("All");
  const [filterJudge, setFilterJudge] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");

  // New Judge modal state
  const [showAddJudgeModal, setShowAddJudgeModal] = useState(false);
  const [newJudge, setNewJudge] = useState({
    name: "",
    email: "",
    organization: "SDMIMD Panel",
    assignedDomain: "All",
  });
  const [submittingJudge, setSubmittingJudge] = useState(false);
  const [autoAllocating, setAutoAllocating] = useState(false);

  // Authenticate Admin access strictly to visionmysuru2050@sdmimd.ac.in
  const currentUserEmail = (localStorage.getItem("juryzaUserEmail") || "").toLowerCase().trim();
  const isAuthorized = currentUserEmail === ADMIN_EMAIL.toLowerCase();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [subsRes, judgesRes] = await Promise.all([
        api.get("/api/v2/submissions"),
        api.get("/api/v2/judges"),
      ]);
      setSubmissions(subsRes.data?.data || []);
      setJudges(judgesRes.data?.data || []);
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to load admin data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthorized) {
      fetchData();
    }
  }, [isAuthorized, fetchData]);

  const handleLogout = () => {
    localStorage.removeItem("juryzaToken");
    localStorage.removeItem("juryzaUser");
    localStorage.removeItem("juryzaUserEmail");
    localStorage.removeItem("juryzaRole");
    toast.success("Admin logged out");
    navigate("/login?role=admin");
  };

  // Add Judge
  const handleAddJudge = async (e) => {
    e.preventDefault();
    if (!newJudge.name || !newJudge.email) {
      toast.error("Name and Gmail address are required");
      return;
    }
    setSubmittingJudge(true);
    try {
      const res = await api.post("/api/v2/judges", newJudge);
      toast.success(res.data?.message || "Judge added successfully");
      setShowAddJudgeModal(false);
      setNewJudge({ name: "", email: "", organization: "SDMIMD Panel", assignedDomain: "All" });
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to add judge");
    } finally {
      setSubmittingJudge(false);
    }
  };

  // Remove Judge
  const handleDeleteJudge = async (judgeId) => {
    if (!window.confirm("Remove this judge and unassign all their submissions?")) return;
    try {
      await api.delete(`/api/v2/judges/${judgeId}`);
      toast.success("Judge removed and submissions unassigned");
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete judge");
    }
  };

  // Allocate Single Submission to a Judge
  const handleAllocate = async (submissionId, judgeEmail, judgeName) => {
    try {
      await api.patch(`/api/v2/submissions/${submissionId}/allocate`, {
        judgeEmail,
        judgeName,
      });
      toast.success("Submission allocated successfully");
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to allocate");
    }
  };

  // Auto Allocate Submissions Evenly
  const handleAutoAllocate = async () => {
    if (
      !window.confirm(
        "Auto-allocate all unassigned submissions evenly among active judges in round-robin fashion?",
      )
    ) {
      return;
    }
    setAutoAllocating(true);
    try {
      const res = await api.post("/api/v2/submissions/auto-allocate");
      toast.success(res.data?.message || "Submissions distributed evenly!");
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Auto-allocation failed");
    } finally {
      setAutoAllocating(false);
    }
  };

  // Update Status / Progress State
  const handleUpdateStatus = async (submissionId, newStatus) => {
    try {
      await api.patch(`/api/v2/submissions/${submissionId}/status`, {
        status: newStatus,
        progressState: newStatus,
      });
      toast.success(`Submission advanced to ${newStatus.replace(/_/g, " ").toUpperCase()}`);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update status");
    }
  };

  // Media URLs
  const getFullMediaUrl = (url) => {
    if (!url) return "";
    if (url.startsWith("http://") || url.startsWith("https://")) return url;
    const base = api.defaults.baseURL || "http://localhost:5001";
    return `${base.replace(/\/$/, "")}${url.startsWith("/") ? url : `/${url}`}`;
  };

  // Filtered submissions
  const filteredSubmissions = useMemo(() => {
    return submissions.filter((sub) => {
      const matchesSearch =
        sub.teamName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sub.teamId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sub.solutionName?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = filterCategory === "All" || sub.category === filterCategory;
      const matchesJudge =
        filterJudge === "All" ||
        (filterJudge === "unassigned" ? !sub.assignedJudgeEmail : sub.assignedJudgeEmail === filterJudge);
      const matchesStatus = filterStatus === "All" || sub.status === filterStatus;

      return matchesSearch && matchesCategory && matchesJudge && matchesStatus;
    });
  }, [submissions, searchQuery, filterCategory, filterJudge, filterStatus]);

  // If not authorized, display restricted access view
  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] dm-sans flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full rounded-3xl border border-red-500/30 bg-[var(--surface)] p-8 text-center shadow-2xl">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/15 text-red-500 mb-4">
            <FiShield className="h-8 w-8" />
          </div>
          <h2 className="oswald text-2xl font-bold uppercase text-[var(--text)]">
            Restricted Admin Portal
          </h2>
          <p className="mt-2 text-sm text-[var(--muted)] leading-relaxed">
            The Admin Portal is strictly restricted to{" "}
            <code className="rounded bg-red-500/10 px-2 py-0.5 font-bold text-red-600 dark:text-red-400">
              {ADMIN_EMAIL}
            </code>
            . Your currently signed-in account is not authorized.
          </p>
          <div className="mt-6 flex flex-col gap-2">
            <Link
              to="/login?role=admin"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--primary)] px-4 py-2.5 text-sm font-bold text-white shadow-md hover:bg-[var(--primary-hover)] transition"
            >
              Sign In as Official Admin
            </Link>
            <Link
              to="/"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-4 py-2.5 text-sm font-semibold hover:bg-[var(--surface)] transition"
            >
              Back to Main Site
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] dm-sans flex flex-col">
      {/* Header */}
      <header className="border-b border-[var(--border)] bg-[var(--surface)]/95 backdrop-blur-md sticky top-0 z-40">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2 text-sm font-bold text-[var(--text)]">
              <img src="/logo_final.png" alt="Logo" className="h-8 w-auto inline-block" />
              <span className="hidden sm:inline">Vision Mysuru 2050</span>
            </Link>
            <span className="rounded-full bg-red-500/15 border border-red-500/30 px-2.5 py-0.5 text-xs font-bold text-red-600 dark:text-red-400 flex items-center gap-1.5">
              <FiShield className="h-3 w-3" /> Master Admin Platform
            </span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <span className="hidden md:inline-block text-xs font-mono text-[var(--muted)]">
              {currentUserEmail}
            </span>
            <ThemeToggle size="sm" />
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs font-bold text-red-600 dark:text-red-400 hover:bg-red-500/20 transition"
            >
              <FiLogOut className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Body */}
      <main className="flex-1 mx-auto w-full max-w-7xl px-4 py-6 sm:px-6">
        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border)] pb-4 mb-6">
          <div className="flex items-center gap-2 p-1 rounded-2xl bg-[var(--surface-2)] border border-[var(--border)]">
            <button
              onClick={() => setActiveTab("allocations")}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
                activeTab === "allocations"
                  ? "bg-[var(--surface)] text-[var(--text)] shadow-sm"
                  : "text-[var(--muted)] hover:text-[var(--text)]"
              }`}
            >
              <FiUserCheck className="h-4 w-4 text-amber-500" />
              <span>Jury Allocations ({submissions.length})</span>
            </button>

            <button
              onClick={() => setActiveTab("submissions")}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
                activeTab === "submissions"
                  ? "bg-[var(--surface)] text-[var(--text)] shadow-sm"
                  : "text-[var(--muted)] hover:text-[var(--text)]"
              }`}
            >
              <FiFileText className="h-4 w-4 text-blue-500" />
              <span>All Registrations & Pitches</span>
            </button>

            <button
              onClick={() => setActiveTab("leaderboard")}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
                activeTab === "leaderboard"
                  ? "bg-[var(--surface)] text-[var(--text)] shadow-sm"
                  : "text-[var(--muted)] hover:text-[var(--text)]"
              }`}
            >
              <FiAward className="h-4 w-4 text-emerald-500" />
              <span>Juryza Leaderboard & Duels</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchData}
              className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs font-semibold hover:bg-[var(--surface-2)] transition"
            >
              <FiRefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* TAB 1: ALLOCATION HUB */}
        {activeTab === "allocations" && (
          <div className="space-y-6">
            {/* Action Bar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm">
              <div>
                <h2 className="text-base font-bold text-[var(--text)]">Jury Panel & Submission Allocations</h2>
                <p className="text-xs text-[var(--muted)] mt-0.5">
                  Allocate participant submissions to judges. Each judge will only see and score the teams alloted to them.
                </p>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  onClick={handleAutoAllocate}
                  disabled={autoAllocating || judges.length === 0}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-black font-bold px-4 py-2 text-xs shadow-md transition disabled:opacity-50"
                >
                  <FiRefreshCw className={`h-3.5 w-3.5 ${autoAllocating ? "animate-spin" : ""}`} />
                  <span>Auto-Allocate Evenly</span>
                </button>

                <button
                  onClick={() => setShowAddJudgeModal(true)}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white font-bold px-4 py-2 text-xs shadow-md transition"
                >
                  <FiPlus className="h-3.5 w-3.5" />
                  <span>Add Judge</span>
                </button>
              </div>
            </div>

            {/* Judges Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {judges.map((judge) => (
                <div
                  key={judge._id || judge.email}
                  className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm hover:border-[var(--accent)]/50 transition relative overflow-hidden flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 font-bold text-sm">
                        {judge.name.charAt(0)}
                      </div>
                      <button
                        onClick={() => handleDeleteJudge(judge._id)}
                        className="text-[var(--muted)] hover:text-red-500 transition p-1"
                        title="Remove Judge"
                      >
                        <FiTrash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <h3 className="mt-3 text-sm font-bold text-[var(--text)]">{judge.name}</h3>
                    <p className="text-xs text-[var(--muted)] font-mono truncate">{judge.email}</p>
                    <p className="mt-1 text-[11px] font-medium text-[var(--accent)]">{judge.organization}</p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-[var(--border)] flex items-center justify-between text-xs">
                    <span className="text-[var(--muted)]">Alloted Submissions:</span>
                    <span className="font-mono font-bold text-[var(--text)] rounded-md bg-[var(--surface-2)] px-2 py-0.5">
                      {judge.allocatedCount || 0} teams
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Allocation Table */}
            <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden shadow-sm">
              <div className="p-4 border-b border-[var(--border)] flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <FiFilter className="text-[var(--muted)]" />
                  <span className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
                    Allocation Table ({filteredSubmissions.length})
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative">
                    <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)] h-3.5 w-3.5" />
                    <input
                      type="text"
                      placeholder="Search team or ID..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)] pl-8 pr-3 py-1.5 text-xs focus:outline-none"
                    />
                  </div>

                  <select
                    value={filterJudge}
                    onChange={(e) => setFilterJudge(e.target.value)}
                    className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-3 py-1.5 text-xs font-medium focus:outline-none"
                  >
                    <option value="All">All Judges</option>
                    <option value="unassigned">Unassigned Only</option>
                    {judges.map((j) => (
                      <option key={j.email} value={j.email}>
                        {j.name} ({j.allocatedCount || 0})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[var(--surface-2)] text-[var(--muted)] border-b border-[var(--border)] uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="p-3.5">Team ID / Name</th>
                      <th className="p-3.5">Thematic Area</th>
                      <th className="p-3.5">Category</th>
                      <th className="p-3.5">Assigned Judge</th>
                      <th className="p-3.5">Progress State</th>
                      <th className="p-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)]">
                    {filteredSubmissions.map((sub) => (
                      <tr key={sub._id} className="hover:bg-[var(--surface-2)]/50 transition">
                        <td className="p-3.5">
                          <p className="font-mono font-bold text-[var(--accent)] text-xs">{sub.teamId}</p>
                          <p className="font-semibold text-[var(--text)]">{sub.teamName}</p>
                        </td>
                        <td className="p-3.5 text-[var(--text)] max-w-xs truncate">{sub.theme}</td>
                        <td className="p-3.5 uppercase font-medium text-[var(--muted)] text-[11px]">
                          {sub.category}
                        </td>
                        <td className="p-3.5">
                          <select
                            value={sub.assignedJudgeEmail || ""}
                            onChange={(e) => {
                              const selected = judges.find((j) => j.email === e.target.value);
                              handleAllocate(sub._id, e.target.value, selected?.name);
                            }}
                            className={`rounded-xl border px-2.5 py-1 text-xs font-semibold focus:outline-none ${
                              sub.assignedJudgeEmail
                                ? "border-amber-500/40 bg-amber-500/10 text-amber-800 dark:text-amber-300"
                                : "border-red-500/40 bg-red-500/10 text-red-700 dark:text-red-400"
                            }`}
                          >
                            <option value="">-- Unassigned --</option>
                            {judges.map((j) => (
                              <option key={j.email} value={j.email}>
                                {j.name}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="p-3.5">
                          <span className="rounded-full bg-[var(--surface-2)] border border-[var(--border)] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">
                            {sub.progressState || sub.status || "submitted"}
                          </span>
                        </td>
                        <td className="p-3.5 text-right">
                          <button
                            onClick={() => setSelectedSubmission(sub)}
                            className="inline-flex items-center gap-1 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1 text-xs font-semibold hover:bg-[var(--surface-2)] transition"
                          >
                            <FiEye className="h-3 w-3" />
                            <span>Details</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: MASTER SUBMISSIONS & ADVANCEMENTS */}
        {activeTab === "submissions" && (
          <div className="space-y-6">
            <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden shadow-sm">
              <div className="p-4 border-b border-[var(--border)] flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-[var(--text)]">Master Submissions & Advancements</h3>
                  <p className="text-xs text-[var(--muted)]">Admin has full control to view and edit all team states</p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-3 py-1.5 text-xs font-medium focus:outline-none"
                  >
                    <option value="All">All Categories</option>
                    <option value="students">Students</option>
                    <option value="citizens">Citizens</option>
                    <option value="corporates">Corporates</option>
                    <option value="ngos">NGOs</option>
                  </select>

                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-3 py-1.5 text-xs font-medium focus:outline-none"
                  >
                    <option value="All">All States</option>
                    <option value="submitted">Submitted</option>
                    <option value="allocated">Allocated to Judge</option>
                    <option value="under_evaluation">Under Evaluation</option>
                    <option value="round_1_shortlisted">Round 1 Shortlisted</option>
                    <option value="round_1_rejected">Round 1 Rejected</option>
                    <option value="round_2_shortlisted">Round 2 Shortlisted</option>
                    <option value="grand_finale_shortlisted">Grand Finale</option>
                    <option value="winner">Winner 🌟</option>
                  </select>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[var(--surface-2)] text-[var(--muted)] border-b border-[var(--border)] uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="p-3.5">Team</th>
                      <th className="p-3.5">Solution</th>
                      <th className="p-3.5">Assigned Jury</th>
                      <th className="p-3.5">Media Links</th>
                      <th className="p-3.5">Current State</th>
                      <th className="p-3.5 text-right">Advance / Set State</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)]">
                    {filteredSubmissions.map((sub) => (
                      <tr key={sub._id} className="hover:bg-[var(--surface-2)]/50 transition">
                        <td className="p-3.5">
                          <p className="font-bold text-[var(--text)]">{sub.teamName}</p>
                          <p className="text-[11px] font-mono text-[var(--accent)]">{sub.teamId}</p>
                          <p className="text-[10px] text-[var(--muted)]">{sub.createdByEmail || sub.members?.[0]?.email}</p>
                        </td>
                        <td className="p-3.5 max-w-xs">
                          <p className="font-semibold text-[var(--text)] truncate">{sub.solutionName}</p>
                          <p className="text-[11px] text-[var(--muted)] truncate">{sub.theme}</p>
                        </td>
                        <td className="p-3.5">
                          {sub.assignedJudgeName ? (
                            <div>
                              <p className="font-bold text-xs text-[var(--text)]">{sub.assignedJudgeName}</p>
                              <p className="text-[10px] text-[var(--muted)] font-mono">{sub.assignedJudgeEmail}</p>
                            </div>
                          ) : (
                            <span className="text-red-500 font-bold text-[11px]">Unassigned</span>
                          )}
                        </td>
                        <td className="p-3.5">
                          <div className="flex items-center gap-2">
                            {sub.video?.url && (
                              <a
                                href={getFullMediaUrl(sub.video.url)}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 px-2 py-0.5 text-[10px] font-bold"
                              >
                                <FiVideo className="h-3 w-3" /> Pitch
                              </a>
                            )}
                            {sub.document?.url && (
                              <button
                                onClick={() =>
                                  setPreviewDocument({
                                    url: getFullMediaUrl(sub.document.url),
                                    name: sub.document.name,
                                  })
                                }
                                className="inline-flex items-center gap-1 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 px-2 py-0.5 text-[10px] font-bold"
                              >
                                <FiFileText className="h-3 w-3" /> Doc
                              </button>
                            )}
                          </div>
                        </td>
                        <td className="p-3.5">
                          <span className="rounded-full bg-[var(--surface-2)] border border-[var(--border)] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[var(--text)]">
                            {sub.progressState || sub.status}
                          </span>
                        </td>
                        <td className="p-3.5 text-right">
                          <select
                            value={sub.progressState || sub.status || "submitted"}
                            onChange={(e) => handleUpdateStatus(sub._id, e.target.value)}
                            className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1 text-xs font-semibold focus:outline-none"
                          >
                            <option value="submitted">1. Submitted</option>
                            <option value="allocated">2. Allocated to Judge</option>
                            <option value="under_evaluation">3. Under Evaluation</option>
                            <option value="round_1_shortlisted">4. Round 1 Shortlisted</option>
                            <option value="round_1_rejected">4. Round 1 Not Shortlisted</option>
                            <option value="round_2_shortlisted">5. Round 2 Shortlisted</option>
                            <option value="round_2_rejected">5. Round 2 Not Shortlisted</option>
                            <option value="grand_finale_shortlisted">6. Grand Finale</option>
                            <option value="winner">7. Winner 🌟</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: LEADERBOARD & JURY OVERVIEW */}
        {activeTab === "leaderboard" && (
          <div className="space-y-6">
            <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden shadow-sm">
              <div className="p-4 border-b border-[var(--border)]">
                <h3 className="text-sm font-bold text-[var(--text)]">Juryza Live Elo & Rubric Leaderboard</h3>
                <p className="text-xs text-[var(--muted)]">All teams ranked statistically across all jury evaluations</p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[var(--surface-2)] text-[var(--muted)] border-b border-[var(--border)] uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="p-3.5">Rank</th>
                      <th className="p-3.5">Team</th>
                      <th className="p-3.5">Thematic Track</th>
                      <th className="p-3.5">Normalized Z-Score</th>
                      <th className="p-3.5">Elo Rating</th>
                      <th className="p-3.5">Rubric Avg</th>
                      <th className="p-3.5">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)]">
                    {submissions.map((sub, idx) => (
                      <tr key={sub._id} className="hover:bg-[var(--surface-2)]/50 transition">
                        <td className="p-3.5 font-black text-amber-500 font-mono text-sm">#{idx + 1}</td>
                        <td className="p-3.5">
                          <p className="font-bold text-[var(--text)]">{sub.teamName}</p>
                          <p className="text-[10px] text-[var(--muted)] font-mono">{sub.teamId}</p>
                        </td>
                        <td className="p-3.5 text-[var(--text)]">{sub.theme}</td>
                        <td className="p-3.5">
                          <span
                            className={`font-mono font-bold px-2 py-0.5 rounded ${
                              (sub.zScore || 0) >= 1
                                ? "bg-emerald-500/20 text-emerald-500"
                                : (sub.zScore || 0) >= 0
                                  ? "bg-amber-500/20 text-amber-500"
                                  : "bg-red-500/20 text-red-500"
                            }`}
                          >
                            {(sub.zScore || 0) > 0 ? `+${sub.zScore}` : sub.zScore || "0.00"}σ
                          </span>
                        </td>
                        <td className="p-3.5 font-mono font-bold text-[var(--text)]">{sub.eloRating || 1200}</td>
                        <td className="p-3.5 font-mono text-[var(--muted)]">{sub.rubricAverage || 0} / 40</td>
                        <td className="p-3.5">
                          <span className="rounded-full bg-[var(--surface-2)] border border-[var(--border)] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[var(--text)]">
                            {sub.progressState || sub.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Modal: Add Judge */}
      <AnimatePresence>
        {showAddJudgeModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-2xl relative"
            >
              <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
                <h3 className="text-base font-bold text-[var(--text)]">Add Jury Member</h3>
                <button
                  onClick={() => setShowAddJudgeModal(false)}
                  className="rounded-lg p-1.5 text-[var(--muted)] hover:bg-[var(--surface-2)]"
                >
                  <FiX className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handleAddJudge} className="mt-4 space-y-3.5 text-xs">
                <div>
                  <label className="block font-bold text-[var(--muted)] mb-1">Judge Name</label>
                  <input
                    type="text"
                    required
                    value={newJudge.name}
                    onChange={(e) => setNewJudge({ ...newJudge, name: e.target.value })}
                    placeholder="e.g. Dr. Rajeshwari Rao"
                    className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-3.5 py-2 font-medium focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[var(--muted)] mb-1">Judge Gmail ID</label>
                  <input
                    type="email"
                    required
                    value={newJudge.email}
                    onChange={(e) => setNewJudge({ ...newJudge, email: e.target.value })}
                    placeholder="e.g. rajeshwari.jury@gmail.com"
                    className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-3.5 py-2 font-medium focus:outline-none"
                  />
                  <p className="mt-1 text-[10px] text-[var(--muted)]">
                    * The judge will use this Gmail address to log in to their jury portal.
                  </p>
                </div>

                <div>
                  <label className="block font-bold text-[var(--muted)] mb-1">Organization / Department</label>
                  <input
                    type="text"
                    value={newJudge.organization}
                    onChange={(e) => setNewJudge({ ...newJudge, organization: e.target.value })}
                    placeholder="e.g. SDMIMD Panel / Industry Mentor"
                    className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-3.5 py-2 font-medium focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[var(--muted)] mb-1">Assigned Domain</label>
                  <select
                    value={newJudge.assignedDomain}
                    onChange={(e) => setNewJudge({ ...newJudge, assignedDomain: e.target.value })}
                    className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-3.5 py-2 font-medium focus:outline-none"
                  >
                    <option value="All">All Thematic Tracks</option>
                    {TOPIC_OPTIONS.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="pt-3 flex gap-2">
                  <button
                    type="submit"
                    disabled={submittingJudge}
                    className="flex-1 rounded-xl bg-[var(--primary)] py-2.5 font-bold text-white shadow-md hover:bg-[var(--primary-hover)] transition disabled:opacity-50"
                  >
                    {submittingJudge ? "Adding..." : "Add to Jury Panel"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddJudgeModal(false)}
                    className="rounded-xl border border-[var(--border)] px-4 py-2.5 font-semibold text-[var(--muted)] hover:bg-[var(--surface-2)]"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal: Submission Detail */}
      <AnimatePresence>
        {selectedSubmission && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-2xl rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-2xl max-h-[85vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
                <div>
                  <h3 className="text-base font-bold text-[var(--text)]">{selectedSubmission.teamName}</h3>
                  <p className="text-xs font-mono text-[var(--accent)]">{selectedSubmission.teamId}</p>
                </div>
                <button
                  onClick={() => setSelectedSubmission(null)}
                  className="rounded-lg p-1.5 text-[var(--muted)] hover:bg-[var(--surface-2)]"
                >
                  <FiX className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-4 space-y-4 text-xs">
                <div>
                  <h4 className="font-bold uppercase tracking-wider text-[var(--muted)]">Solution Name</h4>
                  <p className="mt-1 text-sm font-semibold text-[var(--text)]">{selectedSubmission.solutionName}</p>
                </div>

                <div>
                  <h4 className="font-bold uppercase tracking-wider text-[var(--muted)]">Short Description</h4>
                  <p className="mt-1 text-[var(--muted)] leading-relaxed">{selectedSubmission.shortDescription}</p>
                </div>

                <div>
                  <h4 className="font-bold uppercase tracking-wider text-[var(--muted)]">Team Members</h4>
                  <div className="mt-2 space-y-1.5">
                    {selectedSubmission.members?.map((m, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between rounded-xl bg-[var(--surface-2)] p-2.5"
                      >
                        <div>
                          <p className="font-bold text-[var(--text)]">
                            {m.name} {m.isLeader && <span className="text-[10px] text-amber-500 font-bold">(Leader)</span>}
                          </p>
                          <p className="text-[11px] text-[var(--muted)] font-mono">{m.email} · {m.phone}</p>
                        </div>
                        {m.college && <p className="text-[11px] text-[var(--muted)]">{m.college}</p>}
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-bold uppercase tracking-wider text-[var(--muted)]">Media Submissions</h4>
                  <div className="mt-2 flex gap-3">
                    {selectedSubmission.video?.url && (
                      <a
                        href={getFullMediaUrl(selectedSubmission.video.url)}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500/15 border border-amber-500/30 px-3 py-1.5 text-xs font-bold text-amber-700 dark:text-amber-300"
                      >
                        <FiVideo className="h-4 w-4" /> Watch Explainer Pitch
                      </a>
                    )}
                    {selectedSubmission.document?.url && (
                      <button
                        onClick={() =>
                          setPreviewDocument({
                            url: getFullMediaUrl(selectedSubmission.document.url),
                            name: selectedSubmission.document.name,
                          })
                        }
                        className="inline-flex items-center gap-1.5 rounded-xl bg-blue-500/15 border border-blue-500/30 px-3 py-1.5 text-xs font-bold text-blue-700 dark:text-blue-300"
                      >
                        <FiFileText className="h-4 w-4" /> Preview PDF Proposal
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal: Document Preview */}
      <AnimatePresence>
        {previewDocument && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-4xl rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-2xl flex flex-col max-h-[90vh]"
            >
              <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
                <h3 className="text-sm font-bold text-[var(--text)]">{previewDocument.name || "Proposal Document"}</h3>
                <button
                  onClick={() => setPreviewDocument(null)}
                  className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-2 text-[var(--muted)] hover:text-[var(--text)] transition"
                >
                  <FiX className="h-4 w-4" />
                </button>
              </div>
              <div className="flex-1 mt-3 rounded-2xl overflow-hidden bg-zinc-950 border border-[var(--border)]">
                <iframe
                  src={previewDocument.url}
                  title="Document Preview"
                  className="w-full h-full min-h-[60vh] bg-white rounded-xl"
                />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminJuryzaPlatform;
