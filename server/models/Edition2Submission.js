import mongoose from "mongoose";

const MemberSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, lowercase: true, trim: true },
  phone: { type: String, required: true, trim: true },
  isLeader: { type: Boolean, default: false },
  college: { type: String, trim: true },
  department: { type: String, trim: true },
  designation: { type: String, trim: true },
});

const Edition2SubmissionSchema = new mongoose.Schema(
  {
    teamId: { type: String, required: true, unique: true, index: true },
    teamName: { type: String, required: true, trim: true },
    category: {
      type: String,
      required: true,
      enum: ["students", "corporates", "ngos", "citizens"],
      index: true,
    },
    city: { type: String, default: "Mysuru" },
    theme: {
      type: String,
      required: true,
      index: true,
    },
    solutionName: { type: String, required: true, trim: true },
    shortDescription: { type: String, required: true, trim: true },
    detailedProposal: { type: String, trim: true },

    // Video Pitch (Explainer video required for Edition 2)
    video: {
      url: { type: String, required: true },
      title: { type: String },
      type: {
        type: String,
        enum: ["gdrive", "youtube", "direct", "local", "direct_upload"],
        default: "direct_upload",
      },
      driveDestination: {
        type: String,
        default: "https://drive.google.com/drive/folders/1UKXUmqcMewEhw_KG7L1Fe740yCd6fX2e",
      },
      driveFileId: { type: String },
      localPath: { type: String },
      originalName: { type: String },
      size: { type: Number },
    },

    // Supplementary Document / Pitch Deck (PDF)
    document: {
      name: { type: String },
      url: { type: String },
      driveDestination: {
        type: String,
        default: "https://drive.google.com/drive/folders/1UKXUmqcMewEhw_KG7L1Fe740yCd6fX2e",
      },
      driveFileId: { type: String },
      localPath: { type: String },
      size: { type: Number },
    },

    members: {
      type: [MemberSchema],
      validate: {
        validator: function (members) {
          const leaders = members.filter((m) => m.isLeader);
          return members.length > 0 && leaders.length === 1;
        },
        message: "Every team must have members and exactly one leader",
      },
    },

    organizationDetails: {
      institution: { type: String, trim: true },
      department: { type: String, trim: true },
      companyName: { type: String, trim: true },
      industry: { type: String, trim: true },
      organizationName: { type: String, trim: true },
    },

    // Juryza Evaluation Engine Metrics
    status: {
      type: String,
      enum: [
        "registered",
        "round_1_shortlisted",
        "round_1_rejected",
        "round_2_shortlisted",
        "round_2_rejected",
        "round_3_shortlisted",
        "grand_finale_shortlisted",
        "winner",
      ],
      default: "registered",
      index: true,
    },
    eloRating: { type: Number, default: 1200, index: true }, // Pairwise Duel Rating (Bradley-Terry)
    zScore: { type: Number, default: 0, index: true }, // Statistically Normalized Score across Judges
    rubricAverage: { type: Number, default: 0 }, // Mean raw rubric total (out of 40)
    evaluationCount: { type: Number, default: 0 },
  },
  { timestamps: true },
);

const Edition2Submission =
  mongoose.models.Edition2Submission ||
  mongoose.model("Edition2Submission", Edition2SubmissionSchema);

export default Edition2Submission;
