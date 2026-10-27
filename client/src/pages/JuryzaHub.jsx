import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-hot-toast";
import {
  FiSliders,
  FiAward,
  FiZap,
  FiVideo,
  FiArrowLeft,
  FiCheck,
  FiRefreshCw,
  FiFileText,
  FiX,
  FiLogOut,
  FiExternalLink,
  FiClock,
  FiMail,
  FiLock,
  FiEye,
  FiEyeOff,
  FiArrowRight,
  FiAlertCircle,
  FiDownload,
} from "react-icons/fi";
import api from "../utils/api";
import {
  getStoredSubmissions,
  submitStoredRubricScore,
  updateStoredSubmissionStage,
  clientSignIn,
  getDriveFileId,
  getMediaBlobUrl,
} from "../services/juryzaStorage";
import ThemeToggle from "../Components/ThemeToggle";

export const JuryzaHub = () => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [judgeEmail, setJudgeEmail] = useState("");
  const [judgeName, setJudgeName] = useState("");

  // Judge Login form state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState("");

  const [activeTab, setActiveTab] = useState("rubric"); // "rubric" | "duel"
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [previewDocument, setPreviewDocument] = useState(null);

  // Rubric Scores
  const [scores, setScores] = useState({
    problemClarity: 8,
    innovationImpact: 8,
    feasibilityScalability: 7,
    technicalDepth: 8,
    videoPitchDelivery: 8,
  });
  const [feedback, setFeedback] = useState("");
  const [submittingScore, setSubmittingScore] = useState(false);

  // Status changer state
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Duel State
  const [duelPair, setDuelPair] = useState(null);
  const [votingDuel, setVotingDuel] = useState(false);

  useEffect(() => {
    const token =
      localStorage.getItem("juryzaJudgeToken") ||
      (localStorage.getItem("juryzaRole") === "judge" ? localStorage.getItem("juryzaToken") : null);
    const email =
      localStorage.getItem("juryzaJudgeEmail") ||
      (localStorage.getItem("juryzaRole") === "judge" ? localStorage.getItem("juryzaEmail") : null);
    const name =
      localStorage.getItem("juryzaJudgeName") ||
      (localStorage.getItem("juryzaRole") === "judge" ? localStorage.getItem("juryzaName") : null);

    if (token && email) {
      setIsAuthenticated(true);
      setJudgeEmail(email);
      setJudgeName(name || "Jury Member");
      fetchSubmissions();
      fetchDuelPair();
    } else {
      setIsAuthenticated(false);
      setLoading(false);
    }
  }, []);

  const handleJudgeLogin = async (e) => {
    e.preventDefault();
    setLoginError("");
    const cleanEmail = (loginEmail || "").toLowerCase().trim();

    if (!cleanEmail) {
      setLoginError("Please enter your registered Judge Gmail ID.");
      return;
    }
    if (!loginPassword) {
      setLoginError("Please enter your password.");
      return;
    }

    setLoginLoading(true);

    try {
      let authData = null;
      try {
        const res = await api.post("/api/v2/auth/signin", {
          email: cleanEmail,
          password: loginPassword,
          requestedRole: "judge",
        });
        authData = res.data;
      } catch (apiErr) {
        const status = apiErr.response?.status;
        const sMsg = apiErr.response?.data?.message;
        if (status === 401 || status === 403) {
          setLoginError(sMsg || "Invalid judge credentials or unauthorized account.");
          setLoginLoading(false);
          return;
        }

        // Local fallback
        authData = await clientSignIn({
          email: cleanEmail,
          password: loginPassword,
          requestedRole: "judge",
        });
      }

      if (authData && (authData.token || authData.user)) {
        const user = authData.user || {};
        const token = authData.token || `session-${Date.now()}`;
        const userRole = user.role || "judge";

        if (userRole !== "judge" && userRole !== "admin") {
          setLoginError("Access denied. This portal is strictly for appointed jury members.");
          setLoginLoading(false);
          return;
        }

        localStorage.setItem("juryzaJudgeToken", token);
        localStorage.setItem("juryzaJudgeRole", "judge");
        localStorage.setItem("juryzaJudgeEmail", user.email || cleanEmail);
        localStorage.setItem("juryzaJudgeName", user.name || "Jury Member");

        if (localStorage.getItem("juryzaRole") !== "admin") {
          localStorage.setItem("juryzaToken", token);
          localStorage.setItem("juryzaRole", "judge");
          localStorage.setItem("juryzaEmail", user.email || cleanEmail);
          localStorage.setItem("juryzaName", user.name || "Jury Member");
        }

        setJudgeEmail(user.email || cleanEmail);
        setJudgeName(user.name || "Jury Member");
        setIsAuthenticated(true);
        toast.success("Welcome to the Jury Evaluation Hub!");
        fetchSubmissions();
        fetchDuelPair();
      }
    } catch (err) {
      setLoginError(err.message || "Failed to authenticate judge. Please check your credentials.");
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("juryzaJudgeToken");
    localStorage.removeItem("juryzaJudgeRole");
    localStorage.removeItem("juryzaJudgeEmail");
    localStorage.removeItem("juryzaJudgeName");
    if (localStorage.getItem("juryzaRole") === "judge") {
      localStorage.removeItem("juryzaToken");
      localStorage.removeItem("juryzaRole");
      localStorage.removeItem("juryzaEmail");
      localStorage.removeItem("juryzaName");
    }
    setIsAuthenticated(false);
    setJudgeEmail("");
    setJudgeName("");
    toast.success("Signed out from Jury Hub.");
  };

  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      const res = await api.get("/api/v2/submissions");
      const list = Array.isArray(res.data) ? res.data : [];
      setSubmissions(list);
      if (list.length > 0 && !selectedSubmission) {
        setSelectedSubmission(list[0]);
      }
    } catch {
      // Local fallback
      const stored = getStoredSubmissions();
      const myEmail = (
        judgeEmail ||
        localStorage.getItem("juryzaJudgeEmail") ||
        localStorage.getItem("juryzaEmail") ||
        ""
      ).toLowerCase().trim();
      const myTeams = stored.filter(
        (s) =>
          (s.allotedJudges || []).map((j) => j.toLowerCase()).includes(myEmail) ||
          (s.allotedJudges || []).length === 0,
      );
      const displayList = myTeams.length > 0 ? myTeams : stored;
      setSubmissions(displayList);
      if (displayList.length > 0 && !selectedSubmission) {
        setSelectedSubmission(displayList[0]);
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchDuelPair = async () => {
    try {
      const res = await api.get("/api/v2/jury/duel/pair");
      const pair = res.data?.pair || [];
      if (pair.length >= 2) {
        setDuelPair(pair);
      } else {
        setDuelPair(null);
      }
    } catch {
      setDuelPair(null);
    }
  };

  const totalScore =
    Number(scores.problemClarity) +
    Number(scores.innovationImpact) +
    Number(scores.feasibilityScalability) +
    Number(scores.technicalDepth) +
    Number(scores.videoPitchDelivery);

  const handleScoreChange = (criteria, val) => {
    setScores((prev) => ({ ...prev, [criteria]: Number(val) }));
  };

  const submitEvaluation = async () => {
    if (!selectedSubmission) return;
    setSubmittingScore(true);

    try {
      await api.post("/api/v2/jury/rubric", {
        submissionId: selectedSubmission.teamId || selectedSubmission._id,
        rubric: scores,
        notes: feedback,
      });
    } catch (err) {
      console.warn("Backend evaluation post failed, applying local fallback:", err.message);
    }

    // Always record locally
    submitStoredRubricScore({
      teamId: selectedSubmission.teamId,
      judgeEmail,
      totalScore,
      feedback,
    });

    toast.success(
      `Evaluation recorded for ${selectedSubmission.teamName}! Total Score: ${totalScore}/50`,
    );
    setFeedback("");
    setSelectedSubmission((prev) => ({
      ...prev,
      rubricAverage: totalScore,
      stage: "under evaluation",
    }));
    fetchSubmissions();
    setSubmittingScore(false);
  };

  const handleStatusChange = async (newStage) => {
    if (!selectedSubmission) return;
    setUpdatingStatus(true);

    try {
      await api.patch(`/api/v2/submissions/${selectedSubmission.teamId}/status`, {
        stage: newStage,
      });
    } catch (err) {
      console.warn("Backend status patch failed, applying local fallback:", err.message);
    }

    // Always update locally
    updateStoredSubmissionStage(selectedSubmission.teamId, newStage);
    toast.success(`Team stage updated to '${newStage}'!`);
    setSelectedSubmission((prev) => ({ ...prev, stage: newStage }));
    fetchSubmissions();
    setUpdatingStatus(false);
  };

  const voteDuel = async (winnerId, loserId) => {
    setVotingDuel(true);
    try {
      await api.post("/api/v2/jury/duel", { winnerId, loserId });
      toast.success("Duel vote recorded! Recalculating Elo ranking...");
      fetchDuelPair();
      fetchSubmissions();
    } catch {
      toast.error("Failed to record duel vote.");
    } finally {
      setVotingDuel(false);
    }
  };

  useEffect(() => {
    if (selectedSubmission?.teamId) {
      // Always look up fresh IndexedDB blobs for the selected team
      getMediaBlobUrl(`video_${selectedSubmission.teamId}`).then((blobUrl) => {
        if (blobUrl) {
          setSelectedSubmission((prev) =>
            prev && prev.teamId === selectedSubmission.teamId
              ? { ...prev, videoBlobUrl: blobUrl }
              : prev,
          );
        }
      });
      getMediaBlobUrl(`doc_${selectedSubmission.teamId}`).then((blobUrl) => {
        if (blobUrl) {
          setSelectedSubmission((prev) =>
            prev && prev.teamId === selectedSubmission.teamId
              ? { ...prev, docBlobUrl: blobUrl }
              : prev,
          );
        }
      });
    }
  }, [selectedSubmission?.teamId]);

  const getVideoSrc = (sub) => {
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

  if (!isAuthenticated) {
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
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-red-500/15 text-[var(--primary)] mb-3">
                <FiAward className="h-6 w-6" />
              </div>
              <h1 className="text-xl font-bold text-[var(--text)]">
                Jury Evaluation Panel
              </h1>
              <p className="text-xs text-[var(--muted)] mt-1.5 leading-relaxed">
                Enter your official judge credentials provided by the organizing team to evaluate alloted submissions.
              </p>
            </div>

            {loginError && (
              <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-red-500/30 bg-red-500/10 p-3.5 text-xs text-red-600 dark:text-red-400">
                <FiAlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span className="font-semibold leading-relaxed">{loginError}</span>
              </div>
            )}

            <form onSubmit={handleJudgeLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[var(--text)] mb-1.5">
                  Judge Gmail / Email ID
                </label>
                <div className="relative">
                  <FiMail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--muted)] h-4 w-4" />
                  <input
                    type="email"
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="judge.gmail@gmail.com"
                    className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-2)] pl-10 pr-3.5 py-2.5 text-sm text-[var(--text)] placeholder-[var(--muted)] focus:border-[var(--primary)] focus:outline-none transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text)] mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <FiLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--muted)] h-4 w-4" />
                  <input
                    type={showLoginPassword ? "text" : "password"}
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="Enter judge password"
                    className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-2)] pl-10 pr-10 py-2.5 text-sm text-[var(--text)] placeholder-[var(--muted)] focus:border-[var(--primary)] focus:outline-none transition"
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
                className="w-full mt-2 inline-flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold text-white shadow-md bg-[var(--primary)] hover:bg-[var(--primary-hover)] transition-all duration-200 cursor-pointer disabled:opacity-60"
              >
                {loginLoading ? <span>Authenticating...</span> : (
                  <>
                    <span>Sign In to Evaluation Hub</span>
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
              <img src="/logo_final.png" alt="Logo" className="h-6 w-auto rounded-full" />
              <span className="text-xs sm:text-sm font-bold text-[var(--text)]">
                Jury Evaluation Hub
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex flex-col text-right">
              <span className="text-xs font-bold text-[var(--text)]">{judgeName}</span>
              <span className="text-[10px] text-[var(--muted)]">{judgeEmail}</span>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-2.5 py-1.5 text-xs font-semibold text-[var(--text)] hover:bg-red-500/10 hover:border-red-500/30 hover:text-red-600 transition"
              title="Sign Out / Switch Account"
            >
              <FiLogOut className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Switch / Logout</span>
            </button>
            <ThemeToggle size="sm" />
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 space-y-6">
        {/* Banner with Isolation Notice */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-5 rounded-3xl border border-[var(--border)] bg-[var(--surface)] shadow-md">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[var(--primary)]/30 bg-red-500/10 px-3 py-1 text-xs font-bold text-[var(--primary)] mb-1">
              <span>⚖️ Official Jury Evaluation Panel</span>
            </div>
            <h1 className="oswald text-xl sm:text-3xl font-extrabold uppercase text-[var(--text)]">
              Alloted Submissions Evaluation
            </h1>
            <p className="text-xs text-[var(--muted)]">
              You are evaluating only the team submissions alloted to your Gmail ID by the administration.
            </p>
          </div>

          {/* Mode Switcher */}
          <div className="inline-flex p-1 rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] shrink-0">
            <button
              type="button"
              onClick={() => setActiveTab("rubric")}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
                activeTab === "rubric"
                  ? "bg-[var(--surface)] text-[var(--text)] shadow-xs"
                  : "text-[var(--muted)] hover:text-[var(--text)]"
              }`}
            >
              <FiSliders className="h-3.5 w-3.5" />
              <span>Rubric Scoring</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("duel")}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
                activeTab === "duel"
                  ? "bg-[var(--surface)] text-[var(--text)] shadow-xs"
                  : "text-[var(--muted)] hover:text-[var(--text)]"
              }`}
            >
              <FiZap className="h-3.5 w-3.5 text-amber-500" />
              <span>Pairwise Duel</span>
            </button>
          </div>
        </div>

        {/* Content Tabs */}
        {loading ? (
          <div className="py-20 text-center">
            <div className="h-10 w-10 animate-spin rounded-full border-3 border-[var(--primary)] border-t-transparent mx-auto mb-4" />
            <p className="text-sm text-[var(--muted)]">Loading alloted submissions...</p>
          </div>
        ) : submissions.length === 0 ? (
          /* Empty state when no submissions are alloted */
          <div className="text-center py-20 px-4 rounded-3xl border border-[var(--border)] bg-[var(--surface)] shadow-md max-w-2xl mx-auto">
            <div className="h-14 w-14 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto mb-4 text-2xl">
              ⚖️
            </div>
            <h2 className="text-lg font-bold text-[var(--text)]">No Submissions Alloted Yet</h2>
            <p className="text-xs sm:text-sm text-[var(--muted)] mt-2 leading-relaxed">
              The administrator has not yet alloted team submissions to your account (<strong>{judgeEmail}</strong>).
              As soon as teams are alloted in the admin platform, they will appear here automatically.
            </p>
            <div className="mt-5">
              <button
                type="button"
                onClick={fetchSubmissions}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--primary)] text-white px-4 py-2 text-xs font-semibold hover:bg-[var(--primary-hover)] transition"
              >
                <FiRefreshCw className="h-3.5 w-3.5" />
                <span>Refresh Roster</span>
              </button>
            </div>
          </div>
        ) : activeTab === "rubric" ? (
          /* ==================================================== */
          /* TAB 1: RUBRIC EVALUATION                             */
          /* ==================================================== */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Sidebar: Alloted Teams Roster (4 Cols) */}
            <div className="lg:col-span-4 rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-md flex flex-col h-[750px]">
              <div className="flex items-center justify-between pb-3 border-b border-[var(--border)] mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
                  Alloted Teams ({submissions.length})
                </span>
                <button
                  type="button"
                  onClick={fetchSubmissions}
                  className="p-1 rounded-lg text-[var(--muted)] hover:text-[var(--text)] transition"
                  title="Refresh"
                >
                  <FiRefreshCw className="h-3.5 w-3.5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                {submissions.map((sub) => {
                  const isSelected = selectedSubmission?.teamId === sub.teamId;
                  return (
                    <button
                      key={sub.teamId}
                      type="button"
                      onClick={() => setSelectedSubmission(sub)}
                      className={`w-full text-left p-3 rounded-2xl border transition ${
                        isSelected
                          ? "border-[var(--primary)] bg-red-500/10 shadow-sm"
                          : "border-[var(--border)] bg-[var(--surface-2)] hover:bg-[var(--surface)]"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono font-bold text-[var(--accent)]">
                          {sub.teamId}
                        </span>
                        <span className="text-[10px] uppercase font-semibold text-[var(--muted)]">
                          {sub.category}
                        </span>
                      </div>
                      <h4 className="font-bold text-xs sm:text-sm text-[var(--text)] mt-1 truncate">
                        {sub.teamName}
                      </h4>
                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-[var(--border)]/50 text-[10px] text-[var(--muted)]">
                        <span>{sub.theme}</span>
                        <span className="capitalize font-semibold text-[var(--text)]">
                          {sub.stage || "submitted"}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Main Area: Video Player, Proposal & Rubric (8 Cols) */}
            <div className="lg:col-span-8 space-y-6">
              {selectedSubmission && (
                <>
                  {/* Team Summary & Stage Advancement Bar */}
                  <div className="p-6 rounded-3xl border border-[var(--border)] bg-[var(--surface)] shadow-md">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-[var(--accent)] bg-[var(--surface-2)] px-2 py-0.5 rounded">
                            {selectedSubmission.teamId}
                          </span>
                          <span className="text-xs uppercase font-semibold text-[var(--muted)]">
                            {selectedSubmission.category}
                          </span>
                        </div>
                        <h2 className="oswald text-xl sm:text-2xl font-bold uppercase text-[var(--text)] mt-1">
                          {selectedSubmission.teamName}
                        </h2>
                        <p className="text-xs text-[var(--muted)] mt-0.5">
                          {selectedSubmission.solutionName}
                        </p>
                      </div>

                      {/* Judge Stage Selector: Strictly restricted to evaluation / shortlist stages */}
                      <div className="flex flex-col items-end gap-1.5">
                        <span className="text-[10px] uppercase font-bold tracking-wider text-[var(--muted)]">
                          Judge Decision / Stage:
                        </span>
                        <select
                          disabled={updatingStatus}
                          value={selectedSubmission.stage || "under evaluation"}
                          onChange={(e) => handleStatusChange(e.target.value)}
                          className="rounded-xl border border-[var(--primary)]/50 bg-[var(--surface-2)] px-3 py-1.5 text-xs font-bold text-[var(--text)] focus:outline-none cursor-pointer"
                        >
                          {selectedSubmission.stage !== "under evaluation" &&
                            selectedSubmission.stage !== "shortlisted to next round" &&
                            selectedSubmission.stage !== "not shortlisted to next round" && (
                              <option value={selectedSubmission.stage} disabled>
                                Status: {selectedSubmission.stage}
                              </option>
                            )}
                          <option value="under evaluation">Under Evaluation</option>
                          <option value="shortlisted to next round">Shortlisted to Next Round 🏆</option>
                          <option value="not shortlisted to next round">Not Shortlisted to Next Round ❌</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Pitch Video (.mp4) Player */}
                  {(() => {
                    const driveVidId =
                      selectedSubmission.video?.driveFileId ||
                      getDriveFileId(selectedSubmission.video?.url || selectedSubmission.video?.webViewLink);
                    const activeVideoBlob = selectedSubmission.videoBlobUrl;
                    const isDirectMp4 =
                      (selectedSubmission.video?.url && selectedSubmission.video.url.toLowerCase().endsWith(".mp4")) ||
                      (selectedSubmission.video?.webViewLink && selectedSubmission.video.webViewLink.toLowerCase().endsWith(".mp4"));
                    const directMp4Url = isDirectMp4
                      ? selectedSubmission.video.url || selectedSubmission.video.webViewLink
                      : null;

                    return (
                      <div className="p-6 rounded-3xl border border-[var(--border)] bg-[var(--surface)] shadow-md">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2 text-xs font-bold text-[var(--text)]">
                            <FiVideo className="h-4 w-4 text-[var(--primary)]" />
                            <span>Pitch Video (.mp4)</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] text-[var(--muted)] font-mono truncate max-w-[150px]">
                              {selectedSubmission.video?.originalName || "Team Pitch Video"}
                            </span>
                          </div>
                        </div>

                        <div className="aspect-video w-full rounded-2xl overflow-hidden border border-[var(--border)] bg-black relative shadow-lg">
                          {activeVideoBlob ? (
                            <video
                              key={`blob-${selectedSubmission.teamId}-${activeVideoBlob}`}
                              src={activeVideoBlob}
                              className="h-full w-full object-cover"
                              controls
                              preload="metadata"
                              playsInline
                            />
                          ) : driveVidId ? (
                            <iframe
                              key={`drive-${selectedSubmission.teamId}-${driveVidId}`}
                              src={`https://drive.google.com/file/d/${driveVidId}/preview`}
                              title="Team Pitch Video"
                              className="h-full w-full border-0 rounded-2xl"
                              allow="autoplay; fullscreen"
                            />
                          ) : directMp4Url ? (
                            <video
                              key={`mp4-${selectedSubmission.teamId}-${directMp4Url}`}
                              src={directMp4Url}
                              className="h-full w-full object-cover"
                              controls
                              preload="metadata"
                              playsInline
                            />
                          ) : (
                            <video
                              key={`fallback-${selectedSubmission.teamId}`}
                              src="/speech.mp4"
                              className="h-full w-full object-cover"
                              controls
                              preload="metadata"
                              playsInline
                            />
                          )}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Proposal Deck & Proposal Abstract */}
                  <div className="p-6 rounded-3xl border border-[var(--border)] bg-[var(--surface)] shadow-md">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2 text-xs font-bold text-[var(--text)]">
                        <FiFileText className="h-4 w-4 text-[var(--accent)]" />
                        <span>Proposal Document (.pdf) & Abstract</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <a
                          href={getDocHref(selectedSubmission)}
                          download={selectedSubmission.document?.name || "Proposal.pdf"}
                          className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] text-[var(--text)] hover:border-[var(--primary)] transition cursor-pointer"
                        >
                          <FiDownload className="h-3 w-3" />
                          <span>Download</span>
                        </a>
                        <a
                          href={getDocHref(selectedSubmission)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-[var(--primary)] px-3 py-1.5 rounded-xl hover:bg-[var(--primary-hover)] transition cursor-pointer shadow-sm"
                        >
                          <span>Fullscreen PDF</span>
                          <FiExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    </div>

                    <p className="text-xs sm:text-sm text-[var(--text)] leading-relaxed bg-[var(--surface-2)] p-4 rounded-2xl border border-[var(--border)] mb-4">
                      {selectedSubmission.shortDescription}
                    </p>

                    {/* Embedded Interactive PDF Viewer */}
                    <div className="aspect-[4/3] w-full rounded-2xl overflow-hidden border border-[var(--border)] bg-[var(--surface-2)]">
                      <iframe
                        key={selectedSubmission.teamId}
                        src={`${getDocHref(selectedSubmission)}#toolbar=0&navpanes=0`}
                        title="Proposal PDF Document"
                        className="h-full w-full border-0 rounded-2xl"
                      />
                    </div>
                  </div>

                  {/* Rubric Evaluation Form */}
                  <div className="p-6 rounded-3xl border border-[var(--border)] bg-[var(--surface)] shadow-md">
                    <div className="flex items-center justify-between pb-4 border-b border-[var(--border)] mb-4">
                      <div>
                        <h3 className="font-bold text-sm text-[var(--text)]">Evaluation Rubric</h3>
                        <p className="text-[11px] text-[var(--muted)]">Score each parameter from 1 to 10</p>
                      </div>
                      <div className="text-right">
                        <span className="text-xs text-[var(--muted)] block">Total Score</span>
                        <span className="oswald text-2xl font-extrabold text-[var(--primary)]">
                          {totalScore} / 50
                        </span>
                      </div>
                    </div>

                    <div className="space-y-4">
                      {/* 1. Problem Clarity */}
                      <div>
                        <div className="flex justify-between text-xs font-semibold mb-1">
                          <span>1. Problem Clarity & Civic Need (Mysuru Context)</span>
                          <span className="font-bold font-mono text-[var(--primary)]">{scores.problemClarity}/10</span>
                        </div>
                        <input
                          type="range"
                          min="1"
                          max="10"
                          value={scores.problemClarity}
                          onChange={(e) => handleScoreChange("problemClarity", e.target.value)}
                          className="w-full accent-[var(--primary)] cursor-pointer"
                        />
                      </div>

                      {/* 2. Innovation & Originality */}
                      <div>
                        <div className="flex justify-between text-xs font-semibold mb-1">
                          <span>2. Innovation, Creativity & Novelty</span>
                          <span className="font-bold font-mono text-[var(--primary)]">{scores.innovationImpact}/10</span>
                        </div>
                        <input
                          type="range"
                          min="1"
                          max="10"
                          value={scores.innovationImpact}
                          onChange={(e) => handleScoreChange("innovationImpact", e.target.value)}
                          className="w-full accent-[var(--primary)] cursor-pointer"
                        />
                      </div>

                      {/* 3. Feasibility & Scalability */}
                      <div>
                        <div className="flex justify-between text-xs font-semibold mb-1">
                          <span>3. Feasibility & Long-term Scalability (2050 Horizon)</span>
                          <span className="font-bold font-mono text-[var(--primary)]">{scores.feasibilityScalability}/10</span>
                        </div>
                        <input
                          type="range"
                          min="1"
                          max="10"
                          value={scores.feasibilityScalability}
                          onChange={(e) => handleScoreChange("feasibilityScalability", e.target.value)}
                          className="w-full accent-[var(--primary)] cursor-pointer"
                        />
                      </div>

                      {/* 4. Technical Depth */}
                      <div>
                        <div className="flex justify-between text-xs font-semibold mb-1">
                          <span>4. Technical Depth & Execution Rigor</span>
                          <span className="font-bold font-mono text-[var(--primary)]">{scores.technicalDepth}/10</span>
                        </div>
                        <input
                          type="range"
                          min="1"
                          max="10"
                          value={scores.technicalDepth}
                          onChange={(e) => handleScoreChange("technicalDepth", e.target.value)}
                          className="w-full accent-[var(--primary)] cursor-pointer"
                        />
                      </div>

                      {/* 5. Video Pitch & Delivery */}
                      <div>
                        <div className="flex justify-between text-xs font-semibold mb-1">
                          <span>5. Video Pitch Presentation & Communication</span>
                          <span className="font-bold font-mono text-[var(--primary)]">{scores.videoPitchDelivery}/10</span>
                        </div>
                        <input
                          type="range"
                          min="1"
                          max="10"
                          value={scores.videoPitchDelivery}
                          onChange={(e) => handleScoreChange("videoPitchDelivery", e.target.value)}
                          className="w-full accent-[var(--primary)] cursor-pointer"
                        />
                      </div>

                      {/* Feedback Notes */}
                      <div className="pt-2">
                        <label className="block text-xs font-semibold text-[var(--text)] mb-1">
                          Judge Evaluation Notes (Optional)
                        </label>
                        <textarea
                          rows={2}
                          value={feedback}
                          onChange={(e) => setFeedback(e.target.value)}
                          placeholder="Provide constructive feedback for the team..."
                          className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-2.5 text-xs text-[var(--text)] placeholder-[var(--muted)] focus:outline-none"
                        />
                      </div>

                      {/* Submit Score Button */}
                      <button
                        type="button"
                        onClick={submitEvaluation}
                        disabled={submittingScore}
                        className="w-full rounded-2xl bg-[var(--primary)] hover:bg-[var(--primary-hover)] py-3 text-xs sm:text-sm font-bold text-white shadow-md transition cursor-pointer"
                      >
                        {submittingScore ? "Submitting Rubric..." : "Submit Official Rubric Evaluation ⚖️"}
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        ) : (
          /* ==================================================== */
          /* TAB 2: PAIRWISE DUEL VOTING                          */
          /* ==================================================== */
          <div className="max-w-4xl mx-auto rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 sm:p-10 shadow-xl">
            <div className="text-center mb-8">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-500">
                ⚡ Pairwise Head-to-Head Comparison
              </span>
              <h2 className="oswald text-2xl sm:text-3xl font-extrabold uppercase text-[var(--text)] mt-1">
                Which Innovation Has Higher Impact?
              </h2>
              <p className="text-xs text-[var(--muted)] mt-1 max-w-lg mx-auto">
                Compare these two alloted teams. Your vote updates the Bradley-Terry Elo ratings.
              </p>
            </div>

            {duelPair && duelPair.length === 2 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Team A */}
                <div className="p-6 rounded-3xl border-2 border-[var(--border)] hover:border-amber-500 bg-[var(--surface-2)] transition flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-mono font-bold text-[var(--accent)]">
                      {duelPair[0].teamId}
                    </span>
                    <h3 className="oswald text-xl font-bold uppercase text-[var(--text)] mt-1">
                      {duelPair[0].teamName}
                    </h3>
                    <p className="text-xs text-[var(--primary)] font-semibold mt-0.5">
                      {duelPair[0].solutionName}
                    </p>
                    <p className="text-xs text-[var(--muted)] mt-2 line-clamp-4">
                      {duelPair[0].shortDescription}
                    </p>
                  </div>

                  <button
                    type="button"
                    disabled={votingDuel}
                    onClick={() => voteDuel(duelPair[0].teamId, duelPair[1].teamId)}
                    className="mt-6 w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-md transition cursor-pointer"
                  >
                    Vote for Team A 🏆
                  </button>
                </div>

                {/* Team B */}
                <div className="p-6 rounded-3xl border-2 border-[var(--border)] hover:border-amber-500 bg-[var(--surface-2)] transition flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-mono font-bold text-[var(--accent)]">
                      {duelPair[1].teamId}
                    </span>
                    <h3 className="oswald text-xl font-bold uppercase text-[var(--text)] mt-1">
                      {duelPair[1].teamName}
                    </h3>
                    <p className="text-xs text-[var(--primary)] font-semibold mt-0.5">
                      {duelPair[1].solutionName}
                    </p>
                    <p className="text-xs text-[var(--muted)] mt-2 line-clamp-4">
                      {duelPair[1].shortDescription}
                    </p>
                  </div>

                  <button
                    type="button"
                    disabled={votingDuel}
                    onClick={() => voteDuel(duelPair[1].teamId, duelPair[0].teamId)}
                    className="mt-6 w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-md transition cursor-pointer"
                  >
                    Vote for Team B 🏆
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-[var(--muted)] text-sm">
                Need at least 2 alloted teams to run pairwise duel comparisons.
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default JuryzaHub;
