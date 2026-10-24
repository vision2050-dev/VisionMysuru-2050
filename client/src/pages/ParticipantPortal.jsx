import { useState, useEffect } from "react";
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
  FiUploadCloud,
  FiLogOut,
  FiExternalLink,
  FiClock,
  FiCompass,
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
  const [currentUserEmail, setCurrentUserEmail] = useState("");
  const [currentUserName, setCurrentUserName] = useState("");

  const [loading, setLoading] = useState(true);
  const [hasRegistered, setHasRegistered] = useState(false);
  const [mySubmission, setMySubmission] = useState(null);

  // Registration Form State
  const [activeCategory, setActiveCategory] = useState(CATEGORY.STUDENT);
  const [submitting, setSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Compulsory Files State
  const [videoFile, setVideoFile] = useState(null);
  const [videoLocalPreview, setVideoLocalPreview] = useState(null);
  const [documentFile, setDocumentFile] = useState(null);

  const [formData, setFormData] = useState({
    teamName: "",
    city: "Mysuru",
    theme: TOPIC_OPTIONS[0],
    solutionName: "",
    shortDescription: "",
    detailedProposal: "",
    institution: "",
    department: "",
    companyName: "",
    organizationName: "",
  });

  const [members, setMembers] = useState([
    { name: "", email: "", phone: "", isLeader: true, college: "", department: "" },
  ]);

  // Check auth and fetch submission on mount
  useEffect(() => {
    const token = localStorage.getItem("juryzaToken");
    const email = localStorage.getItem("juryzaEmail");
    const name = localStorage.getItem("juryzaName");

    if (!token || !email) {
      toast("Please sign in with your Gmail to access the participant portal.", { icon: "🔑" });
      navigate("/juryza");
      return;
    }

    setCurrentUserEmail(email);
    setCurrentUserName(name || "Participant");

    // Pre-fill leader email
    setMembers((prev) => [
      {
        ...prev[0],
        name: name || prev[0].name,
        email: email,
      },
      ...prev.slice(1),
    ]);

    fetchParticipantSubmission(email);
  }, [navigate]);

  const fetchParticipantSubmission = async (email) => {
    try {
      setLoading(true);
      const res = await api.get(`/api/v2/participant/my-submission?email=${encodeURIComponent(email)}`);
      if (res.data?.hasRegistered && res.data?.submission) {
        setHasRegistered(true);
        setMySubmission(res.data.submission);
      } else {
        setHasRegistered(false);
      }
    } catch (err) {
      console.warn("Could not load participant submission:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // 1. Compulsory Video File (.mp4 strictly <= 50 MB)
  const handleVideoFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isMp4 = file.type === "video/mp4" || file.name.toLowerCase().endsWith(".mp4");
    if (!isMp4) {
      toast.error("Pitch video must strictly be an .mp4 file.");
      e.target.value = "";
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      toast.error(
        `Video exceeds 50 MB limit (${(file.size / (1024 * 1024)).toFixed(1)} MB). Please compress or trim to ≤ 50 MB.`,
      );
      e.target.value = "";
      return;
    }

    setVideoFile(file);
    if (videoLocalPreview) {
      URL.revokeObjectURL(videoLocalPreview);
    }
    setVideoLocalPreview(URL.createObjectURL(file));
    toast.success(`Pitch video selected: ${file.name} (${(file.size / (1024 * 1024)).toFixed(1)} MB)`);
  };

  // 2. Compulsory Document File (.pdf strictly <= 5 MB)
  const handleDocumentFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
    if (!isPdf) {
      toast.error("Proposal document must strictly be a .pdf file.");
      e.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error(
        `PDF proposal exceeds 5 MB limit (${(file.size / (1024 * 1024)).toFixed(1)} MB). Maximum allowed is 5 MB.`,
      );
      e.target.value = "";
      return;
    }

    setDocumentFile(file);
    toast.success(`Proposal PDF selected: ${file.name} (${(file.size / (1024 * 1024)).toFixed(1)} MB)`);
  };

  const handleMemberChange = (index, field, value) => {
    setMembers((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const addMember = () => {
    if (members.length >= 5) {
      toast.error("Maximum 5 team members allowed.");
      return;
    }
    setMembers((prev) => [
      ...prev,
      { name: "", email: "", phone: "", isLeader: false, college: "", department: "" },
    ]);
  };

  const removeMember = (index) => {
    if (members[index].isLeader) {
      toast.error("Team leader cannot be removed.");
      return;
    }
    setMembers((prev) => prev.filter((_, i) => i !== index));
  };

  const handleLogout = () => {
    localStorage.removeItem("juryzaToken");
    localStorage.removeItem("juryzaRole");
    localStorage.removeItem("juryzaEmail");
    localStorage.removeItem("juryzaName");
    toast.success("Signed out successfully.");
    navigate("/juryza");
  };

  // Form Submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.teamName.trim() || !formData.solutionName.trim() || !formData.shortDescription.trim()) {
      toast.error("Please fill in Team Name, Solution Name, and Description.");
      return;
    }

    // Compulsory check
    if (!videoFile) {
      toast.error("Pitch video (.mp4 ≤ 50 MB) is compulsory to complete registration!");
      return;
    }
    if (!documentFile) {
      toast.error("Proposal deck (.pdf ≤ 5 MB) is compulsory to complete registration!");
      return;
    }

    const leader = members.find((m) => m.isLeader);
    if (!leader?.name || !leader?.email) {
      toast.error("Please provide Team Leader Name and Contact details.");
      return;
    }

    setSubmitting(true);
    setUploadProgress(10);

    const data = new FormData();
    data.append("teamName", formData.teamName.trim());
    data.append("category", activeCategory);
    data.append("city", formData.city);
    data.append("theme", formData.theme);
    data.append("solutionName", formData.solutionName.trim());
    data.append("shortDescription", formData.shortDescription.trim());
    data.append("detailedProposal", formData.detailedProposal.trim() || formData.shortDescription.trim());
    data.append("institution", formData.institution);
    data.append("leadName", leader.name);
    data.append("leadEmail", currentUserEmail || leader.email);
    data.append("leadPhone", leader.phone);
    data.append("members", JSON.stringify(members));

    // Append compulsory files
    data.append("videoFile", videoFile);
    data.append("documentFile", documentFile);

    try {
      const res = await api.post("/api/v2/submissions", data, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / (progressEvent.total || 1),
          );
          setUploadProgress(Math.min(percentCompleted, 95));
        },
      });

      setUploadProgress(100);
      toast.success("Team registered successfully! Live tracking is active.");

      // Refresh to live progress view
      await fetchParticipantSubmission(currentUserEmail);
    } catch (err) {
      const message = err.response?.data?.message || "Failed to submit. Please try again.";
      toast.error(message);
    } finally {
      setSubmitting(false);
      setUploadProgress(0);
    }
  };

  // Helper for Stepper State Mapping
  const getStepStatus = (stage, stepIndex) => {
    // 0: submitted
    // 1: allocated to a judge
    // 2: under evaluation
    // 3: shortlisted / not shortlisted
    const normalized = (stage || "submitted").toLowerCase();

    let currentIndex = 0;
    if (normalized.includes("allocated")) currentIndex = 1;
    else if (normalized.includes("evaluation")) currentIndex = 2;
    else if (normalized.includes("shortlisted") || normalized.includes("winner")) currentIndex = 3;

    if (stepIndex < currentIndex) return "completed";
    if (stepIndex === currentIndex) return "active";
    return "pending";
  };

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg)] text-[var(--text)] dm-sans selection:bg-[var(--accent)] selection:text-white">
      {/* Top Header */}
      <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-[var(--surface)]/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-[var(--muted)] hover:text-[var(--text)] transition">
              <FiArrowLeft className="h-4 w-4" />
              <span>Back to Site</span>
            </Link>
            <span className="text-[var(--border)]">|</span>
            <div className="flex items-center gap-2">
              <img src="/logo_final.png" alt="Logo" className="h-6 w-auto rounded-full" />
              <span className="text-xs sm:text-sm font-bold text-[var(--text)]">
                Participant Portal
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex flex-col text-right">
              <span className="text-xs font-bold text-[var(--text)]">{currentUserName}</span>
              <span className="text-[10px] text-[var(--muted)]">{currentUserEmail}</span>
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

      {/* Main Content Area */}
      <main className="flex-1 mx-auto w-full max-w-5xl px-4 py-8 sm:px-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="h-10 w-10 animate-spin rounded-full border-3 border-[var(--accent)] border-t-transparent mb-4" />
            <p className="text-sm text-[var(--muted)]">Checking team registration status...</p>
          </div>
        ) : hasRegistered && mySubmission ? (
          /* ==================================================== */
          /* 1. REGISTERED STATE: LIVE 4-STEP PROGRESS TRACKER     */
          /* ==================================================== */
          <div className="space-y-8">
            {/* Header Badge */}
            <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 sm:p-8 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-[var(--border)]">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 mb-2">
                    <FiCheckCircle className="h-3.5 w-3.5" />
                    <span>Registration Confirmed</span>
                  </div>
                  <h1 className="oswald text-2xl sm:text-4xl font-extrabold uppercase text-[var(--text)]">
                    {mySubmission.teamName}
                  </h1>
                  <p className="text-xs text-[var(--muted)] mt-1">
                    Team ID: <strong className="text-[var(--text)] font-mono">{mySubmission.teamId}</strong> • Registered:{" "}
                    {new Date(mySubmission.createdAt).toLocaleString("en-IN")}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href="https://drive.google.com/drive/folders/1UKXUmqcMewEhw_KG7L1Fe740yCd6fX2e"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-xs font-semibold text-[var(--text)] hover:border-[var(--accent)] transition"
                  >
                    <span>Event Drive Folder</span>
                    <FiExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>

              {/* LIVE 4-STEP SUBMISSION PROGRESS TRACKER */}
              <div className="pt-8">
                <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--muted)] mb-6">
                  Live Submission Progress
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  {/* Step 1: Submitted */}
                  {(() => {
                    const status = getStepStatus(mySubmission.stage, 0);
                    return (
                      <div
                        className={`p-4 rounded-2xl border transition-all ${
                          status === "completed" || status === "active"
                            ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                            : "border-[var(--border)] bg-[var(--surface-2)] text-[var(--muted)]"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider">Step 1</span>
                          <FiCheckCircle className="h-4 w-4 text-emerald-500" />
                        </div>
                        <h4 className="font-bold text-sm text-[var(--text)]">Submitted</h4>
                        <p className="text-[11px] mt-1 text-[var(--muted)]">Files securely uploaded to Google Drive</p>
                      </div>
                    );
                  })()}

                  {/* Step 2: Allocated to a judge */}
                  {(() => {
                    const status = getStepStatus(mySubmission.stage, 1);
                    return (
                      <div
                        className={`p-4 rounded-2xl border transition-all ${
                          status === "completed"
                            ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                            : status === "active"
                            ? "border-amber-500 bg-amber-500/10 shadow-sm ring-2 ring-amber-500/20"
                            : "border-[var(--border)] bg-[var(--surface-2)] text-[var(--muted)]"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider">Step 2</span>
                          {status === "completed" ? (
                            <FiCheckCircle className="h-4 w-4 text-emerald-500" />
                          ) : status === "active" ? (
                            <span className="flex h-2 w-2 rounded-full bg-amber-500 animate-ping" />
                          ) : (
                            <FiClock className="h-4 w-4" />
                          )}
                        </div>
                        <h4 className="font-bold text-sm text-[var(--text)]">Allocated to Judge</h4>
                        <p className="text-[11px] mt-1 text-[var(--muted)]">
                          {mySubmission.allotedJudgeNames?.length > 0
                            ? `Alloted to ${mySubmission.allotedJudgeNames.join(", ")}`
                            : "Awaiting admin judge allocation"}
                        </p>
                      </div>
                    );
                  })()}

                  {/* Step 3: Under evaluation */}
                  {(() => {
                    const status = getStepStatus(mySubmission.stage, 2);
                    return (
                      <div
                        className={`p-4 rounded-2xl border transition-all ${
                          status === "completed"
                            ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                            : status === "active"
                            ? "border-blue-500 bg-blue-500/10 shadow-sm ring-2 ring-blue-500/20"
                            : "border-[var(--border)] bg-[var(--surface-2)] text-[var(--muted)]"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider">Step 3</span>
                          {status === "completed" ? (
                            <FiCheckCircle className="h-4 w-4 text-emerald-500" />
                          ) : status === "active" ? (
                            <span className="flex h-2 w-2 rounded-full bg-blue-500 animate-ping" />
                          ) : (
                            <FiClock className="h-4 w-4" />
                          )}
                        </div>
                        <h4 className="font-bold text-sm text-[var(--text)]">Under Evaluation</h4>
                        <p className="text-[11px] mt-1 text-[var(--muted)]">
                          Rubric scoring & duel comparisons underway
                        </p>
                      </div>
                    );
                  })()}

                  {/* Step 4: Shortlisted / Final Status */}
                  {(() => {
                    const status = getStepStatus(mySubmission.stage, 3);
                    const isRejected = (mySubmission.stage || "").includes("not shortlisted");
                    return (
                      <div
                        className={`p-4 rounded-2xl border transition-all ${
                          status === "active" || status === "completed"
                            ? isRejected
                              ? "border-red-500/40 bg-red-500/10 text-red-700 dark:text-red-300"
                              : "border-amber-500 bg-gradient-to-br from-amber-500/20 to-amber-600/10 shadow-md ring-2 ring-amber-500/30"
                            : "border-[var(--border)] bg-[var(--surface-2)] text-[var(--muted)]"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider">Step 4</span>
                          {status === "active" || status === "completed" ? (
                            <span>{isRejected ? "❌" : "🏆"}</span>
                          ) : (
                            <FiClock className="h-4 w-4" />
                          )}
                        </div>
                        <h4 className="font-bold text-sm text-[var(--text)]">
                          {isRejected ? "Not Shortlisted" : "Shortlisted"}
                        </h4>
                        <p className="text-[11px] mt-1 text-[var(--muted)]">
                          {isRejected
                            ? "Evaluation concluded for this round."
                            : status === "active" || status === "completed"
                            ? "Congratulations! Selected for next round."
                            : "Pending jury finalization"}
                        </p>
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>

            {/* Submission Details Card */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Pitch Video (.mp4) Review Card */}
              <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-md">
                <div className="flex items-center gap-2 font-bold text-sm text-[var(--text)] mb-3">
                  <FiVideo className="h-4 w-4 text-[var(--accent)]" />
                  <span>Compulsory Pitch Video (.mp4)</span>
                </div>
                <div className="aspect-video w-full rounded-2xl bg-black overflow-hidden border border-[var(--border)]">
                  <video
                    controls
                    src={`http://localhost:5001/api/v2/submissions/${mySubmission.teamId}/video-stream`}
                    className="h-full w-full object-contain"
                  />
                </div>
                <p className="text-xs text-[var(--muted)] mt-2">
                  File: <strong className="text-[var(--text)]">{mySubmission.video?.originalName || "Uploaded Pitch Video"}</strong>
                </p>
              </div>

              {/* Proposal Document (.pdf) Review Card */}
              <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-md flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 font-bold text-sm text-[var(--text)] mb-3">
                    <FiFileText className="h-4 w-4 text-[var(--primary)]" />
                    <span>Compulsory Proposal Deck (.pdf)</span>
                  </div>
                  <div className="p-4 rounded-2xl bg-[var(--surface-2)] border border-[var(--border)]">
                    <h5 className="font-bold text-sm text-[var(--text)]">{mySubmission.solutionName}</h5>
                    <p className="text-xs text-[var(--muted)] mt-1 line-clamp-3">{mySubmission.shortDescription}</p>
                    <p className="text-[11px] text-[var(--muted)] mt-3">
                      PDF File: <strong className="text-[var(--text)]">{mySubmission.document?.name || "Proposal.pdf"}</strong>
                    </p>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-[var(--border)] flex gap-2">
                  <a
                    href={`http://localhost:5001/api/v2/submissions/${mySubmission.teamId}/document-preview`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-[var(--primary)] text-white py-2.5 text-xs font-semibold hover:bg-[var(--primary-hover)] transition"
                  >
                    <span>View Full Proposal PDF</span>
                    <FiExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* ==================================================== */
          /* 2. REGISTRATION FORM: COMPULSORY FILES & DETAILS     */
          /* ==================================================== */
          <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 sm:p-10 shadow-xl">
            <div className="mb-8">
              <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-[var(--accent)] mb-2">
                <span>Edition 2 Team Registration</span>
              </div>
              <h1 className="oswald text-2xl sm:text-4xl font-extrabold uppercase text-[var(--text)]">
                Register Your Innovation Pitch
              </h1>
              <p className="mt-1 text-sm text-[var(--muted)]">
                Provide your team details and upload your compulsory pitch video (.mp4 ≤ 50 MB) and proposal deck (.pdf ≤ 5 MB).
              </p>
            </div>

            {/* Category Selector */}
            <div className="mb-8">
              <label className="block text-xs font-bold uppercase tracking-wider text-[var(--muted)] mb-3">
                Select Participation Category
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {CATEGORY_TABS.map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setActiveCategory(tab.key)}
                    className={`p-3 rounded-2xl border text-left transition ${
                      activeCategory === tab.key
                        ? "border-[var(--accent)] bg-amber-500/10 shadow-sm"
                        : "border-[var(--border)] bg-[var(--surface-2)] hover:bg-[var(--surface)]"
                    }`}
                  >
                    <span className="text-[10px] font-bold font-mono px-1.5 py-0.5 rounded bg-[var(--surface)] text-[var(--accent)]">
                      {tab.code}
                    </span>
                    <h4 className="font-bold text-xs sm:text-sm text-[var(--text)] mt-1.5">{tab.label}</h4>
                    <p className="text-[10px] text-[var(--muted)] mt-0.5">{tab.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[var(--text)] mb-1.5">
                    Team Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.teamName}
                    onChange={(e) => handleInputChange("teamName", e.target.value)}
                    placeholder="e.g. EcoFlow Mysuru"
                    className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-3.5 py-2.5 text-sm text-[var(--text)] placeholder-[var(--muted)] focus:border-[var(--accent)] focus:outline-none transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--text)] mb-1.5">
                    Focus Area / Thematic Track *
                  </label>
                  <select
                    value={formData.theme}
                    onChange={(e) => handleInputChange("theme", e.target.value)}
                    className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-3.5 py-2.5 text-sm text-[var(--text)] focus:border-[var(--accent)] focus:outline-none transition"
                  >
                    {TOPIC_OPTIONS.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text)] mb-1.5">
                  Solution Title *
                </label>
                <input
                  type="text"
                  required
                  value={formData.solutionName}
                  onChange={(e) => handleInputChange("solutionName", e.target.value)}
                  placeholder="e.g. Decentralized Solar Micro-Filtration Network for Kukkarahalli Lake"
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-3.5 py-2.5 text-sm text-[var(--text)] placeholder-[var(--muted)] focus:border-[var(--accent)] focus:outline-none transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text)] mb-1.5">
                  Short Description & Executive Summary *
                </label>
                <textarea
                  required
                  rows={3}
                  value={formData.shortDescription}
                  onChange={(e) => handleInputChange("shortDescription", e.target.value)}
                  placeholder="Briefly describe the civic challenge in Mysuru and your team's proposed innovation..."
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-3.5 py-2.5 text-sm text-[var(--text)] placeholder-[var(--muted)] focus:border-[var(--accent)] focus:outline-none transition"
                />
              </div>

              {/* COMPULSORY UPLOADS SECTION */}
              <div className="pt-4 border-t border-[var(--border)]">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-[var(--accent)]">
                    Compulsory Uploads
                  </span>
                  <span className="text-[11px] text-[var(--muted)]">(Both files required)</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Pitch Video (.mp4 <= 50 MB) */}
                  <div className="rounded-2xl border-2 border-dashed border-[var(--border)] p-4 text-center hover:border-[var(--accent)] transition bg-[var(--surface-2)]/50">
                    <FiVideo className="h-8 w-8 mx-auto text-[var(--accent)] mb-2" />
                    <h4 className="text-xs font-bold text-[var(--text)]">Pitch Video (.mp4) *</h4>
                    <p className="text-[11px] text-[var(--muted)] mt-0.5">Strictly .mp4 • Maximum 50 MB</p>

                    <input
                      type="file"
                      accept=".mp4,video/mp4"
                      onChange={handleVideoFileChange}
                      className="hidden"
                      id="video-upload-input"
                    />
                    <label
                      htmlFor="video-upload-input"
                      className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-[var(--surface)] border border-[var(--border)] px-3 py-1.5 text-xs font-semibold text-[var(--text)] hover:border-[var(--accent)] cursor-pointer transition"
                    >
                      <FiUploadCloud className="h-3.5 w-3.5" />
                      <span>{videoFile ? "Change Video" : "Select .mp4 File"}</span>
                    </label>

                    {videoFile && (
                      <div className="mt-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                        ✓ {videoFile.name} ({(videoFile.size / (1024 * 1024)).toFixed(1)} MB)
                      </div>
                    )}
                  </div>

                  {/* Proposal Document (.pdf <= 5 MB) */}
                  <div className="rounded-2xl border-2 border-dashed border-[var(--border)] p-4 text-center hover:border-[var(--primary)] transition bg-[var(--surface-2)]/50">
                    <FiFileText className="h-8 w-8 mx-auto text-[var(--primary)] mb-2" />
                    <h4 className="text-xs font-bold text-[var(--text)]">Proposal Deck (.pdf) *</h4>
                    <p className="text-[11px] text-[var(--muted)] mt-0.5">Strictly .pdf • Maximum 5 MB</p>

                    <input
                      type="file"
                      accept=".pdf,application/pdf"
                      onChange={handleDocumentFileChange}
                      className="hidden"
                      id="doc-upload-input"
                    />
                    <label
                      htmlFor="doc-upload-input"
                      className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-[var(--surface)] border border-[var(--border)] px-3 py-1.5 text-xs font-semibold text-[var(--text)] hover:border-[var(--primary)] cursor-pointer transition"
                    >
                      <FiUploadCloud className="h-3.5 w-3.5" />
                      <span>{documentFile ? "Change PDF" : "Select .pdf File"}</span>
                    </label>

                    {documentFile && (
                      <div className="mt-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                        ✓ {documentFile.name} ({(documentFile.size / (1024 * 1024)).toFixed(1)} MB)
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Team Members Section */}
              <div className="pt-4 border-t border-[var(--border)]">
                <div className="flex items-center justify-between mb-3">
                  <label className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
                    Team Members & Leader Info
                  </label>
                  <button
                    type="button"
                    onClick={addMember}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--accent)] hover:underline"
                  >
                    <FiPlus className="h-3.5 w-3.5" />
                    <span>Add Member</span>
                  </button>
                </div>

                <div className="space-y-3">
                  {members.map((m, idx) => (
                    <div
                      key={idx}
                      className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 p-3 rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] items-center"
                    >
                      <div>
                        <span className="text-[10px] font-bold text-[var(--muted)] block mb-1">
                          {m.isLeader ? "Leader Name *" : `Member ${idx + 1} Name`}
                        </span>
                        <input
                          type="text"
                          required={m.isLeader}
                          value={m.name}
                          onChange={(e) => handleMemberChange(idx, "name", e.target.value)}
                          placeholder="Name"
                          className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1.5 text-xs text-[var(--text)]"
                        />
                      </div>

                      <div>
                        <span className="text-[10px] font-bold text-[var(--muted)] block mb-1">
                          Gmail ID *
                        </span>
                        <input
                          type="email"
                          required
                          value={m.email}
                          onChange={(e) => handleMemberChange(idx, "email", e.target.value)}
                          placeholder="Gmail ID"
                          readOnly={m.isLeader}
                          className={`w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1.5 text-xs text-[var(--text)] ${
                            m.isLeader ? "opacity-80 cursor-not-allowed" : ""
                          }`}
                        />
                      </div>

                      <div>
                        <span className="text-[10px] font-bold text-[var(--muted)] block mb-1">
                          Phone Number *
                        </span>
                        <input
                          type="tel"
                          required={m.isLeader}
                          value={m.phone}
                          onChange={(e) => handleMemberChange(idx, "phone", e.target.value)}
                          placeholder="+91 Phone"
                          className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1.5 text-xs text-[var(--text)]"
                        />
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-2 pt-2 sm:pt-4">
                        <span className="text-[11px] font-semibold text-[var(--muted)]">
                          {m.isLeader ? "★ Team Lead" : "Co-Author"}
                        </span>
                        {!m.isLeader && (
                          <button
                            type="button"
                            onClick={() => removeMember(idx)}
                            className="p-1.5 rounded-lg text-red-500 hover:bg-red-500/10 transition"
                          >
                            <FiTrash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Progress bar if uploading */}
              {submitting && (
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs text-[var(--muted)]">
                    <span>Uploading files to Google Drive...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-[var(--surface-2)] overflow-hidden">
                    <div
                      className="h-full bg-[var(--accent)] transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Submit CTA */}
              <button
                type="submit"
                disabled={submitting}
                className={`w-full rounded-2xl bg-[var(--accent)] hover:brightness-110 py-3.5 text-sm font-bold text-white shadow-lg transition-all duration-200 cursor-pointer ${
                  submitting ? "opacity-70 cursor-not-allowed" : "hover:scale-[1.01]"
                }`}
              >
                {submitting ? "Uploading & Staging Submission..." : "Complete Team Registration 🚀"}
              </button>
            </form>
          </div>
        )}
      </main>

      <FooterSection />
    </div>
  );
};

export default ParticipantPortal;
