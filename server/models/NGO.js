import mongoose from "mongoose";

const MemberSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, lowercase: true, trim: true },
  phone: { type: String, required: true, trim: true },
  isLeader: { type: Boolean, default: false },
});

const NGOSchema = new mongoose.Schema(
  {
    teamId: { type: String, required: true, unique: true },
    teamName: { type: String, required: true, trim: true },
    organizationName: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },

    members: {
      type: [MemberSchema],
      validate: {
        validator: function (members) {
          const leaders = members.filter((m) => m.isLeader);
          return members.length > 0 && leaders.length === 1;
        },
        message: "Team must have members and exactly one leader",
      },
    },

    theme: { type: String, required: true },
    solutionName: { type: String, required: true, trim: true },
    shortDescription: { type: String, required: true, trim: true },

    idea_document: {
      name: { type: String, required: true },
      public_url: { type: String, required: true },
      public_id: { type: String, required: true },
    },

    status: {
      type: String,
      enum: [
        "Pending",
        "round_1_shortlisted",
        "round_1_rejected",
        "round_2_shortlisted",
        "round_2_rejected",
        "track_2_shortlisted",
        "round_3_shortlisted",
        "round_3_rejected",
        "grand_finale_shortlisted",
        "winner",
      ],
      default: "Pending",
      index: true,
    },
  },
  { timestamps: true },
);

const NGO = mongoose.model("NGO", NGOSchema);

export default NGO;
