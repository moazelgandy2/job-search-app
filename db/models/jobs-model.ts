import mongoose from "mongoose";

const jobSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    location: {
      type: String,
      required: true,
      enum: ["remote", "onsite", "hybrid"],
    },
    workingTime: {
      type: String,
      required: true,
      enum: ["full-time", "part-time"],
    },
    level: {
      type: String,
      required: true,
      enum: ["Junior", "Mid-Level", "Senior", "Team-Lead", "CTO"],
    },
    description: {
      type: String,
      required: true,
    },
    techSkills: {
      type: [String],
      required: true,
    },
    softSkills: {
      type: [String],
      required: true,
    },
    hr: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export const JobModel = mongoose.model("Job", jobSchema);
