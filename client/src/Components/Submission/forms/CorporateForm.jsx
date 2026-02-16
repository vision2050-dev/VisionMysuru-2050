import React from "react";
import { CATEGORY, TOPIC_OPTIONS } from "../../../constants/content";
import { useSubmissionForm, createEmptyMember } from "./useSubmissionForm";
import { Field, TextInput } from "./FormUI";
import {
  TeamMembers,
  ProjectDetails,
  SubmitButton,
  SuccessModal,
} from "./SharedSections";

const CorporateForm = () => {
  const initialState = {
    category: CATEGORY.CORPORATE,
    teamName: "",
    companyName: "",
    industry: "",
    city: "Mysuru",
    leaderIndex: "0",
    members: [createEmptyMember()],
    theme: TOPIC_OPTIONS[0],
    solutionName: "",
    shortDescription: "",
    pdfFile: null,
    consent: false,
  };

  const validate = (form) => {
    if (!form.teamName.trim()) return "Team name is required.";
    if (!form.companyName.trim()) return "Company name is required.";

    const filledMembers = form.members.filter(
      (m) => m.name.trim() && m.email.trim() && m.phone.trim(),
    );
    if (filledMembers.length < 1)
      return "At least 1 team member is required with complete details.";

    const leader = form.members[parseInt(form.leaderIndex)];
    if (!leader.name.trim() || !leader.email.trim() || !leader.phone.trim())
      return "Selected leader must have complete details.";

    if (!form.solutionName.trim()) return "Solution name is required.";
    if (!form.pdfFile) return "Please upload your project PDF.";
    if (!form.consent) return "You must agree to the declaration.";

    return null;
  };

  const {
    form,
    status,
    minMembers,
    set,
    setMember,
    addMember,
    removeMember,
    setLeader,
    onPickPdf,
    handleSubmit,
    confirmSubmit,
    cancelSubmit,
    resetForm,
  } = useSubmissionForm(initialState, validate, { minMembers: 1 });

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <SuccessModal
        isOpen={status.state === "success"}
        onClose={resetForm}
        data={status.data}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Team Name" required>
          <TextInput
            value={form.teamName}
            onChange={set("teamName")}
            placeholder="Enter your team name"
          />
        </Field>
        <Field label="Company Name" required>
          <TextInput
            value={form.companyName}
            onChange={set("companyName")}
            placeholder="Acme Corp"
          />
        </Field>
        <Field label="Industry">
          <TextInput
            value={form.industry}
            onChange={set("industry")}
            placeholder="IT/Software, Healthcare, etc."
          />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="City" required>
          <TextInput value={form.city} onChange={set("city")} />
        </Field>
      </div>

      <TeamMembers
        form={form}
        addMember={addMember}
        removeMember={removeMember}
        setLeader={setLeader}
        setMember={setMember}
        minMembers={minMembers}
      />

      <ProjectDetails form={form} set={set} onPickPdf={onPickPdf} />

      <SubmitButton
        status={status}
        confirmSubmit={confirmSubmit}
        cancelSubmit={cancelSubmit}
      />
    </form>
  );
};

export default CorporateForm;
