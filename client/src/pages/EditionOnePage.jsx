import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FiArrowLeft,
  FiArrowRight,
  FiAward,
  FiCalendar,
  FiFileText,
  FiUsers,
  FiCheckCircle,
  FiRadio,
} from "react-icons/fi";
import FooterSection from "../Components/FooterSection";
import ThemeToggle from "../Components/ThemeToggle";

const AnimatedStatValue = ({ value }) => {
  const [displayValue, setDisplayValue] = React.useState(0);
  const [inView, setInView] = React.useState(false);
  const ref = React.useRef(null);

  const match = String(value).match(/^([^\d]*)(\d+)([^\d]*)$/);
  const prefix = match ? match[1] : "";
  const target = match ? parseInt(match[2], 10) : 0;
  const suffix = match ? match[3] : "";

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  React.useEffect(() => {
    if (!inView || !target) return;
    let startTime = null;
    const duration = 1200;

    const step = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(Math.floor(easeProgress * target));

      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        setDisplayValue(target);
      }
    };

    requestAnimationFrame(step);
  }, [inView, target]);

  if (!match) return <span>{value}</span>;

  return (
    <span ref={ref}>
      {prefix}
      {inView ? displayValue : 0}
      {suffix}
    </span>
  );
};

const EDITION_ONE_STATS = [
  { label: "Total Submissions", value: "317+", icon: FiFileText, color: "border-yellow-500" },
  { label: "Jury Panel Members", value: "32", icon: FiUsers, color: "border-purple-500" },
  { label: "Grand Finale Teams", value: "Top 5", icon: FiAward, color: "border-emerald-500" },
  { label: "Partner Organizations", value: "15+", icon: FiCheckCircle, color: "border-sky-500" },
];

const EDITION_ONE_TIMELINE = [
  {
    phase: "Soft Launch",
    date: "February 7, 2026",
    title: "Inaugural Launch at SDMIMD",
    desc: "Unveiling the Vision Mysuru 2050 initiative with educational institutions, industry leaders, and civic bodies.",
  },
  {
    phase: "Round 0 & 1",
    date: "March 14, 2026",
    title: "Expert Screening (317 Entries)",
    desc: "An esteemed 32-member jury panel evaluated submissions across all 4 categories to shortlist the top 40 teams.",
  },
  {
    phase: "Round 2",
    date: "March 15, 2026",
    title: "Category Showdowns (MDP Hall)",
    desc: "Physical presentations before category-specific experts at the SDMIMD campus, narrowing the field down to 10 finalists.",
  },
  {
    phase: "Round 3",
    date: "March 16, 2026",
    title: "Proposal Presentations",
    desc: "Evaluation before 5 senior jury members from academia, industry, and government to determine the Top 5 finalists.",
  },
  {
    phase: "Grand Finale",
    date: "March 23, 2026",
    title: "District Authorities Pitch & Awards",
    desc: "Top 5 finalists pitched before Mysuru district authorities. Top 3 winners awarded cash prizes; top 10 compiled into the official White Paper.",
  },
];

const WINNERS = [
  {
    place: "1st Place",
    teamId: "ST-3A481C",
    name: "Eco Prabal",
    category: "Students",
    prize: "INR 50,000",
    sponsor: "Sponsored jointly by SDMIMD and rProcess",
    highlight: "from-amber-100 to-yellow-200 border-yellow-400 text-yellow-900",
  },
  {
    place: "2nd Place",
    teamId: "CT-3A22D7",
    name: "Gandabherunda",
    category: "Citizens",
    prize: "INR 25,000",
    sponsor: "Sponsored jointly by Mysuru Grahakara Parishad (MGP) and MINDS Doctors Association",
    highlight: "from-slate-100 to-zinc-200 border-slate-400 text-slate-800",
  },
];

