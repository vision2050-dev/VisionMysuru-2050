import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  FiFileText,
  FiUsers,
  FiAward,
  FiCheckCircle,
  FiArrowRight,
} from "react-icons/fi";

const EDITION_ONE_STATS = [
  {
    label: "Total Submissions",
    value: "317+",
    icon: FiFileText,
    color: "border-yellow-500",
  },
  {
    label: "Jury Panel Members",
    value: "32",
    icon: FiUsers,
    color: "border-purple-500",
  },
  {
    label: "Grand Finale Teams",
    value: "Top 5",
    icon: FiAward,
    color: "border-emerald-500",
  },
  {
    label: "Partner Organizations",
    value: "15+",
    icon: FiCheckCircle,
    color: "border-sky-500",
  },
];

const useInView = () => {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    if (!ref.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2 },
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return [ref, inView];
};

const AnimatedStatValue = ({ value }) => {
  const [ref, inView] = useInView();
  const [count, setCount] = useState(0);
  const numericMatch = value.match(/(\d+)/);
  const targetNumber = numericMatch ? parseInt(numericMatch[0], 10) : null;
  const suffix = value.replace(/[\d]/g, "");

  useEffect(() => {
    if (!inView || targetNumber === null) return;
    let start = 0;
    const duration = 1200;
    const stepTime = Math.max(16, Math.floor(duration / targetNumber));
    const timer = setInterval(() => {
      start += Math.ceil(targetNumber / (duration / stepTime));
      if (start >= targetNumber) {
        setCount(targetNumber);
        clearInterval(timer);
      } else {
        setCount(start);
      }
    }, stepTime);
    return () => clearInterval(timer);
  }, [inView, targetNumber]);

  if (targetNumber === null) return <span>{value}</span>;
  return (
    <span ref={ref}>
      {count}
      {suffix}
    </span>
  );
};

export const GlimpseEditionOne = () => {
  return (
    <section id="glimpse-edition-1" className="scroll-mt-24 py-12 sm:py-16">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-[var(--accent)]">
              Legacy & Impact
            </p>
            <h2 className="mt-1.5 oswald text-2xl font-bold uppercase tracking-tight text-[var(--text)] sm:text-3xl md:text-4xl">
              GLIMPSE OF EDITION 1
            </h2>
          </div>

          <Link
            to="/edition-1"
            onClick={() => window.scrollTo(0, 0)}
            className="inline-flex items-center gap-2 self-start sm:self-auto rounded-xl bg-[var(--primary)] px-5 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-md transition hover:bg-[var(--primary-hover)] hover:scale-105 active:scale-95 cursor-pointer"
          >
            <span>Know More</span>
            <FiArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {/* 4 Exact Metric Cards */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
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
  );
};

export default GlimpseEditionOne;
