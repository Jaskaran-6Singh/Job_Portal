const express = require("express")

const {createJob, getAllJobs, getJobById, updateJob, deleteJob} = require("../controllers/jobController")

const authMiddleware = require("../middlewares/authMiddleware")

const { getExternalJobs } = require("../controllers/externalJobController")
const { saveJob, getSavedJobs, removeSavedJob } = require("../controllers/savedJobController")


const router = express.Router()

router.post("/", authMiddleware, createJob)

router.get("/", getAllJobs)

router.get("/external", getExternalJobs)

router.post("/save", authMiddleware, saveJob)

router.get("/saved", authMiddleware, getSavedJobs)

router.delete("/save", authMiddleware, removeSavedJob)

router.get("/:id", getJobById)

router.put("/:id", authMiddleware, updateJob)

router.delete("/:id", authMiddleware, deleteJob)

module.exports = router