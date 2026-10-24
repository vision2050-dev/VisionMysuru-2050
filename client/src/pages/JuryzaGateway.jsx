import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiUsers,
  FiAward,
  FiShield,
  FiArrowRight,
  FiCheckCircle,
  FiLock,
  FiMail,
  FiUser,
  FiPhone,
  FiBriefcase,
  FiAlertCircle,
  FiExternalLink,
  FiEye,
  FiEyeOff,
  FiActivity,
} from "react-icons/fi";
import api from "../utils/api";
import { clientSignUp, clientSignIn } from "../services/juryzaStorage";
import ThemeToggle from "../Components/ThemeToggle";

export const JuryzaGateway = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("participant"); // "participant" | "judge" | "admin"
  const [authMode, setAuthMode] = useState("signin"); // "signin" | "signup"

  // Form states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [organization, setOrganization] = useState("");
  const [specialization, setSpecialization] = useState("Environmental Sustainability");

  // Show/hide password state
  const [showPassword, setShowPassword] = useState(false);

  // Status feedback
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setError("");
    setSuccess("");
    // Pre-fill email placeholder or prompt if switching
    if (tab === "admin" && !email) {
      setEmail("vision2050@sdmimd.ac.in");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const cleanEmail = (email || "").toLowerCase().trim();
    if (!cleanEmail) {
      setError("Please enter a valid Gmail ID.");
      return;
    }

    if (!password || password.length < 4) {
      setError("Password must be at least 4 characters long.");
      return;
    }

    if (authMode === "signup" && !name.trim()) {
      setError("Please enter your full name.");
      return;
    }

    setLoading(true);

    let authData = null;
    let authError = null;

    // 1. Primary Engine: Attempt Backend API
    try {
      if (authMode === "signup") {
        const payload = {
          name: name.trim(),
          email: cleanEmail,
          password,
          role: activeTab,
          phone: phone.trim(),
          organization: organization.trim(),
          specialization,
        };
        const res = await api.post("/api/v2/auth/signup", payload);
        authData = res.data;
      } else {
        const payload = {
          email: cleanEmail,
          password,
          requestedRole: activeTab,
        };
        const res = await api.post("/api/v2/auth/signin", payload);
        authData = res.data;
      }
    } catch (backendErr) {
      authError = backendErr;
      console.warn("Backend API unreachable or returned error:", backendErr.message);

      // If backend returned a clear business error from DB (e.g. invalid password or unauthorized role),
      // check if it's a network error (no response) vs 401/403/404 from active server
      const status = backendErr.response?.status;
      const serverMessage = backendErr.response?.data?.message;

      // If backend is active and gave a definitive auth rejection (e.g. wrong password or unauthorized role)
      if (status === 401 || status === 403) {
        setError(serverMessage || "Authentication failed. Please verify your credentials.");
        setLoading(false);
        return;
      }

      // If backend is offline, network failed, or not found on deployed domain:
      // Seamlessly fall back to client storage engine
      try {
        if (authMode === "signup") {
          authData = await clientSignUp({
            name: name.trim(),
            email: cleanEmail,
            password,
            role: activeTab,
            phone: phone.trim(),
            organization: organization.trim(),
            specialization,
          });
        } else {
          authData = await clientSignIn({
            email: cleanEmail,
            password,
            requestedRole: activeTab,
          });
        }
      } catch (clientErr) {
        // Fallback also failed or gave a user-friendly message
        const finalMsg =
          clientErr.message ||
          serverMessage ||
          "Authentication failed. Please check your credentials or click Sign Up.";
        setError(finalMsg);
        setLoading(false);
        return;
      }
    }

    if (authData && (authData.token || authData.user)) {
      const user = authData.user || {};
      const token = authData.token || `session-${Date.now()}`;
      const userRole = user.role || activeTab;

      localStorage.setItem("juryzaToken", token);
      localStorage.setItem("juryzaRole", userRole);
      localStorage.setItem("juryzaEmail", user.email || cleanEmail);
      localStorage.setItem("juryzaName", user.name || name || "User");

      if (userRole === "admin") {
        localStorage.setItem("adminToken", token);
      }

      setSuccess(
        authMode === "signup"
          ? "Account registered successfully! Redirecting..."
          : "Signed in successfully! Redirecting...",
      );

      setTimeout(() => {
        if (userRole === "admin") {
          navigate("/admin");
        } else if (userRole === "judge") {
          navigate("/jury");
        } else {
          navigate("/portal");
        }
      }, 500);
    } else {
      setError("Unable to process authentication. Please try again.");
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] dm-sans selection:bg-[var(--accent)] selection:text-white">
      {/* Top Header */}
      <header className="border-b border-[var(--border)] bg-[var(--surface)]/80 backdrop-blur-md sticky top-0 z-40">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <Link to="/" className="flex items-center gap-3 group">
            <img src="/logo_final.png" alt="Logo" className="h-8 w-auto rounded-full" />
            <div className="flex flex-col">
              <span className="text-sm font-bold tracking-tight text-[var(--text)] group-hover:text-[var(--accent)] transition">
                Vision Mysuru 2050
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--muted)]">
                Edition 2 • Juryza Gateway
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <div className="hidden sm:inline-flex items-center gap-1.5 text-[11px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Dual-Engine Resilient Auth</span>
            </div>
            <a
              href="https://drive.google.com/drive/folders/1UKXUmqcMewEhw_KG7L1Fe740yCd6fX2e"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline-flex items-center gap-1.5 text-xs text-[var(--muted)] hover:text-[var(--text)] border border-[var(--border)] px-2.5 py-1.5 rounded-lg transition"
            >
              <span>Drive Storage</span>
              <FiExternalLink className="h-3 w-3" />
            </a>
            <ThemeToggle size="sm" />
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="mx-auto max-w-5xl px-4 py-8 sm:py-12 sm:px-6">
        {/* Title banner */}
        <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-[var(--accent)] mb-3">
            <span>⚖️ Official Juryza Portal</span>
          </div>
          <h1 className="oswald text-3xl sm:text-5xl font-extrabold uppercase tracking-tight text-[var(--text)]">
            Vision Mysuru <span className="text-[var(--accent)]">2050</span> (Ed. 2)
          </h1>
          <p className="mt-2.5 text-sm sm:text-base text-[var(--muted)]">
            One unified platform for participant registrations, jury evaluations, and administrative oversight.
          </p>
        </div>

        {/* 3 Portal Role Selector Tabs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8 max-w-3xl mx-auto">
          {/* Participant Tab */}
          <button
            type="button"
            onClick={() => handleTabChange("participant")}
            className={`flex flex-col items-center text-center p-4 rounded-2xl border transition-all duration-200 cursor-pointer ${
              activeTab === "participant"
                ? "border-[var(--accent)] bg-amber-500/10 shadow-md ring-2 ring-[var(--accent)]/30"
                : "border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-2)]"
            }`}
          >
            <div
              className={`h-11 w-11 rounded-xl flex items-center justify-center mb-2.5 transition ${
                activeTab === "participant"
                  ? "bg-[var(--accent)] text-white"
                  : "bg-[var(--surface-2)] text-[var(--muted)]"
              }`}
            >
              <FiUsers className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-sm text-[var(--text)]">1. Participants</h3>
            <p className="text-[11px] text-[var(--muted)] mt-1">
              Register team & track submission live
            </p>
          </button>

          {/* Judge Tab */}
          <button
            type="button"
            onClick={() => handleTabChange("judge")}
            className={`flex flex-col items-center text-center p-4 rounded-2xl border transition-all duration-200 cursor-pointer ${
              activeTab === "judge"
                ? "border-[var(--primary)] bg-red-500/10 shadow-md ring-2 ring-[var(--primary)]/30"
                : "border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-2)]"
            }`}
          >
            <div
              className={`h-11 w-11 rounded-xl flex items-center justify-center mb-2.5 transition ${
                activeTab === "judge"
                  ? "bg-[var(--primary)] text-white"
                  : "bg-[var(--surface-2)] text-[var(--muted)]"
              }`}
            >
              <FiAward className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-sm text-[var(--text)]">2. Judges (Jury)</h3>
            <p className="text-[11px] text-[var(--muted)] mt-1">
              Score only alloted team submissions
            </p>
          </button>

          {/* Admin Tab */}
          <button
            type="button"
            onClick={() => handleTabChange("admin")}
            className={`flex flex-col items-center text-center p-4 rounded-2xl border transition-all duration-200 cursor-pointer ${
              activeTab === "admin"
                ? "border-emerald-500 bg-emerald-500/10 shadow-md ring-2 ring-emerald-500/30"
                : "border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-2)]"
            }`}
          >
            <div
              className={`h-11 w-11 rounded-xl flex items-center justify-center mb-2.5 transition ${
                activeTab === "admin"
                  ? "bg-emerald-600 text-white"
                  : "bg-[var(--surface-2)] text-[var(--muted)]"
              }`}
            >
              <FiShield className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-sm text-[var(--text)]">3. Admin</h3>
            <p className="text-[11px] text-[var(--muted)] mt-1">
              Full control, allocations & master data
            </p>
          </button>
        </div>

        {/* Dynamic Card Container */}
        <div className="max-w-md mx-auto rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 sm:p-8 shadow-xl">
          {/* Card Header & Sign-in / Sign-up toggle */}
          <div className="mb-6 text-center">
            <h2 className="text-xl font-bold text-[var(--text)] flex items-center justify-center gap-2">
              {activeTab === "participant" && <span>Participant Portal</span>}
              {activeTab === "judge" && <span>Jury Panel Portal</span>}
              {activeTab === "admin" && <span>Admin Control Room</span>}
            </h2>

            <div className="mt-4 inline-flex p-1 rounded-xl bg-[var(--surface-2)] border border-[var(--border)]">
              <button
                type="button"
                onClick={() => {
                  setAuthMode("signin");
                  setError("");
                }}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  authMode === "signin"
                    ? "bg-[var(--surface)] text-[var(--text)] shadow-xs"
                    : "text-[var(--muted)] hover:text-[var(--text)]"
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthMode("signup");
                  setError("");
                }}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  authMode === "signup"
                    ? "bg-[var(--surface)] text-[var(--text)] shadow-xs"
                    : "text-[var(--muted)] hover:text-[var(--text)]"
                }`}
              >
                Sign Up (New)
              </button>
            </div>
          </div>

          {/* Error Banner */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="mb-5 flex flex-col gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-3.5 text-xs text-red-600 dark:text-red-400"
              >
                <div className="flex items-start gap-2.5">
                  <FiAlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span className="font-semibold leading-relaxed">{error}</span>
                </div>

                {/* Helpful quick actions based on error */}
                {error.toLowerCase().includes("no account found") && authMode === "signin" && (
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode("signup");
                      setError("");
                    }}
                    className="self-start underline font-bold hover:brightness-110 ml-6 cursor-pointer"
                  >
                    Click here to Sign Up with this email →
                  </button>
                )}

                {error.toLowerCase().includes("already exists") && authMode === "signup" && (
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode("signin");
                      setError("");
                    }}
                    className="self-start underline font-bold hover:brightness-110 ml-6 cursor-pointer"
                  >
                    Click here to Sign In instead →
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Success Banner */}
          <AnimatePresence>
            {success && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="mb-5 flex items-start gap-2.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-xs text-emerald-600 dark:text-emerald-400"
              >
                <FiCheckCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span className="font-semibold leading-relaxed">{success}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name field (for Sign Up) */}
            {authMode === "signup" && (
              <div>
                <label className="block text-xs font-semibold text-[var(--text)] mb-1.5">
                  Full Name
                </label>
                <div className="relative">
                  <FiUser className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--muted)] h-4 w-4" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={
                      activeTab === "judge"
                        ? "Dr. / Prof. / Judge Name"
                        : activeTab === "admin"
                        ? "Admin Name / SDMIMD Officer"
                        : "Team Leader Name"
                    }
                    className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-2)] pl-10 pr-3.5 py-2.5 text-sm text-[var(--text)] placeholder-[var(--muted)] focus:border-[var(--accent)] focus:outline-none transition"
                  />
                </div>
              </div>
            )}

            {/* Email Field */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-xs font-semibold text-[var(--text)]">
                  Gmail / Official Email ID
                </label>
                <span className="text-[11px] text-[var(--muted)] font-normal">
                  Must be accessible
                </span>
              </div>
              <div className="relative">
                <FiMail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--muted)] h-4 w-4" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={
                    activeTab === "admin"
                      ? "vision2050@sdmimd.ac.in"
                      : activeTab === "judge"
                      ? "judge.mysuru@gmail.com"
                      : "teamleader@gmail.com"
                  }
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-2)] pl-10 pr-3.5 py-2.5 text-sm text-[var(--text)] placeholder-[var(--muted)] focus:border-[var(--accent)] focus:outline-none transition"
                />
              </div>
            </div>

            {/* Sign Up Additional Fields */}
            {authMode === "signup" && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-[var(--text)] mb-1.5">
                    Phone Number
                  </label>
                  <div className="relative">
                    <FiPhone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--muted)] h-4 w-4" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 98450 12345"
                      className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-2)] pl-10 pr-3.5 py-2.5 text-sm text-[var(--text)] placeholder-[var(--muted)] focus:border-[var(--accent)] focus:outline-none transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--text)] mb-1.5">
                    Institution / Organization
                  </label>
                  <div className="relative">
                    <FiBriefcase className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--muted)] h-4 w-4" />
                    <input
                      type="text"
                      value={organization}
                      onChange={(e) => setOrganization(e.target.value)}
                      placeholder={
                        activeTab === "admin"
                          ? "SDMIMD Mysuru"
                          : "e.g. NIE / SDMIMD / Infosys"
                      }
                      className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-2)] pl-10 pr-3.5 py-2.5 text-sm text-[var(--text)] placeholder-[var(--muted)] focus:border-[var(--accent)] focus:outline-none transition"
                    />
                  </div>
                </div>

                {activeTab === "judge" && (
                  <div>
                    <label className="block text-xs font-semibold text-[var(--text)] mb-1.5">
                      Evaluation Domain / Track
                    </label>
                    <select
                      value={specialization}
                      onChange={(e) => setSpecialization(e.target.value)}
                      className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-3.5 py-2.5 text-sm text-[var(--text)] focus:border-[var(--accent)] focus:outline-none transition"
                    >
                      <option value="Environmental Sustainability">Environmental Sustainability</option>
                      <option value="Urban Infrastructure & Mobility">Urban Infrastructure & Mobility</option>
                      <option value="Heritage & Tourism">Heritage & Tourism</option>
                      <option value="Smart Governance & Digital Tech">Smart Governance & Digital Tech</option>
                      <option value="Healthcare & Wellbeing">Healthcare & Wellbeing</option>
                      <option value="Education & Skill Development">Education & Skill Development</option>
                      <option value="All Tracks / General">All Tracks / General</option>
                    </select>
                  </div>
                )}
              </>
            )}

            {/* Password Field with Show/Hide toggle */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-xs font-semibold text-[var(--text)]">
                  {authMode === "signup" ? "Create Password" : "Password"}
                </label>
                {authMode === "signup" && (
                  <span className="text-[11px] text-[var(--muted)]">Min. 4 characters</span>
                )}
              </div>
              <div className="relative">
                <FiLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--muted)] h-4 w-4" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={
                    authMode === "signup"
                      ? "Enter your secure password"
                      : "Enter your password"
                  }
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-2)] pl-10 pr-10 py-2.5 text-sm text-[var(--text)] placeholder-[var(--muted)] focus:border-[var(--accent)] focus:outline-none transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  tabIndex={-1}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--muted)] hover:text-[var(--text)] transition cursor-pointer"
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <FiEyeOff className="h-4 w-4" /> : <FiEye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full mt-2 inline-flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold text-white shadow-md transition-all duration-200 cursor-pointer ${
                activeTab === "admin"
                  ? "bg-emerald-600 hover:bg-emerald-700"
                  : activeTab === "judge"
                  ? "bg-[var(--primary)] hover:bg-[var(--primary-hover)]"
                  : "bg-[var(--accent)] hover:brightness-110"
              } ${loading ? "opacity-70 cursor-not-allowed" : "hover:scale-[1.01]"}`}
            >
              {loading ? (
                <span>Processing...</span>
              ) : (
                <>
                  <span>
                    {authMode === "signup"
                      ? `Create ${
                          activeTab === "admin"
                            ? "Admin"
                            : activeTab === "judge"
                            ? "Judge"
                            : "Participant"
                        } Account`
                      : `Sign In to ${
                          activeTab === "admin"
                            ? "Admin Control Room"
                            : activeTab === "judge"
                            ? "Jury Hub"
                            : "Participant Portal"
                        }`}
                  </span>
                  <FiArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          {/* Contextual Footer Note */}
          <div className="mt-6 border-t border-[var(--border)] pt-4 text-center">
            {activeTab === "participant" && (
              <p className="text-[11px] text-[var(--muted)] leading-relaxed">
                📌 <strong>Registration Notice:</strong> Pitch video (.mp4 ≤ 50 MB) and proposal deck (.pdf ≤ 5 MB) are compulsory to finalize team submission.
              </p>
            )}
            {activeTab === "judge" && (
              <p className="text-[11px] text-[var(--muted)] leading-relaxed">
                ⚖️ <strong>Jury Notice:</strong> You will only see and score submissions alloted to your registered Gmail ID by the admin.
              </p>
            )}
            {activeTab === "admin" && (
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400 leading-relaxed font-semibold">
                🛡️ Admin account with full authority to allocate submissions, score teams, and export master data.
              </p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default JuryzaGateway;
