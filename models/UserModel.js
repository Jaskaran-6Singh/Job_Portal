const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
    },

    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },

    resume: {
      type: String,
      default: null,
    },

    skills: {
      type: [String],
      default: [],
    },

    profilePicture: {
      type: String,
      default: null,
    },
    savedJobs: [
      {
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
      },
    ],    
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("User", userSchema);