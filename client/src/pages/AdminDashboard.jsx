import { useState, useEffect, useMemo } from "react";
import api from "../utils/api";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { FiLogOut, FiFilter, FiDownload } from "react-icons/fi";
import * as XLSX from "xlsx";
import Stats from "../dashboard/Stats";
import SubmissionTable from "../dashboard/SubmissionTable";
import DetailModal from "../dashboard/DetailModal";
import { TOPIC_OPTIONS } from "../constants/content";

const Skeleton = ({ className = "" }) => (
  <div
    className={`animate-pulse rounded-md bg-[var(--border)]/60 ${className}`}
    aria-hidden="true"
  />
);

const StatsSkeleton = () => (
  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
    {Array.from({ length: 3 }).map((_, i) => (
      <div
        key={i}
        className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4"
      >
        <Skeleton className="h-10 w-24 mb-2" />
        <Skeleton className="h-10 w-16" />
      </div>
    ))}
  </div>
);

const FiltersSkeleton = () => (
  <div className="flex flex-wrap items-center gap-3">
    {Array.from({ length: 4 }).map((_, i) => (
      <Skeleton key={i} className="h-8 w-42 rounded-lg" />
    ))}
  </div>
);

const TableSkeleton = () => (
  <div className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)]">
    <div className="space-y-4 p-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="grid grid-cols-7 gap-4">
          {Array.from({ length: 7 }).map((__, j) => (
            <Skeleton key={j} className="h-8 w-full" />
          ))}
        </div>
      ))}
    </div>
  </div>
);

