const User = require("../models/UserModel");
const Job = require("../models/JobModel");
const ExternalJob = require("../models/ExternalJob");

const saveJob = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { jobSource, jobId, externalJobId } = req.body;

    if (!jobSource || !["user", "adzuna"].includes(jobSource)) {
      return res.status(400).json({
        success: false,
        message: "Valid job source is required",
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (jobSource === "user") {
      if (!jobId) {
        return res.status(400).json({
          success: false,
          message: "Job ID is required",
        });
      }

      const job = await Job.findById(jobId);

      if (!job) {
        return res.status(404).json({
          success: false,
          message: "Job not found",
        });
      }

      const alreadySaved = user.savedJobs.some(
        (saved) =>
          saved.jobSource === "user" &&
          saved.job?.toString() === jobId
      );

      if (alreadySaved) {
        return res.status(409).json({
          success: false,
          message: "Job already saved",
        });
      }

      user.savedJobs.push({
        jobSource: "user",
        job: job._id,
      });

      await user.save();

      return res.status(201).json({
        success: true,
        message: "Job saved successfully",
      });
    }

    if (!externalJobId) {
      return res.status(400).json({
        success: false,
        message: "External job ID is required",
      });
    }

    const externalJob = await ExternalJob.findOne({
      externalJobId: String(externalJobId),
      expiresAt: { $gt: new Date() },
    });

    if (!externalJob) {
      return res.status(404).json({
        success: false,
        message: "External job not found or cache has expired",
      });
    }

    const alreadySaved = user.savedJobs.some(
      (saved) =>
        saved.jobSource === "adzuna" &&
        saved.externalJobId === String(externalJobId)
    );

    if (alreadySaved) {
      return res.status(409).json({
        success: false,
        message: "Job already saved",
      });
    }

    user.savedJobs.push({
      jobSource: "adzuna",
      externalJobId: externalJob.externalJobId,
    });

    await user.save();

    return res.status(201).json({
      success: true,
      message: "External job saved successfully",
    });
  } catch (error) {
    console.log("SAVE JOB ERROR:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to save job",
    });
  }
};

const getSavedJobs = async (req, res) => {
  try {
    const userId = req.user.userId;

    const user = await User.findById(userId).populate({
      path: "savedJobs.job",
      model: "Job",
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const savedJobs = [];

    for (const saved of user.savedJobs) {
      // Internal job
      if (saved.jobSource === "user") {
        if (!saved.job) {
          continue;
        }

        savedJobs.push({
          jobSource: "user",
          job: saved.job,
        });
      }

      // External Adzuna job
      if (saved.jobSource === "adzuna") {
        const externalJob = await ExternalJob.findOne({
          externalJobId: saved.externalJobId,
          expiresAt: { $gt: new Date() },
        });

        if (!externalJob) {
          savedJobs.push({
            jobSource: "adzuna",
            externalJobId: saved.externalJobId,
            available: false,
          });

          continue;
        }

        savedJobs.push({
          jobSource: "adzuna",
          available: true,
          job: externalJob,
        });
      }
    }

    res.status(200).json({
      success: true,
      count: savedJobs.length,
      savedJobs,
    });
  } catch (error) {
    console.log("GET SAVED JOBS ERROR:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to fetch saved jobs",
    });
  }
};

const removeSavedJob = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { jobSource, jobId, externalJobId } = req.body;

    if (!jobSource || !["user", "adzuna"].includes(jobSource)) {
      return res.status(400).json({
        success: false,
        message: "Valid job source is required",
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (jobSource === "user") {
      if (!jobId) {
        return res.status(400).json({
          success: false,
          message: "Job ID is required",
        });
      }

      const initialLength = user.savedJobs.length;

      user.savedJobs = user.savedJobs.filter(
        (saved) =>
          !(
            saved.jobSource === "user" &&
            saved.job?.toString() === jobId
          )
      );

      if (user.savedJobs.length === initialLength) {
        return res.status(404).json({
          success: false,
          message: "Saved job not found",
        });
      }
    }

    if (jobSource === "adzuna") {
      if (!externalJobId) {
        return res.status(400).json({
          success: false,
          message: "External job ID is required",
        });
      }

      const initialLength = user.savedJobs.length;

      user.savedJobs = user.savedJobs.filter(
        (saved) =>
          !(
            saved.jobSource === "adzuna" &&
            saved.externalJobId === String(externalJobId)
          )
      );

      if (user.savedJobs.length === initialLength) {
        return res.status(404).json({
          success: false,
          message: "Saved job not found",
        });
      }
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: "Job removed from saved jobs",
    });
  } catch (error) {
    console.log("REMOVE SAVED JOB ERROR:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to remove saved job",
    });
  }
};

module.exports = {
  saveJob, getSavedJobs, removeSavedJob
};