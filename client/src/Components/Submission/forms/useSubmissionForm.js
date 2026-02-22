import { useState } from "react";
import api from "../../../utils/api";
import { toast } from "react-hot-toast";

const MAX_PDF_BYTES = 2 * 1024 * 1024;
export const createEmptyMember = () => ({ name: "", email: "", phone: "" });

export const useSubmissionForm = (initialState, validateFn, options = {}) => {
  const { minMembers = 2 } = options;
  const [form, setForm] = useState(initialState);
  const [status, setStatus] = useState({ state: "idle", message: "" });

  const updateForm = (patch) => setForm((prev) => ({ ...prev, ...patch }));

  const setStatusWithToast = (state, message, type = "error") => {
    setStatus({ state, message });
    toast[type](message);
  };

  const setField = (key) => (e) =>
    updateForm({
      [key]: e?.target?.type === "checkbox" ? e.target.checked : e.target.value,
    });

  const setMemberField = (index, key) => (e) =>
    setForm((prev) => {
      const members = [...prev.members];
      members[index] = { ...members[index], [key]: e.target.value };
      return { ...prev, members };
    });

  const addMember = () =>
    form.members.length < 3 &&
    updateForm({ members: [...form.members, createEmptyMember()] });

  const removeMember = (index) =>
    setForm((prev) => {
      if (prev.members.length <= minMembers) return prev;

      const members = prev.members.filter((_, i) => i !== index);
      const leaderIndex = index === +prev.leaderIndex ? "0" : prev.leaderIndex;

      return { ...prev, members, leaderIndex };
    });

  const setLeader = (index) => updateForm({ leaderIndex: index.toString() });

  const onPickPdf = ({ target }) => {
    const file = target?.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf")
      return setStatusWithToast("error", "Please upload a PDF file.");

    if (file.size > MAX_PDF_BYTES)
      return setStatusWithToast("error", "PDF must be 2MB or smaller.");

    updateForm({ pdfFile: file });
    setStatus({ state: "idle", message: "" });
  };

  const buildFormData = () => {
    const fd = new FormData();

    Object.entries(form).forEach(([key, value]) => {
      if (["members", "pdfFile", "leaderIndex", "consent"].includes(key))
        return;
      value && fd.append(key, value);
    });

    const filledMembers = form.members
      .map((m, i) => ({
        ...m,
        name: m.name.trim(),
        email: m.email?.toLowerCase().trim(),
        phone: m.phone.trim(),
        isLeader: i === +form.leaderIndex,
      }))
      .filter((m) => m.name && m.email && m.phone);

    fd.append("members", JSON.stringify(filledMembers))

    form.pdfFile && fd.append("pdfFile", form.pdfFile);

    return fd;
  };

  const confirmSubmit = async () => {
    setStatus({ state: "submitting", message: "Submitting..." });

    try {
      const { data } = await api.post("/api/v1/submissions", buildFormData());
      const { teamId, teamName, solutionName } = data?.submission || {};

      setStatus({
        state: "success",
        message: `Idea submitted successfully!🎊`,
        data: { teamId, teamName, solutionName },
      });
      toast.success(`Idea submitted successfully!`);
    } catch (err) {
      setStatusWithToast(
        "error",
        err.response?.data?.message || "Failed to submit. Please try again.",
      );
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const error = validateFn(form);
    if (error) return setStatusWithToast("error", error);

    setStatus({
      state: "confirming",
      message: "Please confirm your details.",
    });
  };

  return {
    form,
    status,
    minMembers,
    set: setField,
    setMember: setMemberField,
    addMember,
    removeMember,
    setLeader,
    onPickPdf,
    handleSubmit,
    confirmSubmit,
    cancelSubmit: () => setStatus({ state: "idle", message: "" }),
    resetForm: () => {
      setForm(initialState);
      setStatus({ state: "idle", message: "" });
    },
  };
};
