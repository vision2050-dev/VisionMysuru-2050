import { useState, useEffect, useMemo, useCallback } from "react";
import api from "../utils/api";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { FiLogOut, FiFilter, FiDownload, FiSearch } from "react-icons/fi";
import * as XLSX from "xlsx";
import Stats from "../dashboard/Stats";
import SubmissionTable from "../dashboard/SubmissionTable";
import DetailModal from "../dashboard/DetailModal";
import { TOPIC_OPTIONS } from "../constants/content";
import {
  Skeleton,
  StatsSkeleton,
  FiltersSkeleton,
  TableSkeleton,
} from "../Components/SkeletonLoaders/Loaders";

let adminSubmissionsCache = null;
let adminSubmissionsInFlight = null;

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
  const [searchQuery, setSearchQuery] = useState("");
  const PAGE_SIZE = 30;
  const navigate = useNavigate();

  const fetchSubmissions = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("adminToken");
      if (!token) {
        navigate("/admin/secure/login");
        return;
      }

      if (adminSubmissionsCache) {
        setSubmissions(adminSubmissionsCache);
        return;
      }

      if (!adminSubmissionsInFlight) {
        adminSubmissionsInFlight = api
          .get("/api/v1/admin/submissions")
          .then(({ data }) => {
            adminSubmissionsCache = data;
            return data;
          })
          .finally(() => {
            adminSubmissionsInFlight = null;
          });
      }

      const data = await adminSubmissionsInFlight;
      setSubmissions(data);
    } catch (error) {
      console.error(error);
      if (error.response?.status === 401) {
        adminSubmissionsCache = null;
        localStorage.removeItem("adminToken");
        navigate("/admin/secure/login");
      } else {
        toast.error("Failed to load submissions");
      }
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchSubmissions();
  }, [fetchSubmissions]);

  // Download Excel for round 1 shortlisted teams
  // const handleExportExcel = () => {
  //   try {
  //     const sourceRows = submissions.filter(
  //       (sub) => sub.status === "round_1_shortlisted",
  //     );
  //     if (sourceRows.length === 0) {
  //       toast.error("No Round 1 shortlisted teams available to export");
  //       return;
  //     }

  //     const rows = sourceRows.map((sub) => {
  //       const leader = sub.members?.find((m) => m.isLeader);
  //       let org = "N/A";
  //       if (sub.category === "students") org = sub.institution || "N/A";
  //       else if (sub.category === "corporates") org = sub.companyName || "N/A";
  //       else if (sub.category === "ngos") org = sub.organizationName || "N/A";

  //       return {
  //         "Team ID": sub.teamId,
  //         "Team Name": sub.teamName,
  //         Theme: sub.theme || "N/A",
  //         "Idea Name": sub.solutionName || "N/A",
  //         "Idea Description": sub.shortDescription || "N/A",
  //         "PDF Link": sub.idea_document?.public_url || "N/A",
  //         "College / Organization": org,
  //         "Leader Name": leader?.name || "N/A",
  //         "Leader Email": leader?.email || "N/A",
  //         "Leader Contact Number": leader?.phone || "N/A",
  //         Status: sub.status || "N/A",
  //       };
  //     });

  //     const ws = XLSX.utils.json_to_sheet(rows);

  //     // Auto-fit column widths (capped at 50) and enable text wrap
  //     const maxColWidth = 50;
  //     const cols = Object.keys(rows[0] || {}).map((key) => {
  //       const maxLen = Math.max(
  //         key.length,
  //         ...rows.map((r) => String(r[key] || "").length),
  //       );
  //       return { wch: Math.min(maxLen + 2, maxColWidth) };
  //     });
  //     ws["!cols"] = cols;

  //     const range = XLSX.utils.decode_range(ws["!ref"]);
  //     for (let R = range.s.r; R <= range.e.r; R++) {
  //       for (let C = range.s.c; C <= range.e.c; C++) {
  //         const addr = XLSX.utils.encode_cell({ r: R, c: C });
  //         if (ws[addr]) {
  //           ws[addr].s = {
  //             ...(ws[addr].s || {}),
  //             alignment: { wrapText: true, vertical: "top" },
  //           };
  //         }
  //       }
  //     }

  //     const wb = XLSX.utils.book_new();
  //     XLSX.utils.book_append_sheet(wb, ws, "Round 1 Shortlist");
  //     XLSX.writeFile(wb, "round-1-shortlist.xlsx");
  //     toast.success("Round 1 shortlist Excel downloaded");
  //   } catch (error) {
  //     console.error(error);
  //     toast.error("Failed to export Excel");
  //   }
  // };

  // Handle logout
  const handleLogout = () => {
    adminSubmissionsCache = null;
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

      setSubmissions((prev) => {
        const next = prev.map((sub) =>
          sub._id === id ? { ...sub, status } : sub,
        );
        adminSubmissionsCache = next;
        return next;
      });

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
    const normalizedSearch = searchQuery.trim().toLowerCase();

    return submissions.filter((sub) => {
      const matchesCategory =
        filters.category === "All" || sub.category === filters.category;
      const matchesTheme =
        filters.theme === "All" || sub.theme === filters.theme;
      const matchesStatus =
        filters.status === "All" || sub.status === filters.status;
      const matchesSearch =
        normalizedSearch.length === 0 ||
        String(sub.teamId || "")
          .toLowerCase()
          .includes(normalizedSearch) ||
        String(sub.teamName || "")
          .toLowerCase()
          .includes(normalizedSearch);

      return matchesCategory && matchesTheme && matchesStatus && matchesSearch;
    });
  }, [submissions, filters, searchQuery]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filters, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredData.length / PAGE_SIZE));
  const paginatedData = filteredData.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  if (loading)
    return (
      <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] dm-sans">
        <header className="border-b border-[var(--border)] bg-[var(--surface)] px-6 py-4">
          <Skeleton />
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

      <main className="py-4 px-2 space-y-2">
        <Stats submissions={submissions} />
        <div className="items-center justify-center flex">
          {/* <button
            onClick={handleExportExcel}
            className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 transition"
          >
            <FiDownload /> Download Round 1 Shortlist Excel
          </button> */}
        </div>

        <section className="flex mb-6 justify-center gap-4 pt-4 flex-wrap ">
          <div className="flex flex-wrap gap-2">
            <div className="relative">
              <FiSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search Team ID or Team Name"
                className="w-64 rounded-lg border-2 border-[var(--border)] bg-[var(--bg)] py-2 pl-9 pr-3 text-sm outline-none focus:border-[var(--accent)]"
              />
            </div>

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
              <option value="Pending">Pending</option>
              <option value="round_1_shortlisted">Round 1 Shortlisted</option>
              <option value="round_2_shortlisted">Round 2 Shortlisted</option>
              <option value="track_2_shortlisted">Track 2 Shortlisted</option>
              <option value="round_3_shortlisted">Round 3 Shortlisted</option>
              <option value="grand_finale_shortlisted">
                Grand Finale Shortlisted
              </option>
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
