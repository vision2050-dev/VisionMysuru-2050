import { FiPlay, FiPause } from "react-icons/fi";
import { Section } from "./Section.jsx";

const BrandAmbassador = () => {
  return (
    <Section id="ambassador" title="Message from Our Brand Ambassador">
      <div className="flex flex-col  gap-4 md:flex-row ">
        <div className=" md:w-3/5">
          <div className="bg-[var(--surface)] ">
            <h3 className=" text-xl font-semibold text-[var(--text)]">
              Dr. D. Veerendra Heggade
            </h3>
            <p className="mt-1 text-sm font-medium text-[var(--accent)]">
              Brand Ambassador – Vision Mysuru 2050
            </p>
            <div className="mt-1 space-y-0.5 text-xs text-[var(--muted)]">
              <p>Dharmadhikari, Shri Kshetra Dharmasthala</p>
              <p>Chairman, SDM Educational Trust</p>
            </div>

            <div className="mt-4 space-y-3 text-md  text-[var(--muted)]">
              <p>
                Dr. D. Veerendra Heggade shares his appreciation for the Vision
                Mysuru 2050 initiative and commends the students of SDMIMD for
                taking up the responsibility of envisioning Mysuru's future. He
                emphasizes that planning the next 20 years of the city's growth
                requires foresight, responsibility, and collective
                participation.
              </p>
              <p>
                Mysuru is not just a city of heritage and culture — it is a city
                of opportunity, values, and evolving aspirations. Preserving its
                cultural richness while enabling sustainable development demands
                collaboration between architects, builders, policymakers,
                institutions, and citizens alike.
              </p>
              <p>
                Through his message, Dr. Heggade calls upon every stakeholder to
                move beyond passive observation and actively contribute to
                shaping the Mysuru of tomorrow. Vision Mysuru 2050 is not merely
                a roadmap — it is a movement of shared responsibility, civic
                pride, and long-term commitment.
              </p>
            </div>

            <p className="mt-4 text-md font-semibold italic text-[var(--text)]"></p>
          </div>
        </div>
        <div className="w-full  md:w-3/7">
          <div className="overflow-hidden rounded-3xl shadow-lg">
            <video
              src="/speech.mp4"
              className="aspect-video w-full object-cover"
              controls
              preload="metadata"
              playsInline
            />
          </div>
        </div>
      </div>
    </Section>
  );
};

export default BrandAmbassador;
