import { Link } from "react-router-dom";
import { FiArrowRight } from "react-icons/fi";
import { Section } from "./Section.jsx";

const About = () => {
  return (
    <Section id="about">
      <p className="text-3xl font-semibold dm-sans tracking-tight text-[var(--accent)] ">
        Vision Mysuru 2050
      </p>
      <div className="text-base sm:text-lg font-semibold italic tracking-wider text-[var(--text)]">
        EDITION 2 &nbsp;—&nbsp; IDEAS TO IMPACT
      </div>
      <div className="flex flex-col gap-6 md:flex-row md:gap-12">
        <div className=" max-w-xl mx-auto py-3 md:py-6">
          <p className="text-md text-[var(--muted)]">
            Vision Mysuru 2050 is not just an event; it is a city-wide movement.
            Bridging the gap between academic theory and civic reality, this
            initiative transforms students into “City Consultants”. Over a
            60-day rapid innovation cycle, participants will identify
            ground-level bottlenecks and propose scalable solutions.
          </p>

          <p className="mt-4 text-md  text-[var(--muted)]">
            The goal is to turn local observations into structured proposals
            that can be evaluated, refined, and compiled into a practical
            roadmap for the city — anchored in clear problem definition,
            evidence, feasibility, and measurable impact.
          </p>

          <div className="mt-6">
            <div className="mt-3 grid gap-2 sm:grid-cols-3">
              <div className="border rounded-2xl border-[var(--border)] px-4 py-3">
                <div className="text-xs font-semibold text-[var(--muted)]">
                  01
                </div>
                <div className="mt-1 text-sm font-semibold text-[var(--text)]">
                  Observe
                </div>
                <div className="mt-1 text-sm leading-relaxed text-[var(--muted)]">
                  Spot a real, local civic bottleneck.
                </div>
              </div>
              <div className="border rounded-2xl border-[var(--border)] px-4 py-3">
                <div className="text-xs font-semibold text-[var(--muted)]">
                  02
                </div>
                <div className="mt-1 text-sm font-semibold text-[var(--text)]">
                  Diagnose
                </div>
                <div className="mt-1 text-sm leading-relaxed text-[var(--muted)]">
                  Back it with evidence and root-cause thinking.
                </div>
              </div>
              <div className="border rounded-2xl border-[var(--border)] px-4 py-3">
                <div className="text-xs font-semibold text-[var(--muted)]">
                  03
                </div>
                <div className="mt-1 text-sm font-semibold text-[var(--text)]">
                  Propose
                </div>
                <div className="mt-1 text-sm leading-relaxed text-[var(--muted)]">
                  Deliver a solution that can scale city-wide.
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="relative h-full overflow-hidden md:h-[76vh] w-full">
          <img
            src="/about.jpg"
            alt="Mysuru city"
            className="h-full w-full object-cover"
            loading="lazy"
          />
          <div
            className="absolute inset-0"
            style={{
              background: `
            linear-gradient(to right, var(--bg) 0%, transparent 15%, transparent 85%, var(--bg) 100%),
            linear-gradient(to bottom, var(--bg) 0%, transparent 25%, transparent 75%, var(--bg) 100%)
          `,
            }}
          />
        </div>
      </div>
    </Section>
  );
};

export default About;
