const mongoose = require("mongoose");

const applicationSchema = new mongoose.Schema(
  {
    applicant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    jobSource: {
      type: String,
      enum: ["user", "adzuna"],
      required: true,
    },

    job: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job",
      default: null,
    },

    externalJobId: {
      type: String,
      default: null,
    },

    jobTitle: {
      type: String,
      required: true,
    },

    company: {
      type: String,
      required: true,
    },

    location: {
      type: String,
      default: null,
    },

    applicationUrl: {
      type: String,
      default: null,
    },

    resume: {
      type: String,
      required: true,
    },

    status: {
      type: String,
      enum: [
        "Applied",
        "Shortlisted",
        "Selected",
        "Rejected",
      ],
      default: "Applied",
    },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate applications to user-created jobs
applicationSchema.index(
  { applicant: 1, job: 1 },
  {
    unique: true,
    partialFilterExpression: {
      job: { $type: "objectId" },
    },
  }
);

// Prevent duplicate applications to Adzuna jobs
applicationSchema.index(
  { applicant: 1, externalJobId: 1 },
  {
    unique: true,
    partialFilterExpression: {
      externalJobId: { $type: "string" },
    },
  }
);

module.exports = mongoose.model("Application", applicationSchema);