import React from "react";

const StatCard = ({ title, count, color, isTotal }) => (
  <div
    className={`rounded-2xl p-4 transition-all  duration-300 ${
      isTotal
        ? "bg-[var(--primary)]/15 border-y-4 border border-[var(--primary)]  transform hover:-translate-y-1"
        : `bg-[var(--surface)] border-y-4 border-[var(--border)] border ${color} `
    }`}
  >
    <div className="flex items-center justify-between">
      <div>
        <p
          className={`text-sm font-medium ${
            isTotal ? "text-black/60" : "text-[var(--muted)]"
          }`}
        >
          {title}
        </p>
        <p
          className={`mt-2 text-3xl font-bold ${
            isTotal ? "text-black/80" : "text-[var(--text)]"
          }`}
        >
          {count}
        </p>
      </div>
    </div>
  </div>
);

const Stats = ({ submissions }) => {
  const total = submissions.length;
  const byCategory = submissions.reduce((acc, curr) => {
    acc[curr.category] = (acc[curr.category] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="grid gap-2 justify-center max-w-5xl mx-auto grid-cols-2 md:grid-cols-5">
      <StatCard title="Total Submissions" count={317} isTotal />
      <StatCard
        title="After initial review"
        count={total}
        color="border-yellow-500"
      />
      <StatCard
        title="Students"
        count={byCategory["students"] || 0}
        color="border-purple-500"
      />
      <StatCard
        title="Corporates"
        count={byCategory["corporates"] || 0}
        color="border-emerald-500"
      />
      <StatCard
        title="NGOs"
        count={byCategory["ngos"] || 0}
        color="border-orange-500"
      />
      <StatCard
        title="Citizens"
        count={byCategory["citizens"] || 0}
        color="border-sky-500"
      />
    </div>
  );
};

export default Stats;
