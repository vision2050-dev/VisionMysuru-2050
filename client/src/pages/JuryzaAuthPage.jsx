import { useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-hot-toast";
import {
  FiShield,
  FiAward,
  FiUser,
  FiArrowRight,
  FiCheckCircle,
  FiLock,
  FiMail,
  FiArrowLeft,
} from "react-icons/fi";
import api from "../utils/api";
import ThemeToggle from "../Components/ThemeToggle";

export const JuryzaAuthPage = () => {
  const [searchParams] = useSearchParams();
  const initialRole = searchParams.get("role") || "participant";
  const [selectedRole, setSelectedRole] = useState(initialRole); // "participant" | "judge" | "admin"
  const [email, setEmail] = useState(
    initialRole === "admin" ? "visionmysuru2050@sdmimd.ac.in" : "",
  );
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRoleChange = (role) => {
    setSelectedRole(role);
    if (role === "admin") {
      setEmail("visionmysuru2050@sdmimd.ac.in");
      setName("SDMIMD Vision Admin");
    } else if (role === "judge") {
      setEmail("gayathri.jury@gmail.com");
      setName("Dr. H. Gayathri");
    } else {
      setEmail("");
      setName("");
    }
  };

  const handleLogin = async (e) => {
    if (e) e.preventDefault();

    if (!email || !email.includes("@")) {
      toast.error("Please enter a valid Gmail address");
      return;
    }

    if (
      selectedRole === "admin" &&
      email.toLowerCase().trim() !== "visionmysuru2050@sdmimd.ac.in"
    ) {
      toast.error(
        "Access Denied: The Admin Portal is strictly restricted to visionmysuru2050@sdmimd.ac.in",
      );
      return;
    }

    setLoading(true);
    try {
      const response = await api.post("/api/v2/auth/login", {
        email: email.trim(),
        name: name.trim(),
        roleAttempt: selectedRole,
      });

      const { token, user } = response.data;

      localStorage.setItem("juryzaToken", token);
      localStorage.setItem("juryzaUser", JSON.stringify(user));
      localStorage.setItem("juryzaUserEmail", user.email);
      localStorage.setItem("juryzaRole", user.role);

      toast.success(`Signed in as ${user.name} (${user.role.toUpperCase()})`);

      if (user.role === "admin") {
        navigate("/admin");
      } else if (user.role === "judge") {
        navigate("/jury");
      } else {
        navigate("/portal");
      }
    } catch (err) {
      console.error(err);
      toast.error(
        err.response?.data?.message || "Authentication failed. Please verify your Gmail ID.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] dm-sans flex flex-col justify-between">
      {/* Top Bar */}
      <header className="border-b border-[var(--border)] bg-[var(--surface)]/90 backdrop-blur-md sticky top-0 z-40">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <Link to="/" className="flex items-center gap-2 text-sm font-bold text-[var(--text)]">
            <img
              src="/logo_final.png"
              alt="Vision Mysuru 2050 Logo"
              className="h-8 w-auto inline-block"
            />
            <span>Vision Mysuru 2050</span>
            <span className="rounded-full bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 text-[11px] font-bold text-[var(--accent)]">
              Authentication Gateway
            </span>
          </Link>

          <div className="flex items-center gap-3">
            <ThemeToggle size="sm" />
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-3 py-1.5 text-xs font-semibold hover:bg-[var(--surface)] transition"
            >
              <FiArrowLeft className="h-3.5 w-3.5" /> Back to Site
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-xl rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 sm:p-8 shadow-2xl backdrop-blur-xl relative overflow-hidden"
        >
          {/* Subtle glow decoration */}
          <div className="absolute -top-20 -right-20 h-40 w-40 rounded-full bg-[var(--accent)]/15 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-20 -left-20 h-40 w-40 rounded-full bg-[var(--primary)]/15 blur-3xl pointer-events-none" />

          {/* Heading */}
          <div className="text-center relative z-10">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-[var(--accent)]">
              <FiLock className="h-3 w-3" /> Secure Gmail Access
            </span>
            <h1 className="oswald mt-3 text-3xl font-extrabold uppercase tracking-tight sm:text-4xl">
              Vision Mysuru 2050 Portals
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-[var(--muted)]">
              Select your role to access your dedicated platform with your Gmail ID
            </p>
          </div>

          {/* Role Switcher Tabs */}
          <div className="mt-6 grid grid-cols-3 gap-2 p-1.5 rounded-2xl bg-[var(--surface-2)] border border-[var(--border)] relative z-10">
            <button
              type="button"
              onClick={() => handleRoleChange("participant")}
              className={`flex flex-col items-center justify-center gap-1 rounded-xl py-2.5 px-2 text-xs font-bold transition-all ${
                selectedRole === "participant"
                  ? "bg-[var(--surface)] text-[var(--text)] shadow-md border border-[var(--border)]"
                  : "text-[var(--muted)] hover:text-[var(--text)]"
              }`}
            >
              <FiUser className="h-4 w-4 text-emerald-500" />
              <span>Participant</span>
            </button>

            <button
              type="button"
              onClick={() => handleRoleChange("judge")}
              className={`flex flex-col items-center justify-center gap-1 rounded-xl py-2.5 px-2 text-xs font-bold transition-all ${
                selectedRole === "judge"
                  ? "bg-[var(--surface)] text-[var(--text)] shadow-md border border-[var(--border)]"
                  : "text-[var(--muted)] hover:text-[var(--text)]"
              }`}
            >
              <FiAward className="h-4 w-4 text-amber-500" />
              <span>Jury Member</span>
            </button>

            <button
              type="button"
              onClick={() => handleRoleChange("admin")}
              className={`flex flex-col items-center justify-center gap-1 rounded-xl py-2.5 px-2 text-xs font-bold transition-all ${
                selectedRole === "admin"
                  ? "bg-[var(--surface)] text-[var(--text)] shadow-md border border-[var(--border)]"
                  : "text-[var(--muted)] hover:text-[var(--text)]"
              }`}
            >
              <FiShield className="h-4 w-4 text-red-500" />
              <span>Admin Portal</span>
            </button>
          </div>

          {/* Description for selected role */}
          <div className="mt-4 rounded-xl border border-[var(--border)] bg-[var(--surface-2)]/60 p-3 text-xs text-[var(--muted)] leading-relaxed relative z-10">
            {selectedRole === "participant" && (
              <p>
                🚀 <strong>Participant Access:</strong> Sign in with your Gmail to register your team, upload pitch videos directly to our evaluation drive, and monitor your live submission progress status in real-time.
              </p>
            )}
            {selectedRole === "judge" && (
              <p>
                ⚖️ <strong>Jury Access:</strong> Authorized jury members only. Access only team submissions alloted to you by the admin, review pitch videos, and score rubrics & duels.
              </p>
            )}
            {selectedRole === "admin" && (
              <p className="text-red-700 dark:text-red-400 font-semibold">
                🛡️ <strong>Admin Access:</strong> Strictly restricted to <code>visionmysuru2050@sdmimd.ac.in</code>. Provides complete oversight of all submissions, judge allocations, and round advancements.
              </p>
            )}
          </div>

          {/* Login Form */}
          <form onSubmit={handleLogin} className="mt-5 space-y-4 relative z-10">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[var(--muted)] mb-1">
                Your Full Name
              </label>
              <div className="relative">
                <FiUser className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--muted)] h-4 w-4" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Dr. Ramesh / Aditi Rao"
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] pl-10 pr-3.5 py-2.5 text-xs sm:text-sm font-medium focus:border-[var(--accent)] focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[var(--muted)] mb-1">
                Gmail Address
              </label>
              <div className="relative">
                <FiMail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--muted)] h-4 w-4" />
                <input
                  type="email"
                  required
                  value={email}
                  readOnly={selectedRole === "admin"}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={
                    selectedRole === "admin"
                      ? "visionmysuru2050@sdmimd.ac.in"
                      : "your.email@gmail.com"
                  }
                  className={`w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] pl-10 pr-3.5 py-2.5 text-xs sm:text-sm font-medium focus:border-[var(--accent)] focus:outline-none ${
                    selectedRole === "admin" ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 font-mono" : ""
                  }`}
                />
              </div>
              {selectedRole === "admin" && (
                <p className="mt-1 text-[11px] text-amber-600 dark:text-amber-400">
                  * Locked to official SDMIMD master admin email.
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--primary)] px-5 py-3 text-sm font-bold text-white shadow-lg transition-all duration-300 hover:bg-[var(--primary-hover)] hover:-translate-y-0.5 disabled:opacity-50"
            >
              {loading ? (
                <span>Authenticating Gmail...</span>
              ) : (
                <>
                  <span>Sign In with Gmail ID</span>
                  <FiArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Credentials / Testing Shortcuts */}
          <div className="mt-6 pt-5 border-t border-[var(--border)] relative z-10">
            <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--muted)] text-center mb-2.5">
              ⚡ Quick Testing Shortcuts
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => {
                  setSelectedRole("admin");
                  setEmail("visionmysuru2050@sdmimd.ac.in");
                  setName("SDMIMD Vision Admin");
                }}
                className="rounded-xl border border-red-500/30 bg-red-500/10 p-2 text-left hover:bg-red-500/20 transition"
              >
                <p className="text-[11px] font-bold text-red-600 dark:text-red-400">Admin</p>
                <p className="text-[10px] text-[var(--muted)] truncate">visionmysuru2050@sdmimd.ac.in</p>
              </button>

              <button
                type="button"
                onClick={() => {
                  setSelectedRole("judge");
                  setEmail("gayathri.jury@gmail.com");
                  setName("Dr. H. Gayathri");
                }}
                className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-2 text-left hover:bg-amber-500/20 transition"
              >
                <p className="text-[11px] font-bold text-amber-600 dark:text-amber-400">Jury (Judge)</p>
                <p className="text-[10px] text-[var(--muted)] truncate">gayathri.jury@gmail.com</p>
              </button>

              <button
                type="button"
                onClick={() => {
                  setSelectedRole("participant");
                  setEmail("aditi.rao@nie.ac.in");
                  setName("Aditi Rao");
                }}
                className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-2 text-left hover:bg-emerald-500/20 transition"
              >
                <p className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">Participant</p>
                <p className="text-[10px] text-[var(--muted)] truncate">aditi.rao@nie.ac.in</p>
              </button>
            </div>
          </div>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="py-4 text-center text-xs text-[var(--muted)] border-t border-[var(--border)]">
        Vision Mysuru 2050 · Juryza Evaluation & Submission Engine
      </footer>
    </div>
  );
};

export default JuryzaAuthPage;
