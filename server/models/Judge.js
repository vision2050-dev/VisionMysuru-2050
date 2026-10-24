import mongoose from "mongoose";

const JudgeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, default: "" },
    role: {
      type: String,
      enum: ["judge", "admin"],
      default: "judge",
    },
    organization: { type: String, default: "SDMIMD Panel" },
    assignedDomain: {
      type: String,
      default: "All", // "Urban Infrastructure & Mobility", etc. or "All"
    },
    active: { type: Boolean, default: true },
  },
  { timestamps: true },
);

const Judge = mongoose.models.Judge || mongoose.model("Judge", JudgeSchema);

export default Judge;
