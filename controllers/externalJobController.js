const ExternalJob = require("../models/ExternalJob")
const cloudinary = require("../config/cloudinary")
const { getAdzunaJobs} = require("../services/adzunaService")
const Apply= require("../models/ApplicationModel")
const User = require("../models/UserModel")

const isITJob = (job) => {
  const title = (job.title || "").toLowerCase();

  const itKeywords = [
    "software",
    "developer",
    "programmer",
    "frontend",
    "front-end",
    "backend",
    "back-end",
    "full stack",
    "fullstack",
    "web developer",
    "mobile developer",
    "android developer",
    "ios developer",
    "devops",
    "cloud engineer",
    "cloud developer",
    "cybersecurity",
    "cyber security",
    "data engineer",
    "data scientist",
    "data analyst",
    "machine learning",
    "artificial intelligence",
    "ai engineer",
    "qa engineer",
    "test engineer",
    "sdet",
    "database administrator",
    "database developer",
    "sql developer",
    "network engineer",
    "network administrator",
    "system administrator",
    "systems administrator",
    "technical support",
    "it support",
    "it analyst",
    "it consultant",
    "technology consultant",
  ];

  return itKeywords.some((keyword) =>
    title.includes(keyword)
  );
};

const getExternalJobs = async (req, res) => {
  try {
    const {
      page = 1,
      what = "",
      where = "",
    } = req.query;

    const parsedPage = Number(page);
    const currentPage =
      Number.isInteger(parsedPage) && parsedPage >= 1 ? parsedPage : 1;

    const data = await getAdzunaJobs({
      page: currentPage,
      what,
      where,
    });
    
    const itJobs = (data.results || []).filter(isITJob);

    await Promise.all(
    itJobs.map((job) =>
      ExternalJob.findOneAndUpdate(
        { externalJobId: String(job.id) },
        {
          externalJobId: String(job.id),
          title: job.title,
          company: job.company?.display_name || "Unknown",
          description: job.description || null,
          location: job.location?.display_name || null,
          applicationUrl: job.redirect_url,
          category: job.category?.label || null,
          contractType: job.contract_time || null,
          createdAtExternal: job.created
            ? new Date(job.created)
            : null,
          cachedAt: new Date(),
          expiresAt: new Date(Date.now() + 60 * 60 * 1000),
        },
        {
          upsert: true,
          new: true,
        }
      )
    )
  );
    const jobs = itJobs.map((job) => ({
      id: job.id,
      title: job.title,
      company: job.company?.display_name || "Unknown",
      description: job.description,
      location: job.location?.display_name || "Unknown",
      applicationUrl: job.redirect_url,
      category: job.category?.label || null,
      contractType: job.contract_time || null,
      created: job.created,
    }));

    res.status(200).json({
      success: true,
      count: jobs.length,
      totalResults: data.count,
      page: currentPage,
      resultsPerPage: 20,
      jobs,
    });
  } catch (error) {
    console.log("ADZUNA ERROR:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to fetch external jobs",
    });
  }
};

const uploadResume = (fileBuffer) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        resource_type: "raw",
        folder: "job-portal/resumes",
      },
      (error, result) => {
        if (error) {
          console.log("CLOUDINARY ERROR:", error);
          reject(error);
        } else {
          console.log("CLOUDINARY SUCCESS:", result.secure_url);
          resolve(result);
        }
      }
    );

    stream.end(fileBuffer);
  });
};


const applyToExternalJob = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { externalJobId } = req.body;

    if (!externalJobId) {
      return res.status(400).json({
        success: false,
        message: "External job ID is required",
      });
    }

    // Verify that the external job exists in our cache
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

    // Get the logged-in user
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Prevent duplicate external applications
    const existingApplication = await Apply.findOne({
      applicant: userId,
      jobSource: "adzuna",
      externalJobId: externalJob.externalJobId,
    });

    if (existingApplication) {
      return res.status(409).json({
        success: false,
        message: "You have already applied to this external job",
      });
    }

    // Use profile resume by default
    let resumeUrl = user.resume;

    // If user uploads a different resume, use it for this application only
    if (req.file) {
      const result = await uploadResume(req.file.buffer);
      resumeUrl = result.secure_url;
    }

    if (!resumeUrl) {
      return res.status(400).json({
        success: false,
        message: "Resume is required to apply",
      });
    }

    // Store the user's external application activity
    const application = await Apply.create({
      applicant: userId,
      jobSource: "adzuna",
      job: null,
      externalJobId: externalJob.externalJobId,
      jobTitle: externalJob.title,
      company: externalJob.company,
      location: externalJob.location,
      applicationUrl: externalJob.applicationUrl,
      resume: resumeUrl,
      status: "Applied",
    });

    res.status(201).json({
      success: true,
      message:
        "External application recorded. Continue to the employer's website to complete your application.",
      application: {
        _id: application._id,
        jobSource: application.jobSource,
        externalJobId: application.externalJobId,
        jobTitle: application.jobTitle,
        company: application.company,
        status: application.status,
      },
      applicationUrl: externalJob.applicationUrl,
    });
  }  catch (error) {
      // Duplicate application caught by MongoDB unique index
      if (error.code === 11000) {
        return res.status(409).json({
          success: false,
          message: "You have already applied to this external job",
        });
      }

      console.log("EXTERNAL APPLICATION ERROR:", error.message);

      return res.status(500).json({
        success: false,
        message: "Failed to record external application",
      });
  }
};

module.exports = {
  getExternalJobs, applyToExternalJob
};