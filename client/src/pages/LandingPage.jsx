import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Link } from "react-router-dom";
import { FiX } from "react-icons/fi";
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
import GlimpseEditionOne from "../Components/landing/GlimpseEditionOne.jsx";
// import PrizesSection from "../Components/landing/PrizesSection.jsx";
import RegistrationsSoonSection from "../Components/landing/RegistrationsSoonSection.jsx";
import { Updates } from "../Components/landing/Updates.jsx";
// import InstagramFeedSection from "../Components/landing/InstagramFeedSection.jsx";

const LandingPage = () => {
  const [showCertificatesPopup, setShowCertificatesPopup] = useState(false);

  return (
    <>
      <div className="overflow-hidden flex flex-col dm-sans bg-[var(--bg)] text-[var(--text)]">
        <AnimatePresence>
          {showCertificatesPopup ? (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[70] bg-black/45 backdrop-blur-[2px]"
                onClick={() => setShowCertificatesPopup(false)}
              />

              <motion.div
                initial={{ opacity: 0, y: 24, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 16, scale: 0.98 }}
                transition={{ duration: 0.22, ease: "easeOut" }}
                className="fixed left-1/2 top-1/2 z-[80] w-[92%] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-2xl"
              >
                <button
                  type="button"
                  onClick={() => setShowCertificatesPopup(false)}
                  aria-label="Close certificates popup"
                  className="absolute right-3 top-3 inline-flex rounded-lg p-1.5 text-[var(--muted)] hover:bg-[var(--surface-2)] hover:text-[var(--text)]"
                >
                  <FiX className="h-4 w-4" />
                </button>

                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--accent)]">
                  Important Update
                </p>
                <h2 className="mt-2 oswald text-3xl leading-tight text-[var(--text)]">
                  Certificates Are Live
                </h2>
                <p className="mt-2 text-sm text-[var(--muted)]">
                  Enter your Team ID to instantly access your certificate drive
                  folder.
                </p>

                <div className="mt-5 flex flex-col gap-2 sm:flex-row">
                  <Link
                    to="/certificates"
                    className="inline-flex items-center justify-center rounded-xl bg-[var(--primary)] px-4 py-2.5 text-sm font-semibold text-[var(--button)] transition hover:bg-[var(--primary-hover)]"
                    onClick={() => setShowCertificatesPopup(false)}
                  >
                    Go to Certificates
                  </Link>
                  <button
                    type="button"
                    onClick={() => setShowCertificatesPopup(false)}
                    className="inline-flex items-center justify-center rounded-xl border border-[var(--border)] px-4 py-2.5 text-sm font-semibold text-[var(--text)] transition hover:bg-[var(--surface-2)]"
                  >
                    Maybe later
                  </button>
                </div>
              </motion.div>
            </>
          ) : null}
        </AnimatePresence>

        <TopNav />
        <HeroSection />
        <Updates />
        {/* <InstagramFeedSection /> - Temporarily hidden */}
        <BrandAmbassador />
        <GlimpseEditionOne />
        <About />
        {/* <Sponsors /> - Temporarily hidden; will be updated with Edition 2 sponsors list */}
        <ObjectivesSection />
        <Participants />
        <TopicsSection />
        <TimelineSection />
        <RegistrationsSoonSection />
        <FooterSection />
      </div>
    </>
  );
};

export default LandingPage;
