const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken")
const cloudinary = require("../config/cloudinary")
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
}

const uploadProfilePicture = (fileBuffer) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "job-portal/profile-pictures",
        resource_type: "image",
      },
      (error, result) => {
        if (error) {
          console.log("CLOUDINARY ERROR:", error);
          reject(error);
        } else {
          console.log(
            "CLOUDINARY SUCCESS:",
            result.secure_url
          );
          resolve(result);
        }
      }
    );

    stream.end(fileBuffer);
  });
};

const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check required fields
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email and password are required",
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "User already exists",
      });
    }
    
    let resumeUrl = null;
    let profilePictureUrl = null;

    if (req.files?.resume) {
      const result = await uploadResume(req.files.resume[0].buffer);
      resumeUrl = result.secure_url;
    }

    if (req.files?.profilePicture) {
      const result = await uploadProfilePicture(
        req.files.profilePicture[0].buffer
      );

      profilePictureUrl = result.secure_url;
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    // Create user
    const user = await User.create({
      name,
      email,
      password : hashedPassword,
      resume: resumeUrl,
      profilePicture: profilePictureUrl,
    });

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
    } catch (error) {
      console.log("REGISTER ERROR:", error.message);

      res.status(500).json({
        success: false,
        message: "Failed to register user",
      });
    }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Check required fields
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    // 2. Find user
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // 3. Compare password with hashed password
    const isPasswordCorrect = await bcrypt.compare(
      password,
      user.password
    );

    if (!isPasswordCorrect) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // 4. Create JWT
    const token = jwt.sign(
      {
        userId: user._id,
        role: user.role,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "5d",
      }
    );

    // 5. Send response
    res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
    } catch (error) {
      console.log("LOGIN ERROR:", error.message);

      res.status(500).json({
        success: false,
        message: "Failed to login",
      });
    }
};

const getProfile = async(req, res) => {
  try{
    const user = await User.findById(req.user.userId).select("-password")

    if(!user){
      return res.status(404).json({
        success: false,
        message: "User not found"
      })
    }

    res.status(200).json({
      success: true,
      user,
    })
    } catch (error) {
      console.log("GET PROFILE ERROR:", error.message);

      res.status(500).json({
        success: false,
        message: "Failed to fetch profile",
      });
    }
}

const updateProfile = async (req, res) => {
  try {
    const { name, skills } = req.body;

    const user = await User.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (name !== undefined) {
      user.name = name;
    }

    if (skills !== undefined) {
      user.skills = skills;
    }

    if (req.files?.resume) {
      const result = await uploadResume(
        req.files.resume[0].buffer
      );

      user.resume = result.secure_url;
    }

    if (req.files?.profilePicture) {
      const result = await uploadProfilePicture(
        req.files.profilePicture[0].buffer
      );

      user.profilePicture = result.secure_url;
    }
    await user.save();

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        resume: user.resume,
        skills: user.skills,
        profilePicture: user.profilePicture,
      },
    });
    } catch (error) {
      console.log("UPDATE PROFILE ERROR:", error.message);

      res.status(500).json({
        success: false,
        message: "Failed to update profile",
      });
    }
};

const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Current password and new password are required",
      });
    }

    const user = await User.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const isPasswordCorrect = await bcrypt.compare(
      currentPassword,
      user.password
    );

    if (!isPasswordCorrect) {
      return res.status(401).json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    user.password = await bcrypt.hash(newPassword, 10);

    await user.save();

    res.status(200).json({
      success: true,
      message: "Password changed successfully",
    });
    } catch (error) {
      console.log("CHANGE PASSWORD ERROR:", error.message);

      res.status(500).json({
        success: false,
        message: "Failed to change password",
      });
    }
};

module.exports = { register, login, getProfile, updateProfile, changePassword };