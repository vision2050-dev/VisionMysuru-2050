import React from "react";
import { FiCheckCircle, FiTrash, FiPlus } from "react-icons/fi";
import { Field, TextInput, TextArea, Select } from "./FormUI";
import { TOPIC_OPTIONS } from "../../../constants/content";
import { toast } from "react-hot-toast";

export const StatusMessage = ({ status }) => {
  if (!status.message) return null;
  return (
    <div
      className={`mb-6 rounded-xl p-4 text-sm ${
        status.state === "error"
          ? "bg-red-50 text-red-700 border border-red-200"
          : "bg-emerald-50 text-emerald-700 border border-emerald-200"
      }`}
    >
      {status.state === "success" && <FiCheckCircle className="inline mr-2" />}
      {toast.message}
    </div>
  );
};

export const TeamMembers = ({
  form,
  addMember,
  removeMember,
  setLeader,
  setMember,
  minMembers = 2,
}) => (
  <div className="rounded-2xl bg-[var(--surface-2)] p-4 space-y-4">
    <div className="flex items-center justify-between">
      <p className="text-sm font-bold">
        Team Members (Min {minMembers}, Max 3)
      </p>
    </div>
    {form.members.map((m, idx) => (
      <div
        key={idx}
        className="flex flex-col gap-3 border-b border-[var(--border)] pb-4 last:border-0 last:pb-0"
      >
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-[var(--muted)]">
            Member {idx + 1}
          </span>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2  cursor-pointer">
              <input
                type="radio"
                name="teamLeader"
                checked={parseInt(form.leaderIndex) === idx}
                onChange={() => setLeader(idx)}
                className="accent-[var(--accent)]"
              />
              <span className="text-sm font-medium">Leader</span>
            </label>

            {form.members.length > minMembers && (
              <button
                type="button"
                onClick={() => removeMember(idx)}
                className="text-white bg-red-500 hover:bg-red-600 p-1.5 rounded-full flex items-center justify-center"
                title="Remove Member"
              >
                <FiTrash />
              </button>
            )}
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <TextInput
            value={m.name}
            onChange={setMember(idx, "name")}
            placeholder="Name"
          />
          <TextInput
            value={m.email.toLowerCase()}
            onChange={setMember(idx, "email")}
            placeholder="Email"
            type="email"
          />
          <TextInput
            value={m.phone}
            onChange={setMember(idx, "phone")}
            placeholder="Phone Number +91 xxxx xxxxx"
            type="tel"
            className="sm:col-span-2"
          />
        </div>
      </div>
    ))}
    {form.members.length < 3 && (
      <button
        type="button"
        onClick={addMember}
        className="flex items-center bg-[var(--accent)] gap-1 text-sm px-10  font-bold text-white px-4 py-2 rounded-xl hover:underline"
      >
        <FiPlus /> Add Member
      </button>
    )}
  </div>
);

export const ProjectDetails = ({ form, set, onPickPdf }) => (
  <>
    <Field label="Theme" required>
      <Select value={form.theme} onChange={set("theme")}>
        {TOPIC_OPTIONS.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </Select>
    </Field>

    <Field label="Solution Name" required>
      <TextInput value={form.solutionName} onChange={set("solutionName")} />
    </Field>

    <Field label="Description" required>
      <TextArea
        value={form.shortDescription}
        onChange={set("shortDescription")}
        placeholder="How does this help Mysuru?"
      />
    </Field>

    <Field label="Upload PDF (max 2MB)" required className="space-y-2">
      <input
        type="file"
        accept="application/pdf"
        onChange={onPickPdf}
        className="
      block w-full text-sm
      file:mr-4 file:py-2 file:px-4
      file:rounded-md file:border-0
      file:bg-gray-100 file:text-gray-700
      hover:file:bg-gray-200
      border border-gray-300 rounded-md
      focus:outline-none focus:ring-2 focus:ring-gray-400
    "
      />
    </Field>

    <div className="flex items-center gap-3">
      <input
        type="checkbox"
        checked={form.consent}
        onChange={set("consent")}
        className="h-4 w-4 rounded border-[var(--border)] text-[var(--accent)]"
      />
      <span className="text-xs text-[var(--muted)]">
        I confirm that all information provided is accurate and original.
      </span>
    </div>
  </>
);

export const SubmitButton = ({ status, confirmSubmit, cancelSubmit }) => {
  if (status.state === "confirming") {
    return (
      <div className="rounded-3xl border border-amber-200 bg-amber-50 p-5 space-y-4">
        <div className="flex items-start gap-3">
          <div>
            <p className="text-xl font-semibold text-amber-900">
              ⚠️ Final Review
            </p>
            <p className="text-sm text-amber-800 mt-1 leading-relaxed">
              Please carefully review all entered information like NAME, EMAIL,
              PHONE etc, before submitting. Once submitted, the status cannot be
              modified.
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            type="button"
            onClick={confirmSubmit}
            className="flex-1 rounded-3xl bg-emerald-600 py-2.5 text-sm font-semibold text-white
                 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
          >
            Confirm & Submit
          </button>

          <button
            type="button"
            onClick={cancelSubmit}
            className="flex-1 rounded-3xl border border-gray-300 bg-white py-2.5 text-sm font-medium text-gray-700
                 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
          >
            Review Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      type="submit"
      disabled={status.state === "submitting" || status.state === "success"}
      className="w-full rounded-xl bg-[var(--accent)] py-3 font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
    >
      {status.state === "submitting" ? (
        <div className="w-4 h-4 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto"></div>
      ) : (
        "Submit Idea"
      )}
    </button>
  );
};

export const SuccessModal = ({ isOpen, onClose, data }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 h-screen flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
      <div className="w-full max-w-md  rounded-4xl border-green-800 border-2   bg-gradient-to-b from-emerald-200 to-emerald-800 p-4 shadow-xl animate-in fade-in zoom-in duration-200">
        <div className="flex flex-col items-center text-center">
          <div className="flex flex-col items-center text-center">
            <div className="mb-4 rounded-full bg-emerald-200 p-3 text-emerald-600">
              <FiCheckCircle size={48} />
            </div>
            <h3 className="text-2xl font-bold text-green-900">
              Submission Successful!
            </h3>
            <p className="text-green-200">
              Your idea has been successfully submitted.
            </p>
          </div>
          <div className="flex flex-row justify-between  mt-4 font-bold   rounded-full text-xl  ">
            <span className="items-center pr-2 pl-3 rounded-l-full bg-white/80 py-1">
              ID :
            </span>
            <span className="bg-green-200/80 px-2 py-1  text-green-900 rounded-r-full">
              {data?.teamId}
            </span>
          </div>

          <div className="mt-6 w-full space-y-3 rounded-xl bg-green-100/40 p-4 border border-green-800 text-left">
            <div className="flex justify-between border-b pb-2">
              <span className="text-sm font-medium text-gray-700">
                Team Name
              </span>
              <span className="font-semibold text-gray-900 text-right">
                {data?.teamName}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium text-gray-700">
                Solution Name
              </span>
              <span
                className="font-medium text-gray-900 truncate max-w-[200px] text-right"
                title={data?.solutionName}
              >
                {data?.solutionName}
              </span>
            </div>
          </div>
          <div className="text-sm mt-4 text-white">
            Please <strong>remember your ID</strong>. It will be required for
            all future communication and evaluation processes.
          </div>

          <button
            onClick={onClose}
            className="mt-6 w-full rounded-b-3xl rounded-t-lg bg-green-600 py-3 font-bold text-white transition-opacity hover:opacity-90"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
