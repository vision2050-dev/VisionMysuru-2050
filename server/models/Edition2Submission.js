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
    participantEmail: { type: String, lowercase: true, trim: true, index: true },
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

    // Compulsory Video Pitch (.mp4, max 50 MB)
    video: {
      url: { type: String },
      title: { type: String },
      originalName: { type: String },
      driveDestination: {
        type: String,
        default: "https://drive.google.com/drive/folders/1UKXUmqcMewEhw_KG7L1Fe740yCd6fX2e",
      },
      driveFileId: { type: String },
      localPath: { type: String },
      size: { type: Number },
    },

    // Compulsory Supplementary Document / Pitch Deck (.pdf, max 5 MB)
    document: {
      name: { type: String },
      url: { type: String },
      originalName: { type: String },
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
          return members && members.length > 0;
        },
        message: "Every team must have members and at least one leader",
      },
    },

    organizationDetails: {
      institution: { type: String, trim: true },
      department: { type: String, trim: true },
      companyName: { type: String, trim: true },
      industry: { type: String, trim: true },
      organizationName: { type: String, trim: true },
    },

    // Participant Progress Tracking States
    // Round 1 -> Round 2 -> Round 3 -> Selected / Not Selected
    stage: {
      type: String,
      enum: [
        "Round 1",
        "Round 2",
        "Round 3",
        "Selected",
        "Not Selected",
        "round 1",
        "round 2",
        "round 3",
        "selected",
        "not selected",
        "submitted",
        "allocated to a judge",
        "under evaluation",
        "shortlisted to next round",
        "not shortlisted to next round",
      ],
      default: "Round 1",
      index: true,
    },

    // Alloted Judge Gmail IDs
    allotedJudges: {
      type: [String],
      default: [],
      index: true,
    },
    allotedJudgeNames: {
      type: [String],
      default: [],
    },

    // Evaluation Engine Metrics
    status: {
      type: String,
      default: "submitted",
    },
    eloRating: { type: Number, default: 1200, index: true },
    zScore: { type: Number, default: 0, index: true },
    rubricAverage: { type: Number, default: 0 },
    evaluationCount: { type: Number, default: 0 },
    evaluations: [
      {
        judgeEmail: String,
        judgeName: String,
        rubric: Object,
        totalScore: Number,
        notes: String,
        submittedAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true },
);

const Edition2Submission =
  mongoose.models.Edition2Submission ||
  mongoose.model("Edition2Submission", Edition2SubmissionSchema);

export default Edition2Submission;
