import { useState } from "react";
import { FiChevronDown } from "react-icons/fi";
import { FAQS } from "../constants/faqs.js";
import { Section } from "./landing/Section.jsx";

const FaqsSection = () => {
  const [openIndex, setOpenIndex] = useState(null);

  const toggle = (idx) => {
    setOpenIndex((prev) => (prev === idx ? null : idx));
  };

  return (
    <Section id="faqs" eyebrow="FAQs" title="Frequently asked questions">
      <div className="mx-auto  space-y-3">
        {FAQS.map((f, idx) => {
          const isOpen = openIndex === idx;

          return (
            <div
              key={f.q}
              className={`rounded-2xl border transition
                ${
                  isOpen
                    ? "border-[var(--accent)] bg-[var(--surface)]"
                    : "border-[var(--border)] bg-[var(--surface)]"
                }`}
            >
              <button
                onClick={() => toggle(idx)}
                aria-expanded={isOpen}
                className="flex w-full items-start justify-between gap-6 px-6 py-5 text-left"
              >
                <div>
                  <div className="mb-1 text-xs font-medium uppercase tracking-wide text-[var(--muted)]">
                    Question {String(idx + 1).padStart(2, "0")}
                  </div>
                  <h3 className="text-base font-semibold leading-snug text-[var(--text)]">
                    {f.q}
                  </h3>
                </div>

                <span
                  className={`mt-1 inline-flex h-8 w-8 flex-none items-center justify-center
                    rounded-full border transition
                    ${
                      isOpen
                        ? "border-[var(--accent)] text-[var(--accent)]"
                        : "border-[var(--border)] text-[var(--muted)]"
                    }`}
                >
                  <FiChevronDown
                    className={`transition-transform duration-300 ${
                      isOpen ? "rotate-180" : ""
                    }`}
                  />
                </span>
              </button>

              <div
                className={`grid transition-all duration-300 ease-out
                  ${
                    isOpen
                      ? "grid-rows-[1fr] opacity-100"
                      : "grid-rows-[0fr] opacity-0"
                  }`}
              >
                <div className="overflow-hidden">
                  <div className="border-t border-[var(--border)] px-6 py-4">
                    <p className="text-sm leading-relaxed text-[var(--muted)]">
                      {f.a}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Section>
  );
};

export default FaqsSection;
