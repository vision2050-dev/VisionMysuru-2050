import { useState } from "react";
import { motion } from "framer-motion";
import { FiExternalLink } from "react-icons/fi";
import RulesAndRegulations from "../Components/Submission/RulesAndRegulations";
import FooterSection from "../Components/FooterSection";
import SubmissionHeader from "../Components/Submission/SubmissionHeader";
import SubmissionNav from "../Components/Submission/SubmissionNav";
import { CATEGORY } from "../constants/content";
import StudentForm from "../Components/Submission/forms/StudentForm";
import CorporateForm from "../Components/Submission/forms/CorporateForm";
import NGOForm from "../Components/Submission/forms/NGOForm";
import CitizensForm from "../Components/Submission/forms/CitizensForm";
import FaqsSection from "../Components/FaqsSection";

const Toggle = ({ active, onChange }) => {
  const tabs = [
    { key: CATEGORY.CITIZENS, label: "Citizens" },
    { key: CATEGORY.STUDENT, label: "Students" },
    { key: CATEGORY.CORPORATE, label: "Corporates" },
    { key: CATEGORY.NGO, label: "NGOs" },
  ];

  return (
    <div className="inline-flex w-full flex-wrap overflow-x-auto gap-2 sm:flex-row">
      {tabs.map((t) => (
        <button
          key={t.key}
          type="button"
          onClick={() => onChange(t.key)}
          className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors ${
            active === t.key
              ? "bg-[var(--primary)] text-white"
              : "text-[var(--muted)] bg-[var(--surface-2)] hover:bg-[var(--primary)]/20"
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
};

const SubmitIdeaPage = () => {
  const [activeCategory, setActiveCategory] = useState(CATEGORY.CITIZENS);

  const renderForm = () => {
    switch (activeCategory) {
      case CATEGORY.STUDENT:
        return <StudentForm />;
      case CATEGORY.CORPORATE:
        return <CorporateForm />;
      case CATEGORY.NGO:
        return <NGOForm />;
      case CATEGORY.CITIZENS:
        return <CitizensForm />;
      default:
        return <StudentForm />;
    }
  };

  return (
    <motion.div
      className=" overflow-hidden flex flex-col dm-sans bg-[var(--bg)] text-[var(--text)]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
    >
      <SubmissionNav />
      <main className=" ">
        <SubmissionHeader />
        <RulesAndRegulations />

        <div className="max-w-6xl mx-auto mt-5 mb-10 px-4 md:px-0">
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-[var(--accent)] bg-[var(--surface-2)]/10 p-5 text-center">
            <p className="text-sm text-[var(--muted)]">
              Please read the submission guidelines carefully before filling out
              the form.
            </p>
            <div className="flex items-center gap-4">
              <span className="text-sm font-semibold text-[var(--muted)]">
                Submission Guidelines:
              </span>
              <a
                href="https://drive.google.com/file/d/1sEnGX7O6kani_s_fxr6k5Dm-FxzCo-OY/view?usp=sharing"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm font-medium text-blue-700 underline underline-offset-4 hover:opacity-75 transition"
              >
                <FiExternalLink className="inline" size={14} />
                English
              </a>
              <a
                href="https://drive.google.com/file/d/1wRQleCJJ_RtUFBNzFcCaVSt0dFhlbifC/view?usp=sharing"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm font-medium text-blue-700 underline underline-offset-4 hover:opacity-75 transition"
              >
                <FiExternalLink className="inline" size={14} />
                ಕನ್ನಡ (Kannada)
              </a>
            </div>
          </div>
        </div>

        <div className=" max-w-6xl mx-auto mb-10 px-4 md:px-0">
          <Toggle active={activeCategory} onChange={setActiveCategory} />
          <div className="mt-3 rounded-3xl border-y-4 border border-[var(--accent)] p-6 sm:p-8">
            {renderForm()}
          </div>
        </div>
        <FaqsSection />

        <FooterSection />
      </main>
    </motion.div>
  );
};

export default SubmitIdeaPage;