const EditionOnePage = () => {
  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <motion.div
      className="min-h-screen flex flex-col dm-sans bg-[var(--bg)] text-[var(--text)]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Top Navigation */}
      <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-[var(--bg)]/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <Link to="/" className="flex items-center gap-2 text-sm font-bold text-[var(--text)]">
            <img
              src="/logo_final.png"
              alt="Vision Mysuru 2050 Logo"
              className="h-8 w-auto inline-block"
            />
            <span className="hidden sm:inline">Vision Mysuru 2050</span>
          </Link>

          <div className="flex items-center gap-2 sm:gap-3">
            <ThemeToggle size="sm" />
            <Link
              to="/news"
              className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-xs font-semibold text-[var(--text)] hover:bg-[var(--surface-2)] sm:text-sm sm:px-4 sm:py-2"
            >
              News <FiRadio />
            </Link>
            <Link
              to="/"
              className="inline-flex items-center gap-2 rounded-xl bg-[var(--primary)] px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-[var(--primary-hover)] sm:text-sm sm:px-4 sm:py-2"
            >
              <FiArrowLeft /> Back to Edition 2
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden border-b border-[var(--border)] bg-gradient-to-b from-[var(--surface)] via-[var(--bg)] to-[var(--bg)] py-16 sm:py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="max-w-3xl">
              <span className="inline-flex items-center gap-2 rounded-full bg-[var(--accent-soft)] px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-[var(--accent)] border border-[var(--accent)]/30">
                Inaugural Edition Archive · 2026
              </span>

              <h1 className="mt-4 oswald text-4xl font-extrabold uppercase tracking-tight text-[var(--primary)] sm:text-5xl lg:text-6xl">
                Vision Mysuru 2050 — Edition 1
              </h1>

              <p className="mt-2 text-xl font-semibold italic text-[var(--accent)] sm:text-2xl">
                INK YOUR IDEAS! 💡
              </p>

              <p className="mt-4 text-base leading-relaxed text-[var(--muted)] sm:text-lg">
                The inaugural edition of Vision Mysuru 2050 was organized by SDMIMD as a city-wide
                civic movement. Over 60 days, students, citizens, corporates, and NGOs came together to identify
                ground-level urban bottlenecks and propose scalable roadmaps for the future of Mysuru.
              </p>
            </div>

            {/* Quick Metrics */}
            <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
              {EDITION_ONE_STATS.map((stat) => {
                const Icon = stat.icon;
                return (
                  <div
                    key={stat.label}
                    className={`rounded-2xl border-y-4 border border-[var(--border)] ${stat.color} bg-[var(--surface)] p-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl`}
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-medium text-[var(--muted)] sm:text-sm">
                        {stat.label}
                      </p>
                      <Icon className="text-[var(--muted-2)] text-lg" />
                    </div>
                    <p className="mt-2 text-2xl font-bold text-[var(--text)] sm:text-3xl">
                      <AnimatedStatValue value={stat.value} />
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Edition 1 Winners Spotlight */}
        <section className="py-14 sm:py-16">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="text-center max-w-2xl mx-auto mb-10">
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--accent)]">
                Grand Finale Results
              </span>
              <h2 className="mt-2 text-2xl font-bold tracking-tight text-[var(--text)] sm:text-3xl">
                Edition 1 Winners 🏆
              </h2>
              <p className="mt-2 text-sm text-[var(--muted)]">
                Honoring the top visionary solutions selected at the Grand Finale pitch before district authorities.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 max-w-4xl mx-auto">
              {WINNERS.map((w) => (
                <div
                  key={w.teamId}
                  className={`rounded-2xl border-2 bg-gradient-to-br ${w.highlight} p-6 shadow-md flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 hover:shadow-xl`}
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="rounded-full bg-white/80 px-3 py-1 text-xs font-bold text-gray-800 shadow-xs">
                        #{w.teamId}
                      </span>
                      <span className="text-sm font-extrabold uppercase tracking-wide">
                        {w.place}
                      </span>
                    </div>

                    <h3 className="mt-3 text-2xl font-bold text-gray-900">
                      {w.name}
                    </h3>
                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-700 mt-1">
                      Category: {w.category}
                    </p>
                    <p className="mt-3 text-2xl font-extrabold text-amber-700">
                      {w.prize}
                    </p>
                  </div>

                  <p className="mt-5 border-t border-black/10 pt-3 text-xs font-medium text-gray-700">
                    {w.sponsor}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-8 text-center">
              <Link
                to="/shortlist"
                onClick={() => window.scrollTo(0, 0)}
                className="inline-flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-5 py-2.5 text-sm font-semibold text-[var(--text)] transition hover:bg-[var(--surface-2)]"
              >
                View Full Edition 1 Finalist Table <FiArrowRight />
              </Link>
            </div>
          </div>
        </section>

        {/* Edition 1 Event Journey Timeline */}
        <section className="border-t border-[var(--border)] bg-[var(--surface)] py-14 sm:py-16">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="max-w-2xl mb-10">
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--accent)]">
                The Journey
              </span>
              <h2 className="mt-2 text-2xl font-bold tracking-tight text-[var(--text)] sm:text-3xl">
                Edition 1 Milestones & Rounds
              </h2>
              <p className="mt-2 text-sm text-[var(--muted)]">
                How Edition 1 progressed through multiple stages of evaluation at SDMIMD campus.
              </p>
            </div>

            <div className="space-y-4">
              {EDITION_ONE_TIMELINE.map((item, idx) => (
                <div
                  key={item.title}
                  className="rounded-2xl border border-[var(--border)] bg-[var(--bg)] p-5 transition hover:border-[var(--accent)] sm:p-6"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                    <div className="flex items-center gap-2">
                      <span className="rounded-lg bg-[var(--accent-soft)] px-2.5 py-1 text-xs font-bold text-[var(--accent)]">
                        {item.phase}
                      </span>
                      <h3 className="text-base font-bold text-[var(--text)] sm:text-lg">
                        {item.title}
                      </h3>
                    </div>
                    <span className="flex items-center gap-1.5 text-xs font-medium text-[var(--muted-2)]">
                      <FiCalendar className="text-[var(--accent)]" /> {item.date}
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* White Paper & Knowledge Archive Placeholder */}
        <section className="py-14 sm:py-16 border-t border-[var(--border)]">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="rounded-3xl border-2 border-[var(--accent)]/30 bg-gradient-to-r from-[var(--accent-soft)] via-[var(--surface)] to-[var(--accent-soft)] p-8 sm:p-12 text-center">
              <span className="inline-flex items-center gap-2 rounded-full bg-[var(--accent)]/15 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-[var(--accent)]">
                Outputs & Deliverables
              </span>
              <h2 className="mt-4 oswald text-2xl font-bold uppercase text-[var(--text)] sm:text-3xl">
                The Edition 1 White Paper
              </h2>
              <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-[var(--muted)] sm:text-base">
                Ideas formulated by the top finalists across infrastructure, mobility, waste management,
                and heritage preservation were consolidated into an institutional White Paper presented
                to the Mysuru District Administration for civic policy consideration.
              </p>

              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <Link
                  to="/news"
                  onClick={() => window.scrollTo(0, 0)}
                  className="inline-flex items-center gap-2 rounded-xl bg-[var(--primary)] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--primary-hover)]"
                >
                  Read Press Coverage <FiRadio />
                </Link>
                <Link
                  to="/"
                  onClick={() => window.scrollTo(0, 0)}
                  className="inline-flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-5 py-2.5 text-sm font-semibold text-[var(--text)] transition hover:bg-[var(--surface-2)]"
                >
                  Back to Edition 2 <FiArrowRight />
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <FooterSection />
    </motion.div>
  );
};

export default EditionOnePage;
