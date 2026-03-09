import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { FiX, FiClock } from "react-icons/fi";
import { TopNav } from "../Components/TopNav.jsx";
import HeroSection from "../Components/landing/HeroSection.jsx";
import TopicsSection from "../Components/landing/TopicsSection.jsx";
import TimelineSection from "../Components/landing/TimelineSection.jsx";
import ObjectivesSection from "../Components/landing/ObjectivesSection.jsx";
import FooterSection from "../Components/FooterSection.jsx";
import Participants from "../Components/landing/Participants.jsx";
import About from "../Components/landing/About.jsx";
import Sponsors from "../Components/landing/Sponsors.jsx";
import BrandAmbassador from "../Components/landing/BrandAmbassador.jsx";
import PrizesSection from "../Components/landing/PrizesSection.jsx";

const DeadlinePopup = ({ onClose }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="fixed inset-0 z-[999] flex items-center dm-sans justify-center bg-black/50 backdrop-blur-sm px-4"
    onClick={onClose}
  >
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.9, opacity: 0 }}
      transition={{ type: "spring", duration: 0.8 }}
      onClick={(e) => e.stopPropagation()}
      className="relative w-full max-w-md rounded-4xl border-y-4 border-[var(--accent)] bg-[var(--bg)] px-6 py-4 shadow-2xl"
    >
      <button
        onClick={onClose}
        className="absolute top-3 right-3 rounded-full p-1.5 text-[var(--muted)] hover:bg-[var(--surface)] hover:text-[var(--text)] transition"
      >
        <FiX size={18} />
      </button>

      <div className="flex flex-col items-center text-center gap-3">
        <span className="flex items-center justify-center h-14 w-14 ">
          <FiClock size={32} className="text-[var(--accent)]" />
        </span>

        <h3 className="text-xl font-bold text-[var(--text)]">
          Deadline Extended!🎊
        </h3>

        <p className="text-sm text-[var(--muted)] leading-tight">
          Due to overwhelming demand and numerous requests from participants,
          the last date for submission has been extended to{" "}
          <span className="font-bold text-[var(--accent)]">March 13, 2026</span>
          .
        </p>

        <p className="text-sm text-[var(--muted)] leading-tight">
          Don't miss this opportunity — finalize your ideas and submit before
          the new deadline!
        </p>

        <a
          href="/submit"
          className="mt-2 w-full rounded-b-3xl rounded-xl  bg-[var(--accent)] py-4 border-y-4 border-amber-200 text-sm font-semibold text-white transition hover:opacity-90"
        >
          Submit Your Idea
        </a>
      </div>
    </motion.div>
  </motion.div>
);

const LandingPage = () => {
  const [showPopup, setShowPopup] = useState(true);

  const closePopup = () => setShowPopup(false);

  return (
    <>
      <AnimatePresence>
        {showPopup && <DeadlinePopup onClose={closePopup} />}
      </AnimatePresence>
      <div className="overflow-hidden flex flex-col dm-sans bg-[var(--bg)] text-[var(--text)]">
        <TopNav />
        <HeroSection />
        <BrandAmbassador />
        <About />
        <Sponsors />
        <ObjectivesSection />
        <Participants />
        <TopicsSection />
        <TimelineSection />
        <PrizesSection />
        <FooterSection />
      </div>
    </>
  );
};

export default LandingPage;
