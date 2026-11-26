import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-hot-toast";
import {
  FiVideo,
  FiFileText,
  FiUsers,
  FiPlus,
  FiTrash2,
  FiCheck,
  FiCheckCircle,
  FiArrowLeft,
  FiUploadCloud,
  FiLogOut,
  FiExternalLink,
  FiClock,
  FiCompass,
  FiAlertCircle,
  FiEye,
  FiDownload,
  FiKey,
  FiLock,
  FiX,
} from "react-icons/fi";
import { TOPIC_OPTIONS, CATEGORY } from "../constants/content";
import api from "../utils/api";
import {
  clientRegisterSubmission,
  clientUpdateSubmissionMedia,
  getStoredSubmissions,
  syncSubmissionFilesToCloudDrive,
  autoRecoverDriveMedia,
  getDriveFileId,
  resolveSubmissionMedia,
  sanitizeSubmissionForStorage,
  mergeSubmissions,
  storeMediaBlob,
  getMediaBlobUrl,
  clientResetParticipantPassword,
  syncCloudPortalState,
} from "../services/juryzaStorage";
import FooterSection from "../Components/FooterSection";
import ThemeToggle from "../Components/ThemeToggle";

const CATEGORY_TABS = [
  { key: CATEGORY.STUDENT, label: "Students", code: "ST", desc: "UG & PG college innovators" },
  { key: CATEGORY.CITIZENS, label: "Citizens", code: "CT", desc: "Individuals & civic groups" },
  { key: CATEGORY.CORPORATE, label: "Corporates", code: "CO", desc: "Startups, MSMEs & enterprises" },
  { key: CATEGORY.NGO, label: "NGOs", code: "NG", desc: "Civil society & RWAs" },
];

