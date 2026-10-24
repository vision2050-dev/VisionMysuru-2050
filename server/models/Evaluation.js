import mongoose from "mongoose";

const EvaluationSchema = new mongoose.Schema(
  {
    submissionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Edition2Submission",
      required: true,
      index: true,
    },
    judgeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Judge",
      required: true,
      index: true,
    },
    round: { type: Number, default: 1, enum: [1, 2, 3] },
    type: {
      type: String,
      enum: ["rubric", "duel"],
      default: "rubric",
    },

    // 4-Factor Rubric Criteria (1 - 10 each, Max 40)
    scores: {
      problemClarity: { type: Number, min: 1, max: 10, default: 5 },
      innovationImpact: { type: Number, min: 1, max: 10, default: 5 },
      feasibilityScalability: { type: Number, min: 1, max: 10, default: 5 },
      videoPitchDelivery: { type: Number, min: 1, max: 10, default: 5 },
    },
    totalRawScore: { type: Number, min: 4, max: 40, default: 20 },
    feedback: { type: String, trim: true },

    // Pairwise Comparison Duel details
    duelOpponentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Edition2Submission",
    },
    duelWinnerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Edition2Submission",
    },
  },
  { timestamps: true },
);

const Evaluation =
  mongoose.models.Evaluation || mongoose.model("Evaluation", EvaluationSchema);

export default Evaluation;
