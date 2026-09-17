const express = require("express");

const {register, login, getProfile, updateProfile, changePassword} = require("../controllers/authControllers")

const router = express.Router();

const authMiddleware = require("../middlewares/authMiddleware");
const upload = require("../middlewares/uploadMiddleware")

router.post(
  "/register",
  upload.fields([
    { name: "resume", maxCount: 1 },
    { name: "profilePicture", maxCount: 1 },
  ]),
  register
);

router.post("/login", login)

router.get("/profile", authMiddleware, getProfile)

router.put(
  "/profile",
  authMiddleware,
  upload.fields([
    { name: "resume", maxCount: 1 },
    { name: "profilePicture", maxCount: 1 },
  ]),
  updateProfile
);

router.put("/change-password", authMiddleware, changePassword)

module.exports = router;