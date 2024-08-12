import mongoose from "mongoose";

const applicationSchema = new mongoose.Schema(
  {
    job: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job",
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    userTechSkills: {
      type: [String],
      required: true,
    },
    userResume: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export const ApplicationModel = mongoose.model(
  "Application",
  applicationSchema
);
