import { useState } from "react";
import { motion } from "framer-motion";
import RulesAndRegulations from "../Components/Submission/RulesAndRegulations";
import FooterSection from "../Components/FooterSection";
import SubmissionHeader from "../Components/Submission/SubmissionHeader";
import SubmissionNav from "../Components/Submission/SubmissionNav";
import { CATEGORY } from "../constants/content";
import StudentForm from "../Components/Submission/forms/StudentForm";
import CorporateForm from "../Components/Submission/forms/CorporateForm";
import NGOForm from "../Components/Submission/forms/NGOForm";
import FaqsSection from "../Components/FaqsSection";

const Toggle = ({ active, onChange }) => {
  const tabs = [
    { key: CATEGORY.STUDENT, label: "Students" },
    { key: CATEGORY.CORPORATE, label: "Corporates" },
    { key: CATEGORY.NGO, label: "NGOs" },
  ];

  return (
    <div className="inline-flex w-full flex-row gap-2  sm:flex-row">
      {tabs.map((t) => (
        <button
          key={t.key}
          type="button"
          onClick={() => onChange(t.key)}
          className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors ${
            active === t.key
              ? "bg-[var(--primary)] text-white"
              : "text-[var(--muted)] hover:bg-[var(--surface-2)]"
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
};

const SubmitIdeaPage = () => {
  const [activeCategory, setActiveCategory] = useState(CATEGORY.STUDENT);

  const renderForm = () => {
    switch (activeCategory) {
      case CATEGORY.STUDENT:
        return <StudentForm />;
      case CATEGORY.CORPORATE:
        return <CorporateForm />;
      case CATEGORY.NGO:
        return <NGOForm />;
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
        <div className=" max-w-6xl mx-auto my-10 px-4 md:px-0">
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
