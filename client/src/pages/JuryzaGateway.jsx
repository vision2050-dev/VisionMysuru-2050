import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiUsers,
  FiMail,
  FiLock,
  FiUser,
  FiArrowRight,
  FiCheckCircle,
  FiPhone,
  FiBriefcase,
  FiAlertCircle,
  FiEye,
  FiEyeOff,
  FiKey,
} from "react-icons/fi";
import api from "../utils/api";
import {
  clientSignUp,
  clientSignIn,
  clientResetParticipantPassword,
  sendPasswordResetOtp,
  verifyPasswordResetOtp,
} from "../services/juryzaStorage";
import ThemeToggle from "../Components/ThemeToggle";

export const JuryzaGateway = () => {
  const navigate = useNavigate();
  const [authMode, setAuthMode] = useState("signin"); // "signin" | "signup" | "forgot"

  // Form states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [organization, setOrganization] = useState("");

  // Show/hide password state
  const [showPassword, setShowPassword] = useState(false);

  // Status feedback
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // OTP Verification states for Forgot Password
  const [otpCode, setOtpCode] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpCooldown, setOtpCooldown] = useState(0);

  useEffect(() => {
    let timer;
    if (otpCooldown > 0) {
      timer = setTimeout(() => setOtpCooldown((prev) => prev - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [otpCooldown]);

  const handleSendOtp = async () => {
    setError("");
    setSuccess("");
    const cleanEmail = (email || "").toLowerCase().trim();
    if (!cleanEmail) {
      setError("Please enter your registered Gmail / Email ID first.");
      return;
    }
    setOtpLoading(true);
    try {
      await sendPasswordResetOtp(cleanEmail);
      setOtpSent(true);
      setOtpCooldown(60);
      setSuccess("6-digit verification code sent to your email! Please check your inbox (and spam folder).");
    } catch (err) {
      setError(err.message || "Failed to send verification code.");
    } finally {
      setOtpLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const cleanEmail = (email || "").toLowerCase().trim();
    if (!cleanEmail) {
      setError("Please enter a valid Gmail / Email ID.");
      return;
    }

    if (authMode === "forgot") {
      if (!otpCode || otpCode.trim().length !== 6) {
        setError("Please enter the 6-digit verification code sent to your email.");
        return;
      }
      try {
        verifyPasswordResetOtp({ email: cleanEmail, otp: otpCode });
      } catch (verifyErr) {
        setError(verifyErr.message || "Invalid or expired verification code.");
        return;
      }
    }

    if (authMode === "signup" || authMode === "forgot") {
      if (!password || password.length < 8) {
        setError("Password must be at least 8 characters long.");
        return;
      }
    } else {
      if (!password) {
        setError("Please enter your password.");
        return;
      }
    }

    if (authMode === "forgot") {
      if (password !== confirmPassword) {
        setError("Passwords do not match. Please verify.");
        return;
      }
    }

    if (authMode === "signup" && !name.trim()) {
      setError("Please enter the team leader or participant name.");
      return;
    }

    setLoading(true);

    let authData = null;

    // 1. Primary Engine: Attempt Backend API
    try {
      if (authMode === "signup") {
        const payload = {
          name: name.trim(),
          email: cleanEmail,
          password,
          role: "participant",
          phone: phone.trim(),
          organization: organization.trim(),
        };
        const res = await api.post("/api/v2/auth/signup", payload);
        authData = res.data;
      } else if (authMode === "forgot") {
        const payload = {
          email: cleanEmail,
          newPassword: password,
        };
        const res = await api.post("/api/v2/auth/participant/reset-password", payload);
        authData = res.data;
      } else {
        const payload = {
          email: cleanEmail,
          password,
          requestedRole: "participant",
        };
        const res = await api.post("/api/v2/auth/signin", payload);
        authData = res.data;
      }
    } catch (backendErr) {
      console.warn("Backend API unreachable or returned error:", backendErr.message);

      const status = backendErr.response?.status;
      const serverMessage = backendErr.response?.data?.message;

      if (status === 401 || status === 403) {
        setError(serverMessage || "Authentication failed. Please verify your credentials.");
        setLoading(false);
        return;
      }

      // Fallback to client storage engine
      try {
        if (authMode === "signup") {
          authData = await clientSignUp({
            name: name.trim(),
            email: cleanEmail,
            password,
            role: "participant",
            phone: phone.trim(),
            organization: organization.trim(),
          });
        } else if (authMode === "forgot") {
          authData = await clientResetParticipantPassword({
            email: cleanEmail,
            newPassword: password,
          });
        } else {
          authData = await clientSignIn({
            email: cleanEmail,
            password,
            requestedRole: "participant",
          });
        }
      } catch (clientErr) {
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

      localStorage.setItem("juryzaParticipantToken", token);
      localStorage.setItem("juryzaParticipantEmail", user.email || cleanEmail);
      localStorage.setItem("juryzaParticipantName", user.name || name || "Participant");

      localStorage.setItem("juryzaToken", token);
      localStorage.setItem("juryzaRole", "participant");
      localStorage.setItem("juryzaEmail", user.email || cleanEmail);
      localStorage.setItem("juryzaName", user.name || name || "Participant");

      setSuccess(
        authMode === "signup"
          ? "Account registered successfully! Redirecting to submission portal..."
          : authMode === "forgot"
          ? "Password reset successfully! Redirecting to submission portal..."
          : "Signed in successfully! Redirecting to submission portal...",
      );

      setTimeout(() => {
        navigate("/portal");
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
                Edition 2 • Participant Portal
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <ThemeToggle size="sm" />
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="mx-auto max-w-5xl px-4 py-8 sm:py-12 sm:px-6">
        {/* Title banner */}
        <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-10">
          <h1 className="oswald text-3xl sm:text-5xl font-extrabold uppercase tracking-tight text-[var(--text)]">
            Vision Mysuru <span className="text-[var(--accent)]">2050</span> (Ed. 2)
          </h1>
          <p className="mt-2.5 text-sm sm:text-base text-[var(--muted)]">
            Participant registration and live project submission portal.
          </p>
        </div>

        {/* Dynamic Card Container */}
        <div className="max-w-md mx-auto rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 sm:p-8 shadow-xl">
          {/* Card Header & Sign-in / Sign-up toggle */}
          <div className="mb-6 text-center">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--accent)]/15 text-[var(--accent)] mb-3">
              <FiUsers className="h-6 w-6" />
            </div>
            <h2 className="text-xl font-bold text-[var(--text)]">
              Participant Portal
            </h2>
            <p className="text-xs text-[var(--muted)] mt-1">
              {authMode === "signup"
                ? "Register your team to submit your idea"
                : authMode === "forgot"
                ? "Reset your password associated with your Gmail ID"
                : "Sign in to track submission or upload project files"}
            </p>

            <div className="mt-4 inline-flex p-1 rounded-xl bg-[var(--surface-2)] border border-[var(--border)]">
              <button
                type="button"
                onClick={() => {
                  setAuthMode("signin");
                  setError("");
                  setSuccess("");
                  setOtpCode("");
                  setOtpSent(false);
                  setOtpCooldown(0);
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
                  setSuccess("");
                  setOtpCode("");
                  setOtpSent(false);
                  setOtpCooldown(0);
                }}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  authMode === "signup"
                    ? "bg-[var(--surface)] text-[var(--text)] shadow-xs"
                    : "text-[var(--muted)] hover:text-[var(--text)]"
                }`}
              >
                Sign Up (New Team)
              </button>
              {authMode === "forgot" && (
                <button
                  type="button"
                  className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-[var(--surface)] text-[var(--text)] shadow-xs"
                >
                  Reset Password
                </button>
              )}
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
                  Team Leader / Participant Full Name
                </label>
                <div className="relative">
                  <FiUser className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--muted)] h-4 w-4" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Prajwal M S"
                    className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-2)] pl-10 pr-3.5 py-2.5 text-sm text-[var(--text)] placeholder-[var(--muted)] focus:border-[var(--accent)] focus:outline-none transition"
                  />
                </div>
              </div>
            )}

            {/* Email Field */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-xs font-semibold text-[var(--text)]">
                  Gmail / Email ID
                </label>
                {authMode === "forgot" ? (
                  <button
                    type="button"
                    disabled={otpLoading || otpCooldown > 0}
                    onClick={handleSendOtp}
                    className="text-[11px] font-bold text-[var(--accent)] hover:underline disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                  >
                    {otpLoading
                      ? "Sending Code..."
                      : otpCooldown > 0
                      ? `Resend Code (${otpCooldown}s)`
                      : otpSent
                      ? "Resend Code"
                      : "Send Verification Code"}
                  </button>
                ) : (
                  <span className="text-[11px] text-[var(--muted)] font-normal">
                    Must be accessible
                  </span>
                )}
              </div>
              <div className="relative">
                <FiMail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--muted)] h-4 w-4" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="teamlead@gmail.com"
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-2)] pl-10 pr-3.5 py-2.5 text-sm text-[var(--text)] placeholder-[var(--muted)] focus:border-[var(--accent)] focus:outline-none transition"
                />
              </div>
            </div>

            {/* 6-Digit OTP field for Forgot Password mode */}
            {authMode === "forgot" && (
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-xs font-semibold text-[var(--text)] flex items-center gap-1">
                    <FiKey className="h-3.5 w-3.5 text-[var(--accent)]" />
                    <span>6-Digit Verification Code (OTP) *</span>
                  </label>
                  {!otpSent && (
                    <span className="text-[10px] text-amber-500 font-semibold">
                      Click &apos;Send Verification Code&apos;
                    </span>
                  )}
                </div>
                <div className="relative">
                  <input
                    type="text"
                    maxLength={6}
                    required
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                    placeholder="Enter 6-digit OTP (e.g. 482910)"
                    className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-3.5 py-2.5 text-base font-mono font-bold tracking-widest text-[var(--text)] placeholder-[var(--muted)] focus:border-[var(--accent)] focus:outline-none transition"
                  />
                </div>
                <p className="text-[11px] text-[var(--muted)] mt-1">
                  Sent to your registered Gmail address. Valid for 10 minutes.
                </p>
              </div>
            )}

            {/* Sign Up Additional Fields */}
            {authMode === "signup" && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-[var(--text)] mb-1.5">
                    Phone / WhatsApp Number
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
                    College / Institution / Organization
                  </label>
                  <div className="relative">
                    <FiBriefcase className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--muted)] h-4 w-4" />
                    <input
                      type="text"
                      value={organization}
                      onChange={(e) => setOrganization(e.target.value)}
                      placeholder="e.g. NIE Mysuru / SDMIMD / Infosys"
                      className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-2)] pl-10 pr-3.5 py-2.5 text-sm text-[var(--text)] placeholder-[var(--muted)] focus:border-[var(--accent)] focus:outline-none transition"
                    />
                  </div>
                </div>
              </>
            )}

            {/* Password Field with Show/Hide toggle */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-xs font-semibold text-[var(--text)]">
                  {authMode === "signup"
                    ? "Create Password"
                    : authMode === "forgot"
                    ? "New Password"
                    : "Password"}
                </label>
                {authMode === "signin" && (
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode("forgot");
                      setError("");
                      setSuccess("");
                    }}
                    className="text-[11px] font-semibold text-[var(--accent)] hover:underline cursor-pointer"
                  >
                    Forgot Password?
                  </button>
                )}
                {(authMode === "signup" || authMode === "forgot") && (
                  <span className="text-[11px] text-[var(--muted)]">Min. 8 characters</span>
                )}
              </div>
              <div className="relative">
                <FiLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--muted)] h-4 w-4" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={authMode === "signup" || authMode === "forgot" ? 8 : undefined}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={
                    authMode === "signup"
                      ? "Enter secure password (min. 8 characters)"
                      : authMode === "forgot"
                      ? "Enter new password (min. 8 characters)"
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

            {/* Confirm New Password (for Forgot Password mode) */}
            {authMode === "forgot" && (
              <div>
                <label className="block text-xs font-semibold text-[var(--text)] mb-1.5">
                  Confirm New Password
                </label>
                <div className="relative">
                  <FiLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--muted)] h-4 w-4" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={8}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-2)] pl-10 pr-10 py-2.5 text-sm text-[var(--text)] placeholder-[var(--muted)] focus:border-[var(--accent)] focus:outline-none transition"
                  />
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full mt-2 inline-flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold text-white shadow-md bg-[var(--accent)] hover:brightness-110 transition-all duration-200 cursor-pointer ${
                loading ? "opacity-70 cursor-not-allowed" : "hover:scale-[1.01]"
              }`}
            >
              {loading ? (
                <span>Processing...</span>
              ) : (
                <>
                  <span>
                    {authMode === "signup"
                      ? "Create Participant Account"
                      : authMode === "forgot"
                      ? "Verify Code & Reset Password"
                      : "Sign In to Participant Portal"}
                  </span>
                  <FiArrowRight className="h-4 w-4" />
                </>
              )}
            </button>

            {/* Back link when in forgot password mode */}
            {authMode === "forgot" && (
              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode("signin");
                    setError("");
                    setSuccess("");
                    setOtpCode("");
                    setOtpSent(false);
                    setOtpCooldown(0);
                  }}
                  className="text-xs text-[var(--muted)] hover:text-[var(--text)] hover:underline cursor-pointer"
                >
                  ← Remember your password? Sign In
                </button>
              </div>
            )}
          </form>
        </div>
      </main>
    </div>
  );
};

export default JuryzaGateway;
