import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { FiArrowRight } from "react-icons/fi";

export const RegistrationsSoonSection = () => {
  return (
    <section id="registrations" className="relative scroll-mt-24 overflow-hidden py-16 sm:py-24">
      {/* Ambient background glow matching site theme */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 flex items-center justify-center"
      >
        <div className="h-96 w-96 rounded-full bg-[var(--accent)]/10 blur-3xl sm:h-[28rem] sm:w-[28rem]" />
        <div className="h-72 w-72 rounded-full bg-[var(--primary)]/5 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-5xl px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="relative overflow-hidden rounded-3xl border border-[var(--border)] bg-gradient-to-b from-[var(--surface)] via-[var(--surface)] to-[var(--surface-2)] p-10 sm:p-16 md:p-20 text-center shadow-xl backdrop-blur-md"
        >
          {/* Subtle decorative royal corner borders */}
          <div className="absolute top-0 left-0 h-1.5 w-full bg-gradient-to-r from-[var(--primary)] via-[var(--accent)] to-[var(--primary)]" />
          <div className="absolute -top-24 -right-24 h-48 w-48 rounded-full bg-[var(--accent)]/15 blur-2xl" />
          <div className="absolute -bottom-24 -left-24 h-48 w-48 rounded-full bg-[var(--primary)]/15 blur-2xl" />

          <div className="relative z-10 flex flex-col items-center justify-center">
            {/* Main Required Announcement Text */}
            <h2 className="oswald text-3xl font-extrabold uppercase tracking-tight text-[var(--text)] sm:text-4xl md:text-5xl lg:text-6xl leading-tight">
              <span className="text-[var(--accent)]">REGISTRATIONS</span> ARE NOW OPEN!
            </h2>
            <p className="mt-3 text-sm text-[var(--muted)] max-w-md">
              Submit your team's innovative ideas for Vision Mysuru 2050 and compete for exciting awards.
            </p>
            <Link
              to="/register"
              className="mt-6 inline-flex items-center gap-2.5 rounded-xl bg-[var(--primary)] px-8 py-3.5 text-base font-bold text-white shadow-xl hover:bg-[var(--primary-hover)] hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer"
            >
              <span>APPLY NOW!</span>
              <FiArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default RegistrationsSoonSection;
