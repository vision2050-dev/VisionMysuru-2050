import { useState } from "react";
import { motion } from "framer-motion";
import FooterSection from "../Components/FooterSection";
import SubmissionHeader from "../Components/Submission/SubmissionHeader";
import SubmissionNav from "../Components/Submission/SubmissionNav";
import ShortlistTable from "../Components/Submission/ShortlistTable";
// import { CATEGORY } from "../constants/content";
// import StudentForm from "../Components/Submission/forms/StudentForm";
// import CorporateForm from "../Components/Submission/forms/CorporateForm";
// import NGOForm from "../Components/Submission/forms/NGOForm";
// import CitizensForm from "../Components/Submission/forms/CitizensForm";
import FaqsSection from "../Components/FaqsSection";

// const Toggle = ({ active, onChange }) => {
//   const tabs = [
//     { key: CATEGORY.CITIZENS, label: "Citizens" },
//     { key: CATEGORY.STUDENT, label: "Students" },
//     { key: CATEGORY.CORPORATE, label: "Corporates" },
//     { key: CATEGORY.NGO, label: "NGOs" },
//   ];
//
//   return (
//     <div className="inline-flex w-full flex-wrap overflow-x-auto gap-2 sm:flex-row">
//       {tabs.map((t) => (
//         <button
//           key={t.key}
//           type="button"
//           onClick={() => onChange(t.key)}
//           className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors ${
//             active === t.key
//               ? "bg-[var(--primary)] text-white"
//               : "text-[var(--muted)] bg-[var(--surface-2)] hover:bg-[var(--primary)]/20"
//           }`}
//         >
//           {t.label}
//         </button>
//       ))}
//     </div>
//   );
// };

const SubmitIdeaPage = () => {
  const [activeTrack, setActiveTrack] = useState("track1");

  const roundByTrack = {
    track1: 2,
    track2: 2.1,
  };

  // const [activeCategory, setActiveCategory] = useState(CATEGORY.CITIZENS);

  // const renderForm = () => {
  //   switch (activeCategory) {
  //     case CATEGORY.STUDENT:
  //       return <StudentForm />;
  //     case CATEGORY.CORPORATE:
  //       return <CorporateForm />;
  //     case CATEGORY.NGO:
  //       return <NGOForm />;
  //     case CATEGORY.CITIZENS:
  //       return <CitizensForm />;
  //     default:
  //       return <StudentForm />;
  //   }
  // };

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
        <section className="mx-auto max-w-7xl px-2 pt-4">
          <div className="rounded-2xl gap-2 flex flex-row  justify-center items-center p-1">
            <button
              type="button"
              onClick={() => setActiveTrack("track1")}
              className={`w-full rounded-xl px-4 py-2 text-sm font-semibold transition-colors sm:w-auto ${
                activeTrack === "track1"
                  ? "bg-[var(--primary)] text-white"
                  : "text-[var(--muted)] hover:bg-[var(--surface-2)]"
              }`}
            >
              Track 1
            </button>
            <button
              type="button"
              onClick={() => setActiveTrack("track2")}
              className={`w-full rounded-xl px-4 py-2 text-sm items-center font-semibold transition-colors sm:mt-0 sm:w-auto ${
                activeTrack === "track2"
                  ? "bg-[var(--primary)] text-white"
                  : "text-[var(--muted)] hover:bg-[var(--surface-2)]"
              }`}
            >
              Track 2
            </button>
          </div>
        </section>
        <ShortlistTable round={roundByTrack[activeTrack]} />
        <FaqsSection />
        <FooterSection />
      </main>
    </motion.div>
  );
};

export default SubmitIdeaPage;
