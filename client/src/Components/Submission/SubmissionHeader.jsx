import { useState } from "react";

const SubmissionHeader = () => {
  const [showInstructions, setShowInstructions] = useState(false);

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
            Round 1 shortlist <br />
            announced!👇 <br />
          </h1>
        </div>
      </div>
      <div className="mb-4 text-center">
        <div className="mx-auto mt-4 max-w-4xl rounded-2xl ">
          <p className="text-2xl font-bold leading-tight px-2 text-center text-green-700 sm:text-3xl">
            Congratulations on Being Shortlisted for Round 2!🎊
          </p>
          <p className="mt-4 text-sm px-2 leading-tight text-[var(--muted)] sm:text-base">
            The ideas shortlisted for the next round have been recognized for
            their relevance, creativity, and potential contribution to the
            future development of Mysuru. The selected participants will now
            move to the next stage of evaluation, which will be conducted
            through a physical presentation scheduled tomorrow i.e{" "}
            <b>15th March 2026 from 10 AM onwards at SDMIMD, Mysore.</b>
          </p>
          <div className="mt-5 flex justify-center">
            <button
              type="button"
              onClick={() => setShowInstructions((prev) => !prev)}
              className="rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--primary-hover)]"
              aria-expanded={showInstructions}
            >
              {showInstructions
                ? "Hide Instructions"
                : "View Instructions for Round 2"}
            </button>
          </div>

          {showInstructions && (
            <div className="mt-5 rounded-xl border text-left border-[var(--border)] bg-[var(--surface-2)] p-4 sm:p-5">
              <p className="text-base font-bold text-[var(--text)] sm:text-lg">
                Instructions for Shortlisted Participants
              </p>
              <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-relaxed text-[var(--muted)] sm:text-base">
                <li>The next round will be a physical presentation round.</li>
                <li>
                  Focus on the operational feasibility and implementation
                  aspects of your idea during the presentation.
                </li>
                <li>
                  You may use PowerPoint (PPT) or any other suitable visual
                  presentation aid.
                </li>
                <li>
                  The presentations are scheduled between 10:00 AM and 1:00 PM
                  on 15th March 2026 at SDMIMD, Mysore.
                </li>
                <li>
                  Each participant will be given 10 minutes for presentation,
                  followed by 5 minutes for questions and answers.
                </li>
                <li>
                  All shortlisted participants are requested to report to the
                  venue by 9:45 AM.
                </li>
                <li>
                  Please bring the valid PPT/PDF file for tomorrow's
                  presentation on a USB drive or laptop or have it accessible
                  via email/cloud storage.
                </li>
                <li>
                  For convenience, participants may also email their
                  presentation file to vision2050@sdmimd.ac.in by 8:00 AM on 15
                  March 2026 to facilitate smooth access during the
                  presentation.
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