const AdminDashboard = () => {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    category: "All",
    theme: "All",
    status: "All",
  });
  const [updating, setUpdating] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 30;
  const navigate = useNavigate();

  // Fetch data
  const fetchSubmissions = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("adminToken");
      if (!token) {
        navigate("/admin/login");
        return;
      }

      const { data } = await api.get("/api/v1/admin/submissions");
      setSubmissions(data);
    } catch (error) {
      console.error(error);
      if (error.response?.status === 401) {
        localStorage.removeItem("adminToken");
        navigate("/admin/login");
      } else {
        toast.error("Failed to load submissions");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubmissions();
  }, []);

  // Download Excel (from already-loaded data)
  const handleExportExcel = () => {
    try {
      const rows = submissions.map((sub) => {
        const leader = sub.members?.find((m) => m.isLeader);
        let org = "N/A";
        if (sub.category === "students") org = sub.institution || "N/A";
        else if (sub.category === "corporates") org = sub.companyName || "N/A";
        else if (sub.category === "ngos") org = sub.organizationName || "N/A";

        return {
          "Leader Email": leader?.email || "N/A",
          "Team Name": sub.teamName,
          "Team ID": sub.teamId,
          Category: sub.category,
          "Project Title": sub.solutionName,
          "College / Organization": org,
          "Leader Contact Number": leader?.phone || "N/A",
        };
      });

      const ws = XLSX.utils.json_to_sheet(rows);

      // Auto-fit column widths (capped at 50) and enable text wrap
      const maxColWidth = 50;
      const cols = Object.keys(rows[0] || {}).map((key) => {
        const maxLen = Math.max(
          key.length,
          ...rows.map((r) => String(r[key] || "").length),
        );
        return { wch: Math.min(maxLen + 2, maxColWidth) };
      });
      ws["!cols"] = cols;

      const range = XLSX.utils.decode_range(ws["!ref"]);
      for (let R = range.s.r; R <= range.e.r; R++) {
        for (let C = range.s.c; C <= range.e.c; C++) {
          const addr = XLSX.utils.encode_cell({ r: R, c: C });
          if (ws[addr]) {
            ws[addr].s = {
              ...(ws[addr].s || {}),
              alignment: { wrapText: true, vertical: "top" },
            };
          }
        }
      }

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Submissions");
      XLSX.writeFile(wb, "submissions.xlsx");
      toast.success("Excel downloaded successfully");
    } catch (error) {
      console.error(error);
      toast.error("Failed to export Excel");
    }
  };

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminUser");
    navigate("/admin/login");
  };

  // Update status
  const updateStatus = async (id, status, category) => {
    try {
      setUpdating(true);
      await api.patch(`/api/v1/admin/submissions/${id}/status`, {
        status,
        category,
      });

      setSubmissions((prev) =>
        prev.map((sub) => (sub._id === id ? { ...sub, status } : sub)),
      );

      // Update selected submission if open
      if (selectedSubmission?._id === id) {
        setSelectedSubmission((prev) => ({ ...prev, status }));
      }

      toast.success(`Status updated to ${status}`);
      setUpdating(false);
    } catch (error) {
      toast.error("Failed to update status", error.message);
    }
  };

  const filteredData = useMemo(() => {
    return submissions.filter((sub) => {
      const matchesCategory =
        filters.category === "All" || sub.category === filters.category;
      const matchesTheme =
        filters.theme === "All" || sub.theme === filters.theme;
      const matchesStatus =
        filters.status === "All" || sub.status === filters.status;

      return matchesCategory && matchesTheme && matchesStatus;
    });
  }, [submissions, filters]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  const totalPages = Math.max(1, Math.ceil(filteredData.length / PAGE_SIZE));
  const paginatedData = filteredData.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  if (loading)
    return (
      <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] dm-sans">
        <header className="border-b border-[var(--border)] bg-[var(--surface)] px-6 py-4">
          <Skeleton className="h-10 w-48 mb-2" />
        </header>

        <main className="mx-auto max-w-7xl space-y-6 mt-4">
          <StatsSkeleton />
          <FiltersSkeleton />
          <TableSkeleton />
        </main>
      </div>
    );

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] dm-sans">
      <header className="sticky top-0 z-30 border-b border-[var(--border)] bg-[var(--surface)]/80 backdrop-blur-md">
        <div className="mx-auto flex  items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div>
            <h1 className="text-xl font-bold text-[var(--text)]">
              Admin Dashboard
            </h1>
            <p className="text-xs text-[var(--muted)]">
              Overview of all submissions
            </p>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 rounded-lg bg-red-50 px-4 py-2 text-sm font-semibold text-white hover:bg-red-100 dark:bg-red-800 "
            >
              <FiLogOut /> Logout
            </button>
          </div>
        </div>
      </header>

      <main className="py-6 px-4 space-y-2">
        <Stats submissions={submissions} />
        <div className="items-center justify-center flex">
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 transition"
          >
            <FiDownload /> Export Excel
          </button>
        </div>

        <section className="flex flex-col gap-4 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <FiFilter className="text-[var(--muted)]" />

            <select
              value={filters.category}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, category: e.target.value }))
              }
              className="rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
            >
              <option value="All">All Categories</option>
              <option value="students">Students</option>
              <option value="corporates">Corporates</option>
              <option value="ngos">NGOs</option>
              <option value="citizens">Citizens</option>
            </select>

            <select
              value={filters.theme}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, theme: e.target.value }))
              }
              className="rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
            >
              <option value="All">All Themes</option>
              {TOPIC_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>

            <select
              value={filters.status}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, status: e.target.value }))
              }
              className="rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
            >
              <option value="All">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="screening_shortlisted">
                Screening-Shortlisted
              </option>
              <option value="screening_rejected">Screening-Rejected</option>
              <option value="r1_shortlisted">R1 Shortlisted</option>
              <option value="r1_eliminated">R1 Eliminated</option>
              <option value="r2_eliminated">R2 Eliminated</option>
              <option value="finalist">Finalist</option>
              <option value="winner">Winner</option>
            </select>
            <div className=" border border-[var(--border)]  px-4 py-1 rounded-md">
              <p>
                Showing{" "}
                <span className="font-bold text-sm ">
                  {paginatedData.length}
                </span>{" "}
                of{" "}
                <span className="font-bold text-sm ">
                  {filteredData.length}
                </span>
              </p>
            </div>
          </div>
        </section>

        <SubmissionTable
          submissions={paginatedData}
          onView={setSelectedSubmission}
        />

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 py-4">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="rounded-lg border border-[var(--border)] bg-[var(--bg)] px-4 py-1 text-sm font-semibold disabled:opacity-40 hover:bg-[var(--surface-2)] transition-colors"
            >
              Prev
            </button>
            <span className="text-sm text-[var(--muted)]">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="rounded-lg border border-[var(--border)] bg-[var(--bg)]  px-4 py-1 text-sm font-semibold disabled:opacity-40 hover:bg-[var(--surface-2)] transition-colors"
            >
              Next
            </button>
          </div>
        )}
      </main>

      {selectedSubmission && (
        <DetailModal
          submission={selectedSubmission}
          onClose={() => setSelectedSubmission(null)}
          onUpdateStatus={updateStatus}
          updating={updating}
        />
      )}
    </div>
  );
};

export default AdminDashboard;
