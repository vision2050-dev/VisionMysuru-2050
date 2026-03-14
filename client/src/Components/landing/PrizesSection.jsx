import { Link } from "react-router-dom";
import { FiArrowRight } from "react-icons/fi";
import { motion } from "framer-motion";

const PrizesSection = () => {
  return (
    <section className="relative overflow-hidden pb-20 ">
      <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.7 }}
          className="text-center"
        >
          <h2 className="mt-3 text-2xl font-bold tracking-tight text-[var(--text)]  md:text-3xl dm-sans">
            Your Ideas Deserve to be Rewarded!🏆
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg leading-tight text-[var(--muted)]">
            The Mysuru of 2050 will be built by the ideas of today. Attractive
            cash prizes await the top 3 winners!
          </p>
        </motion.div>

        {/* White Paper highlight */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mx-auto mt-14 max-w-2xl"
        >
          <div className="relative overflow-hidden rounded-3xl border-2 border-[var(--accent)]/30 bg-gradient-to-r from-[var(--accent-soft)] via-[var(--surface)] to-[var(--accent-soft)] p-6 sm:p-8 text-center">
            <div className="absolute -top-20 -right-20 h-40 w-40 rounded-full bg-[var(--accent)]/5 blur-3xl" />
            <div className="absolute -bottom-20 -left-20 h-40 w-40 rounded-full bg-[var(--primary)]/5 blur-3xl" />

            <div className="relative">
              <span className="inline-flex items-center gap-2 rounded-full bg-[var(--accent)]/10 px-4 py-1.5 text-md font-semibold text-[var(--accent)]">
                White Paper Publication
              </span>
              <p className="mt-4 text-lg font-semibold text-[var(--text)] sm:text-xl">
                Top 10 Finalist Ideas will be Published as a{" "}
                <span className="text-[var(--accent)]">White Paper</span>
              </p>
              <p className="mt-2 text-sm text-[var(--muted)] leading-relaxed">
                {
                  "The best ideas won't just win prizes — they'll shape Mysuru's future. Top 10 submissions will be compiled and published as an official white paper, reaching policymakers and civic leaders."
                }
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default PrizesSection;
