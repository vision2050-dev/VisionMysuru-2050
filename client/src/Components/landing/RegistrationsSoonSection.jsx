import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { FiArrowRight, FiCheckCircle, FiBell, FiCompass } from "react-icons/fi";

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
          className="relative overflow-hidden rounded-3xl border border-[var(--border)] bg-gradient-to-b from-[var(--surface)] via-[var(--surface)] to-[var(--surface-2)] p-8 sm:p-12 md:p-16 text-center shadow-xl backdrop-blur-md"
        >
          {/* Subtle decorative royal corner borders */}
          <div className="absolute top-0 left-0 h-1.5 w-full bg-gradient-to-r from-[var(--primary)] via-[var(--accent)] to-[var(--primary)]" />
          <div className="absolute -top-24 -right-24 h-48 w-48 rounded-full bg-[var(--accent)]/15 blur-2xl" />
          <div className="absolute -bottom-24 -left-24 h-48 w-48 rounded-full bg-[var(--primary)]/15 blur-2xl" />

          <div className="relative z-10 flex flex-col items-center">
            {/* Live Pulsing Beacon Tag */}
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-[var(--accent)] shadow-sm">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-500"></span>
              </span>
              <span>Edition 2 Announcement</span>
            </div>

            {/* Main Required Text */}
            <h2 className="oswald mt-5 text-3xl font-extrabold uppercase tracking-tight text-[var(--text)] sm:text-4xl md:text-5xl lg:text-6xl leading-[1.08]">
              <span className="text-[var(--accent)]">REGISTRATIONS</span> ARE STARTING SOON!!
            </h2>

            {/* Supporting description in DM Sans */}
            <p className="dm-sans mx-auto mt-4 max-w-2xl text-base sm:text-lg leading-relaxed text-[var(--muted)]">
              The stage is being set for <strong className="font-semibold text-[var(--text)]">Vision Mysuru 2050 Edition 2</strong>.
              Assemble your team, shape your groundbreaking ideas across our 9 focus areas, and prepare your explainer pitch video!
            </p>

            {/* Highlights Grid */}
            <div className="mt-8 grid w-full max-w-3xl grid-cols-1 gap-3 sm:grid-cols-3 text-left">
              <div className="flex items-start gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)]/80 p-3.5 sm:p-4 backdrop-blur-sm transition-all duration-300 hover:border-[var(--accent)]/50 hover:shadow-md">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400">
                  <FiCompass className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text)]">9 Focus Areas</h4>
                  <p className="mt-0.5 text-xs text-[var(--muted)]">From mobility & heritage to sustainability & tech</p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)]/80 p-3.5 sm:p-4 backdrop-blur-sm transition-all duration-300 hover:border-[var(--accent)]/50 hover:shadow-md">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-red-500/15 text-red-600 dark:text-red-400">
                  <FiCheckCircle className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text)]">4 Categories</h4>
                  <p className="mt-0.5 text-xs text-[var(--muted)]">Students, Citizens, Corporates & NGOs</p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)]/80 p-3.5 sm:p-4 backdrop-blur-sm transition-all duration-300 hover:border-[var(--accent)]/50 hover:shadow-md">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                  <FiBell className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text)]">Video Pitches</h4>
                  <p className="mt-0.5 text-xs text-[var(--muted)]">Direct drive uploads & jury evaluation hub</p>
                </div>
              </div>
            </div>

            {/* Quick Action Links */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <a
                href="#topics"
                className="group inline-flex items-center gap-2 rounded-xl bg-[var(--primary)] px-5 py-2.5 text-xs sm:text-sm font-bold text-white shadow-md transition-all duration-300 hover:bg-[var(--primary-hover)] hover:-translate-y-0.5"
              >
                <span>Explore Thematic Topics</span>
                <FiArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </a>

              <Link
                to="/edition-1"
                onClick={() => window.scrollTo(0, 0)}
                className="inline-flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-5 py-2.5 text-xs sm:text-sm font-semibold text-[var(--text)] transition-all duration-300 hover:bg-[var(--surface-2)] hover:-translate-y-0.5"
              >
                <span>Browse Edition 1 Hall of Fame</span>
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default RegistrationsSoonSection;
