import { useEffect, useState } from "react";
import api from "../../utils/api";

const CATEGORY_LABEL = {
  students: "Student",
  corporates: "Corporate",
  ngos: "NGO",
  citizens: "Citizen",
};

const ShortlistTable = ({ round }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showInstructions, setShowInstructions] = useState(false);

  useEffect(() => {
    api
      .get(`/api/v1/shortlist?round=${round}`)
      .then((res) => setData(res.data.data))
      .catch(() => setError("Failed to load shortlist."))
      .finally(() => setLoading(false));
  }, [round]);

  if (loading) {
    return (
      <div className="flex justify-center py-10">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--primary)] border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return (
      <p className="text-center text-sm text-[var(--muted)] py-6">{error}</p>
    );
  }

  if (data.length === 0) {
    return (
      <p className="text-center text-sm text-[var(--muted)] py-6">
        No teams have been shortlisted yet. Check back soon!
      </p>
    );
  }

  return (
    <section className="mx-auto max-w-7xl px-2 py-6 ">
      <div className="mb-6 text-center">
        {round === "1" ? (
          <div className="mx-auto mt-4 max-w-4xl rounded-2xl ">
            <p className="text-2xl font-bold leading-tight text-center text-green-700 sm:text-3xl">
              Congratulations on Being Shortlisted for Round 2!🎊
            </p>

            <p className="mt-3 text-sm leading-tight text-[var(--muted)] sm:text-base">
              The ideas shortlisted for the next round have been recognized for
              their relevance, creativity, and potential contribution to the
              future development of Mysuru. The selected participants will now
              move to the next stage of evaluation, which will be conducted
              through a physical presentation at SDMIMD, Mysore.
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
                    presentation file to vision2050@sdmimd.ac.in by 8:00 AM on
                    15 March 2026 to facilitate smooth access during the
                    presentation.
                  </li>
                  <li>
                    Organizers will not provide accommodation or travel support
                    to the presenters.
                  </li>
                </ol>
              </div>
            )}
          </div>
        ) : (
          <p className="mt-3 text-base text-[var(--muted)]">
            Congratulations to all shortlisted teams.
          </p>
        )}
      </div>
      <div className="overflow-x-auto rounded-xl border border-[var(--border)]">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-[var(--accent)] text-white">
              <th className="px-4 py-3 text-left font-semibold">#</th>
              <th className="px-4 py-3 text-left font-semibold">ID</th>
              <th className="px-4 py-3 text-left font-semibold">Team Name</th>
              <th className="px-4 py-3 text-left font-semibold">Category</th>
              <th className="px-4 py-3 text-left font-semibold">Theme</th>
              <th className="px-4 py-3 text-left font-semibold">Leader name</th>
              <th className="px-4 py-3 text-left font-semibold">
                Leader Email
              </th>
            </tr>
          </thead>
          <tbody>
            {data.map((team, idx) => {
              const leader = team.members?.find((m) => m.isLeader);
              return (
                <tr
                  key={team.teamId}
                  className={
                    idx % 2 === 0
                      ? "bg-[var(--surface)]"
                      : "bg-[var(--surface-2)]"
                  }
                >
                  <td className="px-4 py-3 text-[var(--muted)]">{idx + 1}</td>
                  <td className="px-4 py-3 font-mono text-md text-black">
                    {team.teamId}
                  </td>
                  <td className="px-4 py-3 font-semibold text-[var(--text)]">
                    {team.teamName}
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-[var(--primary-soft)] px-2.5 py-1 text-xs font-semibold text-[var(--primary)]">
                      {CATEGORY_LABEL[team.category] ?? team.category}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[var(--muted)]">
                    {team.theme}
                  </td>
                  <td className="px-4 py-3 text-[var(--muted-2)]">
                    {leader?.name ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-blue-800">
                    {leader?.email ?? "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
};

export default ShortlistTable;
