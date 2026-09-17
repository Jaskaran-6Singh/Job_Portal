const mongoose = require("mongoose")
const cloudinary = require("../config/cloudinary")
const Apply = require("../models/ApplicationModel");
const Job = require("../models/JobModel");
const User = require("../models/UserModel");


const uploadResume = (fileBuffer) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        resource_type: "raw",
        folder: "job-portal/resumes",
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      }
    );

    stream.end(fileBuffer);
  });
};

const applyToJob = async (req, res) => {
  try {
    const userId = req.user.userId;
    const jobId = req.params.jobId;

    if (!mongoose.Types.ObjectId.isValid(jobId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid job ID",
      });
    }
    // 1. Find user
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // 2. Resume is required
    if (!user.resume) {
      return res.status(400).json({
        success: false,
        message: "Please upload a resume before applying",
      });
    }

    // 3. Find job
    const job = await Job.findOne({
      _id: jobId,
      isActive: true,
      $or: [
        { expiresAt: null },
        { expiresAt: { $gt: new Date() } },
      ],
    });

    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found or is no longer available",
      });
    }

    // 4. Check duplicate application
    const existingApplication = await Apply.findOne({
      applicant: userId,
      job: jobId,
    });

    if (existingApplication) {
      return res.status(409).json({
        success: false,
        message: "You have already applied to this job",
      });
    }
    
    let resumeUrl = user.resume
    if(req.file){
      const result = await uploadResume(req.file.buffer)
      resumeUrl = result.secure_url
    }

    if(!resumeUrl){
      return res.status(400).json({
        success: false,
        message: "Resume is required to apply",
      })
    }
    // 5. Create application
    const application = await Apply.create({
      applicant: userId,
      jobSource: "user",
      job: job._id,
      jobTitle: job.title,
      company: job.company,
      location: job.location,
      applicationUrl: null,
      resume: resumeUrl,
    });

    res.status(201).json({
      success: true,
      message: "Application submitted successfully",
      application,
    });
  } catch (error) {
      // Duplicate application caught by MongoDB unique index
      if (error.code === 11000) {
        return res.status(409).json({
          success: false,
          message: "You have already applied to this job",
        });
      }

      console.log("APPLY TO JOB ERROR:", error.message);

      return res.status(500).json({
        success: false,
        message: "Failed to submit application",
      });
  }
};

const getMyApplications = async (req, res) => {
  try {
    const applications = await Apply.find({
      applicant: req.user.userId,
    }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: applications.length,
      applications,
    });
  } catch (error) {
      console.log("GET MY APPLICATIONS ERROR:", error.message);

      res.status(500).json({
        success: false,
        message: "Failed to fetch your applications",
      });
    }
};

const getApplicationById = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
          success: false,
          message: "Invalid application ID"
      });
    }
    const application = await Apply.findById(req.params.id);

    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Application not found",
      });
    }

    // Only the applicant who owns the application can view it
    if (application.applicant.toString() !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to view this application",
      });
    }

    res.status(200).json({
      success: true,
      application,
    });
    } catch (error) {
      console.log("GET APPLICATION ERROR:", error.message);

      res.status(500).json({
        success: false,
        message: "Failed to fetch application",
      });
    }
};

const getAllApplications = async (req, res) => {
  try {
    const applications = await Apply.find()
      .populate("applicant", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: applications.length,
      applications,
    });
    } catch (error) {
      console.log("GET ALL APPLICATIONS ERROR:", error.message);

      res.status(500).json({
        success: false,
        message: "Failed to fetch applications",
      });
    }
};

const updateApplicationStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid application ID",
      });
    }
    const allowedStatuses = [
      "Applied",
      "Shortlisted",
      "Selected",
      "Rejected",
    ];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid application status",
      });
    }

    const application = await Apply.findById(req.params.id);

    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Application not found",
      });
    }

    if (application.jobSource === "adzuna") {
      return res.status(400).json({
        success: false,
        message: "Status cannot be updated for external applications",
      });
    }
    application.status = status;

    await application.save();

    res.status(200).json({
      success: true,
      message: "Application status updated successfully",
      application,
    });
    } catch (error) {
      console.log("UPDATE APPLICATION STATUS ERROR:", error.message);

      res.status(500).json({
        success: false,
        message: "Failed to update application status",
      });
    }
};

module.exports = {
  applyToJob, getMyApplications,
  getApplicationById, getAllApplications, updateApplicationStatus
};