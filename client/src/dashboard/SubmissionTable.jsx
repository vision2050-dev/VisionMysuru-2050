import React from "react";
import { FiEye } from "react-icons/fi";

const STATUS_COLORS = {
  Pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
  screening_shortlisted: "bg-blue-100 text-blue-800 border-blue-200",
  screening_rejected: "bg-red-100 text-red-800 border-red-200",
  r1_shortlisted: "bg-indigo-100 text-indigo-800 border-indigo-200",
  r1_eliminated: "bg-red-100 text-red-800 border-red-200",
  r2_eliminated: "bg-red-100 text-red-800 border-red-200",
  finalist: "bg-purple-100 text-purple-800 border-purple-200",
  winner: "bg-emerald-100 text-emerald-800 border-emerald-200",
};

const SubmissionTable = ({ submissions, onView }) => {
  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)]">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-[var(--accent)]/80 text-white">
            <tr>
              <th className="px-6 py-4 font-semibold">Team ID</th>
              <th className="px-6 py-4 font-semibold">Team Name</th>
              <th className="px-6 py-4 font-semibold">Category</th>
              <th className="px-6 py-4 font-semibold">Org /College /Company</th>
              <th className="px-6 py-4 font-semibold">Project</th>
              <th className="px-6 py-4 font-semibold">Theme</th>
              <th className="px-6 py-4 font-semibold">Status</th>
              <th className="px-6 py-4 font-semibold text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)]">
            {submissions.map((sub) => (
              <tr
                key={sub._id}
                className="hover:bg-[var(--surface-2)] transition-colors"
              >
                <td className="px-6 py-4 font-bold text-sm ">{sub.teamId}</td>
                <td className="px-6 py-4 font-medium text-sm ">
                  {sub.teamName}
                </td>
                <td className="px-6 py-4">
                  <span className="inline-flex  px-2.5 py-0.5 text-sm font-medium text-[var(--text)] ">
                    {sub.category.toUpperCase()}
                  </span>
                </td>
                <td className="px-6 py-4 font-semibold text-black">
                  {sub.organizationName}
                  {sub.category === "students" && sub.institution && (
                    <div>{sub.institution}</div>
                  )}
                  {sub.category === "corporates" && sub.companyName && (
                    <div>{sub.companyName}</div>
                  )}
                </td>
                <td className="px-6 py-4 text-[var(--text)]">
                  <div className="font-semibold">{sub.solutionName}</div>
                </td>
                <td
                  className="px-6 py-4 text-black font-semibold max-w-xs truncate"
                  title={sub.theme}
                >
                  {sub.theme}
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold border ${
                      STATUS_COLORS[sub.status] || "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {sub.status.replace("_", " ").toUpperCase()}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <button
                    onClick={() => onView(sub)}
                    className="inline-flex items-center gap-1 rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-1.5 text-xs font-semibold text-[var(--text)] hover:bg-[var(--surface-2)] transition-colors"
                  >
                    <FiEye /> View
                  </button>
                </td>
              </tr>
            ))}
            {submissions.length === 0 && (
              <tr>
                <td
                  colSpan="8"
                  className="px-6 py-12 text-center text-[var(--muted)]"
                >
                  No submissions found matching your filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SubmissionTable;
