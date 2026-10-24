import { useState } from "react";
import { Link } from "react-router-dom";
import { FiArrowRight, FiMenu, FiX, FiChevronDown } from "react-icons/fi";
import ThemeToggle from "./ThemeToggle";

export const TopNav = () => {
  const [open, setOpen] = useState(false);
  const [editionDropdown, setEditionDropdown] = useState(false);

  const navItems = [
    { label: "About", href: "/#about" },
    { label: "Participation", href: "/#participation" },
    { label: "Topics", href: "/#topics" },
    { label: "Objectives", href: "/#objectives" },
    { label: "In the News", href: "/news", isRoute: true },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-[var(--bg)]/90 backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-2.5 sm:px-6 lg:px-8">
        {/* Brand Logo & Name */}
        <Link
          to="/"
          className="flex items-center gap-2.5 shrink-0 text-sm sm:text-base font-bold text-[var(--text)] whitespace-nowrap"
        >
          <img
            src="/logo_final.png"
            alt="Vision Mysuru 2050 Logo"
            className="h-8 w-auto shrink-0"
          />
          <span className="tracking-tight">Vision Mysuru 2050</span>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center gap-5 xl:gap-6">
          {navItems.map((item) =>
            item.isRoute ? (
              <Link
                key={item.label}
                to={item.href}
                className="text-xs xl:text-sm font-medium text-[var(--muted)] hover:text-[var(--accent)] transition-colors whitespace-nowrap"
              >
                {item.label}
              </Link>
            ) : (
              <a
                key={item.label}
                href={item.href}
                className="text-xs xl:text-sm font-medium text-[var(--muted)] hover:text-[var(--accent)] transition-colors whitespace-nowrap"
              >
                {item.label}
              </a>
            )
          )}
        </nav>

        {/* Action Button Group */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Jury Hub Button */}
          <Link
            to="/jury"
            className="hidden sm:inline-flex items-center gap-1.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-xs font-semibold text-[var(--text)] hover:border-[var(--accent)] hover:bg-[var(--surface-2)] transition whitespace-nowrap shadow-2xs"
          >
            <span>Jury Hub</span>
            <span className="text-[11px]">⚖️</span>
          </Link>

          {/* Consolidated Edition 1 Dropdown */}
          <div
            className="relative group hidden sm:block"
            onMouseEnter={() => setEditionDropdown(true)}
            onMouseLeave={() => setEditionDropdown(false)}
          >
            <Link
              to="/edition-1"
              className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-xs font-semibold text-[var(--text)] hover:border-[var(--accent)] hover:bg-[var(--surface-2)] transition whitespace-nowrap shadow-2xs"
            >
              <span>Edition 1</span>
              <FiChevronDown
                className={`h-3 w-3 text-[var(--muted)] transition-transform duration-200 ${
                  editionDropdown ? "rotate-180" : ""
                }`}
              />
            </Link>

            {/* Dropdown Menu */}
            <div
              className={`absolute right-0 top-full mt-1.5 flex flex-col min-w-[210px] rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-1.5 shadow-2xl backdrop-blur-xl z-50 transition-all duration-150 ${
                editionDropdown
                  ? "opacity-100 visible translate-y-0"
                  : "opacity-0 invisible -translate-y-1"
              }`}
            >
              <Link
                to="/edition-1"
                onClick={() => setEditionDropdown(false)}
                className="flex items-center justify-between rounded-xl px-3 py-2 text-xs font-medium text-[var(--text)] hover:bg-[var(--surface-2)] transition"
              >
                <span>📜 Edition 1 Archive</span>
                <FiArrowRight className="h-3 w-3 text-[var(--muted)]" />
              </Link>
              <Link
                to="/shortlist"
                onClick={() => setEditionDropdown(false)}
                className="flex items-center justify-between rounded-xl px-3 py-2 text-xs font-bold text-amber-600 dark:text-amber-400 hover:bg-[var(--surface-2)] transition"
              >
                <span>🏆 Check Winners</span>
                <FiArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </div>

          {/* Primary Edition 2 CTA */}
          <Link
            to="/portal"
            className="hidden sm:inline-flex items-center gap-1.5 rounded-xl bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white px-3.5 py-1.5 text-xs font-semibold shadow-xs transition-all whitespace-nowrap hover:scale-[1.02]"
          >
            <span>Register / Pitch</span>
            <span className="text-xs">🚀</span>
          </Link>

          {/* Theme Toggle Button */}
          <ThemeToggle size="sm" />

          {/* Mobile Navigation Toggle */}
          <button
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle navigation menu"
            aria-expanded={open}
            className="inline-flex items-center justify-center rounded-xl border border-[var(--border)] p-2 text-[var(--text)] lg:hidden hover:bg-[var(--surface-2)] transition"
          >
            {open ? <FiX className="h-5 w-5" /> : <FiMenu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      <div
        className={`lg:hidden overflow-hidden border-t border-[var(--border)] bg-[var(--bg)] transition-all duration-300 ease-out ${
          open ? "max-h-[32rem] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="px-4 py-4 space-y-2">
          {navItems.map((item) =>
            item.isRoute ? (
              <Link
                key={item.label}
                to={item.href}
                onClick={() => setOpen(false)}
                className="block rounded-lg px-3 py-2 text-sm font-medium text-[var(--text)] hover:bg-[var(--surface-2)]"
              >
                {item.label}
              </Link>
            ) : (
              <a
                key={item.label}
                href={item.href}
                onClick={() => setOpen(false)}
                className="block rounded-lg px-3 py-2 text-sm font-medium text-[var(--text)] hover:bg-[var(--surface-2)]"
              >
                {item.label}
              </a>
            )
          )}

          {/* Mobile Actions */}
          <div className="pt-3 border-t border-[var(--border)] space-y-2">
            <Link
              to="/portal"
              onClick={() => setOpen(false)}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--primary)] px-4 py-2.5 text-sm font-bold text-white shadow-xs hover:bg-[var(--primary-hover)] transition"
            >
              <span>Register / Pitch (Ed. 2)</span>
              <span>🚀</span>
            </Link>

            <Link
              to="/jury"
              onClick={() => setOpen(false)}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 text-sm font-semibold text-[var(--text)] hover:bg-[var(--surface-2)] transition"
            >
              <span>Juryza Evaluation Hub</span>
              <span>⚖️</span>
            </Link>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <Link
                to="/edition-1"
                onClick={() => setOpen(false)}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs font-semibold text-[var(--text)] hover:bg-[var(--surface-2)] transition"
              >
                <span>📜 Edition 1</span>
              </Link>
              <Link
                to="/shortlist"
                onClick={() => setOpen(false)}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs font-bold text-amber-700 dark:text-amber-300 hover:bg-amber-500/20 transition"
              >
                <span>🏆 Check Winners</span>
              </Link>
            </div>
          </div>

          {/* Theme Row in Mobile */}
          <div className="pt-3 flex items-center justify-between border-t border-[var(--border)]">
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
              Appearance
            </span>
            <ThemeToggle showLabel={true} size="sm" />
          </div>
        </div>
      </div>
    </header>
  );
};

export default TopNav;
