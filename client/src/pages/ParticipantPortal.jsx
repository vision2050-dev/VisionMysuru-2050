import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-hot-toast";
import {
  FiVideo,
  FiFileText,
  FiUsers,
  FiPlus,
  FiTrash2,
  FiCheckCircle,
  FiArrowLeft,
  FiEye,
  FiUploadCloud,
  FiHelpCircle,
  FiClock,
  FiUserCheck,
  FiAward,
  FiRefreshCw,
  FiLogOut,
  FiMail,
  FiShield,
  FiX,
  FiAlertCircle,
} from "react-icons/fi";
import { TOPIC_OPTIONS, CATEGORY } from "../constants/content";
import api from "../utils/api";
import FooterSection from "../Components/FooterSection";
import ThemeToggle from "../Components/ThemeToggle";

const CATEGORY_TABS = [
  { key: CATEGORY.STUDENT, label: "Students", code: "ST", desc: "UG & PG college innovators" },
  { key: CATEGORY.CITIZENS, label: "Citizens", code: "CT", desc: "Individuals & civic groups" },
  { key: CATEGORY.CORPORATE, label: "Corporates", code: "CO", desc: "Startups, MSMEs & enterprises" },
  { key: CATEGORY.NGO, label: "NGOs", code: "NG", desc: "Civil society & RWAs" },
];