export const ParticipantPortal = () => {
  const navigate = useNavigate();
  const [currentUserEmail, setCurrentUserEmail] = useState("");
  const [currentUserName, setCurrentUserName] = useState("");

  const [loading, setLoading] = useState(true);
  const [hasRegistered, setHasRegistered] = useState(false);
  const [mySubmission, setMySubmission] = useState(null);

  // Registration Form State
  const [activeCategory, setActiveCategory] = useState(CATEGORY.STUDENT);
  const [submitting, setSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState("");

  // Files & Link Submission State (Both Pitch Video and Proposal PDF are encouraged)
  const [videoSubmissionType, setVideoSubmissionType] = useState("link"); // "link" (recommended) | "file"
  const [videoDriveUrl, setVideoDriveUrl] = useState("");
  const [videoDriveError, setVideoDriveError] = useState("");
  const [videoFile, setVideoFile] = useState(null);
  const [videoLocalPreview, setVideoLocalPreview] = useState(null);
  const [docSubmissionType, setDocSubmissionType] = useState("file"); // "file" | "link"
  const [docDriveUrl, setDocDriveUrl] = useState("");
  const [docDriveError, setDocDriveError] = useState("");
  const [documentFile, setDocumentFile] = useState(null);
  const [documentLocalPreview, setDocumentLocalPreview] = useState(null);

  // Media Update Modal States for Registered Participants
  const [showMediaUpdateModal, setShowMediaUpdateModal] = useState(false);
  const [mediaUpdateTarget, setMediaUpdateTarget] = useState("both"); // "both" | "video" | "doc"
  const [updateVideoType, setUpdateVideoType] = useState("link");
  const [updateVideoDriveUrl, setUpdateVideoDriveUrl] = useState("");
  const [updateVideoDriveError, setUpdateVideoDriveError] = useState("");
  const [updateVideoFile, setUpdateVideoFile] = useState(null);
  const [updateVideoLocalPreview, setUpdateVideoLocalPreview] = useState(null);
  const [updateDocType, setUpdateDocType] = useState("file");
  const [updateDocDriveUrl, setUpdateDocDriveUrl] = useState("");
  const [updateDocDriveError, setUpdateDocDriveError] = useState("");
  const [updateDocFile, setUpdateDocFile] = useState(null);
  const [updateDocLocalPreview, setUpdateDocLocalPreview] = useState(null);
  const [mediaUpdating, setMediaUpdating] = useState(false);
  const [mediaUpdateProgress, setMediaUpdateProgress] = useState(0);

  // Dedicated Registration Confirmed Modal State
  const [showConfirmedModal, setShowConfirmedModal] = useState(false);
  const [confirmedTeamData, setConfirmedTeamData] = useState(null);

  const [formData, setFormData] = useState({
    teamName: "",
    city: "Mysuru",
    theme: TOPIC_OPTIONS[0],
    solutionName: "",
    shortDescription: "",
    detailedProposal: "",
    institution: "",
    department: "",
    companyName: "",
    organizationName: "",
  });

  const [members, setMembers] = useState([
    { name: "", email: "", phone: "", isLeader: true, college: "", department: "" },
  ]);

  // Reset Password Modal states
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetNewPassword, setResetNewPassword] = useState("");
  const [resetConfirmPassword, setResetConfirmPassword] = useState("");
  const [resetLoading, setResetLoading] = useState(false);

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!resetNewPassword || resetNewPassword.length < 8) {
      toast.error("New password must be at least 8 characters long.");
      return;
    }
    if (resetNewPassword !== resetConfirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }
    setResetLoading(true);
    try {
      try {
        await api.post("/api/v2/auth/participant/reset-password", {
          email: currentUserEmail,
          newPassword: resetNewPassword,
        });
      } catch {
        await clientResetParticipantPassword({
          email: currentUserEmail,
          newPassword: resetNewPassword,
        });
      }
      toast.success("Password updated successfully!");
      setShowResetModal(false);
      setResetNewPassword("");
      setResetConfirmPassword("");
    } catch (err) {
      toast.error(err.message || "Failed to update password.");
    } finally {
      setResetLoading(false);
    }
  };

  // Check auth and fetch submission on mount
  useEffect(() => {
    const token =
      localStorage.getItem("juryzaParticipantToken") ||
      (localStorage.getItem("juryzaRole") === "participant" ? localStorage.getItem("juryzaToken") : null);
    const email =
      localStorage.getItem("juryzaParticipantEmail") ||
      (localStorage.getItem("juryzaRole") === "participant" ? localStorage.getItem("juryzaEmail") : null);
    const name =
      localStorage.getItem("juryzaParticipantName") ||
      (localStorage.getItem("juryzaRole") === "participant" ? localStorage.getItem("juryzaName") : null);

    if (!token || !email) {
      toast("Please sign in to access the participant submission portal.");
      navigate("/register");
      return;
    }

    setCurrentUserEmail(email);
    setCurrentUserName(name || "Participant");

    // Pre-fill leader email
    setMembers((prev) => [
      {
        ...prev[0],
        name: name || prev[0].name,
        email: email,
      },
      ...prev.slice(1),
    ]);

    fetchParticipantSubmission(email);
  }, [navigate]);

  // Warn if user attempts to close or reload tab while upload is actively in progress
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (submitting) {
        e.preventDefault();
        e.returnValue = "Upload in progress! Closing this tab will cancel your submission.";
        return e.returnValue;
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [submitting]);

  const hydrateSubmissionBlobs = async (sub, cleanEmail) => {
    const cleanSub = sanitizeSubmissionForStorage(sub);
    let hasVerifiedBlob = false;
    try {
      const storedBlobUrl =
        (await getMediaBlobUrl(`video_${cleanSub.teamId}`)) ||
        (await getMediaBlobUrl(`participant_video_${cleanEmail}`));
      if (storedBlobUrl) {
        cleanSub.videoBlobUrl = storedBlobUrl;
        hasVerifiedBlob = true;
      }

      const storedDocBlob =
        (await getMediaBlobUrl(`doc_${cleanSub.teamId}`)) ||
        (await getMediaBlobUrl(`participant_doc_${cleanEmail}`));
      if (storedDocBlob) {
        cleanSub.docBlobUrl = storedDocBlob;
        hasVerifiedBlob = true;
      }
    } catch (e) {
      console.warn("IndexedDB load note:", e);
    }
    if (hasVerifiedBlob) {
      cleanSub._blobsVerified = true;
    }
    return cleanSub;
  };

  const fetchParticipantSubmission = async (email) => {
    const clean = (email || "").toLowerCase().trim();
    try {
      setLoading(true);
      const res = await api.get(`/api/v2/participant/my-submission?email=${encodeURIComponent(email)}`);
      if (res.data?.hasRegistered && res.data?.submission) {
        const sub = await hydrateSubmissionBlobs(res.data.submission, clean);
        setHasRegistered(true);
        setMySubmission(sub);
        setLoading(false);
        return;
      }
    } catch (err) {
      console.warn("Could not load participant submission from backend, checking local storage:", err.message);
    }

    // Local + cloud sync fallback
    let subs = getStoredSubmissions();
    try {
      const synced = await syncCloudPortalState();
      if (synced?.submissions) {
        subs = mergeSubmissions(subs, synced.submissions);
      }
    } catch (syncErr) {
      console.warn("Cloud sync on participant load:", syncErr.message);
    }

    const mySub = subs.find(
      (s) =>
        (s.participantEmail || "").toLowerCase() === clean ||
        (s.members || []).some((m) => (m.email || "").toLowerCase() === clean),
    );

    if (mySub) {
      setHasRegistered(true);
      const hydrated = await hydrateSubmissionBlobs(mySub, clean);
      setMySubmission(hydrated);
      autoRecoverDriveMedia(hydrated, clean).catch(() => {});
    } else {
      setHasRegistered(false);
    }
    setLoading(false);
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Google Drive Pitch Video Link Handler with YouTube detection
  const handleDriveUrlChange = (val) => {
    setVideoDriveUrl(val);
    const trimmed = (val || "").trim();
    if (!trimmed) {
      setVideoDriveError("");
      return;
    }

    if (/youtube\.com/i.test(trimmed) || /youtu\.be/i.test(trimmed)) {
      setVideoDriveError("YouTube links are strictly not allowed. Please upload your video to Google Drive and provide a Google Drive link.");
      return;
    }

    if (!trimmed.includes("drive.google.com")) {
      setVideoDriveError("Please enter a valid Google Drive link (e.g. https://drive.google.com/file/d/.../view).");
      return;
    }

    setVideoDriveError("");
  };

  // 1. Pitch Video File (.mp4 strictly <= 25 MB for direct browser upload)
  const handleVideoFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isMp4 = file.type === "video/mp4" || file.name.toLowerCase().endsWith(".mp4");
    if (!isMp4) {
      toast.error("Pitch video must strictly be an .mp4 file.");
      e.target.value = "";
      return;
    }

    if (file.size > 25 * 1024 * 1024) {
      toast.error(
        `Video size is ${(file.size / (1024 * 1024)).toFixed(1)} MB. Direct file uploads are limited to 25 MB to prevent network timeouts. Please switch to the "Google Drive Link" option to submit videos of any size!`,
        { duration: 6000 }
      );
      e.target.value = "";
      return;
    }

    setVideoFile(file);
    if (videoLocalPreview) {
      URL.revokeObjectURL(videoLocalPreview);
    }
    const previewUrl = URL.createObjectURL(file);
    setVideoLocalPreview(previewUrl);
    
    // Cache in IndexedDB for resilience
    if (currentUserEmail) {
      storeMediaBlob(`temp_video_${currentUserEmail.toLowerCase().trim()}`, file);
    }
    toast.success(`Pitch video selected: ${file.name} (${(file.size / (1024 * 1024)).toFixed(1)} MB)`);
  };

  // 2. Proposal Document File (.pdf strictly <= 5 MB)
  const handleDocumentFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
    if (!isPdf) {
      toast.error("Proposal document must strictly be a .pdf file.");
      e.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error(
        `PDF proposal exceeds 5 MB limit (${(file.size / (1024 * 1024)).toFixed(1)} MB). Maximum allowed is 5 MB.`,
      );
      e.target.value = "";
      return;
    }

    setDocumentFile(file);
    if (documentLocalPreview) {
      URL.revokeObjectURL(documentLocalPreview);
    }
    const previewUrl = URL.createObjectURL(file);
    setDocumentLocalPreview(previewUrl);

    // Cache in IndexedDB for resilience
    if (currentUserEmail) {
      storeMediaBlob(`temp_doc_${currentUserEmail.toLowerCase().trim()}`, file);
    }
    toast.success(`Proposal PDF selected: ${file.name} (${(file.size / (1024 * 1024)).toFixed(1)} MB)`);
  };

  // Google Drive Proposal Document Link Handler with YouTube detection
  const handleDocDriveUrlChange = (val) => {
    setDocDriveUrl(val);
    const trimmed = (val || "").trim();
    if (!trimmed) {
      setDocDriveError("");
      return;
    }

    if (/youtube\.com/i.test(trimmed) || /youtu\.be/i.test(trimmed)) {
      setDocDriveError("YouTube links cannot be used for documents. Please upload your document to Google Drive and provide a Google Drive link.");
      return;
    }

    if (!trimmed.includes("drive.google.com")) {
      setDocDriveError("Please enter a valid Google Drive link (e.g. https://drive.google.com/file/d/.../view).");
      return;
    }

    setDocDriveError("");
  };

  // Open Media Update Modal for registered participants
  const openMediaUpdateModal = (target = "both") => {
    setMediaUpdateTarget(target);
    const { video: resolvedVideo, document: resolvedDoc } = resolveSubmissionMedia(
      mySubmission,
      api.defaults.baseURL,
    );

    if (resolvedVideo.type === "drive") {
      setUpdateVideoType("link");
      setUpdateVideoDriveUrl(mySubmission?.video?.url || "");
    } else {
      setUpdateVideoType("link");
      setUpdateVideoDriveUrl("");
    }
    setUpdateVideoFile(null);
    if (updateVideoLocalPreview) {
      URL.revokeObjectURL(updateVideoLocalPreview);
    }
    setUpdateVideoLocalPreview(null);
    setUpdateVideoDriveError("");

    if (resolvedDoc.type === "drive") {
      setUpdateDocType("link");
      setUpdateDocDriveUrl(mySubmission?.document?.url || "");
    } else {
      setUpdateDocType("file");
      setUpdateDocDriveUrl("");
    }
    setUpdateDocFile(null);
    if (updateDocLocalPreview) {
      URL.revokeObjectURL(updateDocLocalPreview);
    }
    setUpdateDocLocalPreview(null);
    setUpdateDocDriveError("");

    setShowMediaUpdateModal(true);
  };

  const handleUpdateVideoFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isMp4 = file.type === "video/mp4" || file.name.toLowerCase().endsWith(".mp4");
    if (!isMp4) {
      toast.error("Pitch video must strictly be an .mp4 file.");
      e.target.value = "";
      return;
    }

    if (file.size > 25 * 1024 * 1024) {
      toast.error(
        `Video size is ${(file.size / (1024 * 1024)).toFixed(1)} MB. Direct file uploads are limited to 25 MB to prevent network timeouts. Please switch to the "Google Drive Link" option to submit videos of any size!`,
        { duration: 6000 }
      );
      e.target.value = "";
      return;
    }

    setUpdateVideoFile(file);
    if (updateVideoLocalPreview) {
      URL.revokeObjectURL(updateVideoLocalPreview);
    }
    setUpdateVideoLocalPreview(URL.createObjectURL(file));
  };

  const handleUpdateDocFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
    if (!isPdf) {
      toast.error("Proposal document must strictly be a .pdf file.");
      e.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error(
        `PDF proposal exceeds 5 MB limit (${(file.size / (1024 * 1024)).toFixed(1)} MB). Maximum allowed is 5 MB.`,
      );
      e.target.value = "";
      return;
    }

    setUpdateDocFile(file);
    if (updateDocLocalPreview) {
      URL.revokeObjectURL(updateDocLocalPreview);
    }
    setUpdateDocLocalPreview(URL.createObjectURL(file));
  };

  const handleMediaUpdateSubmit = async (e) => {
    e.preventDefault();
    if (!mySubmission) return;

    const trimmedVideoUrl = updateVideoDriveUrl.trim();
    const trimmedDocUrl = updateDocDriveUrl.trim();

    const hasNewVideoLink = updateVideoType === "link" && Boolean(trimmedVideoUrl);
    const hasNewVideoFile = updateVideoType === "file" && Boolean(updateVideoFile);
    const hasNewDocLink = updateDocType === "link" && Boolean(trimmedDocUrl);
    const hasNewDocFile = updateDocType === "file" && Boolean(updateDocFile);

    if (hasNewVideoLink) {
      if (/youtube\.com/i.test(trimmedVideoUrl) || /youtu\.be/i.test(trimmedVideoUrl)) {
        toast.error("YouTube links are strictly not allowed for pitch video.");
        return;
      }
      if (!trimmedVideoUrl.includes("drive.google.com")) {
        toast.error("Pitch video must be a valid Google Drive link.");
        return;
      }
    }

    if (hasNewDocLink) {
      if (/youtube\.com/i.test(trimmedDocUrl) || /youtu\.be/i.test(trimmedDocUrl)) {
        toast.error("YouTube links cannot be used for proposal document.");
        return;
      }
      if (!trimmedDocUrl.includes("drive.google.com")) {
        toast.error("Proposal document must be a valid Google Drive link.");
        return;
      }
    }

    if (!hasNewVideoLink && !hasNewVideoFile && !hasNewDocLink && !hasNewDocFile) {
      toast.error("Please provide at least one new file or Google Drive link to update.");
      return;
    }

    setMediaUpdating(true);
    setMediaUpdateProgress(15);

    const updateFormData = new FormData();
    updateFormData.append("teamId", mySubmission.teamId);
    if (currentUserEmail) {
      updateFormData.append("email", currentUserEmail);
    }
    if (hasNewVideoLink) {
      updateFormData.append("videoDriveUrl", trimmedVideoUrl);
    } else if (hasNewVideoFile) {
      updateFormData.append("videoFile", updateVideoFile);
    }
    if (hasNewDocLink) {
      updateFormData.append("documentDriveUrl", trimmedDocUrl);
    } else if (hasNewDocFile) {
      updateFormData.append("documentFile", updateDocFile);
    }

    try {
      const res = await api.put("/api/v2/participant/submission/media", updateFormData, {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 600000,
        onUploadProgress: (progressEvent) => {
          const percent = Math.round((progressEvent.loaded * 100) / (progressEvent.total || 1));
          setMediaUpdateProgress(Math.min(percent, 90));
        },
      });

      const updated = res.data?.submission || mySubmission;

      // Store local blobs for instant local preview
      if (hasNewVideoFile) {
        await storeMediaBlob(`video_${mySubmission.teamId}`, updateVideoFile);
        if (currentUserEmail) {
          await storeMediaBlob(`participant_video_${currentUserEmail.toLowerCase().trim()}`, updateVideoFile);
        }
        updated.videoBlobUrl = URL.createObjectURL(updateVideoFile);
        updated._blobsVerified = true;
      }
      if (hasNewDocFile) {
        await storeMediaBlob(`doc_${mySubmission.teamId}`, updateDocFile);
        if (currentUserEmail) {
          await storeMediaBlob(`participant_doc_${currentUserEmail.toLowerCase().trim()}`, updateDocFile);
        }
        updated.docBlobUrl = URL.createObjectURL(updateDocFile);
        updated._blobsVerified = true;
      }

      setMySubmission(updated);
      toast.success("Submission media updated successfully!");
      setShowMediaUpdateModal(false);
    } catch (err) {
      console.warn("Backend media update failed, updating via client fallback:", err.message);
      try {
        const updated = await clientUpdateSubmissionMedia({
          teamId: mySubmission.teamId,
          userEmail: currentUserEmail,
          videoDriveUrl: hasNewVideoLink ? trimmedVideoUrl : "",
          videoFile: hasNewVideoFile ? updateVideoFile : null,
          documentDriveUrl: hasNewDocLink ? trimmedDocUrl : "",
          documentFile: hasNewDocFile ? updateDocFile : null,
        });
        setMySubmission(updated);
        toast.success("Submission media updated successfully!");
        setShowMediaUpdateModal(false);
      } catch (fallbackErr) {
        toast.error(fallbackErr.message || "Failed to update media files.");
      }
    } finally {
      setMediaUpdating(false);
      setMediaUpdateProgress(0);
    }
  };

  const handleMemberChange = (index, field, value) => {
    setMembers((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const addMember = () => {
    if (members.length >= 5) {
      toast.error("Maximum 5 team members allowed.");
      return;
    }
    setMembers((prev) => [
      ...prev,
      { name: "", email: "", phone: "", isLeader: false, college: "", department: "" },
    ]);
  };

  const removeMember = (index) => {
    if (members[index].isLeader) {
      toast.error("Team leader cannot be removed.");
      return;
    }
    setMembers((prev) => prev.filter((_, i) => i !== index));
  };

  const handleLogout = () => {
    localStorage.removeItem("juryzaParticipantToken");
    localStorage.removeItem("juryzaParticipantEmail");
    localStorage.removeItem("juryzaParticipantName");
    if (localStorage.getItem("juryzaRole") === "participant") {
      localStorage.removeItem("juryzaToken");
      localStorage.removeItem("juryzaRole");
      localStorage.removeItem("juryzaEmail");
      localStorage.removeItem("juryzaName");
    }
    toast.success("Signed out successfully.");
    navigate("/register");
  };

  // Form Submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.teamName.trim() || !formData.solutionName.trim() || !formData.shortDescription.trim()) {
      toast.error("Please fill in Team Name, Solution Name, and Description.");
      return;
    }

    // Allow uploading both Pitch Video and Proposal Deck without one replacing the other (at least one required)
    const trimmedVideoUrl = videoDriveUrl.trim();
    const trimmedDocUrl = docDriveUrl.trim();
    const useDriveLink = videoSubmissionType === "link" && Boolean(trimmedVideoUrl);
    const useVideoFile = videoSubmissionType === "file" && Boolean(videoFile);
    const useDocDriveLink = docSubmissionType === "link" && Boolean(trimmedDocUrl);
    const useDocFile = docSubmissionType === "file" && Boolean(documentFile);

    const hasVideo = useDriveLink || useVideoFile;
    const hasDocument = useDocDriveLink || useDocFile;

    if (!hasVideo && !hasDocument) {
      toast.error("Please provide at least one submission: your Pitch Video and/or Proposal Deck. Submitting both is recommended.");
      return;
    }

    if (hasVideo && useDriveLink) {
      if (/youtube\.com/i.test(trimmedVideoUrl) || /youtu\.be/i.test(trimmedVideoUrl)) {
        toast.error("YouTube links are strictly not allowed. Please provide a Google Drive link.");
        return;
      }
      if (!trimmedVideoUrl.includes("drive.google.com")) {
        toast.error("Please enter a valid Google Drive link (e.g. https://drive.google.com/file/d/.../view).");
        return;
      }
    }

    if (hasDocument && useDocDriveLink) {
      if (/youtube\.com/i.test(trimmedDocUrl) || /youtu\.be/i.test(trimmedDocUrl)) {
        toast.error("YouTube links cannot be used for proposal document. Please provide a Google Drive link.");
        return;
      }
      if (!trimmedDocUrl.includes("drive.google.com")) {
        toast.error("Please enter a valid Google Drive link (e.g. https://drive.google.com/file/d/.../view).");
        return;
      }
    }

    if (!formData.institution?.trim()) {
      toast.error(
        activeCategory === CATEGORY.STUDENT
          ? "Please provide your College / Institution name."
          : activeCategory === CATEGORY.CORPORATE
          ? "Please provide your Company / Enterprise name."
          : activeCategory === CATEGORY.NGO
          ? "Please provide your Organization / Foundation name."
          : "Please provide your Institution / Affiliation / Locality."
      );
      return;
    }

    const leader = members.find((m) => m.isLeader);
    if (!leader?.name || !leader?.email) {
      toast.error("Please provide Team Leader Name and Contact details.");
      return;
    }

    setSubmitting(true);
    setUploadProgress(10);

    const cleanInstitution = formData.institution.trim();

    const data = new FormData();
    data.append("teamName", formData.teamName.trim());
    data.append("category", activeCategory);
    data.append("city", formData.city);
    data.append("theme", formData.theme);
    data.append("solutionName", formData.solutionName.trim());
    data.append("shortDescription", formData.shortDescription.trim());
    data.append("detailedProposal", formData.detailedProposal.trim() || formData.shortDescription.trim());
    data.append("institution", cleanInstitution);
    data.append("leadName", leader.name);
    data.append("leadEmail", currentUserEmail || leader.email);
    data.append("leadPhone", leader.phone);
    data.append("members", JSON.stringify(members));

    // Append both video and PDF document simultaneously when provided
    if (useDriveLink) {
      data.append("videoDriveUrl", trimmedVideoUrl);
    } else if (useVideoFile) {
      data.append("videoFile", videoFile);
    }

    if (useDocDriveLink) {
      data.append("documentDriveUrl", trimmedDocUrl);
    } else if (useDocFile) {
      data.append("documentFile", documentFile);
    }

    try {
      const res = await api.post("/api/v2/submissions", data, {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 600000, // 10 minutes timeout to allow full upload of media files
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / (progressEvent.total || 1),
          );
          setUploadProgress(Math.min(percentCompleted, 95));
        },
      });

      const returnedSub = res.data?.submission || {
        teamId: res.data?.teamId,
        teamName: formData.teamName.trim(),
        category: activeCategory,
        institution: cleanInstitution,
        solutionName: formData.solutionName.trim(),
        video: hasVideo
          ? {
              url: useDriveLink ? trimmedVideoUrl : "",
              originalName: useVideoFile ? videoFile?.name : "Google Drive Pitch Video",
            }
          : undefined,
        document: hasDocument
          ? {
              url: useDocDriveLink ? trimmedDocUrl : "",
              name: useDocFile ? documentFile?.name : "Google Drive Proposal Deck",
              originalName: useDocFile ? documentFile?.name : "Google Drive Proposal Deck",
            }
          : undefined,
      };

      // Cache local blobs in IndexedDB for instant playback even before async Drive sync completes
      if (useVideoFile && returnedSub.teamId) {
        await storeMediaBlob(`video_${returnedSub.teamId}`, videoFile);
        if (currentUserEmail) {
          await storeMediaBlob(`participant_video_${currentUserEmail.toLowerCase().trim()}`, videoFile);
        }
        returnedSub.videoBlobUrl = URL.createObjectURL(videoFile);
        returnedSub._blobsVerified = true;
      }
      if (useDocFile && returnedSub.teamId) {
        await storeMediaBlob(`doc_${returnedSub.teamId}`, documentFile);
        if (currentUserEmail) {
          await storeMediaBlob(`participant_doc_${currentUserEmail.toLowerCase().trim()}`, documentFile);
        }
        returnedSub.docBlobUrl = URL.createObjectURL(documentFile);
        returnedSub._blobsVerified = true;
      }

      setUploadProgress(100);
      toast.success("Team registered successfully! Live tracking is active.");
      setConfirmedTeamData(returnedSub);
      setShowConfirmedModal(true);
      setHasRegistered(true);
      setMySubmission(returnedSub);
    } catch (err) {
      console.warn("Backend registration failed, saving locally for zero downtime:", err.message);
      
      // Create local blob previews for instant playback in current tab only
      const localVideoBlob = useVideoFile ? URL.createObjectURL(videoFile) : null;
      const localDocBlob = useDocFile ? URL.createObjectURL(documentFile) : null;

      // Client-side fallback registration
      const newSub = clientRegisterSubmission({
        teamName: formData.teamName.trim(),
        category: activeCategory,
        theme: formData.theme,
        solutionName: formData.solutionName.trim(),
        shortDescription: formData.shortDescription.trim(),
        detailedProposal: formData.detailedProposal.trim() || formData.shortDescription.trim(),
        participantEmail: currentUserEmail || leader.email,
        leadName: leader.name,
        leadPhone: leader.phone,
        institution: cleanInstitution,
        members,
        videoFileName: hasVideo ? (useVideoFile ? videoFile?.name : "Google Drive Pitch Video") : undefined,
        documentFileName: hasDocument ? (useDocFile ? documentFile?.name : "Google Drive Proposal Deck") : undefined,
        videoBlobUrl: localVideoBlob,
        docBlobUrl: localDocBlob,
        videoDriveUrl: useDriveLink ? trimmedVideoUrl : "",
        documentDriveUrl: useDocDriveLink ? trimmedDocUrl : "",
      });

      // Persist raw files in browser IndexedDB for permanent playback across reloads
      if (useVideoFile) {
        await storeMediaBlob(`video_${newSub.teamId}`, videoFile);
        if (currentUserEmail) {
          await storeMediaBlob(`participant_video_${currentUserEmail.toLowerCase().trim()}`, videoFile);
        }
      }
      if (useDocFile) {
        await storeMediaBlob(`doc_${newSub.teamId}`, documentFile);
        if (currentUserEmail) {
          await storeMediaBlob(`participant_doc_${currentUserEmail.toLowerCase().trim()}`, documentFile);
        }
      }

      setUploadProgress(30);
      setUploadStatus("Submitting proposal...");

      // Simultaneously sync media files & master spreadsheets to Google Drive
      const updatedSub = await syncSubmissionFilesToCloudDrive({
        submission: newSub,
        videoFile: useVideoFile ? videoFile : null,
        documentFile: useDocFile ? documentFile : null,
        onStatusUpdate: (msg) => setUploadStatus(msg),
        onProgressUpdate: (pct) => setUploadProgress(Math.min(95, Math.max(30, pct))),
      });

      const finalSub = {
        ...(updatedSub || newSub),
        videoBlobUrl: localVideoBlob,
        docBlobUrl: localDocBlob,
        _blobsVerified: Boolean(localVideoBlob || localDocBlob),
      };

      setUploadProgress(100);
      toast.success("Team registered successfully! Live tracking is active.");
      setConfirmedTeamData(finalSub);
      setShowConfirmedModal(true);
      setHasRegistered(true);
      setMySubmission(finalSub);
    } finally {
      setSubmitting(false);
      setUploadProgress(0);
      setUploadStatus("");
    }
  };

  // Helper for Stepper State Mapping (Round 1, Round 2, Round 3, Selected / Not Selected)
  const getStepStatus = (stage, stepIndex) => {
    // 0: Round 1
    // 1: Round 2
    // 2: Round 3
    // 3: Selected / Not Selected
    const normalized = (stage || "round 1").toLowerCase();

    let currentIndex = 0;
    if (normalized.includes("round 2") || normalized.includes("round_2")) {
      currentIndex = 1;
    } else if (normalized.includes("round 3") || normalized.includes("round_3")) {
      currentIndex = 2;
    } else if (
      normalized.includes("selected") ||
      normalized.includes("shortlisted") ||
      normalized.includes("winner")
    ) {
      currentIndex = 3;
    } else {
      // "round 1", "submitted", "allocated", "evaluation" -> Round 1
      currentIndex = 0;
    }

    if (stepIndex < currentIndex) return "completed";
    if (stepIndex === currentIndex) return "active";
    return "pending";
  };

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg)] text-[var(--text)] dm-sans selection:bg-[var(--accent)] selection:text-white">
      {/* Top Header */}
      <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-[var(--surface)]/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-[var(--muted)] hover:text-[var(--text)] transition">
              <FiArrowLeft className="h-4 w-4" />
              <span>Back to Site</span>
            </Link>
            <span className="text-[var(--border)]">|</span>
            <div className="flex items-center gap-2">
              <img src="/logo_final.png" alt="Logo" className="h-6 w-auto rounded-full" />
              <span className="text-xs sm:text-sm font-bold text-[var(--text)]">
                Participant Portal
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex flex-col text-right">
              <span className="text-xs font-bold text-[var(--text)]">{currentUserName}</span>
              <span className="text-[10px] text-[var(--muted)]">{currentUserEmail}</span>
            </div>

            <button
              type="button"
              onClick={() => {
                setResetNewPassword("");
                setResetConfirmPassword("");
                setShowResetModal(true);
              }}
              className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-2.5 py-1.5 text-xs font-semibold text-[var(--text)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition cursor-pointer"
              title="Reset / Change Password"
            >
              <FiKey className="h-3.5 w-3.5 text-[var(--accent)]" />
              <span className="hidden sm:inline">Reset Password</span>
            </button>

            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-2.5 py-1.5 text-xs font-semibold text-[var(--text)] hover:bg-red-500/10 hover:border-red-500/30 hover:text-red-600 transition"
              title="Sign Out / Switch Account"
            >
              <FiLogOut className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Switch / Logout</span>
            </button>
            <ThemeToggle size="sm" />
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 mx-auto w-full max-w-5xl px-4 py-8 sm:px-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="h-10 w-10 animate-spin rounded-full border-3 border-[var(--accent)] border-t-transparent mb-4" />
            <p className="text-sm text-[var(--muted)]">Checking team registration status...</p>
          </div>
        ) : hasRegistered && mySubmission ? (
          /* ==================================================== */
          /* 1. REGISTERED STATE: LIVE 4-STEP PROGRESS TRACKER     */
          /* ==================================================== */
          <div className="space-y-8">
            {/* Header Badge */}
            <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 sm:p-8 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-[var(--border)]">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 mb-2">
                    <FiCheckCircle className="h-3.5 w-3.5" />
                    <span>Registration Confirmed</span>
                  </div>
                  <h1 className="oswald text-2xl sm:text-4xl font-extrabold uppercase text-[var(--text)]">
                    {mySubmission.teamName}
                  </h1>
                  <p className="text-xs text-[var(--muted)] mt-1">
                    Team ID: <strong className="text-[var(--text)] font-mono">{mySubmission.teamId}</strong> • Institution:{" "}
                    <strong className="text-[var(--text)]">
                      {mySubmission.institution || mySubmission.organizationDetails?.institution || "N/A"}
                    </strong>{" "}
                    • Registered: {new Date(mySubmission.createdAt).toLocaleString("en-IN")}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => openMediaUpdateModal("both")}
                    className="inline-flex items-center gap-1.5 rounded-2xl bg-[var(--accent)] text-white px-4 py-2.5 text-xs font-bold hover:brightness-110 transition shadow-md cursor-pointer"
                  >
                    <FiUploadCloud className="h-4 w-4" />
                    <span>Submit / Update Media Files</span>
                  </button>
                </div>
              </div>

              {/* LIVE 4-STEP SUBMISSION PROGRESS TRACKER */}
              <div className="pt-8">
                <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--muted)] mb-6">
                  Live Submission Progress
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  {/* Step 1: Round 1 */}
                  {(() => {
                    const status = getStepStatus(mySubmission.stage, 0);
                    return (
                      <div
                        className={`p-4 rounded-2xl border transition-all ${
                          status === "completed"
                            ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                            : status === "active"
                            ? "border-emerald-500 bg-emerald-500/10 shadow-sm ring-2 ring-emerald-500/20"
                            : "border-[var(--border)] bg-[var(--surface-2)] text-[var(--muted)]"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider">Step 1</span>
                          {status === "completed" ? (
                            <FiCheckCircle className="h-4 w-4 text-emerald-500" />
                          ) : (
                            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                          )}
                        </div>
                        <h4 className="font-bold text-sm text-[var(--text)]">Round 1</h4>
                        <p className="text-[11px] mt-1 text-[var(--muted)]">Expert screening & submission evaluation</p>
                      </div>
                    );
                  })()}

                  {/* Step 2: Round 2 */}
                  {(() => {
                    const status = getStepStatus(mySubmission.stage, 1);
                    return (
                      <div
                        className={`p-4 rounded-2xl border transition-all ${
                          status === "completed"
                            ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                            : status === "active"
                            ? "border-indigo-500 bg-indigo-500/10 shadow-sm ring-2 ring-indigo-500/20"
                            : "border-[var(--border)] bg-[var(--surface-2)] text-[var(--muted)]"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider">Step 2</span>
                          {status === "completed" ? (
                            <FiCheckCircle className="h-4 w-4 text-emerald-500" />
                          ) : status === "active" ? (
                            <span className="flex h-2 w-2 rounded-full bg-indigo-500 animate-ping" />
                          ) : (
                            <FiClock className="h-4 w-4" />
                          )}
                        </div>
                        <h4 className="font-bold text-sm text-[var(--text)]">Round 2</h4>
                        <p className="text-[11px] mt-1 text-[var(--muted)]">
                          Category showdowns & domain evaluation
                        </p>
                      </div>
                    );
                  })()}

                  {/* Step 3: Round 3 */}
                  {(() => {
                    const status = getStepStatus(mySubmission.stage, 2);
                    return (
                      <div
                        className={`p-4 rounded-2xl border transition-all ${
                          status === "completed"
                            ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                            : status === "active"
                            ? "border-purple-500 bg-purple-500/10 shadow-sm ring-2 ring-purple-500/20"
                            : "border-[var(--border)] bg-[var(--surface-2)] text-[var(--muted)]"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider">Step 3</span>
                          {status === "completed" ? (
                            <FiCheckCircle className="h-4 w-4 text-emerald-500" />
                          ) : status === "active" ? (
                            <span className="flex h-2 w-2 rounded-full bg-purple-500 animate-ping" />
                          ) : (
                            <FiClock className="h-4 w-4" />
                          )}
                        </div>
                        <h4 className="font-bold text-sm text-[var(--text)]">Round 3</h4>
                        <p className="text-[11px] mt-1 text-[var(--muted)]">
                          Senior jury panel presentation
                        </p>
                      </div>
                    );
                  })()}

                  {/* Step 4: Selected / Not Selected */}
                  {(() => {
                    const status = getStepStatus(mySubmission.stage, 3);
                    const normalized = (mySubmission.stage || "").toLowerCase();
                    const isRejected = normalized.includes("not selected") || normalized.includes("not shortlisted");
                    const isSelected = !isRejected && (normalized.includes("selected") || normalized.includes("winner") || normalized.includes("shortlisted"));
                    const isDecided = isRejected || isSelected;

                    return (
                      <div
                        className={`p-4 rounded-2xl border transition-all ${
                          isDecided
                            ? isRejected
                              ? "border-red-500/40 bg-red-500/10 text-red-700 dark:text-red-300"
                              : "border-amber-500 bg-gradient-to-br from-amber-500/20 to-amber-600/10 shadow-md ring-2 ring-amber-500/30"
                            : "border-[var(--border)] bg-[var(--surface-2)] text-[var(--muted)]"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider">Outcome</span>
                          {isDecided ? (
                            isRejected ? (
                              <FiAlertCircle className="h-4 w-4 text-red-500" />
                            ) : (
                              <FiCheckCircle className="h-4 w-4 text-emerald-500" />
                            )
                          ) : (
                            <FiClock className="h-4 w-4" />
                          )}
                        </div>
                        <h4 className="font-bold text-sm text-[var(--text)]">
                          {isRejected ? "Not Selected" : isSelected ? "Selected" : "Selected / Not Selected"}
                        </h4>
                        <p className="text-[11px] mt-1 text-[var(--muted)]">
                          {isRejected
                            ? "Evaluation concluded for this round."
                            : isSelected
                            ? "Congratulations! Selected for next stage."
                            : "Awaiting final jury decision"}
                        </p>
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>

            {/* Submission Details & Media Review Section */}
            {(() => {
              const { video: resolvedVideo, document: resolvedDoc } = resolveSubmissionMedia(
                mySubmission,
                api.defaults.baseURL,
              );
              const docFrameSrc =
                resolvedDoc.type === "blob" || resolvedDoc.type === "pdf"
                  ? `${resolvedDoc.embedUrl}#toolbar=0&navpanes=0`
                  : resolvedDoc.embedUrl;

              return (
                <div className="space-y-6">
                  {/* Action Banner for Missing / Pending Media */}
                  {(!resolvedVideo.hasVideo || !resolvedDoc.hasDoc) && (
                    <div className="rounded-3xl border border-amber-500/30 bg-amber-500/10 p-5 sm:p-6 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-start gap-3.5">
                        <div className="p-2.5 rounded-2xl bg-amber-500/20 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0">
                          <FiAlertCircle className="h-5 w-5" />
                        </div>
                        <div>
                          <h4 className="font-bold text-sm sm:text-base text-[var(--text)]">
                            {!resolvedVideo.hasVideo && !resolvedDoc.hasDoc
                              ? "Submission Media Pending (Both Video & Proposal Missing)"
                              : !resolvedVideo.hasVideo
                              ? "Pitch Video Pending (Strongly Recommended for Scoring)"
                              : "Proposal Deck Pending (Strongly Recommended for Scoring)"}
                          </h4>
                          <p className="text-xs text-[var(--muted)] mt-1 max-w-2xl leading-relaxed">
                            {!resolvedVideo.hasVideo && !resolvedDoc.hasDoc
                              ? "Your team is registered, but you have not uploaded a Pitch Video or Proposal Document yet. Please submit your materials now so the jury panel can thoroughly evaluate your innovation."
                              : !resolvedVideo.hasVideo
                              ? "You have submitted your Proposal Deck, but your Pitch Video is missing. Submitting both formats is strongly encouraged to ensure the jury has complete insight into your solution."
                              : "You have submitted your Pitch Video, but your Proposal Deck is missing. Submitting both formats is strongly encouraged to ensure the jury has complete insight into your solution."}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => openMediaUpdateModal(!resolvedVideo.hasVideo && !resolvedDoc.hasDoc ? "both" : !resolvedVideo.hasVideo ? "video" : "doc")}
                        className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[var(--accent)] hover:brightness-110 text-white px-5 py-3 text-xs font-bold transition shadow-md shrink-0 cursor-pointer"
                      >
                        <FiUploadCloud className="h-4 w-4" />
                        <span>{!resolvedVideo.hasVideo && !resolvedDoc.hasDoc ? "Submit Both Media Files" : !resolvedVideo.hasVideo ? "Attach Pitch Video" : "Attach Proposal Deck"}</span>
                      </button>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Pitch Video (.mp4) Review Card */}
                    <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-md flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2 font-bold text-sm text-[var(--text)]">
                            <FiVideo className="h-4 w-4 text-[var(--accent)]" />
                            <span>Pitch Video</span>
                          </div>
                          {resolvedVideo.hasVideo && (
                            <a
                              href={resolvedVideo.directUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-[11px] font-bold text-[var(--accent)] hover:underline"
                            >
                              <span>Open Video</span>
                              <FiExternalLink className="h-3 w-3" />
                            </a>
                          )}
                        </div>

                        {!resolvedVideo.hasVideo ? (
                          <div className="aspect-video w-full rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface-2)] flex flex-col items-center justify-center p-6 text-center">
                            <FiVideo className="h-8 w-8 text-[var(--muted)] mb-2 opacity-40" />
                            <p className="text-xs font-semibold text-[var(--text)]">No Pitch Video Submitted</p>
                            <p className="text-[11px] text-[var(--muted)] mt-1 max-w-xs mb-3">
                              No pitch video file or Google Drive link was attached to this submission.
                            </p>
                            <button
                              type="button"
                              onClick={() => openMediaUpdateModal("video")}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--accent)] text-white text-xs font-semibold hover:brightness-110 transition cursor-pointer shadow-sm"
                            >
                              <FiUploadCloud className="h-3.5 w-3.5" />
                              <span>Upload Pitch Video</span>
                            </button>
                          </div>
                        ) : resolvedVideo.type === "drive" ? (
                          <div className="aspect-video w-full rounded-2xl overflow-hidden border border-[var(--border)] bg-black relative shadow-lg">
                            <iframe
                              key={`drive-${mySubmission.teamId}-${resolvedVideo.embedUrl}`}
                              src={resolvedVideo.embedUrl}
                              title="Pitch Video Preview"
                              className="h-full w-full border-0 rounded-2xl"
                              allow="autoplay; fullscreen"
                            />
                          </div>
                        ) : resolvedVideo.type === "external" ? (
                          <div className="aspect-video w-full rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] flex flex-col items-center justify-center p-6 text-center gap-3">
                            <FiVideo className="h-9 w-9 text-[var(--accent)]" />
                            <p className="text-xs font-semibold text-[var(--text)]">External Pitch Video Linked</p>
                            <a
                              href={resolvedVideo.directUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--accent)] text-white px-4 py-2 text-xs font-bold hover:brightness-110 transition"
                            >
                              <span>Watch Video</span>
                              <FiExternalLink className="h-3.5 w-3.5" />
                            </a>
                          </div>
                        ) : (
                          <div className="aspect-video w-full rounded-2xl overflow-hidden border border-[var(--border)] bg-black relative shadow-lg">
                            <video
                              key={`vid-${mySubmission.teamId}-${resolvedVideo.embedUrl}`}
                              src={resolvedVideo.embedUrl}
                              className="h-full w-full object-cover"
                              controls
                              preload="metadata"
                              playsInline
                            />
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-[var(--border)]">
                        <p className="text-xs text-[var(--muted)] truncate max-w-[180px] sm:max-w-xs">
                          File: <strong className="text-[var(--text)]">{resolvedVideo.fileName}</strong>
                        </p>
                        <button
                          type="button"
                          onClick={() => openMediaUpdateModal("video")}
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-[var(--accent)] hover:underline cursor-pointer"
                        >
                          <FiUploadCloud className="h-3 w-3" />
                          <span>{resolvedVideo.hasVideo ? "Update Video" : "Attach Video"}</span>
                        </button>
                      </div>
                    </div>

                    {/* Proposal Document (.pdf) Review Card */}
                    <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-md flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2 font-bold text-sm text-[var(--text)]">
                            <FiFileText className="h-4 w-4 text-[var(--primary)]" />
                            <span>Proposal Deck (.pdf)</span>
                          </div>
                          {resolvedDoc.hasDoc && (
                            <button
                              type="button"
                              onClick={() => openMediaUpdateModal("doc")}
                              className="inline-flex items-center gap-1 text-[11px] font-semibold text-[var(--primary)] hover:underline cursor-pointer"
                            >
                              <FiUploadCloud className="h-3 w-3" />
                              <span>Update Deck</span>
                            </button>
                          )}
                        </div>

                        {resolvedDoc.hasDoc ? (
                          <>
                            <div className="aspect-[4/3] w-full rounded-2xl overflow-hidden border border-[var(--border)] bg-[var(--surface-2)] relative">
                              <iframe
                                key={`doc-${mySubmission.teamId}-${docFrameSrc}`}
                                src={docFrameSrc}
                                title="Proposal PDF Document"
                                className="h-full w-full border-0 rounded-2xl"
                              />
                            </div>

                            <div className="mt-3 flex items-center justify-between">
                              <p className="text-xs text-[var(--muted)] truncate max-w-[180px] sm:max-w-xs">
                                File: <strong className="text-[var(--text)]">{resolvedDoc.fileName}</strong>
                              </p>
                              <button
                                type="button"
                                onClick={() => openMediaUpdateModal("doc")}
                                className="inline-flex items-center gap-1 text-[11px] font-semibold text-[var(--primary)] hover:underline cursor-pointer"
                              >
                                <FiUploadCloud className="h-3 w-3" />
                                <span>Change File</span>
                              </button>
                            </div>

                            <div className="mt-4 pt-4 border-t border-[var(--border)] flex flex-col sm:flex-row gap-2">
                              <a
                                href={resolvedDoc.directUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-[var(--primary)] text-white py-2.5 text-xs font-semibold hover:bg-[var(--primary-hover)] transition cursor-pointer shadow-md"
                              >
                                <FiEye className="h-4 w-4" />
                                <span>View Fullscreen</span>
                              </a>
                              <a
                                href={resolvedDoc.downloadUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                download={resolvedDoc.fileName || "Proposal.pdf"}
                                className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] text-[var(--text)] px-4 py-2.5 text-xs font-semibold hover:border-[var(--primary)] transition cursor-pointer"
                              >
                                <FiDownload className="h-4 w-4" />
                                <span>Download</span>
                              </a>
                            </div>
                          </>
                        ) : (
                          <div className="aspect-[4/3] w-full rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface-2)] flex flex-col items-center justify-center p-6 text-center">
                            <FiFileText className="h-8 w-8 text-[var(--muted)] mb-2 opacity-40" />
                            <p className="text-xs font-semibold text-[var(--text)]">No Proposal Document Submitted</p>
                            <p className="text-[11px] text-[var(--muted)] mt-1 max-w-xs mb-3">
                              No PDF proposal deck or Google Drive link was attached to this submission.
                            </p>
                            <button
                              type="button"
                              onClick={() => openMediaUpdateModal("doc")}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--primary)] text-white text-xs font-semibold hover:bg-[var(--primary-hover)] transition cursor-pointer shadow-sm"
                            >
                              <FiUploadCloud className="h-3.5 w-3.5" />
                              <span>Upload Proposal Deck</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        ) : (
          /* ==================================================== */
          /* 2. REGISTRATION FORM: COMPULSORY FILES & DETAILS     */
          /* ==================================================== */
          <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 sm:p-10 shadow-xl">
            <div className="mb-8">
              <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-[var(--accent)] mb-2">
                <span>Edition 2 Team Registration</span>
              </div>
              <h1 className="oswald text-2xl sm:text-4xl font-extrabold uppercase text-[var(--text)]">
                Register Your Innovation Pitch
              </h1>
              <p className="mt-1 text-sm text-[var(--muted)]">
                Provide your team details and upload both your Pitch Video (Google Drive link or .mp4 ≤ 25 MB) and Proposal Deck (.pdf ≤ 5 MB). Uploading both is strongly recommended for jury evaluation.
              </p>
            </div>

            {/* Category Selector */}
            <div className="mb-8">
              <label className="block text-xs font-bold uppercase tracking-wider text-[var(--muted)] mb-3">
                Select Participation Category
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {CATEGORY_TABS.map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setActiveCategory(tab.key)}
                    className={`p-3 rounded-2xl border text-left transition ${
                      activeCategory === tab.key
                        ? "border-[var(--accent)] bg-amber-500/10 shadow-sm"
                        : "border-[var(--border)] bg-[var(--surface-2)] hover:bg-[var(--surface)]"
                    }`}
                  >
                    <span className="text-[10px] font-bold font-mono px-1.5 py-0.5 rounded bg-[var(--surface)] text-[var(--accent)]">
                      {tab.code}
                    </span>
                    <h4 className="font-bold text-xs sm:text-sm text-[var(--text)] mt-1.5">{tab.label}</h4>
                    <p className="text-[10px] text-[var(--muted)] mt-0.5">{tab.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[var(--text)] mb-1.5">
                    Team Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.teamName}
                    onChange={(e) => handleInputChange("teamName", e.target.value)}
                    placeholder="e.g. EcoFlow Mysuru"
                    className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-3.5 py-2.5 text-sm text-[var(--text)] placeholder-[var(--muted)] focus:border-[var(--accent)] focus:outline-none transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--text)] mb-1.5">
                    Focus Area / Thematic Track *
                  </label>
                  <select
                    value={formData.theme}
                    onChange={(e) => handleInputChange("theme", e.target.value)}
                    className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-3.5 py-2.5 text-sm text-[var(--text)] focus:border-[var(--accent)] focus:outline-none transition"
                  >
                    {TOPIC_OPTIONS.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Institution / College / Company / Organization Field */}
              <div>
                <label className="block text-xs font-semibold text-[var(--text)] mb-1.5">
                  {activeCategory === CATEGORY.STUDENT
                    ? "College / Educational Institution *"
                    : activeCategory === CATEGORY.CORPORATE
                    ? "Company / Enterprise / Startup Name *"
                    : activeCategory === CATEGORY.NGO
                    ? "NGO / Foundation / Civil Society Org *"
                    : "Institution / Organization / Locality *"}
                </label>
                <input
                  type="text"
                  required
                  value={formData.institution}
                  onChange={(e) => handleInputChange("institution", e.target.value)}
                  placeholder={
                    activeCategory === CATEGORY.STUDENT
                      ? "e.g. SDMIMD, SJCE, NIE, University of Mysore, etc."
                      : activeCategory === CATEGORY.CORPORATE
                      ? "e.g. Infosys, Wipro, L&T, Tech Startup, etc."
                      : activeCategory === CATEGORY.NGO
                      ? "e.g. Mysuru Heritage Trust, Rotary Mysuru, etc."
                      : "e.g. Mysuru Resident, Vijayanagar RWA, Citizen Forum, etc."
                  }
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-3.5 py-2.5 text-sm text-[var(--text)] placeholder-[var(--muted)] focus:border-[var(--accent)] focus:outline-none transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text)] mb-1.5">
                  Solution Title *
                </label>
                <input
                  type="text"
                  required
                  value={formData.solutionName}
                  onChange={(e) => handleInputChange("solutionName", e.target.value)}
                  placeholder="e.g. Decentralized Solar Micro-Filtration Network for Kukkarahalli Lake"
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-3.5 py-2.5 text-sm text-[var(--text)] placeholder-[var(--muted)] focus:border-[var(--accent)] focus:outline-none transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text)] mb-1.5">
                  Short Description & Executive Summary *
                </label>
                <textarea
                  required
                  rows={3}
                  value={formData.shortDescription}
                  onChange={(e) => handleInputChange("shortDescription", e.target.value)}
                  placeholder="Briefly describe the civic challenge in Mysuru and your team's proposed innovation..."
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-3.5 py-2.5 text-sm text-[var(--text)] placeholder-[var(--muted)] focus:border-[var(--accent)] focus:outline-none transition"
                />
              </div>

              {/* UPLOADS SECTION (BOTH ENCOURAGED) */}
              <div className="pt-4 border-t border-[var(--border)]">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-[var(--accent)]">
                      Submission Materials
                    </span>
                    <span className="text-[11px] text-[var(--muted)]">
                      (Upload Pitch Video & Proposal Deck)
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] font-semibold">
                    <span
                      className={`px-2 py-0.5 rounded-full border ${
                        (videoSubmissionType === "link" ? Boolean(videoDriveUrl.trim()) : Boolean(videoFile))
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                          : "bg-[var(--surface-2)] text-[var(--muted)] border-[var(--border)]"
                      }`}
                    >
                      {(videoSubmissionType === "link" ? Boolean(videoDriveUrl.trim()) : Boolean(videoFile))
                        ? "Video Attached"
                        : "Video Optional"}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full border ${
                        (docSubmissionType === "link" ? Boolean(docDriveUrl.trim()) : Boolean(documentFile))
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                          : "bg-[var(--surface-2)] text-[var(--muted)] border-[var(--border)]"
                      }`}
                    >
                      {(docSubmissionType === "link" ? Boolean(docDriveUrl.trim()) : Boolean(documentFile))
                        ? "PDF Attached"
                        : "PDF Optional"}
                    </span>
                  </div>
                </div>

                <div className="rounded-2xl border border-[var(--primary)]/20 bg-[var(--primary)]/5 p-3.5 text-xs text-[var(--text)] flex items-start gap-2.5 mb-4">
                  <FiCheck className="h-4 w-4 text-[var(--primary)] shrink-0 mt-0.5" />
                  <div className="leading-relaxed">
                    <strong className="text-[var(--primary)]">Recommended Submission:</strong> Please upload <strong>both</strong> your <strong>Pitch Video</strong> (Google Drive link or .mp4 ≤ 25 MB) and your <strong>Proposal Deck</strong> (.pdf ≤ 5 MB) without hesitation — both will be preserved for complete jury and admin review (at least one is required).
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
                  {/* Pitch Video Submission Card */}
                  <div className="rounded-2xl border border-[var(--border)] p-4 bg-[var(--surface-2)]/50">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-1.5">
                        <FiVideo className="h-4 w-4 text-[var(--accent)]" />
                        <h4 className="text-xs font-bold text-[var(--text)]">1. Pitch Video</h4>
                      </div>
                      <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                        Recommended
                      </span>
                    </div>

                    {/* Selector Tabs: Google Drive Link vs File Upload */}
                    <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-[var(--surface)] border border-[var(--border)] mb-3">
                      <button
                        type="button"
                        onClick={() => {
                          setVideoSubmissionType("link");
                          setVideoFile(null);
                          if (videoLocalPreview) {
                            URL.revokeObjectURL(videoLocalPreview);
                            setVideoLocalPreview(null);
                          }
                        }}
                        className={`py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer ${
                          videoSubmissionType === "link"
                            ? "bg-[var(--accent)] text-white shadow-sm"
                            : "text-[var(--muted)] hover:text-[var(--text)]"
                        }`}
                      >
                        <span>Drive Link</span>
                        <span className="text-[9px] bg-white/20 px-1 py-0.2 rounded font-normal">
                          Recommended
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setVideoSubmissionType("file");
                          setVideoDriveUrl("");
                          setVideoDriveError("");
                        }}
                        className={`py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer ${
                          videoSubmissionType === "file"
                            ? "bg-[var(--accent)] text-white shadow-sm"
                            : "text-[var(--muted)] hover:text-[var(--text)]"
                        }`}
                      >
                        <span>Upload File</span>
                        <span className="text-[9px] opacity-75 font-normal">≤ 25 MB</span>
                      </button>
                    </div>

                    {videoSubmissionType === "link" ? (
                      /* Google Drive Link */
                      <div className="space-y-2 text-left">
                        <label className="block text-[11px] font-semibold text-[var(--muted)]">
                          Paste Public Google Drive Link
                        </label>
                        <input
                          type="url"
                          value={videoDriveUrl}
                          onChange={(e) => handleDriveUrlChange(e.target.value)}
                          placeholder="https://drive.google.com/file/d/1.../view"
                          className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs text-[var(--text)] placeholder-[var(--muted)] focus:border-[var(--accent)] focus:outline-none transition"
                        />

                        {/* Error warning if YouTube or non-Drive */}
                        {videoDriveError && (
                          <div className="flex items-center gap-1.5 rounded-xl bg-red-500/10 border border-red-500/30 p-2 text-[11px] text-red-600 dark:text-red-400 font-semibold">
                            <FiAlertCircle className="h-3.5 w-3.5 shrink-0" />
                            <span>{videoDriveError}</span>
                          </div>
                        )}

                        {/* Guidance badge */}
                        <div className="rounded-xl bg-[var(--surface)] p-2.5 border border-[var(--border)] text-[11px] text-[var(--muted)] space-y-1">
                          <p className="flex items-start gap-1.5">
                            <FiCheck className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
                            <span>
                              In Google Drive, ensure sharing is set to:{" "}
                              <strong className="text-[var(--text)]">"Anyone with the link can view"</strong>.
                            </span>
                          </p>
                          <p className="flex items-start gap-1.5 text-amber-600 dark:text-amber-400 font-medium">
                            <FiAlertCircle className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5" />
                            <span>YouTube links are strictly not allowed. Only Google Drive links are accepted.</span>
                          </p>
                        </div>

                        {/* Live Google Drive Preview if valid ID extracted */}
                        {(() => {
                          const driveId = getDriveFileId(videoDriveUrl);
                          if (!driveId || videoDriveError) return null;
                          return (
                            <div className="mt-2 overflow-hidden rounded-xl border border-emerald-500/30 shadow-md">
                              <div className="p-1.5 bg-emerald-500/10 border-b border-emerald-500/20 text-[10px] font-bold text-emerald-600 flex items-center justify-between">
                                <span className="flex items-center gap-1">
                                  <FiCheck className="h-3 w-3" />
                                  <span>Live Google Drive Preview</span>
                                </span>
                                <span className="font-mono text-[9px]">{driveId}</span>
                              </div>
                              <iframe
                                src={`https://drive.google.com/file/d/${driveId}/preview`}
                                title="Drive Preview"
                                className="aspect-video w-full border-0"
                                allow="autoplay"
                              />
                            </div>
                          );
                        })()}
                      </div>
                    ) : (
                      /* Upload .mp4 File (Max 25 MB) */
                      <div className="text-center py-4 border-2 border-dashed border-[var(--border)] rounded-2xl bg-[var(--surface)]">
                        <p className="text-[11px] text-[var(--muted)]">Strictly .mp4 • Maximum 25 MB</p>

                        <input
                          type="file"
                          accept=".mp4,video/mp4"
                          onClick={(e) => { e.target.value = ""; }}
                          onChange={handleVideoFileChange}
                          className="hidden"
                          id="video-upload-input"
                        />
                        <label
                          htmlFor="video-upload-input"
                          className="mt-2.5 inline-flex items-center gap-1.5 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] px-3.5 py-1.5 text-xs font-semibold text-[var(--text)] hover:border-[var(--accent)] cursor-pointer transition shadow-sm"
                        >
                          <FiUploadCloud className="h-3.5 w-3.5" />
                          <span>{videoFile ? "Change Video File" : "Select .mp4 File"}</span>
                        </label>

                        {videoFile && (
                          <div className="mt-2 flex items-center justify-center gap-2 px-2">
                            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 inline-flex items-center gap-1 truncate max-w-[200px]">
                              <FiCheck className="h-3 w-3 shrink-0" />
                              <span className="truncate">{videoFile.name} ({(videoFile.size / (1024 * 1024)).toFixed(1)} MB)</span>
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                setVideoFile(null);
                                if (videoLocalPreview) {
                                  URL.revokeObjectURL(videoLocalPreview);
                                  setVideoLocalPreview(null);
                                }
                              }}
                              className="text-[11px] text-red-500 hover:underline cursor-pointer shrink-0"
                            >
                              Remove
                            </button>
                          </div>
                        )}

                        {videoLocalPreview && (
                          <div className="mt-3 overflow-hidden rounded-xl border border-emerald-500/30 shadow-md">
                            <video
                              src={videoLocalPreview}
                              controls
                              preload="metadata"
                              playsInline
                              className="aspect-video w-full object-cover"
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Proposal Document (.pdf <= 5 MB or Google Drive Link) Card */}
                  <div className="rounded-2xl border border-[var(--border)] p-4 bg-[var(--surface-2)]/50">
                    <div className="flex items-center justify-between mb-3 text-left">
                      <div className="flex items-center gap-1.5">
                        <FiFileText className="h-4 w-4 text-[var(--primary)]" />
                        <h4 className="text-xs font-bold text-[var(--text)]">2. Proposal Deck (.pdf)</h4>
                      </div>
                      <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                        Recommended
                      </span>
                    </div>

                    {/* Selector Tabs: File Upload vs Google Drive Link */}
                    <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-[var(--surface)] border border-[var(--border)] mb-3">
                      <button
                        type="button"
                        onClick={() => {
                          setDocSubmissionType("file");
                          setDocDriveUrl("");
                          setDocDriveError("");
                        }}
                        className={`py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer ${
                          docSubmissionType === "file"
                            ? "bg-[var(--primary)] text-white shadow-sm"
                            : "text-[var(--muted)] hover:text-[var(--text)]"
                        }`}
                      >
                        <span>Upload File</span>
                        <span className="text-[9px] opacity-75 font-normal">≤ 5 MB</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setDocSubmissionType("link");
                          setDocumentFile(null);
                          if (documentLocalPreview) {
                            URL.revokeObjectURL(documentLocalPreview);
                            setDocumentLocalPreview(null);
                          }
                        }}
                        className={`py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer ${
                          docSubmissionType === "link"
                            ? "bg-[var(--primary)] text-white shadow-sm"
                            : "text-[var(--muted)] hover:text-[var(--text)]"
                        }`}
                      >
                        <span>Drive Link</span>
                        <span className="text-[9px] bg-white/20 px-1 py-0.2 rounded font-normal">
                          Any size
                        </span>
                      </button>
                    </div>

                    {docSubmissionType === "link" ? (
                      /* Google Drive Link for Proposal Deck */
                      <div className="space-y-2 text-left">
                        <label className="block text-[11px] font-semibold text-[var(--muted)]">
                          Paste Public Google Drive Link
                        </label>
                        <input
                          type="url"
                          value={docDriveUrl}
                          onChange={(e) => handleDocDriveUrlChange(e.target.value)}
                          placeholder="https://drive.google.com/file/d/1.../view"
                          className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs text-[var(--text)] placeholder-[var(--muted)] focus:border-[var(--primary)] focus:outline-none transition"
                        />

                        {/* Error warning if YouTube or non-Drive */}
                        {docDriveError && (
                          <div className="flex items-center gap-1.5 rounded-xl bg-red-500/10 border border-red-500/30 p-2 text-[11px] text-red-600 dark:text-red-400 font-semibold">
                            <FiAlertCircle className="h-3.5 w-3.5 shrink-0" />
                            <span>{docDriveError}</span>
                          </div>
                        )}

                        {/* Guidance badge */}
                        <div className="rounded-xl bg-[var(--surface)] p-2.5 border border-[var(--border)] text-[11px] text-[var(--muted)] space-y-1">
                          <p className="flex items-start gap-1.5">
                            <FiCheck className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
                            <span>
                              In Google Drive, ensure sharing is set to:{" "}
                              <strong className="text-[var(--text)]">"Anyone with the link can view"</strong>.
                            </span>
                          </p>
                        </div>

                        {/* Live Google Drive Preview if valid ID extracted */}
                        {(() => {
                          const driveId = getDriveFileId(docDriveUrl);
                          if (!driveId || docDriveError) return null;
                          return (
                            <div className="mt-2 overflow-hidden rounded-xl border border-emerald-500/30 shadow-md">
                              <div className="p-1.5 bg-emerald-500/10 border-b border-emerald-500/20 text-[10px] font-bold text-emerald-600 flex items-center justify-between">
                                <span className="flex items-center gap-1">
                                  <FiCheck className="h-3 w-3" />
                                  <span>Live Google Drive Preview</span>
                                </span>
                                <span className="font-mono text-[9px]">{driveId}</span>
                              </div>
                              <iframe
                                src={`https://drive.google.com/file/d/${driveId}/preview`}
                                title="Drive Doc Preview"
                                className="aspect-[4/3] w-full border-0"
                              />
                            </div>
                          );
                        })()}
                      </div>
                    ) : (
                      /* Upload .pdf File (Max 5 MB) */
                      <div className="rounded-2xl border-2 border-dashed border-[var(--border)] p-6 text-center hover:border-[var(--primary)] transition bg-[var(--surface)]">
                        <p className="text-xs font-medium text-[var(--text)]">Upload your team proposal deck</p>
                        <p className="text-[11px] text-[var(--muted)] mt-0.5">Strictly .pdf • Maximum 5 MB</p>

                        <input
                          type="file"
                          accept=".pdf,application/pdf"
                          onClick={(e) => { e.target.value = ""; }}
                          onChange={handleDocumentFileChange}
                          className="hidden"
                          id="doc-upload-input"
                        />
                        <label
                          htmlFor="doc-upload-input"
                          className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] px-3.5 py-1.5 text-xs font-semibold text-[var(--text)] hover:border-[var(--primary)] cursor-pointer transition shadow-sm"
                        >
                          <FiUploadCloud className="h-3.5 w-3.5" />
                          <span>{documentFile ? "Change PDF" : "Select .pdf File"}</span>
                        </label>

                        {documentFile && (
                          <div className="mt-2 flex items-center justify-center gap-2 px-2">
                            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 inline-flex items-center gap-1 truncate max-w-[200px]">
                              <FiCheck className="h-3 w-3 shrink-0" />
                              <span className="truncate">{documentFile.name} ({(documentFile.size / (1024 * 1024)).toFixed(1)} MB)</span>
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                setDocumentFile(null);
                                if (documentLocalPreview) {
                                 URL.revokeObjectURL(documentLocalPreview);
                                  setDocumentLocalPreview(null);
                                }
                              }}
                              className="text-[11px] text-red-500 hover:underline cursor-pointer shrink-0"
                            >
                              Remove
                            </button>
                          </div>
                        )}

                        {documentLocalPreview && (
                          <div className="mt-3 overflow-hidden rounded-xl border border-[var(--primary)]/30 shadow-md text-left">
                            <div className="p-2 bg-[var(--surface)] border-b border-[var(--border)] flex items-center justify-between">
                              <span className="text-[11px] font-semibold text-[var(--text)] truncate max-w-[180px] inline-flex items-center gap-1">
                                <FiFileText className="h-3 w-3 shrink-0 text-[var(--primary)]" />
                                <span>{documentFile?.name}</span>
                              </span>
                              <a
                                href={documentLocalPreview}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-[11px] font-bold text-[var(--primary)] hover:underline"
                              >
                                <span>Preview</span>
                                <FiExternalLink className="h-3 w-3" />
                              </a>
                            </div>
                            <div className="h-52 w-full bg-[var(--surface-2)]">
                              <iframe
                                src={`${documentLocalPreview}#toolbar=0&navpanes=0`}
                                title="Selected Proposal PDF Preview"
                                className="w-full h-full border-0"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Team Members Section */}
              <div className="pt-4 border-t border-[var(--border)]">
                <div className="flex items-center justify-between mb-3">
                  <label className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
                    Team Members & Leader Info
                  </label>
                  <button
                    type="button"
                    onClick={addMember}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--accent)] hover:underline"
                  >
                    <FiPlus className="h-3.5 w-3.5" />
                    <span>Add Member</span>
                  </button>
                </div>

                <div className="space-y-3">
                  {members.map((m, idx) => (
                    <div
                      key={idx}
                      className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 p-3 rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] items-center"
                    >
                      <div>
                        <span className="text-[10px] font-bold text-[var(--muted)] block mb-1">
                          {m.isLeader ? "Leader Name *" : `Member ${idx + 1} Name`}
                        </span>
                        <input
                          type="text"
                          required={m.isLeader}
                          value={m.name}
                          onChange={(e) => handleMemberChange(idx, "name", e.target.value)}
                          placeholder="Name"
                          className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1.5 text-xs text-[var(--text)]"
                        />
                      </div>

                      <div>
                        <span className="text-[10px] font-bold text-[var(--muted)] block mb-1">
                          Gmail ID *
                        </span>
                        <input
                          type="email"
                          required
                          value={m.email}
                          onChange={(e) => handleMemberChange(idx, "email", e.target.value)}
                          placeholder="Gmail ID"
                          readOnly={m.isLeader}
                          className={`w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1.5 text-xs text-[var(--text)] ${
                            m.isLeader ? "opacity-80 cursor-not-allowed" : ""
                          }`}
                        />
                      </div>

                      <div>
                        <span className="text-[10px] font-bold text-[var(--muted)] block mb-1">
                          Phone Number *
                        </span>
                        <input
                          type="tel"
                          required={m.isLeader}
                          value={m.phone}
                          onChange={(e) => handleMemberChange(idx, "phone", e.target.value)}
                          placeholder="+91 Phone"
                          className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1.5 text-xs text-[var(--text)]"
                        />
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-2 pt-2 sm:pt-4">
                        <span className="text-[11px] font-semibold text-[var(--muted)]">
                          {m.isLeader ? "(Team Lead)" : "Co-Author"}
                        </span>
                        {!m.isLeader && (
                          <button
                            type="button"
                            onClick={() => removeMember(idx)}
                            className="p-1.5 rounded-lg text-red-500 hover:bg-red-500/10 transition"
                          >
                            <FiTrash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Submit CTA */}
              <button
                type="submit"
                disabled={submitting}
                className={`w-full rounded-2xl bg-[var(--accent)] hover:brightness-110 py-3.5 text-sm font-bold text-white shadow-lg transition-all duration-200 cursor-pointer ${
                  submitting ? "opacity-70 cursor-not-allowed" : "hover:scale-[1.01]"
                }`}
              >
                {submitting ? "Uploading & Staging Submission..." : "Complete Team Registration"}
              </button>
            </form>
          </div>
        )}
      </main>

      {/* Reset Password Modal */}
      <AnimatePresence>
        {showResetModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-xl bg-[var(--accent)]/15 text-[var(--accent)] flex items-center justify-center">
                    <FiKey className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-[var(--text)]">Reset Password</h3>
                    <p className="text-[11px] text-[var(--muted)]">{currentUserEmail}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowResetModal(false)}
                  className="p-1 rounded-lg text-[var(--muted)] hover:text-[var(--text)] transition cursor-pointer"
                >
                  <FiX className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handleResetPassword} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-[var(--text)] mb-1">
                    New Password
                  </label>
                  <div className="relative">
                    <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)] h-3.5 w-3.5" />
                    <input
                      type="password"
                      required
                      minLength={8}
                      value={resetNewPassword}
                      onChange={(e) => setResetNewPassword(e.target.value)}
                      placeholder="Minimum 8 characters"
                      className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-2)] pl-9 pr-3.5 py-2 text-xs text-[var(--text)] placeholder-[var(--muted)] focus:border-[var(--accent)] focus:outline-none transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--text)] mb-1">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)] h-3.5 w-3.5" />
                    <input
                      type="password"
                      required
                      minLength={8}
                      value={resetConfirmPassword}
                      onChange={(e) => setResetConfirmPassword(e.target.value)}
                      placeholder="Re-enter new password"
                      className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-2)] pl-9 pr-3.5 py-2 text-xs text-[var(--text)] placeholder-[var(--muted)] focus:border-[var(--accent)] focus:outline-none transition"
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowResetModal(false)}
                    className="flex-1 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] py-2 text-xs font-bold text-[var(--text)] hover:bg-[var(--surface)] transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={resetLoading}
                    className="flex-1 rounded-xl bg-[var(--accent)] hover:brightness-110 py-2 text-xs font-bold text-white transition cursor-pointer disabled:opacity-60"
                  >
                    {resetLoading ? "Updating..." : "Update Password"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Dedicated Registration Confirmed Modal */}
      <AnimatePresence>
        {showConfirmedModal && confirmedTeamData && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="w-full max-w-lg rounded-3xl border border-emerald-500/40 bg-[var(--surface)] p-6 sm:p-8 shadow-2xl relative overflow-hidden"
            >
              {/* Decorative Glow */}
              <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />

              <div className="text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 mb-4 shadow-inner ring-4 ring-emerald-500/10">
                  <FiCheckCircle className="h-8 w-8" />
                </div>

                <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 mb-2">
                  <span>Registration Successfully Confirmed</span>
                </div>

                <h2 className="oswald text-2xl sm:text-3xl font-extrabold uppercase text-[var(--text)]">
                  {confirmedTeamData.teamName}
                </h2>

                <div className="mt-3 inline-block rounded-xl bg-[var(--surface-2)] border border-[var(--border)] px-4 py-2 font-mono text-sm font-bold text-[var(--accent)] tracking-wider">
                  TEAM ID: {confirmedTeamData.teamId}
                </div>

                <p className="mt-3 text-xs text-[var(--muted)] leading-relaxed max-w-sm mx-auto">
                  Institution: <strong className="text-[var(--text)]">{confirmedTeamData.institution || "N/A"}</strong>
                </p>
              </div>

              {/* Status summary list */}
              <div className="mt-6 space-y-2 rounded-2xl bg-[var(--surface-2)] p-4 border border-[var(--border)] text-xs">
                <div className="flex items-center justify-between text-[var(--text)]">
                  <span className="flex items-center gap-1.5 font-medium">
                    <FiVideo className="h-4 w-4 text-emerald-500" />
                    <span>Pitch Video:</span>
                  </span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400 truncate max-w-[200px]">
                    {confirmedTeamData.video?.url ? (
                      <a
                        href={confirmedTeamData.video.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:underline flex items-center gap-1"
                      >
                        <span>Google Drive Link</span>
                        <FiExternalLink className="h-3 w-3" />
                      </a>
                    ) : confirmedTeamData.video?.originalName ? (
                      confirmedTeamData.video.originalName
                    ) : (
                      <span className="text-[var(--muted)] font-normal italic">Not provided</span>
                    )}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[var(--text)] pt-2 border-t border-[var(--border)]">
                  <span className="flex items-center gap-1.5 font-medium">
                    <FiFileText className="h-4 w-4 text-emerald-500" />
                    <span>Proposal Deck:</span>
                  </span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400 truncate max-w-[200px]">
                    {confirmedTeamData.document?.name ? (
                      confirmedTeamData.document.name
                    ) : (
                      <span className="text-[var(--muted)] font-normal italic">Not provided</span>
                    )}
                  </span>
                </div>
              </div>

              {/* Safe to close notification */}
              <div className="mt-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-3 text-center">
                <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                  You may now safely close this tab, refresh, or log out. Your progress and submission are permanent.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="mt-6 flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard?.writeText(confirmedTeamData.teamId);
                    toast.success("Team ID copied to clipboard!");
                  }}
                  className="flex-1 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] py-2.5 text-xs font-bold text-[var(--text)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition cursor-pointer"
                >
                  Copy Team ID
                </button>
                <button
                  type="button"
                  onClick={() => setShowConfirmedModal(false)}
                  className="flex-1 rounded-xl bg-[var(--accent)] py-2.5 text-xs font-bold text-white hover:brightness-110 shadow-md transition cursor-pointer"
                >
                  Go to Live Dashboard
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* ==================================================== */}
        {/* 4. SUBMIT / UPDATE MEDIA MODAL (REGISTERED TEAMS)    */}
        {/* ==================================================== */}
        {showMediaUpdateModal && mySubmission && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 sm:p-8 shadow-2xl space-y-6 text-left"
            >
              {/* Modal Header */}
              <div className="flex items-start justify-between gap-4 pb-4 border-b border-[var(--border)]">
                <div>
                  <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-[11px] font-bold text-[var(--accent)] mb-1">
                    <FiUploadCloud className="h-3 w-3" />
                    <span>Media Upload & Management</span>
                  </div>
                  <h3 className="oswald text-xl sm:text-2xl font-bold uppercase text-[var(--text)]">
                    Submit / Update Media Files
                  </h3>
                  <p className="text-xs text-[var(--muted)] mt-0.5">
                    Team: <strong className="text-[var(--text)]">{mySubmission.teamName}</strong> ({mySubmission.teamId})
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowMediaUpdateModal(false)}
                  disabled={mediaUpdating}
                  className="p-2 rounded-xl text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--surface-2)] transition cursor-pointer"
                >
                  <FiX className="h-5 w-5" />
                </button>
              </div>

              {/* Informational Guidance */}
              <div className="rounded-2xl border border-[var(--primary)]/20 bg-[var(--primary)]/5 p-3.5 text-xs text-[var(--text)] flex items-start gap-2.5">
                <FiCheck className="h-4 w-4 text-[var(--primary)] shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  Both your <strong>Pitch Video</strong> and <strong>Proposal Deck</strong> can be submitted together! We strongly encourage submitting both materials to ensure your evaluation panel has complete details of your innovation.
                </div>
              </div>

              <form onSubmit={handleMediaUpdateSubmit} className="space-y-6">
                {/* 1. Pitch Video Section */}
                <div className="rounded-2xl border border-[var(--border)] p-4 bg-[var(--surface-2)]/40 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FiVideo className="h-4 w-4 text-[var(--accent)]" />
                      <h4 className="text-xs font-bold text-[var(--text)]">1. Pitch Video</h4>
                    </div>
                    <span className="text-[10px] font-semibold text-[var(--muted)] bg-[var(--surface)] px-2 py-0.5 rounded-full border border-[var(--border)]">
                      {(() => {
                        const { video: vid } = resolveSubmissionMedia(mySubmission, api.defaults.baseURL);
                        return vid.hasVideo ? `Current: ${vid.fileName}` : "Not Submitted Yet";
                      })()}
                    </span>
                  </div>

                  {/* Toggle: Drive Link vs Upload File */}
                  <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-[var(--surface)] border border-[var(--border)]">
                    <button
                      type="button"
                      onClick={() => {
                        setUpdateVideoType("link");
                        setUpdateVideoFile(null);
                        if (updateVideoLocalPreview) {
                          URL.revokeObjectURL(updateVideoLocalPreview);
                          setUpdateVideoLocalPreview(null);
                        }
                      }}
                      className={`py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer ${
                        updateVideoType === "link"
                          ? "bg-[var(--accent)] text-white shadow-sm"
                          : "text-[var(--muted)] hover:text-[var(--text)]"
                      }`}
                    >
                      <span>Drive Link</span>
                      <span className="text-[9px] bg-white/20 px-1 py-0.2 rounded font-normal">Recommended</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setUpdateVideoType("file");
                        setUpdateVideoDriveUrl("");
                        setUpdateVideoDriveError("");
                      }}
                      className={`py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer ${
                        updateVideoType === "file"
                          ? "bg-[var(--accent)] text-white shadow-sm"
                          : "text-[var(--muted)] hover:text-[var(--text)]"
                      }`}
                    >
                      <span>Upload .mp4</span>
                      <span className="text-[9px] opacity-75 font-normal">≤ 25 MB</span>
                    </button>
                  </div>

                  {updateVideoType === "link" ? (
                    <div className="space-y-2">
                      <label className="block text-[11px] font-semibold text-[var(--muted)]">
                        Google Drive Video Link (Anyone with the link can view)
                      </label>
                      <input
                        type="url"
                        value={updateVideoDriveUrl}
                        onChange={(e) => {
                          const val = e.target.value;
                          setUpdateVideoDriveUrl(val);
                          const trimmed = (val || "").trim();
                          if (!trimmed) {
                            setUpdateVideoDriveError("");
                            return;
                          }
                          if (/youtube\.com/i.test(trimmed) || /youtu\.be/i.test(trimmed)) {
                            setUpdateVideoDriveError("YouTube links are strictly not allowed. Please provide a Google Drive link.");
                            return;
                          }
                          if (!trimmed.includes("drive.google.com")) {
                            setUpdateVideoDriveError("Please enter a valid Google Drive link (e.g. https://drive.google.com/file/d/.../view).");
                            return;
                          }
                          setUpdateVideoDriveError("");
                        }}
                        placeholder="https://drive.google.com/file/d/1.../view"
                        className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs text-[var(--text)] placeholder-[var(--muted)] focus:border-[var(--accent)] focus:outline-none transition"
                      />

                      {updateVideoDriveError && (
                        <div className="flex items-center gap-1.5 rounded-xl bg-red-500/10 border border-red-500/30 p-2 text-[11px] text-red-600 dark:text-red-400 font-semibold">
                          <FiAlertCircle className="h-3.5 w-3.5 shrink-0" />
                          <span>{updateVideoDriveError}</span>
                        </div>
                      )}

                      {(() => {
                        const driveId = getDriveFileId(updateVideoDriveUrl);
                        if (!driveId || updateVideoDriveError) return null;
                        return (
                          <div className="overflow-hidden rounded-xl border border-emerald-500/30 shadow-md">
                            <div className="p-1.5 bg-emerald-500/10 border-b border-emerald-500/20 text-[10px] font-bold text-emerald-600 flex items-center justify-between">
                              <span className="flex items-center gap-1">
                                <FiCheck className="h-3 w-3" />
                                <span>Live Google Drive Preview</span>
                              </span>
                              <span className="font-mono text-[9px]">{driveId}</span>
                            </div>
                            <iframe
                              src={`https://drive.google.com/file/d/${driveId}/preview`}
                              title="Drive Preview"
                              className="aspect-video w-full border-0"
                            />
                          </div>
                        );
                      })()}
                    </div>
                  ) : (
                    <div className="text-center py-4 border-2 border-dashed border-[var(--border)] rounded-2xl bg-[var(--surface)]">
                      <p className="text-[11px] text-[var(--muted)]">Strictly .mp4 • Maximum 25 MB</p>
                      <input
                        type="file"
                        accept=".mp4,video/mp4"
                        onClick={(e) => { e.target.value = ""; }}
                        onChange={handleUpdateVideoFileChange}
                        className="hidden"
                        id="update-video-file-input"
                      />
                      <label
                        htmlFor="update-video-file-input"
                        className="mt-2.5 inline-flex items-center gap-1.5 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] px-3.5 py-1.5 text-xs font-semibold text-[var(--text)] hover:border-[var(--accent)] cursor-pointer transition shadow-sm"
                      >
                        <FiUploadCloud className="h-3.5 w-3.5" />
                        <span>{updateVideoFile ? "Change Video File" : "Select .mp4 File"}</span>
                      </label>

                      {updateVideoFile && (
                        <div className="mt-2 flex items-center justify-center gap-2 px-2">
                          <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 inline-flex items-center gap-1 truncate max-w-[200px]">
                            <FiCheck className="h-3 w-3 shrink-0" />
                            <span className="truncate">{updateVideoFile.name} ({(updateVideoFile.size / (1024 * 1024)).toFixed(1)} MB)</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setUpdateVideoFile(null);
                              if (updateVideoLocalPreview) {
                                URL.revokeObjectURL(updateVideoLocalPreview);
                                setUpdateVideoLocalPreview(null);
                              }
                            }}
                            className="text-[11px] text-red-500 hover:underline cursor-pointer shrink-0"
                          >
                            Remove
                          </button>
                        </div>
                      )}

                      {updateVideoLocalPreview && (
                        <div className="mt-3 overflow-hidden rounded-xl border border-emerald-500/30 shadow-md">
                          <video
                            src={updateVideoLocalPreview}
                            controls
                            playsInline
                            className="aspect-video w-full object-cover"
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* 2. Proposal Deck Section */}
                <div className="rounded-2xl border border-[var(--border)] p-4 bg-[var(--surface-2)]/40 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FiFileText className="h-4 w-4 text-[var(--primary)]" />
                      <h4 className="text-xs font-bold text-[var(--text)]">2. Proposal Deck (.pdf)</h4>
                    </div>
                    <span className="text-[10px] font-semibold text-[var(--muted)] bg-[var(--surface)] px-2 py-0.5 rounded-full border border-[var(--border)]">
                      {(() => {
                        const { document: doc } = resolveSubmissionMedia(mySubmission, api.defaults.baseURL);
                        return doc.hasDoc ? `Current: ${doc.fileName}` : "Not Submitted Yet";
                      })()}
                    </span>
                  </div>

                  {/* Toggle: Upload File vs Drive Link */}
                  <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-[var(--surface)] border border-[var(--border)]">
                    <button
                      type="button"
                      onClick={() => {
                        setUpdateDocType("file");
                        setUpdateDocDriveUrl("");
                        setUpdateDocDriveError("");
                      }}
                      className={`py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer ${
                        updateDocType === "file"
                          ? "bg-[var(--primary)] text-white shadow-sm"
                          : "text-[var(--muted)] hover:text-[var(--text)]"
                      }`}
                    >
                      <span>Upload .pdf</span>
                      <span className="text-[9px] opacity-75 font-normal">≤ 5 MB</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setUpdateDocType("link");
                        setUpdateDocFile(null);
                        if (updateDocLocalPreview) {
                          URL.revokeObjectURL(updateDocLocalPreview);
                          setUpdateDocLocalPreview(null);
                        }
                      }}
                      className={`py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer ${
                        updateDocType === "link"
                          ? "bg-[var(--primary)] text-white shadow-sm"
                          : "text-[var(--muted)] hover:text-[var(--text)]"
                      }`}
                    >
                      <span>Drive Link</span>
                      <span className="text-[9px] bg-white/20 px-1 py-0.2 rounded font-normal">Any size</span>
                    </button>
                  </div>

                  {updateDocType === "link" ? (
                    <div className="space-y-2">
                      <label className="block text-[11px] font-semibold text-[var(--muted)]">
                        Google Drive Proposal Document Link (Anyone with the link can view)
                      </label>
                      <input
                        type="url"
                        value={updateDocDriveUrl}
                        onChange={(e) => {
                          const val = e.target.value;
                          setUpdateDocDriveUrl(val);
                          const trimmed = (val || "").trim();
                          if (!trimmed) {
                            setUpdateDocDriveError("");
                            return;
                          }
                          if (/youtube\.com/i.test(trimmed) || /youtu\.be/i.test(trimmed)) {
                            setUpdateDocDriveError("YouTube links cannot be used for documents. Please provide a Google Drive link.");
                            return;
                          }
                          if (!trimmed.includes("drive.google.com")) {
                            setUpdateDocDriveError("Please enter a valid Google Drive link (e.g. https://drive.google.com/file/d/.../view).");
                            return;
                          }
                          setUpdateDocDriveError("");
                        }}
                        placeholder="https://drive.google.com/file/d/1.../view"
                        className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs text-[var(--text)] placeholder-[var(--muted)] focus:border-[var(--primary)] focus:outline-none transition"
                      />

                      {updateDocDriveError && (
                        <div className="flex items-center gap-1.5 rounded-xl bg-red-500/10 border border-red-500/30 p-2 text-[11px] text-red-600 dark:text-red-400 font-semibold">
                          <FiAlertCircle className="h-3.5 w-3.5 shrink-0" />
                          <span>{updateDocDriveError}</span>
                        </div>
                      )}

                      {(() => {
                        const driveId = getDriveFileId(updateDocDriveUrl);
                        if (!driveId || updateDocDriveError) return null;
                        return (
                          <div className="overflow-hidden rounded-xl border border-emerald-500/30 shadow-md">
                            <div className="p-1.5 bg-emerald-500/10 border-b border-emerald-500/20 text-[10px] font-bold text-emerald-600 flex items-center justify-between">
                              <span className="flex items-center gap-1">
                                <FiCheck className="h-3 w-3" />
                                <span>Live Google Drive Preview</span>
                              </span>
                              <span className="font-mono text-[9px]">{driveId}</span>
                            </div>
                            <iframe
                              src={`https://drive.google.com/file/d/${driveId}/preview`}
                              title="Drive Preview"
                              className="aspect-[4/3] w-full border-0"
                            />
                          </div>
                        );
                      })()}
                    </div>
                  ) : (
                    <div className="rounded-2xl border-2 border-dashed border-[var(--border)] p-6 text-center hover:border-[var(--primary)] transition bg-[var(--surface)]">
                      <p className="text-[11px] text-[var(--muted)]">Strictly .pdf • Maximum 5 MB</p>
                      <input
                        type="file"
                        accept=".pdf,application/pdf"
                        onClick={(e) => { e.target.value = ""; }}
                        onChange={handleUpdateDocFileChange}
                        className="hidden"
                        id="update-doc-file-input"
                      />
                      <label
                        htmlFor="update-doc-file-input"
                        className="mt-2.5 inline-flex items-center gap-1.5 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] px-3.5 py-1.5 text-xs font-semibold text-[var(--text)] hover:border-[var(--primary)] cursor-pointer transition shadow-sm"
                      >
                        <FiUploadCloud className="h-3.5 w-3.5" />
                        <span>{updateDocFile ? "Change PDF" : "Select .pdf File"}</span>
                      </label>

                      {updateDocFile && (
                        <div className="mt-2 flex items-center justify-center gap-2 px-2">
                          <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 inline-flex items-center gap-1 truncate max-w-[200px]">
                            <FiCheck className="h-3 w-3 shrink-0" />
                            <span className="truncate">{updateDocFile.name} ({(updateDocFile.size / (1024 * 1024)).toFixed(1)} MB)</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setUpdateDocFile(null);
                              if (updateDocLocalPreview) {
                                URL.revokeObjectURL(updateDocLocalPreview);
                                setUpdateDocLocalPreview(null);
                              }
                            }}
                            className="text-[11px] text-red-500 hover:underline cursor-pointer shrink-0"
                          >
                            Remove
                          </button>
                        </div>
                      )}

                      {updateDocLocalPreview && (
                        <div className="mt-3 overflow-hidden rounded-xl border border-[var(--primary)]/30 shadow-md text-left">
                          <div className="p-2 bg-[var(--surface)] border-b border-[var(--border)] flex items-center justify-between">
                            <span className="text-[11px] font-semibold text-[var(--text)] truncate max-w-[180px] inline-flex items-center gap-1">
                              <FiFileText className="h-3 w-3 shrink-0 text-[var(--primary)]" />
                              <span>{updateDocFile?.name}</span>
                            </span>
                            <a
                              href={updateDocLocalPreview}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-[11px] font-bold text-[var(--primary)] hover:underline"
                            >
                              <span>Preview</span>
                              <FiExternalLink className="h-3 w-3" />
                            </a>
                          </div>
                          <div className="h-44 w-full bg-[var(--surface-2)]">
                            <iframe
                              src={`${updateDocLocalPreview}#toolbar=0&navpanes=0`}
                              title="Selected Proposal PDF Preview"
                              className="w-full h-full border-0"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Progress bar during media update */}
                {mediaUpdating && (
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-semibold text-[var(--text)]">
                      <span>Uploading & Updating Submission Media...</span>
                      <span>{mediaUpdateProgress}%</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--surface-2)]">
                      <div
                        className="h-full bg-[var(--accent)] transition-all duration-300"
                        style={{ width: `${mediaUpdateProgress}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Modal Actions */}
                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowMediaUpdateModal(false)}
                    disabled={mediaUpdating}
                    className="flex-1 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] py-2.5 text-xs font-bold text-[var(--text)] hover:border-[var(--accent)] transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={mediaUpdating}
                    className="flex-1 rounded-xl bg-[var(--accent)] py-2.5 text-xs font-bold text-white hover:brightness-110 shadow-md transition cursor-pointer flex items-center justify-center gap-2"
                  >
                    {mediaUpdating ? (
                      <>
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        <span>Saving Media...</span>
                      </>
                    ) : (
                      <>
                        <FiUploadCloud className="h-4 w-4" />
                        <span>Save & Submit Media</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <FooterSection />
    </div>
  );
};

export default ParticipantPortal;
