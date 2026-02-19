import { useState } from "react";
import { FiAlertCircle, FiCheck } from "react-icons/fi";
import { GUIDELINES } from "../../constants/content.js";
import { motion, AnimatePresence } from "framer-motion";

const RulesAndRegulations = () => {
  const [activeTab, setActiveTab] = useState("general");
  const activeCategory = GUIDELINES.categories.find((c) => c.id === activeTab);

  return (
    <section className="m-1 md:m-4 px-4 dm-sans">
      <main className="mx-auto max-w-6xl space-y-2">
        <header className="mb-6">
          <h2 className="mt-2 text-2xl font-bold text-[var(--text)]">
            Category Guidelines
          </h2>
          <p className="mt-2 text-sm text-[var(--muted)] leading-tight">
            Read the detailed rules and regulations for each category before
            submitting your idea.
          </p>
        </header>

        <div className="flex overflow-x-auto whitespace-nowrap pb-3">
          {GUIDELINES.categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveTab(cat.id)}
              className={`px-4 py-3 text-start text-sm md:text-md transition-colors relative ${
                activeTab === cat.id
                  ? "text-[var(--accent)] font-bold bg-[var(--accent-soft)]"
                  : "text-[var(--muted)] hover:text-[var(--text)]"
              }`}
            >
              {cat.title}
              {activeTab === cat.id && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--accent)]"
                />
              )}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-2"
          >
            <div className="grid gap-2 md:grid-cols-2">
              <div className="border border-[var(--border)] rounded-2xl p-5">
                <div className="flex items-center gap-3 mb-4">
                  <h4 className="font-semibold text-[var(--text)]">
                    Eligibility Guidelines
                  </h4>
                </div>
                <ul className="space-y-2">
                  {activeCategory.eligibility.map((item, idx) => (
                    <li
                      key={idx}
                      className="flex gap-2 text-sm text-[var(--muted)]"
                    >
                      <FiCheck className="shrink-0 mt-0.5 text-[var(--accent)]" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="border border-[var(--border)] rounded-2xl p-4">
                <div className="flex items-center gap-3 mb-4">
                  <h4 className="font-semibold text-[var(--text)]">Purpose</h4>
                </div>
                <ul className="space-y-2">
                  {activeCategory.purpose.map((item, idx) => (
                    <li
                      key={idx}
                      className="flex gap-2 text-sm text-[var(--muted)]"
                    >
                      <span className="shrink-0 mt-1.5 h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="border border-[var(--border)] rounded-2xl p-4 bg-white/50">
              <div className="flex items-center gap-2 mb-4">
                <h4 className="font-semibold text-[var(--text)]">
                  Mandatory Submission Components
                </h4>
              </div>
              <div className="grid md:grid-cols-3 gap-2">
                {activeCategory.submissionComponents.map((comp, idx) => (
                  <div
                    key={idx}
                    className="bg-[var(--bg-secondary)] p-4 rounded-xl border border-[var(--border)]"
                  >
                    <h5 className="font-semibold text-[var(--text)] text-sm mb-2">
                      {comp.title}
                    </h5>
                    <ul className="space-y-2">
                      {comp.details.map((detail, dIdx) => (
                        <li
                          key={dIdx}
                          className="text-sm text-[var(--muted)] flex gap-2"
                        >
                          <span className="shrink-0 mt-1 h-1 w-1 rounded-full bg-[var(--muted)]" />
                          {detail}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2"></div>
          </motion.div>
        </AnimatePresence>

        <div>
          <div className=" grid md:grid-cols-2 gap-6">
            <div className="p-6 bg-red-50 rounded-2xl border border-red-100">
              <div className="flex items-center gap-3 mb-4">
                <FiAlertCircle className="text-red-500" size={24} />
                <h4 className="text-lg font-bold text-red-700">
                  Disqualification Criteria
                </h4>
              </div>
              <ul className="space-y-2 text-sm text-red-600/80">
                <li className="flex gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-red-500 shrink-0" />
                  Stock or AI-generated images
                </li>
                <li className="flex gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-red-500 shrink-0" />
                  Plagiarized ideas
                </li>
                <li className="flex gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-red-500 shrink-0" />
                  Submissions without geotagged evidence
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-6 flex  font-medium items-center bg-[var(--bg)] border border-[var(--border)] p-4 rounded-xl">
            {" "}
            -Submission File - PDF • Max 2MB
            <br />
            -Ensure the details like EMAIL, PHONE, TEAM NAME are clearly
            mentioned and valid in the submission file.
          </div>
        </div>
      </main>
    </section>
  );
};

export default RulesAndRegulations;
