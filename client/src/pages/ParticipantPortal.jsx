import { useState } from "react";
import { Link } from "react-router-dom";
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

  // Form State
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
    { name: "", email: "", phone: "", isLeader: true, college: "", department: "" },
  ]);

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
    toast.success(`Document selected: ${file.name} (${(file.size / (1024 * 1024)).toFixed(1)} MB)`);
  };

  const removeDocumentFile = () => {
    setDocumentFile(null);
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

  const setLeader = (index) => {
    setMembers((prev) =>
      prev.map((m, i) => ({ ...m, isLeader: i === index }))
    );
  };

  // Convert YouTube / Google Drive URLs into embeddable URLs
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

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.teamName.trim()) {
      toast.error("Team name is required");
      return;
    }
    if (!formData.solutionName.trim()) {
      toast.error("Solution name is required");
      return;
    }
    if (!formData.shortDescription.trim()) {
      toast.error("Short description is required");
      return;
    }
    if (!videoFile && !formData.videoUrl.trim()) {
      toast.error("Please choose and upload your explainer video pitch file to the Drive");
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
              : "citizens"
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
        })
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
        headers: {
          "Content-Type": "multipart/form-data",
        },
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
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to submit. Please try again.");
    } finally {
      setSubmitting(false);
      setUploadProgress(0);
    }
  };

  const embedUrl = getEmbeddableVideoUrl(formData.videoUrl);

  return (
    <div className="min-h-screen flex flex-col dm-sans bg-[var(--bg)] text-[var(--text)]">
      {/* Top Header */}
      <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-[var(--bg)]/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <Link to="/" className="flex items-center gap-2 text-sm font-bold">
            <img src="/logo_final.png" alt="Logo" className="h-8 w-auto inline-block" />
            <span className="hidden sm:inline">Vision Mysuru 2050</span>
            <span className="rounded-full bg-[var(--primary-soft)] px-2.5 py-0.5 text-xs font-bold text-[var(--primary)] border border-[var(--primary)]/30">
              Edition 2 Registration & Pitch Portal
            </span>
          </Link>

          <div className="flex items-center gap-2 sm:gap-3">
            <ThemeToggle size="sm" />
            <Link
              to="/jury"
              className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-xs font-semibold hover:bg-[var(--surface-2)] sm:text-sm sm:px-4 sm:py-2"
            >
              Juryza Hub ⚖️
            </Link>
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--primary)] px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-[var(--primary-hover)] sm:text-sm sm:px-4 sm:py-2"
            >
              <FiArrowLeft /> Home
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 py-10 px-4 sm:px-6">
        <div className="mx-auto max-w-4xl">
          {/* Banner */}
          <div className="rounded-3xl border border-[var(--border)] bg-gradient-to-br from-[var(--surface)] to-[var(--surface-2)] p-6 sm:p-8 mb-8 shadow-xs">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[var(--accent)]">
                  Edition 2 · All-in-One Submission Engine
                </span>
                <h1 className="mt-1 oswald text-3xl font-extrabold uppercase text-[var(--primary)] sm:text-4xl">
                  Register Your Team & Pitch Your Idea
                </h1>
                <p className="mt-2 text-sm text-[var(--muted)] leading-relaxed max-w-2xl">
                  Welcome to Edition 2 of Vision Mysuru 2050. This edition features an{" "}
                  <strong>Explainer Video Pitch</strong> evaluated directly by our 32+ member jury
                  panel via the Juryza fair-scoring engine.
                </p>
              </div>
              <div className="shrink-0 flex items-center gap-2 rounded-2xl bg-amber-500/10 border border-amber-500/30 p-3 text-amber-900 text-xs font-semibold">
                <FiUploadCloud className="text-xl text-amber-600 shrink-0" />
                <span>Auto-syncs to official SDMIMD Drive</span>
              </div>
            </div>
          </div>

          {/* Category Tabs */}
          <div className="mb-8">
            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--muted)] mb-3">
              Select Your Category:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {CATEGORY_TABS.map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveCategory(tab.key)}
                  className={`rounded-2xl border p-3.5 text-left transition ${
                    activeCategory === tab.key
                      ? "border-[var(--primary)] bg-[var(--primary)] text-white shadow-sm"
                      : "border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-2)] text-[var(--text)]"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold">{tab.label}</span>
                    <span
                      className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                        activeCategory === tab.key
                          ? "bg-white/20 text-white"
                          : "bg-[var(--surface-2)] text-[var(--muted)]"
                      }`}
                    >
                      {tab.code}
                    </span>
                  </div>
                  <p
                    className={`mt-1 text-xs truncate ${
                      activeCategory === tab.key ? "text-white/80" : "text-[var(--muted)]"
                    }`}
                  >
                    {tab.desc}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* 1. Basic Team Details */}
            <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 space-y-4">
              <h2 className="text-base font-bold text-[var(--primary)] uppercase tracking-wide flex items-center gap-2">
                <span>01.</span> Team Information
              </h2>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1">
                    Team Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.teamName}
                    onChange={(e) => handleInputChange("teamName", e.target.value)}
                    placeholder="e.g. EcoFlow Mysuru"
                    className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3.5 py-2.5 text-sm outline-none focus:border-[var(--accent)]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1">
                    City / Locality <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.city}
                    onChange={(e) => handleInputChange("city", e.target.value)}
                    className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3.5 py-2.5 text-sm outline-none focus:border-[var(--accent)]"
                  />
                </div>
              </div>

              {/* Category-Specific Fields */}
              {activeCategory === CATEGORY.STUDENT && (
                <div className="grid sm:grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="block text-xs font-semibold mb-1">College / Institution</label>
                    <input
                      type="text"
                      value={formData.institution}
                      onChange={(e) => handleInputChange("institution", e.target.value)}
                      placeholder="e.g. NIE, SJCE, SDMIMD, Mysore University"
                      className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3.5 py-2.5 text-sm outline-none focus:border-[var(--accent)]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1">Department / Degree</label>
                    <input
                      type="text"
                      value={formData.department}
                      onChange={(e) => handleInputChange("department", e.target.value)}
                      placeholder="e.g. Environmental Engineering / PGDM"
                      className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3.5 py-2.5 text-sm outline-none focus:border-[var(--accent)]"
                    />
                  </div>
                </div>
              )}

              {activeCategory === CATEGORY.CORPORATE && (
                <div className="grid sm:grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="block text-xs font-semibold mb-1">Company / Entity Name</label>
                    <input
                      type="text"
                      value={formData.companyName}
                      onChange={(e) => handleInputChange("companyName", e.target.value)}
                      placeholder="e.g. CleanGrid Solutions Pvt Ltd"
                      className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3.5 py-2.5 text-sm outline-none focus:border-[var(--accent)]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1">Industry Sector</label>
                    <input
                      type="text"
                      value={formData.industry}
                      onChange={(e) => handleInputChange("industry", e.target.value)}
                      placeholder="e.g. CleanTech, Mobility, Urban Planning"
                      className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3.5 py-2.5 text-sm outline-none focus:border-[var(--accent)]"
                    />
                  </div>
                </div>
              )}

              {activeCategory === CATEGORY.NGO && (
                <div className="pt-2">
                  <label className="block text-xs font-semibold mb-1">Organization / RWA Name</label>
                  <input
                    type="text"
                    value={formData.organizationName}
                    onChange={(e) => handleInputChange("organizationName", e.target.value)}
                    placeholder="e.g. Mysuru Heritage Citizens' Forum"
                    className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3.5 py-2.5 text-sm outline-none focus:border-[var(--accent)]"
                  />
                </div>
              )}
            </div>

            {/* 2. Team Members */}
            <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-[var(--primary)] uppercase tracking-wide flex items-center gap-2">
                  <span>02.</span> Team Members (1 to 3)
                </h2>
                {members.length < 3 && (
                  <button
                    type="button"
                    onClick={addMember}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-3 py-1.5 text-xs font-semibold hover:bg-[var(--accent-soft)]"
                  >
                    <FiPlus /> Add Member
                  </button>
                )}
              </div>

              <div className="space-y-4">
                {members.map((member, idx) => (
                  <div
                    key={idx}
                    className="rounded-2xl border border-[var(--border)] bg-[var(--bg)] p-4 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
                        Member #{idx + 1}
                      </span>
                      <div className="flex items-center gap-3">
                        <label className="inline-flex items-center gap-1.5 text-xs font-semibold cursor-pointer">
                          <input
                            type="radio"
                            name="teamLeader"
                            checked={member.isLeader}
                            onChange={() => setLeader(idx)}
                            className="accent-[var(--primary)]"
                          />
                          Team Leader
                        </label>
                        {members.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeMember(idx)}
                            className="p-1 text-red-500 hover:text-red-700"
                            title="Remove member"
                          >
                            <FiTrash2 />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-3 gap-3">
                      <div>
                        <input
                          type="text"
                          required
                          value={member.name}
                          onChange={(e) => handleMemberChange(idx, "name", e.target.value)}
                          placeholder="Full Name"
                          className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm outline-none"
                        />
                      </div>
                      <div>
                        <input
                          type="email"
                          required
                          value={member.email}
                          onChange={(e) => handleMemberChange(idx, "email", e.target.value)}
                          placeholder="Email Address"
                          className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm outline-none"
                        />
                      </div>
                      <div>
                        <input
                          type="tel"
                          required
                          value={member.phone}
                          onChange={(e) => handleMemberChange(idx, "phone", e.target.value)}
                          placeholder="Phone (+91)"
                          className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm outline-none"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 3. Thematic Civic Proposal */}
            <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 space-y-4">
              <h2 className="text-base font-bold text-[var(--primary)] uppercase tracking-wide flex items-center gap-2">
                <span>03.</span> Thematic Priority & Proposal
              </h2>

              <div>
                <label className="block text-xs font-semibold mb-1">
                  Thematic Domain <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.theme}
                  onChange={(e) => handleInputChange("theme", e.target.value)}
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3.5 py-2.5 text-sm outline-none"
                >
                  {TOPIC_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">
                  Project / Solution Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.solutionName}
                  onChange={(e) => handleInputChange("solutionName", e.target.value)}
                  placeholder="e.g. AI-Assisted Smart Traffic Grid for Palace Sub-corridor"
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3.5 py-2.5 text-sm outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">
                  Problem Statement & Ground Reality <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={formData.shortDescription}
                  onChange={(e) => handleInputChange("shortDescription", e.target.value)}
                  placeholder="Describe the exact local issue in Mysuru, who is impacted, and the severity..."
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] p-3 text-sm outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">
                  Proposed Solution & Scaling Strategy
                </label>
                <textarea
                  rows={4}
                  value={formData.detailedProposal}
                  onChange={(e) => handleInputChange("detailedProposal", e.target.value)}
                  placeholder="Explain your practical roadmap, technology/civic model, and how it transforms Mysuru by 2050..."
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] p-3 text-sm outline-none"
                />
              </div>
            </div>

            {/* 4. Direct Drive Video Pitch Upload & Supplementary Document */}
            <div className="rounded-3xl border-2 border-[var(--accent)]/40 bg-gradient-to-br from-[var(--surface)] via-amber-500/5 to-[var(--surface)] p-6 space-y-5">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-[var(--accent)] uppercase tracking-wide flex items-center gap-2">
                  <FiVideo className="text-lg" />
                  <span>04.</span> Video Pitch & Document Direct Upload
                </h2>
                <span className="text-xs font-bold bg-amber-500/20 text-amber-800 dark:text-amber-300 px-3 py-1 rounded-full">
                  Direct Drive Upload
                </span>
              </div>

              <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs text-amber-900 dark:text-amber-200 space-y-1">
                <p className="font-bold flex items-center gap-1.5 text-sm">
                  <FiUploadCloud className="text-base text-amber-600 dark:text-amber-400" /> Upload Directly to Official Evaluation Drive
                </p>
                <p className="leading-relaxed">
                  No need to upload to your personal Google Drive and share links! Simply pick your video file and optional proposal document below. They will be uploaded and organized directly into the official Vision Mysuru 2050 evaluation Drive folder for the jury.
                </p>
              </div>

              {/* Video Pitch File Dropzone */}
              <div>
                <label className="block text-xs font-bold text-[var(--text)] uppercase tracking-wider mb-2">
                  Pitch Video File <span className="text-red-500">*</span>
                  <span className="normal-case font-normal text-[var(--muted)] ml-2">
                    (.mp4, .mov, .webm · 1 to 3 minutes · max 500 MB)
                  </span>
                </label>

                {!videoFile ? (
                  <label className="group flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[var(--border)] bg-[var(--bg)] p-8 text-center cursor-pointer hover:border-[var(--accent)] hover:bg-[var(--surface-2)] transition-all">
                    <input
                      type="file"
                      accept="video/mp4,video/webm,video/quicktime,video/x-matroska,video/*"
                      onChange={handleVideoFileChange}
                      className="hidden"
                    />
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--accent-soft)] text-[var(--accent)] text-2xl group-hover:scale-110 transition-transform">
                      <FiUploadCloud />
                    </div>
                    <p className="mt-3 text-sm font-bold text-[var(--text)]">
                      Choose Pitch Video File or Drag & Drop Here
                    </p>
                    <p className="mt-1 text-xs text-[var(--muted)]">
                      MP4, MOV, WebM, MKV supported (Up to 500 MB)
                    </p>
                  </label>
                ) : (
                  <div className="rounded-2xl border border-emerald-500/40 bg-emerald-500/5 p-4 space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-600 text-lg">
                          <FiVideo />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-[var(--text)] truncate max-w-xs sm:max-w-md">
                            {videoFile.name}
                          </p>
                          <p className="text-xs text-[var(--muted)]">
                            {(videoFile.size / (1024 * 1024)).toFixed(1)} MB · Ready for Direct Drive Upload
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={removeVideoFile}
                        className="inline-flex items-center gap-1 rounded-lg border border-red-500/30 bg-red-500/10 px-2.5 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-500/20 transition"
                      >
                        <FiTrash2 /> Remove
                      </button>
                    </div>

                    {/* Instant In-Browser Video Player Preview */}
                    {videoLocalPreview && (
                      <div className="mt-2 rounded-xl overflow-hidden bg-black shadow-inner">
                        <video
                          src={videoLocalPreview}
                          controls
                          playsInline
                          className="aspect-video w-full object-contain"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Supplementary Document File Picker */}
              <div className="pt-2">
                <label className="block text-xs font-bold text-[var(--text)] uppercase tracking-wider mb-2">
                  Supplementary Proposal Document (Optional)
                  <span className="normal-case font-normal text-[var(--muted)] ml-2">
                    (.pdf, .docx, .pptx · max 50 MB)
                  </span>
                </label>

                {!documentFile ? (
                  <label className="flex items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--bg)] p-3.5 cursor-pointer hover:border-[var(--accent)] hover:bg-[var(--surface-2)] transition-all">
                    <input
                      type="file"
                      accept=".pdf,.docx,.doc,.pptx,.ppt,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation"
                      onChange={handleDocumentFileChange}
                      className="hidden"
                    />
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--accent-soft)] text-[var(--accent)]">
                        <FiFileText />
                      </div>
                      <div className="text-left">
                        <p className="text-xs font-semibold text-[var(--text)]">
                          Attach PDF Blueprint or Slide Deck
                        </p>
                        <p className="text-[10px] text-[var(--muted)]">Optional supplementary documentation</p>
                      </div>
                    </div>
                    <span className="text-xs font-semibold rounded-lg bg-[var(--surface)] border border-[var(--border)] px-3 py-1.5 hover:bg-[var(--surface-2)] text-[var(--text)]">
                      Browse File
                    </span>
                  </label>
                ) : (
                  <div className="flex items-center justify-between p-3 rounded-xl border border-emerald-500/40 bg-emerald-500/5">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-600">
                        <FiFileText />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-[var(--text)]">{documentFile.name}</p>
                        <p className="text-[10px] text-[var(--muted)]">
                          {(documentFile.size / (1024 * 1024)).toFixed(1)} MB · Ready for Drive Upload
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={removeDocumentFile}
                      className="text-xs font-semibold text-red-500 hover:text-red-700 p-1"
                    >
                      <FiTrash2 />
                    </button>
                  </div>
                )}
              </div>

              {/* Upload Progress Bar if submitting */}
              {submitting && uploadProgress > 0 && (
                <div className="space-y-1.5 pt-2">
                  <div className="flex justify-between text-xs font-bold text-[var(--accent)]">
                    <span>Uploading directly to Drive...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="h-2.5 w-full rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden shadow-inner">
                    <div
                      className="h-full bg-gradient-to-r from-amber-500 to-emerald-500 transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 rounded-2xl bg-[var(--primary)] py-3.5 px-6 font-bold text-white transition hover:bg-[var(--primary-hover)] shadow-md disabled:opacity-50"
              >
                {submitting
                  ? `Uploading to Evaluation Drive (${uploadProgress}%)...`
                  : "Submit Idea & Upload to Drive 🚀"}
              </button>
            </div>
          </form>
        </div>
      </main>

      {/* Success Modal */}
      <AnimatePresence>
        {showSuccessModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg rounded-3xl border-2 border-emerald-500 bg-[var(--surface)] p-6 sm:p-8 shadow-2xl text-center"
            >
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 text-3xl mb-4">
                <FiCheckCircle />
              </div>

              <h3 className="oswald text-2xl font-bold uppercase text-[var(--text)]">
                Submission Received!
              </h3>
              <p className="mt-1 text-sm text-[var(--muted)]">
                Your proposal has been logged and queued for Round 1 Juryza evaluation.
              </p>

              <div className="my-6 rounded-2xl border border-emerald-300 bg-emerald-50 p-4">
                <p className="text-xs uppercase font-bold text-emerald-800">Your Official Team ID</p>
                <p className="mt-1 text-3xl font-extrabold tracking-wider text-emerald-900">
                  {generatedSubmission?.teamId || "VM2-ST-XXXXXX"}
                </p>
                <p className="mt-2 text-xs text-emerald-700">
                  Please save this ID for tracking evaluation rounds and jury scoring.
                </p>
              </div>

              <div className="space-y-2 text-left text-xs bg-[var(--bg)] p-4 rounded-xl border border-[var(--border)] mb-6">
                <p>
                  <strong>Team Name:</strong> {generatedSubmission?.teamName}
                </p>
                <p>
                  <strong>Theme:</strong> {generatedSubmission?.theme}
                </p>
                <p>
                  <strong>Video Pitch:</strong> Logged & Ready for Jury
                </p>
                <p className="text-amber-800 font-semibold mt-1">
                  📁 Drive Archive: Synced to official SDMIMD repository folder
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <Link
                  to="/jury"
                  className="flex-1 rounded-xl bg-[var(--accent)] py-2.5 text-sm font-semibold text-white hover:opacity-90"
                >
                  View in Jury Hub ⚖️
                </Link>
                <button
                  type="button"
                  onClick={() => setShowSuccessModal(false)}
                  className="flex-1 rounded-xl border border-[var(--border)] py-2.5 text-sm font-semibold hover:bg-[var(--surface-2)]"
                >
                  Done
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <FooterSection />
    </div>
  );
};

export default ParticipantPortal;
