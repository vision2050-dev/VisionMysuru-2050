import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import api from "../../utils/api";

const shortlistCache = new Map();
const inFlightShortlistRequests = new Map();

const CATEGORY_LABEL = {
  students: "Student",
  corporates: "Corporate",
  ngos: "NGO",
  citizens: "Citizen",
};

const GRAND_FINALE_WINNERS = [
  {
    teamId: "ST-3A481C",
    place: "1st Place",
    prize: "INR 50,000",
    name: " Eco Prabal",
    sponsor: "Sponsored jointly by SDMIMD and rProcess",
  },
  {
    teamId: "CT-3A22D7",
    place: "2nd Place",
    prize: "INR 25,000",
    name: "Gandabherunda",

    sponsor:
      "Sponsored jointly by Mysuru Grahakara Parishad (MGP) and MINDS Doctors Association",
  },
];

const podiumConfig = {
  0: {
    bgGradient: "from-amber-50 to-yellow-100",
    borderColor: "border-yellow-400",
    shadowColor: "shadow-yellow-300/40",
    gradient: "from-yellow-600 to-amber-500",
    pillarGradient: "from-amber-500 to-yellow-500",
    height: "h-36 md:h-42",
    rankLabel: "1st",
  },
  1: {
    bgGradient: "from-slate-100 to-zinc-200",
    borderColor: "border-slate-400",
    shadowColor: "shadow-slate-300/40",
    gradient: "from-slate-500 to-zinc-500",
    pillarGradient: "from-slate-500 to-zinc-500",
    height: "h-26 md:h-32",
    rankLabel: "2nd",
  },
};

const podiumOrder = [0, 1];

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

  const topFive = data.slice(0, 5);

  return (
    <section className="mx-auto max-w-7xl px-2 py-4">
      <div className="flex flex-row items-end justify-center gap-3 md:gap-12 mb-12 max-w-4xl mx-auto mt-8">
        {podiumOrder.map((podiumIdx, i) => {
          const winner = GRAND_FINALE_WINNERS[podiumIdx];
          const prizeStyle = podiumConfig[podiumIdx];

          return (
            <motion.div
              key={winner.teamId}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: i * 0.2 }}
              viewport={{ once: true, amount: 0.2 }}
              className="flex flex-col items-center w-full sm:w-auto"
            >
              <div
                className={`relative mt-2 sm:mt-3 bg-gradient-to-br ${prizeStyle.bgGradient} rounded-xl sm:rounded-2xl p-2 md:p-4 shadow-xl text-center w-36 sm:w-32 md:w-44 ${prizeStyle.shadowColor} transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl`}
              >
                <p className="text-sm font-bold bg-white rounded-full mb-2 text-gray-800">
                  # {winner.teamId}
                </p>
                <h3 className="text-base md:text-lg leading-tight tracking-tight mb-1 font-bold text-gray-800">
                  {winner.name}
                </h3>
                <p
                  className={`text-sm md:text-base font-extrabold text-transparent bg-clip-text bg-gradient-to-r ${prizeStyle.gradient}`}
                >
                  {winner.prize}
                </p>
              </div>
              <div
                className={`w-24 mt-3 md:w-36 h-2 rounded-b-sm bg-gradient-to-t ${prizeStyle.pillarGradient}`}
              />
              <div
                className={`w-20 md:w-28 h-1 rounded-b-sm bg-gradient-to-t ${prizeStyle.pillarGradient}`}
              />

              <div
                className={`w-24 md:w-34 ${prizeStyle.height} bg-gradient-to-b ${prizeStyle.pillarGradient} shadow-lg relative flex items-center justify-center`}
                style={{
                  clipPath:
                    "polygon(25% 6%, 5% 4%, 0 0, 100% 0, 95% 4%, 75% 6%, 85% 90%, 100% 96%, 100% 100%, 0 100%, 0 96%, 15% 90%)",
                }}
              >
                <span className="absolute bottom-2 text-white font-bold text-sm md:text-xl drop-shadow-md">
                  {prizeStyle.rankLabel}
                </span>
              </div>
              <div
                className={`w-28 md:w-42 h-2 rounded-t-sm bg-gradient-to-b ${prizeStyle.pillarGradient}`}
              />
              <div className="w-24 md:w-36 h-1 rounded-t-sm bg-gradient-to-b ${prizeStyle.pillarGradient}`} />">
                {winner.sponsor ? (
                  <p className="mt-2 text-[11px] text-center font-semibold text-[#6E1E1E] leading-tight">
                    {winner.sponsor}
                  </p>
                ) : null}
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="py-10 mt-20">
        <div className="flex flex-col items-center justify-center mb-6 mt-2 text-center">
          <h2 className="text-3xl md:text-4xl leading-tight font-extrabold tracking-tight text-[#6E1E1E] mb-2">
            🎉Top 5 Finalists!🎉
          </h2>
          <p className="text-base md:text-lg leading-tight text-[var(--muted)]">
            Congratulations to all teams that reached the Grand Finale.
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-10">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--primary)] border-t-transparent" />
          </div>
        ) : error ? (
          <p className="text-center text-sm text-[var(--muted)] py-6">
            {error}
          </p>
        ) : topFive.length === 0 ? (
          <p className="text-center text-sm text-[var(--muted)] py-6">
            Finalist shortlist table is currently unavailable.
          </p>
        ) : (
          <div className="overflow-x-auto bg-[var(--surface)] border border-[var(--border)] rounded-xl shadow-xs">
            <table className="min-w-full bg-[var(--surface)] border-collapse">
              <thead className="bg-[var(--primary)] text-white">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold">
                    S.No
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">
                    Team ID
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">
                    Team Name
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">
                    Leader
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">
                    Leader Email
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">
                    Theme
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">
                    Category
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {topFive.map((team, index) => {
                  const leader =
                    team.leader ??
                    team.members?.find((m) => m.isLeader) ??
                    team.members?.[0] ??
                    null;

                  return (
                    <tr
                      key={team.teamId ?? `${team.teamName}-${index}`}
                      className="hover:bg-[var(--surface-2)] transition-colors"
                    >
                      <td className="px-4 py-2.5 text-sm font-bold text-[var(--text)]">
                        {index + 1}
                      </td>
                      <td className="px-4 py-2.5 font-bold text-sm text-amber-500 whitespace-nowrap">
                        {team.teamId ?? "N/A"}
                      </td>
                      <td className="px-4 py-2.5 text-sm font-medium text-[var(--text)] whitespace-nowrap">
                        {team.teamName ?? "N/A"}
                      </td>
                      <td className="px-4 py-2.5 text-sm text-[var(--text)] whitespace-nowrap">
                        {leader?.name ?? "N/A"}
                      </td>
                      <td className="px-4 py-2.5 text-sm text-[var(--accent)] whitespace-nowrap">
                        {leader?.email ?? "N/A"}
                      </td>
                      <td className="px-4 py-2.5 text-sm text-[var(--muted)] whitespace-nowrap">
                        {team.theme ?? "N/A"}
                      </td>
                      <td className="px-4 py-2.5 text-sm text-[var(--muted)] whitespace-nowrap">
                        {CATEGORY_LABEL[team.category] ??
                          team.category ??
                          "N/A"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
};

export default ShortlistTable;
