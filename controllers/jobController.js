const mongoose = require("mongoose")
const Job = require("../models/JobModel");

const createJob = async (req, res) => {
  try {
    const {
      title,
      company,
      description,
      location,
      salaryMin,
      salaryMax,
      skills,
      category,
      contractType,
    } = req.body;

    // Check required fields
    if (
      !title?.trim() ||
      !company?.trim() ||
      !description?.trim() ||
      !location?.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Title, company, description and location are required",
      });
    }

    // Validate salary
    if (
      salaryMin !== undefined &&
      salaryMin !== null &&
      (isNaN(salaryMin) || Number(salaryMin) < 0)
    ) {
      return res.status(400).json({
        success: false,
        message: "salaryMin must be a valid non-negative number",
      });
    }

    if (
      salaryMax !== undefined &&
      salaryMax !== null &&
      (isNaN(salaryMax) || Number(salaryMax) < 0)
    ) {
      return res.status(400).json({
        success: false,
        message: "salaryMax must be a valid non-negative number",
      });
    }

    if (
      salaryMin !== undefined &&
      salaryMax !== undefined &&
      salaryMin !== null &&
      salaryMax !== null &&
      Number(salaryMin) > Number(salaryMax)
    ) {
      return res.status(400).json({
        success: false,
        message: "salaryMin cannot be greater than salaryMax",
      });
    }

    const job = await Job.create({
      title: title.trim(),
      company: company.trim(),
      description: description.trim(),
      location: location.trim(),
      salaryMin,
      salaryMax,
      skills,
      category,
      contractType,

      // Always comes from authenticated user
      createdBy: req.user.userId,
    });

    res.status(201).json({
      success: true,
      message: "Job created successfully",
      job,
    });
  } catch (error) {
    console.log("CREATE JOB ERROR:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to create job",
    });
  }
};

const getAllJobs = async (req, res) => {
  try {
    const jobs = await Job.find({
      isActive: true,
      $or: [
        { expiresAt: null },
        { expiresAt: { $gt: new Date() } },
      ],
    })
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: jobs.length,
      jobs,
    });
  } catch (error) {
    console.log("GET JOBS ERROR:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to fetch jobs",
    });
  }
};

const getJobById = async (req, res) => {
  try{
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return res.status(400).json({
            success: false,
            message: "Invalid job ID"
        });
    }
    const job = await Job.findOne({
      _id: req.params.id,
      isActive: true,
      $or: [
        { expiresAt: null },
        { expiresAt: { $gt: new Date() } },
      ],
    }).populate("createdBy", "name email");

    if(!job){
      return res.status(404).json({
        success: false,
        message: "Job not found or is no longer available",
      })
    }

    res.status(200).json({
      success: true,
      job,
    })
    } catch (error) {
      console.log("GET JOB ERROR:", error.message);

      res.status(500).json({
        success: false,
        message: "Failed to fetch job",
      });
    }
}

const updateJob = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
          success: false,
          message: "Invalid job ID"
      });
    }
    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found",
      });
    }

    // Check ownership
    if (job.createdBy.toString() !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to update this job",
      });
    }

    const {
      title,
      company,
      description,
      location,
      salaryMin,
      salaryMax,
      skills,
      category,
      contractType,
    } = req.body;

    // Validate text fields if provided
     if (title !== undefined && (typeof title !== "string" || !title.trim())) {
      return res.status(400).json({
        success: false,
        message: "Title cannot be empty",
      });
    }

    if (company !== undefined && (typeof company !== "string" || !company.trim())) {
      return res.status(400).json({
        success: false,
        message: "Company cannot be empty",
      });
    }

    if (
      description !== undefined &&
      (typeof description !== "string" || !description.trim())
    ) {
      return res.status(400).json({
        success: false,
        message: "Description cannot be empty",
      });
    }

    if (
      location !== undefined &&
      (typeof location !== "string" || !location.trim())
    ) {
      return res.status(400).json({
        success: false,
        message: "Location cannot be empty",
      });
    }

    // Validate salary values if provided
    if (
      salaryMin !== undefined &&
      salaryMin !== null &&
      (isNaN(salaryMin) || Number(salaryMin) < 0)
    ) {
      return res.status(400).json({
        success: false,
        message: "salaryMin must be a valid non-negative number",
      });
    }

    if (
      salaryMax !== undefined &&
      salaryMax !== null &&
      (isNaN(salaryMax) || Number(salaryMax) < 0)
    ) {
      return res.status(400).json({
        success: false,
        message: "salaryMax must be a valid non-negative number",
      });
    }

    // Check final salary range
    const finalSalaryMin =
      salaryMin !== undefined ? salaryMin : job.salaryMin;

    const finalSalaryMax =
      salaryMax !== undefined ? salaryMax : job.salaryMax;

    if (
      finalSalaryMin !== null &&
      finalSalaryMax !== null &&
      finalSalaryMin !== undefined &&
      finalSalaryMax !== undefined &&
      Number(finalSalaryMin) > Number(finalSalaryMax)
    ) {
      return res.status(400).json({
        success: false,
        message: "salaryMin cannot be greater than salaryMax",
      });
    }

    // Update only provided fields
    job.title = title !== undefined ? title.trim() : job.title;
    job.company = company !== undefined ? company.trim() : job.company;
    job.description =
      description !== undefined ? description.trim() : job.description;
    job.location =
      location !== undefined ? location.trim() : job.location;

    job.salaryMin =
      salaryMin !== undefined ? salaryMin : job.salaryMin;

    job.salaryMax =
      salaryMax !== undefined ? salaryMax : job.salaryMax;

    job.skills = skills !== undefined ? skills : job.skills;
    job.category = category !== undefined ? category : job.category;
    job.contractType =
      contractType !== undefined ? contractType : job.contractType;

    await job.save();

    res.status(200).json({
      success: true,
      message: "Job updated successfully",
      job,
    });
  } catch (error) {
    console.log("UPDATE JOB ERROR:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to update job",
    });
  }
};

const deleteJob = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
          success: false,
          message: "Invalid job ID"
      });
    }

    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found",
      });        
    }

    // Check ownership
    if (job.createdBy.toString() !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to delete this job",
      });
    }

    await Job.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: "Job deleted successfully",
    });
    } catch (error) {
      console.log("DELETE JOB ERROR:", error.message);

      res.status(500).json({
        success: false,
        message: "Failed to delete job",
      });
    }
};
module.exports = { createJob, getAllJobs, getJobById, updateJob, deleteJob };