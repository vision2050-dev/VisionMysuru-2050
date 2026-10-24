import { useEffect } from "react";
import { motion } from "framer-motion";
import { FiArrowUpRight, FiRadio } from "react-icons/fi";
import SubmissionNav from "../Components/Submission/SubmissionNav";
import FooterSection from "../Components/FooterSection";
import { NEWS_COVERAGE } from "../constants/news";

const formatDate = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const getLinkLabel = (link) => {
  if (!link) return "Open link";
  return link.includes("drive.google.com") ? "View clipping" : "Read article";
};

const NewsPage = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const sortedNewsCoverage = [...NEWS_COVERAGE].sort((a, b) => {
    const dateA = new Date(a.date).getTime();
    const dateB = new Date(b.date).getTime();

    if (Number.isNaN(dateA) && Number.isNaN(dateB)) {
      return (b.id ?? 0) - (a.id ?? 0);
    }

    if (Number.isNaN(dateA)) return 1;
    if (Number.isNaN(dateB)) return -1;

    if (dateB !== dateA) {
      return dateB - dateA;
    }

    return (b.id ?? 0) - (a.id ?? 0);
  });

  return (
    <motion.div
      className="overflow-hidden flex flex-col dm-sans bg-[var(--bg)] text-[var(--text)] min-h-screen"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
    >
      <SubmissionNav />

      <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:py-10">
        <section className="rounded-3xl bg-[var(--surface)] p-6 ">
          <div className="flex items-center gap-2 text-[var(--accent)]">
            <FiRadio className="text-lg" />
            <p className="text-sm font-semibold uppercase tracking-wide">
              Media Highlights
            </p>
          </div>
          <h1 className="mt-3 text-3xl font-extrabold leading-tight text-[var(--primary)] sm:text-4xl">
            In the News
          </h1>
          <p className="mt-3 max-w-3xl text-[var(--muted)]">
            Coverage of Vision Mysuru 2050 across leading media channels.
            Explore how this initiative is being discussed in the public domain.
          </p>
        </section>

        <section className="mt-6 grid gap-2 md:grid-cols-2">
          {sortedNewsCoverage.map((item, index) => (
            <motion.article
              key={item.id || index}
              className="group rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 transition-colors hover:border-[var(--accent)]"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.5,
                delay: index * 0.15,
                ease: "easeOut",
              }}
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--accent)]">
                  {item.channel}
                </p>
                <p className="text-xs text-[var(--muted-2)]">
                  {formatDate(item.date)}
                </p>
              </div>

              <h2 className="mt-3 text-lg font-bold leading-snug text-[var(--text)] sm:text-xl">
                {item.headline}
              </h2>

              {item.description ? (
                <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">
                  {item.description}
                </p>
              ) : null}

              <a
                href={item.link}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex items-center gap-2 rounded-xl border border-[var(--accent-soft)] px-3 py-2 text-sm font-semibold text-[var(--primary)] transition-colors hover:bg-[var(--surface-2)]"
              >
                {getLinkLabel(item.link)}
                <FiArrowUpRight className="text-base transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </a>
            </motion.article>
          ))}
        </section>
      </main>

      <FooterSection />
    </motion.div>
  );
};

export default NewsPage;
