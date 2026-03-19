import { useState } from "react";

const SubmissionHeader = () => {
  const [showTrack1Rules, setShowTrack1Rules] = useState(false);
  const [showTrack2Rules, setShowTrack2Rules] = useState(false);

  return (
    <>
      <div className="relative mb-6 h-[350px] w-full overflow-hidden">
        <img
          src="https://res.cloudinary.com/dqlqxcwqr/image/upload/v1771551663/sdmclg_hqeqab.jpg"
          alt="Submit Idea"
          className="absolute inset-0 h-full w-full object-cover"
          lazyload="eager"
        />
        <div
          className="absolute inset-0"
          style={{
            background: `
            linear-gradient(to bottom, var(--bg) 0%, transparent 35%, transparent 65%, var(--bg) 100%)
          `,
          }}
        />
        <div className="relative z-10 flex h-full items-start justify-center pt-17">
          <h1 className="oswald text-3xl font-bold text-white text-center  md:text-5xl">
            Round 2 shortlist <br />
            announced!👇 <br />
          </h1>
        </div>
      </div>
      <div className="px-2 text-center">
        <div className="mx-auto justify-center mt-4 max-w-4xl rounded-2xl ">
          <p className="text-2xl font-bold leading-tight text-center text-green-700 sm:text-3xl">
            Congratulations on Being Shortlisted for Round 3!🎊
          </p>
          <p className="mt-4 text-sm px-2 leading-tight text-[var(--muted)] sm:text-base">
            The ideas shortlisted for Round 3 of Vision Mysuru 2050 have been
            recognized for their relevance, creativity, and potential
            contribution to the future development of Mysuru. The selected
            participants will now advance through two parallel evaluation tracks
            (Track 1 and Track 2). Please open the relevant track-specific
            instructions below before your presentation, which will be conducted
            through a{" "}
            <b>
              physical presentation before a five-member jury panel at SDMIMD,
              Mysore.
            </b>
          </p>
          <div className="mt-5 flex flex-col items-stretch gap-3 md:flex-row md:items-start md:justify-center">
            <div className="inline-flex flex-row gap-2 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-1">
              <button
                type="button"
                onClick={() => setShowTrack1Rules((prev) => !prev)}
                className={`rounded-xl border px-4 py-2 text-sm font-semibold transition-all duration-200 ${
                  showTrack1Rules
                    ? "border-[var(--primary)] bg-[var(--primary)] text-white shadow-sm"
                    : "border-transparent bg-transparent text-[var(--muted)] hover:border-[var(--border)] hover:bg-[var(--surface-2)]"
                }`}
                aria-expanded={showTrack1Rules}
                aria-pressed={showTrack1Rules}
              >
                {showTrack1Rules
                  ? "Hide Track 1 Rules"
                  : "Instructions for Track 1"}
              </button>
              <button
                type="button"
                onClick={() => setShowTrack2Rules((prev) => !prev)}
                className={`rounded-xl border px-4 py-2 text-sm font-semibold transition-all duration-200 ${
                  showTrack2Rules
                    ? "border-[var(--primary)] bg-[var(--primary)] text-white shadow-sm"
                    : "border-transparent bg-transparent text-[var(--muted)] hover:border-[var(--border)] hover:bg-[var(--surface-2)]"
                }`}
                aria-expanded={showTrack2Rules}
                aria-pressed={showTrack2Rules}
              >
                {showTrack2Rules
                  ? "Hide Track 2 Rules"
                  : "Instructions for Track 2"}
              </button>
            </div>
          </div>

          {showTrack2Rules && (
            <div className="mt-4 rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-left text-sm text-[var(--muted)] sm:text-sm md:mx-auto md:max-w-xl">
              <p className="font-semibold text-[var(--text)]">
                Track 2: Presentation Format & Strict Rules
              </p>
              <ul className="mt-1 list-disc space-y-1 pl-4">
                <li>
                  Duration: Exactly 10 minutes presentation + 5 minutes Q&A. You
                  will be cut off when time expires.
                </li>
                <li>Slide Limit: Maximum 10 slides.</li>
                <li>
                  Evidence Requirement: MUST include hard data specific to
                  Mysuru (newspaper clippings, govt reports, credible sources).
                </li>
                <li>
                  Prototypes: Highly encouraged to bring physical or digital
                  prototypes if available.
                </li>
                <li>
                  Submission Deadline: Email presentation to
                  vision2050@sdmimd.ac.in by Thursday, March 19 at 6:00 PM.
                </li>
                <li>Travel: SDMIMD will not provide travel allowance.</li>
              </ul>
            </div>
          )}

          {showTrack1Rules && (
            <div className="mt-5 rounded-xl border  text-left border-[var(--border)] bg-[var(--surface-2)] p-4 sm:p-5">
              <p className="text-base font-bold text-[var(--text)] sm:text-lg">
                Instructions for Track 1
              </p>
              <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-relaxed text-[var(--muted)] sm:text-base">
                <li>
                  Focus your presentation on the viability and operational
                  feasibility of your idea.
                </li>
                <li>
                  Support your proposal with relevant data, and clearly explain
                  the on-ground situation and practical context.
                </li>
                <li>
                  You may use a PowerPoint presentation (PPT) with a maximum of
                  10 slides.
                </li>
                <li>
                  Submit your PPT to vision2050@sdmimd.ac.in by 12:00 Noon on
                  March 16, 2026.
                </li>
                <li>
                  The presentation session is scheduled from 4:00 PM to 6:00 PM
                  on March 16, 2026, at SDMIMD, Mysore.
                </li>
                <li>
                  Each participant will be given 10 minutes for presentation,
                  followed by 5 minutes for questions and answers.
                </li>
                <li>
                  All shortlisted participants are requested to report to the
                  venue by 3:45 PM.
                </li>
                <li>
                  Attend the online meeting on March 15, 2026, at 7:30 PM, where
                  suggestions, review points, guidelines, and presentation
                  instructions for the next day will be shared.
                </li>
                <li>
                  Organizers will not provide accommodation or travel support to
                  the presenters.
                </li>
              </ol>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default SubmissionHeader;
