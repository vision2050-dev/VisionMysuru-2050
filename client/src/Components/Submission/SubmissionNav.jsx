import React from "react";
import { Link } from "react-router-dom";
import { FiArrowLeft } from "react-icons/fi";

const SubmissionNav = () => {
  return (
    <div>
      {" "}
      <header className="sticky top-0 z-50  backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <Link to="/" className="text-sm font-bold">
            <img
              src="/logo_final.png"
              alt="Vision Mysuru 2050 Logo"
              className="h-8 w-auto inline-block mr-2"
            />
            Vision Mysuru 2050
          </Link>
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-xl border border-[var(--border)] px-4 py-2 text-sm font-semibold hover:bg-[var(--surface-2)]"
          >
            <FiArrowLeft /> Home
          </Link>
        </div>
      </header>
    </div>
  );
};

export default SubmissionNav;
