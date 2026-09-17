const multer = require("multer");

const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    if (file.fieldname === "resume") {
      if (file.mimetype === "application/pdf") {
        return cb(null, true);
      }

      return cb(new Error("Resume must be a PDF"));
    }

    if (file.fieldname === "profilePicture") {
      const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/webp",
      ];

      if (allowedTypes.includes(file.mimetype)) {
        return cb(null, true);
      }

      return cb(new Error("Profile picture must be JPG, PNG or WEBP"));
    }

    cb(new Error("Invalid file field"));
  },
});

module.exports = upload;