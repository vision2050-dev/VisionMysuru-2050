import React from "react";
import { FiSun, FiMoon } from "react-icons/fi";
import { motion } from "framer-motion";
import { useTheme } from "../context/ThemeContext";

export const ThemeToggle = ({
  showLabel = false,
  className = "",
  size = "md",
}) => {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  const sizeClasses =
    size === "sm"
      ? "p-1.5 text-sm"
      : size === "lg"
        ? "p-2.5 text-lg"
        : "p-2 text-base";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className={`group relative inline-flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] transition-all duration-200 hover:border-[var(--accent)] hover:bg-[var(--surface-2)] active:scale-95 ${sizeClasses} ${className}`}
    >
      <motion.div
        key={theme}
        initial={{ rotate: -90, scale: 0.7, opacity: 0 }}
        animate={{ rotate: 0, scale: 1, opacity: 1 }}
        exit={{ rotate: 90, scale: 0.7, opacity: 0 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className="flex items-center justify-center text-[var(--accent)]"
      >
        {isDark ? (
          <FiSun className="h-4 w-4 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]" />
        ) : (
          <FiMoon className="h-4 w-4 text-[var(--accent)]" />
        )}
      </motion.div>

      {showLabel && (
        <span className="text-xs font-semibold tracking-tight text-[var(--text)]">
          {isDark ? "Light Mode" : "Dark Mode"}
        </span>
      )}
    </button>
  );
};

export default ThemeToggle;
