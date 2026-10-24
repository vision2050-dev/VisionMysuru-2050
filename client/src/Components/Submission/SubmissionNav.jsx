import React from "react";
import { Link } from "react-router-dom";
import { FiArrowLeft } from "react-icons/fi";
import ThemeToggle from "../ThemeToggle";

const SubmissionNav = () => {
  return (
    <div>
      <header className="sticky top-0 z-50 bg-[var(--bg)]/80 border-b border-[var(--border)] backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <Link to="/" className="text-sm font-bold text-[var(--text)] flex items-center">
            <img
              src="/logo_final.png"
              alt="Vision Mysuru 2050 Logo"
              className="h-8 w-auto inline-block mr-2"
            />
            <span>Vision Mysuru 2050</span>
          </Link>
          <div className="flex items-center gap-2">
            <ThemeToggle size="sm" />
            <Link
              to="/edition-1"
              onClick={() => window.scrollTo(0, 0)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-xs font-semibold text-[var(--text)] hover:bg-[var(--surface-2)] transition sm:text-sm"
            >
              <FiArrowLeft /> Back to Edition 1
            </Link>
            <Link
              to="/"
              onClick={() => window.scrollTo(0, 0)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--primary)] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[var(--primary-hover)] transition sm:text-sm"
            >
              Home
            </Link>
          </div>
        </div>
      </header>
    </div>
  );
};

export default SubmissionNav;
