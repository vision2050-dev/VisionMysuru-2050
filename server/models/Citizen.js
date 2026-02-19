import mongoose from "mongoose";

const CitizenSchema = new mongoose.Schema(
  {
    teamId: { type: String, required: true, unique: true },
    teamName: { type: String, required: true },
    city: { type: String, required: true },
    members: [
      {
        name: { type: String, required: true },
        email: { type: String, required: true },
        phone: { type: String, required: true },
        isLeader: { type: Boolean, default: false },
      },
    ],
    theme: { type: String, required: true },
    solutionName: { type: String, required: true },
    shortDescription: { type: String, required: true },
    idea_document: {
      name: { type: String, required: true },
      public_url: { type: String, required: true },
      public_id: { type: String, required: true },
    },
    status: {
      type: String,
      enum: [
        "Pending",
        "screening_rejected",
        "screening_shortlisted",
        "r1_eliminated",
        "r1_shortlisted",
        "r2_eliminated",
        "finalist",
        "winner",
      ],
      default: "Pending",
    },
  },
  { timestamps: true },
);

const Citizen = mongoose.model("Citizen", CitizenSchema);

export default Citizen;
