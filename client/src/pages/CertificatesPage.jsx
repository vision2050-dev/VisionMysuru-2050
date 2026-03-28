import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { FiArrowLeft, FiExternalLink, FiLink } from "react-icons/fi";
import { CERTIFICATE_LINKS, normalizeTeamId } from "../constants/certificates";

const CertificatesPage = () => {
  const [teamId, setTeamId] = useState("");
  const [queriedTeamId, setQueriedTeamId] = useState("");

  const normalizedQuery = useMemo(
    () => normalizeTeamId(queriedTeamId),
    [queriedTeamId],
  );

  const certificateLink = normalizedQuery
    ? CERTIFICATE_LINKS[normalizedQuery]
    : null;

  const handleSearch = (event) => {
    event.preventDefault();

    const normalizedInput = normalizeTeamId(teamId);
    if (!normalizedInput) {
      toast.error("Please enter a team ID.");
      return;
    }

    setQueriedTeamId(normalizedInput);
  };

  const handleCopyLink = async () => {
    if (!certificateLink) {
      return;
    }

    try {
      await navigator.clipboard.writeText(certificateLink);
      toast.success("Drive link copied.");
    } catch {
      toast.error("Unable to copy link. Please copy it manually.");
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg)] px-4 py-12 sm:px-6">
      <div className="mx-auto w-full max-w-3xl bg-[var(--surface)] p-4 sm:p-10">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm font-medium text-[var(--muted)] transition-colors hover:text-[var(--primary)]"
        >
          <FiArrowLeft className="h-4 w-4" />
          Back to Home
        </Link>

        <h1 className="mt-6 oswald text-4xl leading-tight text-[var(--text)] sm:text-5xl">
          Certificate Download
        </h1>
        <p className="mt-3 dm-sans text-base text-[var(--muted)]">
          Enter your Team ID to get the official Google Drive folder link for
          your certificate.
        </p>

        <form onSubmit={handleSearch} className="mt-8 space-y-4">
          <label
            htmlFor="team-id"
            className="block dm-sans text-sm font-medium"
          >
            Team ID
          </label>
          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              id="team-id"
              type="text"
              value={teamId}
              onChange={(event) => setTeamId(event.target.value.toUpperCase())}
              placeholder="Example: ST-0A2DD9"
              autoComplete="off"
              className="w-full rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-base outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--focus)]"
            />
            <button
              type="submit"
              className="rounded-xl bg-[var(--primary)] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[var(--primary-hover)] focus:outline-none focus:ring-2 focus:ring-[var(--focus)]"
            >
              Search
            </button>
          </div>
        </form>

        {normalizedQuery ? (
          certificateLink ? (
            <div className="mt-8 rounded-2xl border border-green-200 bg-green-50 p-5">
              <p className="dm-sans text-sm font-medium text-green-800">
                Team ID found: {normalizedQuery}
              </p>
              <a
                href={certificateLink}
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-flex items-center gap-2 rounded-xl bg-green-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-green-800"
              >
                Open Drive Folder
                <FiExternalLink className="h-4 w-4" />
              </a>

              <button
                type="button"
                onClick={handleCopyLink}
                className="mt-3 ml-0 inline-flex items-center gap-2 rounded-xl border border-green-300 bg-white px-4 py-2.5 text-sm font-semibold text-green-800 transition hover:bg-green-100 sm:ml-3"
              >
                Copy Link
                <FiLink className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="mt-8 rounded-2xl border border-red-200 bg-red-50 p-5">
              <p className="dm-sans text-sm font-medium text-red-700">
                No certificate link found for Team ID: {normalizedQuery}
              </p>
              <p className="mt-1 dm-sans text-sm text-red-600">
                Please check the Team ID and try again.
              </p>
            </div>
          )
        ) : null}
      </div>
    </div>
  );
};

export default CertificatesPage;
