import { useState } from "react";
import { Link } from "react-router-dom";
import { FiArrowRight, FiMenu, FiX, FiRadio } from "react-icons/fi";

export const TopNav = () => {
  const [open, setOpen] = useState(false);

  const navItems = [
    { label: "About", href: "#about" },
    { label: "Participation", href: "#participation" },
    { label: "Topics", href: "#topics" },
    { label: "Timeline", href: "#timeline" },
    { label: "Objectives", href: "#objectives" },
  ];

  return (
    <header className="top-0 z-50 bg-[var(--bg)]/80 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <Link to="/" className="text-sm font-semibold text-[var(--text)]">
          <img
            src="/logo_final.png"
            alt="Vision Mysuru 2050 Logo"
            className="h-8 w-auto inline-block mr-2"
          />
          Vision Mysuru 2050
        </Link>

        <nav className="hidden items-center gap-5 md:flex">
          {navItems.map((item) => (
            <a
              key={item.label}
              href={item.href}
              className="text-sm font-medium text-[var(--muted)] hover:text-[var(--accent)]"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            to="/news"
            className="hidden md:inline-flex items-center gap-2 rounded-xl border border-[var(--border)]
            bg-[var(--surface)] px-4 py-2 text-sm font-semibold
            text-[var(--text)] hover:bg-[var(--surface-2)]"
          >
            In the News <FiRadio />
          </Link>
          <Link
            to="/shortlist"
            className="hidden md:inline-flex items-center gap-2 rounded-xl
            bg-[var(--primary)] px-4 py-2 text-sm font-semibold
            text-[var(--button)] hover:bg-[var(--primary-hover)]"
          >
            Check winners <FiArrowRight />
          </Link>

          <button
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle navigation menu"
            aria-expanded={open}
            className="inline-flex items-center justify-center rounded-xl
            border border-[var(--border)] p-2 text-[var(--text)] md:hidden"
          >
            {open ? <FiX /> : <FiMenu />}
          </button>
        </div>
      </div>
      <div
        className={`md:hidden overflow-hidden border-t border-[var(--border)]
        bg-[var(--bg)] transition-all duration-300 ease-out
        ${open ? "max-h-96 opacity-100" : "max-h-0 opacity-0"}`}
      >
        <div className="px-4 py-4 space-y-2">
          {navItems.map((item) => (
            <a
              key={item.label}
              href={item.href}
              onClick={() => setOpen(false)}
              className="block rounded-lg px-3 py-2 text-sm font-medium
              text-[var(--text)] hover:bg-[var(--surface-2)]"
            >
              {item.label}
            </a>
          ))}

          <Link
            to="/news"
            onClick={() => setOpen(false)}
            className="inline-flex w-full items-center justify-center gap-2
            rounded-xl border border-[var(--border)] px-4 py-2 text-sm font-semibold
            text-[var(--text)] hover:bg-[var(--surface-2)]"
          >
            In the News <FiRadio />
          </Link>

          <Link
            to="/shortlist"
            onClick={() => setOpen(false)}
            className="mt-3 inline-flex w-full items-center justify-center gap-2
            rounded-xl bg-[var(--primary)] px-4 py-2 text-sm font-semibold
            text-[var(--button)] hover:bg-[var(--primary-hover)]"
          >
            Check Winners <FiArrowRight />
          </Link>
        </div>
      </div>
    </header>
  );
};