export const ParticipantPortal = () => {
  const navigate = useNavigate();

  // Authentication State
  const currentUser = JSON.parse(localStorage.getItem("juryzaUser") || "{}");
  const userEmail = (localStorage.getItem("juryzaUserEmail") || "").toLowerCase().trim();
  const isLoggedIn = Boolean(userEmail);

  // View state: "track" (View progress) | "form" (Register idea)
  const [viewMode, setViewMode] = useState("form");
  const [existingSubmission, setExistingSubmission] = useState(null);
  const [progressTimeline, setProgressTimeline] = useState(null);
  const [fetchingSubmission, setFetchingSubmission] = useState(false);

  // Form State
  const [activeCategory, setActiveCategory] = useState(CATEGORY.STUDENT);
  const [submitting, setSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [generatedSubmission, setGeneratedSubmission] = useState(null);
  const [showPitchPreview, setShowPitchPreview] = useState(false);

  // Direct Drive Upload File States
  const [videoFile, setVideoFile] = useState(null);
  const [videoLocalPreview, setVideoLocalPreview] = useState(null);
  const [documentFile, setDocumentFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const [formData, setFormData] = useState({
    teamName: "",
    city: "Mysuru",
    theme: TOPIC_OPTIONS[0],
    solutionName: "",
    shortDescription: "",
    detailedProposal: "",
    videoUrl: "",
    videoTitle: "",
    documentName: "",
    documentUrl: "",
    institution: "",
    department: "",
    companyName: "",
    industry: "",
    organizationName: "",
  });

  const [members, setMembers] = useState([
    {
      name: currentUser?.name || "",
      email: userEmail || "",
      phone: "",
      isLeader: true,
      college: "",
      department: "",
    },
  ]);

  // Fetch participant's existing submission
  const fetchMySubmission = useCallback(async () => {
    if (!userEmail) return;
    setFetchingSubmission(true);
    try {
      const res = await api.get(`/api/v2/participant/my-submission?email=${encodeURIComponent(userEmail)}`);
      if (res.data?.found && res.data.submission) {
        setExistingSubmission(res.data.submission);
        setProgressTimeline(res.data.progressTimeline);
        setViewMode("track");
      } else {
        setExistingSubmission(null);
        setProgressTimeline(null);
        setViewMode("form");
      }
    } catch (err) {
      console.warn("Could not fetch participant submission:", err.message);
    } finally {
      setFetchingSubmission(false);
    }
  }, [userEmail]);

  useEffect(() => {
    if (isLoggedIn) {
      fetchMySubmission();
    }
  }, [isLoggedIn, fetchMySubmission]);

  const handleLogout = () => {
    localStorage.removeItem("juryzaToken");
    localStorage.removeItem("juryzaUser");
    localStorage.removeItem("juryzaUserEmail");
    localStorage.removeItem("juryzaRole");
    toast.success("Signed out");
    navigate("/login?role=participant");
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleVideoFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 500 * 1024 * 1024) {
      toast.error("Video file is too large. Maximum size allowed is 500 MB.");
      return;
    }

    setVideoFile(file);
    if (videoLocalPreview) {
      URL.revokeObjectURL(videoLocalPreview);
    }
    const previewUrl = URL.createObjectURL(file);
    setVideoLocalPreview(previewUrl);
    toast.success(`Video selected: ${file.name} (${(file.size / (1024 * 1024)).toFixed(1)} MB)`);
  };

  const removeVideoFile = () => {
    if (videoLocalPreview) {
      URL.revokeObjectURL(videoLocalPreview);
    }
    setVideoFile(null);
    setVideoLocalPreview(null);
  };

  const handleDocumentFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 50 * 1024 * 1024) {
      toast.error("Document is too large. Maximum size allowed is 50 MB.");
      return;
    }

    setDocumentFile(file);
    toast.success(`Document attached: ${file.name} (${(file.size / (1024 * 1024)).toFixed(1)} MB)`);
  };

  const handleMemberChange = (index, field, value) => {
    setMembers((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const addMember = () => {
    if (members.length >= 3) {
      toast.error("Maximum team size is 3 members");
      return;
    }
    setMembers((prev) => [
      ...prev,
      { name: "", email: "", phone: "", isLeader: false, college: "", department: "" },
    ]);
  };

  const removeMember = (index) => {
    if (members.length <= 1) {
      toast.error("At least one member is required");
      return;
    }
    setMembers((prev) => {
      const updated = prev.filter((_, i) => i !== index);
      if (!updated.some((m) => m.isLeader)) {
        updated[0].isLeader = true;
      }
      return updated;
    });
  };

  // Submit Handler
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.teamName.trim() || !formData.solutionName.trim() || !formData.shortDescription.trim()) {
      toast.error("Please fill in all required project information fields");
      return;
    }

    if (!videoFile && !formData.videoUrl) {
      toast.error(
        "Explainer video pitch is required. Please upload your video file directly to our evaluation drive.",
      );
      return;
    }

    const leader = members.find((m) => m.isLeader);
    if (!leader?.name?.trim() || !leader?.email?.trim() || !leader?.phone?.trim()) {
      toast.error("Leader name, valid email, and phone number are required");
      return;
    }

    setSubmitting(true);
    setUploadProgress(15);

    try {
      const data = new FormData();
      data.append("teamName", formData.teamName.trim());
      data.append(
        "category",
        activeCategory === CATEGORY.STUDENT
          ? "students"
          : activeCategory === CATEGORY.CORPORATE
            ? "corporates"
            : activeCategory === CATEGORY.NGO
              ? "ngos"
              : "citizens",
      );
      data.append("city", formData.city || "Mysuru");
      data.append("theme", formData.theme);
      data.append("solutionName", formData.solutionName.trim());
      data.append("shortDescription", formData.shortDescription.trim());
      data.append("detailedProposal", formData.detailedProposal?.trim() || formData.shortDescription.trim());
      data.append("members", JSON.stringify(members));
      data.append(
        "organizationDetails",
        JSON.stringify({
          institution: formData.institution,
          department: formData.department,
          companyName: formData.companyName,
          industry: formData.industry,
          organizationName: formData.organizationName,
        }),
      );

      if (videoFile) {
        data.append("videoFile", videoFile);
      } else if (formData.videoUrl) {
        data.append("videoUrl", formData.videoUrl.trim());
      }

      if (documentFile) {
        data.append("documentFile", documentFile);
      }

      const response = await api.post("/api/v2/submissions", data, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(percent);
          }
        },
      });

      setGeneratedSubmission(response.data?.submission);
      setShowSuccessModal(true);
      toast.success("Successfully uploaded to official Vision Mysuru 2050 Drive!");
      fetchMySubmission();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to submit. Please try again.");
    } finally {
      setSubmitting(false);
      setUploadProgress(0);
    }
  };

  const getFullMediaUrl = (url) => {
    if (!url) return "";
    if (url.startsWith("http://") || url.startsWith("https://")) return url;
    const base = api.defaults.baseURL || "http://localhost:5001";
    return `${base.replace(/\/$/, "")}${url.startsWith("/") ? url : `/${url}`}`;
  };

  return (
    <div className="min-h-screen flex flex-col dm-sans bg-[var(--bg)] text-[var(--text)]">
      {/* Top Header */}
      <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-[var(--surface)]/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <Link to="/" className="flex items-center gap-2 text-sm font-bold">
            <img src="/logo_final.png" alt="Logo" className="h-8 w-auto inline-block" />
            <span className="hidden sm:inline">Vision Mysuru 2050</span>
            <span className="rounded-full bg-amber-500/15 border border-amber-500/30 px-2.5 py-0.5 text-xs font-bold text-[var(--accent)]">
              Participant Portal
            </span>
          </Link>

          <div className="flex items-center gap-2 sm:gap-3">
            <ThemeToggle size="sm" />

            {isLoggedIn ? (
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-[var(--muted)] hidden md:inline">
                  {userEmail}
                </span>
                <button
                  onClick={handleLogout}
                  className="inline-flex items-center gap-1 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-3 py-1.5 text-xs font-semibold hover:bg-[var(--surface)] transition"
                >
                  <FiLogOut className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Sign Out</span>
                </button>
              </div>
            ) : (
              <Link
                to="/login?role=participant"
                className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--primary)] text-white px-3.5 py-1.5 text-xs font-bold hover:bg-[var(--primary-hover)] transition"
              >
                Sign In with Gmail
              </Link>
            )}

            <Link
              to="/"
              className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-xs font-semibold hover:bg-[var(--surface-2)] transition"
            >
              <FiArrowLeft /> Home
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 py-10 px-4 sm:px-6">
        <div className="mx-auto max-w-4xl">
          {/* Header Banner */}
          <div className="mb-8 text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-[var(--accent)] shadow-xs">
              <FiVideo className="h-3.5 w-3.5" /> Edition 2 Participant Hub
            </span>
            <h1 className="oswald mt-4 text-3xl font-extrabold uppercase tracking-tight sm:text-4xl md:text-5xl">
              {viewMode === "track" && existingSubmission
                ? "Live Submission Progress Tracker"
                : "Submit Your Vision & Pitch Video"}
            </h1>
            <p className="mt-2 text-sm sm:text-base text-[var(--muted)] max-w-2xl mx-auto">
              {viewMode === "track" && existingSubmission
                ? `Track the real-time evaluation status of your proposal for team "${existingSubmission.teamName}".`
                : "Register your team and upload your explainer video pitch directly to the official Vision Mysuru 2050 evaluation drive."}
            </p>

            {/* Toggle view button if submission exists */}
            {existingSubmission && (
              <div className="mt-4 flex justify-center gap-2">
                <button
                  type="button"
                  onClick={() => setViewMode(viewMode === "track" ? "form" : "track")}
                  className="inline-flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-xs font-bold hover:bg-[var(--surface-2)] shadow-sm transition"
                >
                  <FiClock className="h-3.5 w-3.5 text-amber-500" />
                  <span>
                    {viewMode === "track" ? "Register Another Team" : "View Live Submission Status"}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={fetchMySubmission}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs font-semibold hover:bg-[var(--surface-2)] transition"
                >
                  <FiRefreshCw className={`h-3 w-3 ${fetchingSubmission ? "animate-spin" : ""}`} />
                  <span>Refresh</span>
                </button>
              </div>
            )}
          </div>

          {/* Prompt to Sign In if not logged in */}
          {!isLoggedIn && (
            <div className="mb-8 rounded-3xl border border-amber-500/30 bg-[var(--surface)] p-6 text-center shadow-lg">
              <FiMail className="mx-auto h-8 w-8 text-amber-500 mb-2" />
              <h3 className="text-base font-bold text-[var(--text)]">Sign In with Gmail Required</h3>
              <p className="mt-1 text-xs text-[var(--muted)] max-w-md mx-auto">
                Every participant must login with their Gmail ID to submit proposals and track submission evaluation progress.
              </p>
              <Link
                to="/login?role=participant"
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[var(--primary)] text-white px-5 py-2.5 text-xs font-bold shadow-md hover:bg-[var(--primary-hover)] transition"
              >
                Sign In with Gmail ID
              </Link>
            </div>
          )}

          {/* VIEW MODE 1: LIVE SUBMISSION PROGRESS TRACKER */}
          {viewMode === "track" && existingSubmission && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Stepper Card */}
              <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 sm:p-8 shadow-xl">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border)] pb-4 mb-6">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--accent)] font-mono">
                      {existingSubmission.teamId}
                    </span>
                    <h2 className="text-xl sm:text-2xl font-bold text-[var(--text)] mt-0.5">
                      {existingSubmission.teamName}
                    </h2>
                    <p className="text-xs text-[var(--muted)] mt-0.5">
                      Thematic Track: <strong className="text-[var(--text)]">{existingSubmission.theme}</strong>
                    </p>
                  </div>

                  <span className="rounded-full bg-amber-500/15 border border-amber-500/30 px-3 py-1 text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300">
                    State: {existingSubmission.progressState?.replace(/_/g, " ") || "Submitted"}
                  </span>
                </div>

                {/* 4-Step Interactive Progress Tracker */}
                <div className="relative pl-6 border-l-2 border-amber-500/30 space-y-8 my-4 ml-2">
                  {/* Step 1: Submitted */}
                  <div className="relative">
                    <div className="absolute -left-[31px] top-0 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-white text-xs">
                      <FiCheckCircle className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-[var(--text)]">1. Idea & Video Pitch Submitted</h4>
                      <p className="mt-1 text-xs text-[var(--muted)]">
                        Your explainer pitch video and project details have been ingested directly into the official Vision Mysuru 2050 evaluation drive.
                      </p>
                    </div>
                  </div>

                  {/* Step 2: Allocated to Judge */}
                  <div className="relative">
                    <div
                      className={`absolute -left-[31px] top-0 flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                        progressTimeline?.isAllocated
                          ? "bg-emerald-500 text-white"
                          : "bg-[var(--surface-2)] text-[var(--muted)] border border-[var(--border)]"
                      }`}
                    >
                      {progressTimeline?.isAllocated ? <FiCheckCircle className="h-4 w-4" /> : "2"}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-[var(--text)]">2. Allocated to Jury Panel</h4>
                      <p className="mt-1 text-xs text-[var(--muted)]">
                        {existingSubmission.assignedJudgeName
                          ? `Alloted to official jury member: ${existingSubmission.assignedJudgeName}`
                          : "Your submission is queued for jury member allocation by the SDMIMD administration."}
                      </p>
                    </div>
                  </div>

                  {/* Step 3: Under Evaluation */}
                  <div className="relative">
                    <div
                      className={`absolute -left-[31px] top-0 flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                        progressTimeline?.isUnderEvaluation
                          ? "bg-blue-500 text-white"
                          : "bg-[var(--surface-2)] text-[var(--muted)] border border-[var(--border)]"
                      }`}
                    >
                      {progressTimeline?.isUnderEvaluation ? <FiClock className="h-4 w-4" /> : "3"}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-[var(--text)]">3. Under Evaluation</h4>
                      <p className="mt-1 text-xs text-[var(--muted)]">
                        {progressTimeline?.isUnderEvaluation
                          ? "Your explainer video pitch and proposal are actively undergoing 4-factor rubric scoring and normalized ranking by your assigned jury member."
                          : "Awaiting preliminary scoring by appointed jury panel."}
                      </p>
                    </div>
                  </div>

                  {/* Step 4: Next Round Shortlist / Decision */}
                  <div className="relative">
                    <div
                      className={`absolute -left-[31px] top-0 flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                        progressTimeline?.isShortlisted
                          ? "bg-amber-500 text-black"
                          : progressTimeline?.isRejected
                            ? "bg-zinc-700 text-white"
                            : "bg-[var(--surface-2)] text-[var(--muted)] border border-[var(--border)]"
                      }`}
                    >
                      <FiAward className="h-3.5 w-3.5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-[var(--text)]">4. Round Advancement Decision</h4>
                      <p className="mt-1 text-xs text-[var(--muted)]">
                        {progressTimeline?.isWinner ? (
                          <span className="font-bold text-emerald-600 dark:text-emerald-400">
                            🏆 Congratulations! Your team has been declared an Official Winner of Vision Mysuru 2050!
                          </span>
                        ) : progressTimeline?.isShortlisted ? (
                          <span className="font-bold text-amber-600 dark:text-amber-400">
                            🌟 Congratulations! Your team has been shortlisted for the next presentation stage! Prepare for physical showcases at SDMIMD campus.
                          </span>
                        ) : progressTimeline?.isRejected ? (
                          <span className="text-[var(--muted)]">
                            Evaluation concluded for this edition. We sincerely appreciate your vision for Mysuru 2050.
                          </span>
                        ) : (
                          "Official shortlist announcements will appear here once all jury evaluations are finalized."
                        )}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Submitted Media Links */}
                <div className="mt-8 pt-6 border-t border-[var(--border)] flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    {existingSubmission.video?.url && (
                      <a
                        href={getFullMediaUrl(existingSubmission.video.url)}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500/15 border border-amber-500/30 px-3.5 py-2 text-xs font-bold text-amber-700 dark:text-amber-300"
                      >
                        <FiVideo className="h-4 w-4" /> Watch Pitch Video
                      </a>
                    )}

                    {existingSubmission.document?.url && (
                      <a
                        href={getFullMediaUrl(existingSubmission.document.url)}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-xl bg-blue-500/15 border border-blue-500/30 px-3.5 py-2 text-xs font-bold text-blue-700 dark:text-blue-300"
                      >
                        <FiFileText className="h-4 w-4" /> View Proposal PDF
                      </a>
                    )}
                  </div>

                  <p className="text-[11px] text-[var(--muted)]">
                    Submitted: {new Date(existingSubmission.createdAt || Date.now()).toLocaleDateString("en-IN")}
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* VIEW MODE 2: REGISTRATION FORM */}
          {(viewMode === "form" || !existingSubmission) && (
            <motion.form
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              onSubmit={handleSubmit}
              className="space-y-8"
            >
              {/* Category Selector Tabs */}
              <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm">
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--muted)] mb-3">
                  Select Participation Track *
                </label>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {CATEGORY_TABS.map((tab) => {
                    const isSelected = activeCategory === tab.key;
                    return (
                      <button
                        key={tab.key}
                        type="button"
                        onClick={() => setActiveCategory(tab.key)}
                        className={`rounded-2xl border p-4 text-left transition-all ${
                          isSelected
                            ? "border-[var(--accent)] bg-[var(--surface-2)] shadow-md"
                            : "border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-2)]/60"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                              isSelected
                                ? "bg-[var(--accent)] text-white"
                                : "bg-[var(--surface-2)] text-[var(--muted)]"
                            }`}
                          >
                            {tab.code}
                          </span>
                          {isSelected && <FiCheckCircle className="text-[var(--accent)] text-sm" />}
                        </div>
                        <h4 className="mt-2 text-sm font-bold text-[var(--text)]">{tab.label}</h4>
                        <p className="mt-0.5 text-[11px] text-[var(--muted)] line-clamp-2">{tab.desc}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Step 1: Proposal Information */}
              <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 sm:p-8 shadow-sm space-y-5">
                <div className="border-b border-[var(--border)] pb-3">
                  <h3 className="text-lg font-bold text-[var(--text)]">1. Proposal Details</h3>
                  <p className="text-xs text-[var(--muted)] mt-0.5">
                    Define the core problem and visionary solution for Mysuru 2050
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[var(--muted)] mb-1">
                      Team Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.teamName}
                      onChange={(e) => handleInputChange("teamName", e.target.value)}
                      placeholder="e.g. EcoFlow Mysuru"
                      className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-3.5 py-2.5 text-xs sm:text-sm font-medium focus:border-[var(--accent)] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[var(--muted)] mb-1">
                      Thematic Focus Area *
                    </label>
                    <select
                      value={formData.theme}
                      onChange={(e) => handleInputChange("theme", e.target.value)}
                      className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-3.5 py-2.5 text-xs sm:text-sm font-medium focus:border-[var(--accent)] focus:outline-none"
                    >
                      {TOPIC_OPTIONS.map((topic) => (
                        <option key={topic} value={topic}>
                          {topic}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[var(--muted)] mb-1">
                    Solution Name / Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.solutionName}
                    onChange={(e) => handleInputChange("solutionName", e.target.value)}
                    placeholder="e.g. Decentralized Kukkarahalli Lake Micro-Filtration Network"
                    className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-3.5 py-2.5 text-xs sm:text-sm font-medium focus:border-[var(--accent)] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[var(--muted)] mb-1">
                    Executive Summary / Short Description *
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={formData.shortDescription}
                    onChange={(e) => handleInputChange("shortDescription", e.target.value)}
                    placeholder="Briefly explain the bottleneck addressed, technological or civic intervention, and impact on Mysuru 2050..."
                    className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-3.5 py-2.5 text-xs sm:text-sm font-medium focus:border-[var(--accent)] focus:outline-none resize-none"
                  />
                </div>
              </div>

              {/* Step 2: Pitch Video Upload */}
              <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 sm:p-8 shadow-sm space-y-5">
                <div className="border-b border-[var(--border)] pb-3">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--accent)] font-mono">
                    Direct Evaluation Drive Upload
                  </span>
                  <h3 className="text-lg font-bold text-[var(--text)] mt-0.5">2. Explainer Pitch Video *</h3>
                  <p className="text-xs text-[var(--muted)] mt-0.5">
                    Upload your 2-to-3 minute video explaining your idea. It will be uploaded directly to our master evaluation drive.
                  </p>
                </div>

                <div className="rounded-2xl border-2 border-dashed border-[var(--accent)]/40 bg-[var(--surface-2)]/50 p-6 text-center hover:border-[var(--accent)] transition-colors">
                  {videoFile ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-sm">
                        <FiCheckCircle className="h-5 w-5" />
                        <span>Ready for Upload: {videoFile.name}</span>
                      </div>
                      <p className="text-xs text-[var(--muted)] font-mono">
                        File Size: {(videoFile.size / (1024 * 1024)).toFixed(2)} MB · MP4/WebM/MOV
                      </p>

                      <div className="flex items-center justify-center gap-3 pt-2">
                        <button
                          type="button"
                          onClick={() => setShowPitchPreview(!showPitchPreview)}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3.5 py-1.5 text-xs font-semibold hover:bg-[var(--surface-2)]"
                        >
                          <FiEye /> {showPitchPreview ? "Hide Preview" : "Preview Video"}
                        </button>
                        <button
                          type="button"
                          onClick={removeVideoFile}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-red-500/30 bg-red-500/10 px-3.5 py-1.5 text-xs font-bold text-red-600 hover:bg-red-500/20"
                        >
                          <FiTrash2 /> Remove File
                        </button>
                      </div>

                      {showPitchPreview && videoLocalPreview && (
                        <div className="mt-4 rounded-xl overflow-hidden border border-[var(--border)] bg-black max-w-lg mx-auto">
                          <video src={videoLocalPreview} controls className="w-full h-auto max-h-60" />
                        </div>
                      )}
                    </div>
                  ) : (
                    <div>
                      <FiUploadCloud className="mx-auto h-10 w-10 text-[var(--accent)]" />
                      <p className="mt-2 text-sm font-bold text-[var(--text)]">
                        Click or drag your pitch video file here
                      </p>
                      <p className="mt-1 text-xs text-[var(--muted)]">
                        Supports MP4, WebM, MOV up to 500 MB
                      </p>
                      <input
                        type="file"
                        accept="video/mp4,video/webm,video/quicktime"
                        onChange={handleVideoFileChange}
                        className="mt-3 block w-full max-w-xs mx-auto text-xs text-[var(--muted)] file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-[var(--primary)] file:text-white hover:file:bg-[var(--primary-hover)] cursor-pointer"
                      />
                    </div>
                  )}
                </div>

                {/* Supplementary PDF Proposal Document */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[var(--muted)] mb-1">
                    Supplementary Project Report / Pitch Deck (PDF - Optional)
                  </label>
                  <input
                    type="file"
                    accept="application/pdf"
                    onChange={handleDocumentFileChange}
                    className="block w-full text-xs text-[var(--muted)] file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-[var(--surface-2)] file:text-[var(--text)] hover:file:bg-[var(--border)] cursor-pointer"
                  />
                  {documentFile && (
                    <p className="mt-1 text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                      Attached: {documentFile.name} ({(documentFile.size / (1024 * 1024)).toFixed(1)} MB)
                    </p>
                  )}
                </div>
              </div>

              {/* Step 3: Team Members */}
              <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 sm:p-8 shadow-sm space-y-5">
                <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
                  <div>
                    <h3 className="text-lg font-bold text-[var(--text)]">3. Team Members (Up to 3)</h3>
                    <p className="text-xs text-[var(--muted)] mt-0.5">
                      First member is designated as the Team Leader
                    </p>
                  </div>
                  {members.length < 3 && (
                    <button
                      type="button"
                      onClick={addMember}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--surface-2)] px-3 py-1.5 text-xs font-bold hover:bg-[var(--border)] transition"
                    >
                      <FiPlus /> Add Member
                    </button>
                  )}
                </div>

                <div className="space-y-4">
                  {members.map((member, index) => (
                    <div
                      key={index}
                      className="rounded-2xl border border-[var(--border)] bg-[var(--surface-2)]/50 p-4 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-[var(--accent)]">
                          {member.isLeader ? "★ Team Leader (Primary Contact)" : `Member #${index + 1}`}
                        </span>
                        {index > 0 && (
                          <button
                            type="button"
                            onClick={() => removeMember(index)}
                            className="text-[var(--muted)] hover:text-red-500 transition"
                          >
                            <FiTrash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                        <input
                          type="text"
                          required
                          value={member.name}
                          onChange={(e) => handleMemberChange(index, "name", e.target.value)}
                          placeholder="Full Name *"
                          className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs font-medium focus:outline-none"
                        />
                        <input
                          type="email"
                          required
                          value={member.email}
                          onChange={(e) => handleMemberChange(index, "email", e.target.value)}
                          placeholder="Gmail / Email *"
                          className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs font-medium focus:outline-none"
                        />
                        <input
                          type="tel"
                          required
                          value={member.phone}
                          onChange={(e) => handleMemberChange(index, "phone", e.target.value)}
                          placeholder="Mobile / WhatsApp *"
                          className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs font-medium focus:outline-none"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Upload Progress Bar */}
              {submitting && (
                <div className="rounded-2xl border border-amber-500/30 bg-[var(--surface)] p-4 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-[var(--text)]">
                    <span>Uploading Pitch Video to Master Drive...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-[var(--surface-2)] overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Submit CTA */}
              <div className="text-center pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full sm:w-auto min-w-[280px] inline-flex items-center justify-center gap-2 rounded-2xl bg-[var(--primary)] px-8 py-4 text-sm font-bold text-white shadow-xl transition-all duration-300 hover:bg-[var(--primary-hover)] hover:-translate-y-0.5 disabled:opacity-50"
                >
                  {submitting ? "Processing Direct Drive Upload..." : "Submit Pitch & Register Team 🚀"}
                </button>
              </div>
            </motion.form>
          )}
        </div>
      </main>

      <FooterSection />
    </div>
  );
};

export default ParticipantPortal;
