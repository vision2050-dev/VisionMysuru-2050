import mongoose from "mongoose";
import bcrypt from "bcrypt";

export const ADMIN_EMAIL = "vision2050@sdmimd.ac.in";

const JuryzaUserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: { type: String, required: true },
    role: {
      type: String,
      required: true,
      enum: ["participant", "judge", "admin"],
      default: "participant",
    },
    phone: { type: String, trim: true },
    organization: { type: String, trim: true },
    specialization: { type: String, trim: true, default: "General" }, // Domain track for judges
    allotedTeams: {
      type: [String],
      default: [], // List of teamIds alloted to this judge
    },
  },
  { timestamps: true },
);

// Hash password before saving
JuryzaUserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// Compare password method
JuryzaUserSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

const JuryzaUser =
  mongoose.models.JuryzaUser || mongoose.model("JuryzaUser", JuryzaUserSchema);

export default JuryzaUser;
