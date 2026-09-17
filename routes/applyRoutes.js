const express = require("express")

const{applyToJob, getMyApplications, getApplicationById, getAllApplications, updateApplicationStatus} = require("../controllers/applyController")

const authMiddleware = require("../middlewares/authMiddleware")
const upload = require("../middlewares/uploadMiddleware")
const adminMiddleware = require("../middlewares/adminMiddleware")
const { applyToExternalJob } = require("../controllers/externalJobController")

const router = express.Router()

router.get("/my-applications", authMiddleware, getMyApplications)

router.get("/admin/all", authMiddleware, adminMiddleware, getAllApplications)

router.patch("/:id/status", authMiddleware, adminMiddleware, updateApplicationStatus)

router.get("/:id", authMiddleware, getApplicationById)

// External jobs
router.post(
  "/external",
  authMiddleware,
  upload.single("resume"),
  applyToExternalJob
);

// MongoDB jobs
router.post("/:jobId", authMiddleware, upload.single("resume"), applyToJob)

module.exports = router;