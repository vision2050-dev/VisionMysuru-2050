import { useState } from "react";

const SubmissionHeader = () => {
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
            Round 3 shortlist <br />
            announced! <br />
          </h1>
        </div>
      </div>
      <div className="px-2 text-center">
        <div className="mx-auto justify-center mt-4 max-w-4xl rounded-2xl ">
          <p className="text-2xl font-bold leading-tight text-center bg-clip-text text-transparent bg-gradient-to-r from-amber-700 to-yellow-300 sm:text-3xl">
            🎉Congratulations on being shortlisted for Grand Finale!🎉
          </p>
          <p className="mt-4 text-sm px-2 leading-tight text-[var(--muted)] sm:text-base">
            You are now in the Grand Finale stage of Vision Mysuru 2050. Your
            shortlisted idea has reached the final round based on its impact
            potential, practicality, and relevance to Mysuru's long-term
            development goals. Please review the final presentation instructions
            below carefully before your session, which will be conducted through
            a{" "}
            <b>
              physical presentation at SDMIMD on March 23th, 2026 at 3:00 PM.
            </b>
          </p>

          <div className="inline-flex my-4 flex-row gap-2 rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] ">
            <button
              type="button"
              onClick={() => setShowTrack2Rules((prev) => !prev)}
              className={`rounded-xl px-4 py-2 text-sm font-semibold transition-all duration-200 ${
                showTrack2Rules
                  ? "border-[var(--primary)] bg-[var(--primary)] text-white shadow-sm"
                  : "border-transparent bg-transparent text-[var(--muted)] hover:border-[var(--border)] hover:bg-[var(--surface-2)]"
              }`}
              aria-expanded={showTrack2Rules}
              aria-pressed={showTrack2Rules}
            >
              {showTrack2Rules
                ? "Hide Instructions"
                : "Instructions for Grand Finale"}
            </button>
          </div>

          {showTrack2Rules && (
            <div className="mt-5 rounded-xl border  text-left border-[var(--border)] bg-[var(--surface-2)] p-4 sm:p-5">
              <ul className="mt-1 list-disc space-y-1 pl-4">
                <li>
                  Arrival: Be at the SDMIMD campus by 3:00 PM on March 23th for
                  setup.
                </li>
                <li>
                  Timing: Exactly 8 minutes for your presentation and 2 minutes
                  for Q&amp;A.
                </li>
                <li>Slide Limit: A maximum of 8 to 10 slides only.</li>
                <li>
                  Prototypes: Bring any physical models, digital demos, or
                  samples you have built.
                </li>
                <li>
                  Local Focus: Show how your idea helps Mysuru and fits the
                  Vision 2050 goals.
                </li>
                <li>
                  Execution &amp; Data: Use simple facts and clear numbers to
                  show your plan works.
                </li>
                <li>
                  Submission: Email your final presentation to
                  vision2050@sdmimd.ac.in before March 22nd at 8:00 PM.
                </li>
                <li>Dress Code: You must wear Business Formals.</li>
                <li>
                  WhatsApp Group: Check your email for the link to join the
                  official WhatsApp group.
                </li>
                <li>
                  Virtual Session: Attend the mandatory online meeting for PPT
                  guidelines (details sent via email).
                </li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default SubmissionHeader;
