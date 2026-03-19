import { useEffect, useState } from "react";
import api from "../../utils/api";

const shortlistCache = new Map();
const inFlightShortlistRequests = new Map();

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

  useEffect(() => {
    let isActive = true;
    const key = String(round);

    Promise.resolve().then(() => {
      if (!isActive) return;
      setLoading(true);
      setError(null);
    });

    if (shortlistCache.has(key)) {
      Promise.resolve().then(() => {
        if (!isActive) return;
        setData(shortlistCache.get(key));
        setLoading(false);
      });
      return () => {
        isActive = false;
      };
    }

    let requestPromise = inFlightShortlistRequests.get(key);

    if (!requestPromise) {
      requestPromise = api
        .get(`/api/v1/shortlist?round=${round}`)
        .then((res) => {
          const teams = res.data?.data ?? [];
          shortlistCache.set(key, teams);
          return teams;
        })
        .finally(() => {
          inFlightShortlistRequests.delete(key);
        });

      inFlightShortlistRequests.set(key, requestPromise);
    }

    requestPromise
      .then((teams) => {
        if (!isActive) return;
        setData(teams);
      })
      .catch(() => {
        if (!isActive) return;
        setError("Failed to load shortlist.");
      })
      .finally(() => {
        if (!isActive) return;
        setLoading(false);
      });

    return () => {
      isActive = false;
    };
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
    <section className="mx-auto max-w-7xl px-2 py-4">
      <div className="overflow-x-auto rounded-xl border border-[var(--border)]">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-[var(--primary)] text-white">
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
                  <td className="px-4 py-3 min-w-[130px] font-mono text-md font-semibold text-black">
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
