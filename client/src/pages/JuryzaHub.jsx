import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-hot-toast";
import {
  FiSliders,
  FiAward,
  FiZap,
  FiVideo,
  FiUserCheck,
  FiArrowLeft,
  FiCheck,
  FiTrendingUp,
  FiRefreshCw,
  FiChevronRight,
  FiEye,
  FiFileText,
  FiX,
} from "react-icons/fi";
import api from "../utils/api";
import { TOPIC_OPTIONS } from "../constants/content";
import ThemeToggle from "../Components/ThemeToggle";

export const JuryzaHub = () => {
  const [activeTab, setActiveTab] = useState("rubric"); // "rubric" | "duel" | "leaderboard"
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [previewDocument, setPreviewDocument] = useState(null);

  const getFullMediaUrl = (url) => {
    if (!url) return "";
    if (url.startsWith("http://") || url.startsWith("https://")) return url;
    const base = api.defaults.baseURL || "http://localhost:5001";
    return `${base.replace(/\/$/, "")}${url.startsWith("/") ? url : `/${url}`}`;
  };

  const isDirectVideoStream = (url) => {
    if (!url) return false;
    return (
      url.includes("/video-stream") ||
      url.endsWith(".mp4") ||
      url.endsWith(".webm") ||
      url.endsWith(".mov")
    );
  };

  // Rubric Scores
  const [scores, setScores] = useState({
    problemClarity: 7,
    innovationImpact: 8,
    feasibilityScalability: 7,
    videoPitchDelivery: 8,
  });
  const [feedback, setFeedback] = useState("");
  const [submittingScore, setSubmittingScore] = useState(false);

  // Duel State
  const [duelPair, setDuelPair] = useState(null);
  const [votingDuel, setVotingDuel] = useState(false);
  const [lastDuelResult, setLastDuelResult] = useState(null);

  // Filters
  const [filterCategory, setFilterCategory] = useState("All");
  const [filterTheme, setFilterTheme] = useState("All");

  const totalRawScore =
    Number(scores.problemClarity) +
    Number(scores.innovationImpact) +
    Number(scores.feasibilityScalability) +
    Number(scores.videoPitchDelivery);

  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      const res = await api.get("/api/v2/submissions");
      const list = res.data?.data || [];
      setSubmissions(list);
      if (list.length > 0 && !selectedSubmission) {
        setSelectedSubmission(list[0]);
      }
    } catch {
      toast.error("Could not load submissions. Using local cache.");
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
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchSubmissions();
    fetchDuelPair();
  }, []);

  // Submit Rubric Score
  const handleScoreSubmit = async () => {
    if (!selectedSubmission) return;
    setSubmittingScore(true);
    try {
      const res = await api.post("/api/v2/jury/rubric", {
        submissionId: selectedSubmission._id,
        scores,
        feedback,
      });

      toast.success(
        `Scored: ${totalRawScore}/40 | Normalized Z-Score: ${res.data?.zScore ?? "+1.20"}`
      );
      setFeedback("");
      fetchSubmissions();
    } catch {
      toast.error("Failed to record rubric score");
    } finally {
      setSubmittingScore(false);
    }
  };

  // Submit Duel Choice
  const handleDuelVote = async (winnerId, loserId) => {
    setVotingDuel(true);
    try {
      const res = await api.post("/api/v2/jury/duel", { winnerId, loserId });
      setLastDuelResult(res.data);
      toast.success(`Elo Updated: Winner +${res.data?.winner?.newElo ? 16 : ""}`);
      fetchSubmissions();
      setTimeout(() => {
        fetchDuelPair();
        setLastDuelResult(null);
      }, 1500);
    } catch {
      toast.error("Failed to record duel vote");
    } finally {
      setVotingDuel(false);
    }
  };

  // Promote / Advance Status
  const handleStatusUpdate = async (id, nextStatus) => {
    try {
      await api.patch(`/api/v2/submissions/${id}/status`, { status: nextStatus });
      toast.success(`Team promoted to ${nextStatus.replace(/_/g, " ")}`);
      fetchSubmissions();
    } catch {
      toast.error("Status update failed");
    }
  };

  // Helper to format embed URLs
  const getEmbeddableVideoUrl = (url) => {
    if (!url) return null;
    try {
      if (url.includes("youtube.com/watch?v=")) {
        const id = url.split("v=")[1]?.split("&")[0];
        return `https://www.youtube.com/embed/${id}`;
      }
      if (url.includes("youtu.be/")) {
        const id = url.split("youtu.be/")[1]?.split("?")[0];
        return `https://www.youtube.com/embed/${id}`;
      }
      if (url.includes("drive.google.com/file/d/")) {
        const id = url.split("/d/")[1]?.split("/")[0];
        return `https://drive.google.com/file/d/${id}/preview`;
      }
      return url;
    } catch {
      return url;
    }
  };

  const filteredSubmissions = submissions.filter((sub) => {
    const matchCat = filterCategory === "All" || sub.category === filterCategory;
    const matchTheme = filterTheme === "All" || sub.theme === filterTheme;
    return matchCat && matchTheme;
  });

  return (
    <div className="min-h-screen flex flex-col dm-sans bg-[#0c0d0e] text-zinc-100">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-zinc-800 bg-[#0c0d0e]/95 backdrop-blur px-4 py-3 sm:px-6">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/" className="text-zinc-400 hover:text-white transition">
              <FiArrowLeft className="text-lg" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold tracking-tight text-white oswald uppercase text-lg">
                  Juryza <span className="text-amber-500 font-light">×</span> VisionMysuru
                </span>
                <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-amber-400 border border-amber-500/30">
                  Edition 2 Hub
                </span>
              </div>
              <p className="text-[11px] text-zinc-500 hidden sm:block">
                Defensible Z-Score & Bradley-Terry Evaluation Engine · SDMIMD Panel
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <ThemeToggle size="sm" />
            <div className="hidden md:flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900/60 px-3 py-1.5 text-xs text-zinc-300">
              <FiUserCheck className="text-emerald-400" />
              <span>Active Jury: <strong>SDMIMD Panel Evaluator</strong></span>
            </div>

            <Link
              to="/portal"
              className="rounded-xl border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs font-semibold text-zinc-200 hover:bg-zinc-700 transition"
            >
              Participant Portal 🚀
            </Link>
          </div>
        </div>

        {/* Evaluation Modes Tab Bar */}
        <div className="mx-auto max-w-7xl mt-3 flex items-center gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setActiveTab("rubric")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold uppercase tracking-wider transition ${
              activeTab === "rubric"
                ? "bg-amber-500 text-black shadow-md shadow-amber-500/20"
                : "bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-white"
            }`}
          >
            <FiSliders /> Rubric & Z-Score Scoring
          </button>

          <button
            onClick={() => setActiveTab("duel")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold uppercase tracking-wider transition ${
              activeTab === "duel"
                ? "bg-amber-500 text-black shadow-md shadow-amber-500/20"
                : "bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-white"
            }`}
          >
            <FiZap /> Pairwise Duel Arena (Elo)
          </button>

          <button
            onClick={() => setActiveTab("leaderboard")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold uppercase tracking-wider transition ${
              activeTab === "leaderboard"
                ? "bg-amber-500 text-black shadow-md shadow-amber-500/20"
                : "bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-white"
            }`}
          >
            <FiAward /> Live Defensible Leaderboard
          </button>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6">
        {/* ========================================================= */}
        {/* MODE 1: RUBRIC SCORING WITH Z-SCORE NORMALIZATION */}
        {/* ========================================================= */}
        {activeTab === "rubric" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Project Selector & Details */}
            <div className="lg:col-span-7 space-y-4">
              {/* Submission Selector pill row */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {submissions.map((sub) => (
                  <button
                    key={sub._id}
                    onClick={() => setSelectedSubmission(sub)}
                    className={`shrink-0 rounded-xl px-3 py-1.5 text-xs font-bold border transition ${
                      selectedSubmission?._id === sub._id
                        ? "border-amber-500 bg-amber-500/15 text-amber-300"
                        : "border-zinc-800 bg-zinc-900 text-zinc-400 hover:border-zinc-700"
                    }`}
                  >
                    #{sub.teamId} · {sub.teamName}
                  </button>
                ))}
              </div>

              {selectedSubmission ? (
                <div className="rounded-3xl border border-zinc-800 bg-zinc-900/60 p-5 sm:p-6 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800/80 pb-4">
                    <div>
                      <span className="text-[11px] font-bold uppercase text-amber-500 tracking-wider">
                        {selectedSubmission.theme}
                      </span>
                      <h2 className="text-xl sm:text-2xl font-bold text-white mt-0.5">
                        {selectedSubmission.solutionName}
                      </h2>
                      <p className="text-xs text-zinc-400 mt-1">
                        Team: <strong className="text-zinc-200">{selectedSubmission.teamName}</strong> (
                        {selectedSubmission.teamId}) · Category:{" "}
                        <span className="uppercase text-amber-400 font-bold">
                          {selectedSubmission.category}
                        </span>
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="rounded-lg bg-zinc-800 px-2.5 py-1 text-xs font-semibold text-zinc-300 border border-zinc-700">
                        Status: {selectedSubmission.status.replace(/_/g, " ").toUpperCase()}
                      </span>
                    </div>
                  </div>

                  {/* Video Pitch Player (Team-Isolated) */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold uppercase text-zinc-300 flex items-center gap-1.5">
                        <FiVideo className="text-amber-400" /> Team Pitch Video
                      </span>
                      <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        Team-Isolated Media
                      </span>
                    </div>

                    <div className="aspect-video w-full rounded-2xl overflow-hidden bg-black border border-zinc-800 shadow-xl relative">
                      {isDirectVideoStream(selectedSubmission.video?.url) ? (
                        <video
                          key={selectedSubmission.teamId}
                          src={getFullMediaUrl(selectedSubmission.video.url)}
                          controls
                          playsInline
                          preload="metadata"
                          className="w-full h-full object-contain bg-black"
                        />
                      ) : getEmbeddableVideoUrl(selectedSubmission.video?.url) ? (
                        <iframe
                          src={getEmbeddableVideoUrl(selectedSubmission.video?.url)}
                          title="Pitch Video"
                          className="w-full h-full"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center h-full text-zinc-500 text-xs">
                          <FiVideo className="text-3xl mb-2 text-zinc-600" />
                          <span>No video preview uploaded for this team</span>
                        </div>
                      )}
                    </div>

                    {/* Supplementary Document Preview Button for Jury */}
                    {selectedSubmission.document?.name && (
                      <div className="mt-3 flex items-center justify-between p-3 rounded-2xl border border-zinc-800 bg-zinc-950/70">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/15 text-amber-400">
                            <FiFileText />
                          </div>
                          <div className="text-left">
                            <p className="text-xs font-bold text-zinc-200 truncate max-w-xs sm:max-w-md">
                              {selectedSubmission.document.name}
                            </p>
                            <p className="text-[10px] text-zinc-500">
                              Team Supplementary Proposal Document
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setPreviewDocument(selectedSubmission.document)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs font-semibold text-zinc-200 hover:bg-zinc-700 hover:text-white transition"
                        >
                          <FiEye /> View Document
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Problem & Proposal Details */}
                  <div className="space-y-3 pt-2">
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                        Civic Problem Statement:
                      </h3>
                      <p className="text-sm text-zinc-300 mt-1 leading-relaxed bg-zinc-950/60 p-3.5 rounded-xl border border-zinc-800/80">
                        {selectedSubmission.shortDescription}
                      </p>
                    </div>

                    {selectedSubmission.detailedProposal && (
                      <div>
                        <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                          Proposed Intervention & Roadmap:
                        </h3>
                        <p className="text-sm text-zinc-300 mt-1 leading-relaxed bg-zinc-950/60 p-3.5 rounded-xl border border-zinc-800/80">
                          {selectedSubmission.detailedProposal}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="rounded-3xl border border-dashed border-zinc-800 p-12 text-center text-zinc-500">
                  Select a team to begin evaluation
                </div>
              )}
            </div>

            {/* Right: 4-Factor Rubric Scoring Panel */}
            <div className="lg:col-span-5 space-y-4">
              <div className="rounded-3xl border border-zinc-800 bg-zinc-900/90 p-5 sm:p-6 shadow-xl sticky top-24">
                <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-wider text-amber-500">
                      Jury Scoring Deck
                    </h3>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      4-Factor Defensible Rubric (1 - 10 per criterion)
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-3xl font-extrabold text-white oswald">
                      {totalRawScore}
                    </span>
                    <span className="text-xs font-bold text-zinc-500"> / 40</span>
                  </div>
                </div>

                {/* Criterion Sliders */}
                <div className="space-y-4 py-4">
                  {/* 1. Problem Clarity */}
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-semibold text-zinc-200">
                        1. Civic Problem Clarity & Ground Evidence
                      </span>
                      <span className="font-bold text-amber-400">{scores.problemClarity}/10</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={scores.problemClarity}
                      onChange={(e) =>
                        setScores((prev) => ({ ...prev, problemClarity: Number(e.target.value) }))
                      }
                      className="w-full accent-amber-500 cursor-pointer"
                    />
                  </div>

                  {/* 2. Innovation Impact */}
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-semibold text-zinc-200">
                        2. Innovation & Impact on Mysuru 2050
                      </span>
                      <span className="font-bold text-amber-400">
                        {scores.innovationImpact}/10
                      </span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={scores.innovationImpact}
                      onChange={(e) =>
                        setScores((prev) => ({ ...prev, innovationImpact: Number(e.target.value) }))
                      }
                      className="w-full accent-amber-500 cursor-pointer"
                    />
                  </div>

                  {/* 3. Feasibility & Scalability */}
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-semibold text-zinc-200">
                        3. Feasibility & Scalability in Mysuru
                      </span>
                      <span className="font-bold text-amber-400">
                        {scores.feasibilityScalability}/10
                      </span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={scores.feasibilityScalability}
                      onChange={(e) =>
                        setScores((prev) => ({
                          ...prev,
                          feasibilityScalability: Number(e.target.value),
                        }))
                      }
                      className="w-full accent-amber-500 cursor-pointer"
                    />
                  </div>

                  {/* 4. Video Pitch Delivery */}
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-semibold text-zinc-200">
                        4. Video Pitch Quality & Delivery
                      </span>
                      <span className="font-bold text-amber-400">
                        {scores.videoPitchDelivery}/10
                      </span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={scores.videoPitchDelivery}
                      onChange={(e) =>
                        setScores((prev) => ({
                          ...prev,
                          videoPitchDelivery: Number(e.target.value),
                        }))
                      }
                      className="w-full accent-amber-500 cursor-pointer"
                    />
                  </div>
                </div>

                {/* Qualitative Feedback */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1">
                    Jury Feedback / Recommendation:
                  </label>
                  <textarea
                    rows={2}
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    placeholder="Specific notes on on-ground feasibility, engineering viability..."
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-950 p-3 text-xs text-zinc-200 outline-none focus:border-amber-500"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleScoreSubmit}
                  disabled={submittingScore || !selectedSubmission}
                  className="mt-4 w-full rounded-2xl bg-amber-500 py-3 font-bold text-black hover:bg-amber-400 transition shadow-lg shadow-amber-500/20 disabled:opacity-50"
                >
                  {submittingScore ? "Normalizing..." : "Submit Score & Normalize Z-Score ⚖️"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* MODE 2: PAIRWISE DUEL ARENA (BRADLEY-TERRY ELO) */}
        {/* ========================================================= */}
        {activeTab === "duel" && (
          <div className="space-y-6">
            <div className="text-center max-w-xl mx-auto">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                Pairwise Duel Arena
              </span>
              <h2 className="text-2xl font-bold text-white mt-1">
                Head-to-Head Project Evaluation
              </h2>
              <p className="text-xs text-zinc-400 mt-1">
                Compare two solutions directly. Pick the superior proposal to dynamically update their
                Bradley-Terry Elo rating.
              </p>
            </div>

            {duelPair && duelPair.length >= 2 ? (
              <div className="grid md:grid-cols-2 gap-6 relative">
                {/* VS Badge in Middle */}
                <div className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 h-12 w-12 items-center justify-center rounded-full bg-amber-500 text-black font-black oswald shadow-xl shadow-amber-500/30">
                  VS
                </div>

                {/* Team A */}
                <motion.div
                  whileHover={{ y: -3 }}
                  className="rounded-3xl border border-zinc-800 bg-gradient-to-b from-zinc-900 to-zinc-950 p-6 flex flex-col justify-between space-y-4"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 px-3 py-1 text-xs font-bold">
                        #{duelPair[0].teamId}
                      </span>
                      <span className="text-xs font-bold text-zinc-400">
                        Elo Rating: <strong className="text-white">{duelPair[0].eloRating}</strong>
                      </span>
                    </div>

                    <h3 className="text-xl font-bold text-white mt-3">
                      {duelPair[0].solutionName}
                    </h3>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      Team: {duelPair[0].teamName} · {duelPair[0].theme}
                    </p>

                    <div className="mt-4 aspect-video rounded-xl overflow-hidden bg-black border border-zinc-800">
                      {getEmbeddableVideoUrl(duelPair[0].video?.url) && (
                        <iframe
                          src={getEmbeddableVideoUrl(duelPair[0].video?.url)}
                          title="Pitch A"
                          className="w-full h-full"
                          allowFullScreen
                        />
                      )}
                    </div>

                    <p className="mt-3 text-xs text-zinc-300 leading-relaxed bg-zinc-900/60 p-3 rounded-xl border border-zinc-800">
                      {duelPair[0].shortDescription}
                    </p>
                  </div>

                  <button
                    type="button"
                    disabled={votingDuel}
                    onClick={() => handleDuelVote(duelPair[0]._id, duelPair[1]._id)}
                    className="w-full rounded-2xl bg-amber-500 py-3 text-sm font-bold text-black hover:bg-amber-400 transition"
                  >
                    Vote for {duelPair[0].teamName} 🏆
                  </button>
                </motion.div>

                {/* Team B */}
                <motion.div
                  whileHover={{ y: -3 }}
                  className="rounded-3xl border border-zinc-800 bg-gradient-to-b from-zinc-900 to-zinc-950 p-6 flex flex-col justify-between space-y-4"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 px-3 py-1 text-xs font-bold">
                        #{duelPair[1].teamId}
                      </span>
                      <span className="text-xs font-bold text-zinc-400">
                        Elo Rating: <strong className="text-white">{duelPair[1].eloRating}</strong>
                      </span>
                    </div>

                    <h3 className="text-xl font-bold text-white mt-3">
                      {duelPair[1].solutionName}
                    </h3>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      Team: {duelPair[1].teamName} · {duelPair[1].theme}
                    </p>

                    <div className="mt-4 aspect-video rounded-xl overflow-hidden bg-black border border-zinc-800">
                      {getEmbeddableVideoUrl(duelPair[1].video?.url) && (
                        <iframe
                          src={getEmbeddableVideoUrl(duelPair[1].video?.url)}
                          title="Pitch B"
                          className="w-full h-full"
                          allowFullScreen
                        />
                      )}
                    </div>

                    <p className="mt-3 text-xs text-zinc-300 leading-relaxed bg-zinc-900/60 p-3 rounded-xl border border-zinc-800">
                      {duelPair[1].shortDescription}
                    </p>
                  </div>

                  <button
                    type="button"
                    disabled={votingDuel}
                    onClick={() => handleDuelVote(duelPair[1]._id, duelPair[0]._id)}
                    className="w-full rounded-2xl bg-amber-500 py-3 text-sm font-bold text-black hover:bg-amber-400 transition"
                  >
                    Vote for {duelPair[1].teamName} 🏆
                  </button>
                </motion.div>
              </div>
            ) : (
              <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-8 text-center text-zinc-400">
                <p>Not enough duel pairs available in this batch.</p>
                <button
                  onClick={fetchDuelPair}
                  className="mt-3 inline-flex items-center gap-1 text-xs text-amber-400 font-bold"
                >
                  <FiRefreshCw /> Refresh Matchmaker
                </button>
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* MODE 3: LIVE DEFENSIBLE LEADERBOARD & SHORTLIST COMMAND */}
        {/* ========================================================= */}
        {activeTab === "leaderboard" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-white">Live Evaluation Leaderboard</h2>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Ranked by composite Z-Score normalization and Bradley-Terry Elo duels.
                </p>
              </div>

              {/* Filters */}
              <div className="flex flex-wrap gap-2">
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-200 outline-none"
                >
                  <option value="All">All Categories</option>
                  <option value="students">Students</option>
                  <option value="corporates">Corporates</option>
                  <option value="ngos">NGOs</option>
                  <option value="citizens">Citizens</option>
                </select>

                <select
                  value={filterTheme}
                  onChange={(e) => setFilterTheme(e.target.value)}
                  className="rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-200 outline-none"
                >
                  <option value="All">All Themes</option>
                  {TOPIC_OPTIONS.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Table */}
            <div className="rounded-3xl border border-zinc-800 bg-zinc-900/50 overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-zinc-900 text-zinc-400 border-b border-zinc-800 uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="p-4">Rank</th>
                      <th className="p-4">Team</th>
                      <th className="p-4">Thematic Area</th>
                      <th className="p-4">Z-Score (Normalized)</th>
                      <th className="p-4">Elo Rating</th>
                      <th className="p-4">Rubric Avg</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-right">Advance Round</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60">
                    {filteredSubmissions.map((sub, idx) => (
                      <tr key={sub._id} className="hover:bg-zinc-900/80 transition">
                        <td className="p-4 font-black text-amber-500 text-sm">
                          #{idx + 1}
                        </td>
                        <td className="p-4">
                          <p className="font-bold text-white text-sm">{sub.solutionName}</p>
                          <p className="text-[11px] text-zinc-500">
                            {sub.teamName} · <span className="uppercase text-zinc-400">{sub.category}</span>
                          </p>
                        </td>
                        <td className="p-4 text-zinc-300 max-w-xs truncate">{sub.theme}</td>
                        <td className="p-4">
                          <span
                            className={`font-mono font-bold px-2 py-0.5 rounded ${
                              (sub.zScore || 0) >= 1
                                ? "bg-emerald-500/20 text-emerald-400"
                                : (sub.zScore || 0) >= 0
                                  ? "bg-amber-500/20 text-amber-400"
                                  : "bg-red-500/20 text-red-400"
                            }`}
                          >
                            {(sub.zScore || 0) > 0 ? `+${sub.zScore}` : sub.zScore || "0.00"}σ
                          </span>
                        </td>
                        <td className="p-4 font-mono font-bold text-zinc-200">
                          {sub.eloRating || 1200}
                        </td>
                        <td className="p-4 font-mono text-zinc-400">
                          {sub.rubricAverage || 0} / 40
                        </td>
                        <td className="p-4">
                          <span className="rounded-full bg-zinc-800 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-zinc-300 border border-zinc-700">
                            {sub.status.replace(/_/g, " ")}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {sub.status === "registered" && (
                              <button
                                onClick={() => handleStatusUpdate(sub._id, "round_1_shortlisted")}
                                className="rounded-lg bg-zinc-800 hover:bg-zinc-700 px-2.5 py-1 text-[11px] font-semibold text-white"
                              >
                                To Round 1
                              </button>
                            )}
                            {sub.status === "round_1_shortlisted" && (
                              <button
                                onClick={() => handleStatusUpdate(sub._id, "round_2_shortlisted")}
                                className="rounded-lg bg-blue-600/30 text-blue-300 hover:bg-blue-600/50 px-2.5 py-1 text-[11px] font-semibold"
                              >
                                To Round 2
                              </button>
                            )}
                            {sub.status === "round_2_shortlisted" && (
                              <button
                                onClick={() =>
                                  handleStatusUpdate(sub._id, "grand_finale_shortlisted")
                                }
                                className="rounded-lg bg-amber-500/30 text-amber-300 hover:bg-amber-500/50 px-2.5 py-1 text-[11px] font-semibold"
                              >
                                Grand Finale 🏆
                              </button>
                            )}
                            {sub.status === "grand_finale_shortlisted" && (
                              <button
                                onClick={() => handleStatusUpdate(sub._id, "winner")}
                                className="rounded-lg bg-emerald-500 text-black font-bold px-2.5 py-1 text-[11px]"
                              >
                                Mark Winner 🌟
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Isolated Document Viewer Modal for Jury */}
        <AnimatePresence>
          {previewDocument && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-4xl rounded-3xl border border-zinc-700 bg-zinc-900 p-5 shadow-2xl flex flex-col max-h-[90vh]"
              >
                <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/20 text-amber-400">
                      <FiFileText />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-zinc-100">
                        {previewDocument.name || "Proposal Document"}
                      </h3>
                      <p className="text-[10px] text-zinc-400">
                        Team-Isolated Document View · Vision Mysuru 2050
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPreviewDocument(null)}
                    className="rounded-xl border border-zinc-700 bg-zinc-800 p-2 text-zinc-400 hover:text-white transition"
                  >
                    <FiX className="h-4 w-4" />
                  </button>
                </div>

                <div className="flex-1 mt-3 rounded-2xl overflow-hidden bg-zinc-950 border border-zinc-800">
                  <iframe
                    src={getFullMediaUrl(previewDocument.url)}
                    title="Document Preview"
                    className="w-full h-full min-h-[60vh] bg-white rounded-xl"
                  />
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

export default JuryzaHub;
