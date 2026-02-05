import { TopNav } from "../Components/TopNav.jsx";
import HeroSection from "../Components/landing/HeroSection.jsx";
import TopicsSection from "../Components/landing/TopicsSection.jsx";
import TimelineSection from "../Components/landing/TimelineSection.jsx";
import ObjectivesSection from "../Components/landing/ObjectivesSection.jsx";
import FooterSection from "../Components/FooterSection.jsx";
import Participants from "../Components/landing/Participants.jsx";
import About from "../Components/landing/About.jsx";
import Sponsors from "../Components/landing/Sponsors.jsx";
import Gallery from "../Components/landing/Gallery.jsx";

const LandingPage = () => {
  return (
    <>
      <div className="overflow-hidden flex flex-col dm-sans bg-[var(--bg)] text-[var(--text)]">
        <TopNav />
        <HeroSection />
        <About />
        <Sponsors />
        <ObjectivesSection />
        <Participants />
        <TopicsSection />
        <TimelineSection />
        <Gallery />
        <FooterSection />
      </div>
    </>
  );
};

export default LandingPage;
