const express = require("express");
const cors = require("cors");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const authRoutes = require("./routes/authRoutes")
const jobRoutes = require("./routes/jobRoutes");
const applyRoutes = require("./routes/applyRoutes")

app.use("/api/auth", authRoutes)
app.use("/api/jobs", jobRoutes)
app.use("/api/apply", applyRoutes)

app.use((err, req, res, next) => {
  if (err.name === "MulterError") {
    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }

  if (
    err.message === "Resume must be a PDF" ||
    err.message === "Profile picture must be JPG, PNG or WEBP" ||
    err.message === "Invalid file field"
  ) {
    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }

  next(err);
});
module.exports = app;