const express = require("express");
const router = express.Router();
require('dotenv').config();
const jwt = require("jsonwebtoken");
const User = require("../models/User"); 
const { z } = require('zod');
const sendOTPEmail = require("../utils/sendOTPEmail");
const otpStore = new Map();
const passwordResetStore = new Map();
const bcrypt=require("bcrypt");
const userAuth = require("../middleware/authentication/user");
const  Car  = require("../models/Car");
const rateLimitMap = new Map(); // email -> timestamp of last OTP request
const passwordResetRateLimitMap = new Map();
const  Conversation  = require("../models/Conversation");
const  Message  = require("../models/Message");
const crypto = require("crypto");
const { authLimiter, globalLimiter } = require("../middleware/rateLimiter");

router.get('/health', (req, res) => {
  res.status(200).send("Backend is awake!");
});


router.post("/signup-request", authLimiter, async (req, res) => {
  const signupRequestSchema = z.object({
    username: z
      .string()
      .min(3, "Username must be at least 3 characters")
      .max(15, "Username must be at most 15 characters"),

    email: z
      .string()
      .email("Invalid email format")
      .max(100, "Email is too long"),

    password: z
      .string()
      .min(3, "Password must be at least 3 characters")
      .max(50, "Password must be at most 50 characters"),

    profilePic: z
      .string()
      .url("Profile picture must be a valid URL")
      .optional()
  });

  const validationResult = signupRequestSchema.safeParse(req.body);

  if (!validationResult.success) {
    const errors = validationResult.error.errors.map(err => err.message);
    return res.status(400).json({ message: errors[0] }); 
  }

  const { username, email, password, profilePic } = validationResult.data;
  const normalizedProfilePic = profilePic?.trim() ? profilePic.trim() : undefined;

  const now = Date.now();
  const lastRequestTime = rateLimitMap.get(email);
  const COOLDOWN = 2 * 60 * 1000; // 2 minutes cooldown

  if (lastRequestTime && now - lastRequestTime < COOLDOWN) {
    const waitTime = Math.ceil((COOLDOWN - (now - lastRequestTime)) / 1000);
    return res.status(429).json({ message: `Please wait ${waitTime} seconds before requesting another OTP.` });
  }

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser && existingUser.isActive) {
      return res.status(400).json({ message: "User already exists" });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = Date.now() + 5 * 60 * 1000; // 5 mins

    
    otpStore.set(email, { otp, otpExpiry, username, password, profilePic: normalizedProfilePic });
    rateLimitMap.set(email, now);

    await sendOTPEmail(email, otp);
    

    res.status(200).json({ message: "OTP sent to email." });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Failed to send OTP.",
      ...(process.env.NODE_ENV !== "production" ? { error: err.message } : {}),
    });
  }
});


router.post("/signup-verify", authLimiter, async (req, res) => {
  const { email, otp } = req.body;

  const record = otpStore.get(email);
  if (!record) {
    return res.status(400).json({ message: "OTP not requested for this email" });
  }

  const { otp: storedOtp, otpExpiry, username, password, profilePic } = record;

  if (Date.now() > otpExpiry) {
    otpStore.delete(email);
    return res.status(400).json({ message: "OTP has expired" });
  }

  if (otp !== storedOtp) {
    return res.status(400).json({ message: "Invalid OTP" });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 5);
    const isInstituteEmail = email.endsWith("@pec.edu.in");

    // Check if we are reactivating an old account or creating a new one
    let savedUser = await User.findOne({ email });

    if (savedUser) {
      // Reactivation
      savedUser.username = username;
      savedUser.password = hashedPassword;
      savedUser.isVerified = true;
      savedUser.isActive = true;
      if (profilePic) savedUser.profilePic = profilePic;
      await savedUser.save();
    } else {
      // New registration
      savedUser = new User({
        username,
        email,
        password: hashedPassword,
        isVerified: true,
        role: isInstituteEmail ? "dealer" : "customer",
        ...(profilePic ? { profilePic } : {})
      });
      await savedUser.save();
    }

    const token = jwt.sign(
      { userId: savedUser._id, email: savedUser.email, username: savedUser.username, role: savedUser.role, profilePic: savedUser.profilePic },
      process.env.JWT_SECRET,
      { expiresIn: "12h" }
    );

    otpStore.delete(email);

    const isProduction = process.env.NODE_ENV === 'production';
    res.cookie('token', token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'None' : 'Lax',
      maxAge: 12 * 60 * 60 * 1000 // 12 hours
    });

    res.status(201).json({ 
      message: "User registered successfully",
      user: {
        id: savedUser._id,
        email: savedUser.email,
        username: savedUser.username
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error saving user" });
  }
});


router.post('/signin', authLimiter, async(req,res)=>{

  const signinSchema = z.object({
  email: z
    .string()
    .email("Invalid email format")
    .max(100, "Email too long"),

  password: z
    .string()
    .min(3, "Password must be atleast 3 characters")
    .max(50, "Password too long"),
});

  const result = signinSchema.safeParse(req.body);

  if (!result.success) {
    const errorMessage = result.error.errors[0].message;
    return res.status(400).json({ message: errorMessage });
  }

  const { email, password } = result.data;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: "Wrong email" });
    }

    if (!user.isActive) {
      return res.status(403).json({ message: "Account is deactivated. Sign up with the same email to reactivate it." });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(400).json({ message: "Wrong password" });
    }

    const token = jwt.sign(
      { userId: user._id, email: user.email,username:user.username,role:user.role,profilePic: user.profilePic },
      process.env.JWT_SECRET,
      { expiresIn: "12h" }
    );

    const isProduction = process.env.NODE_ENV === 'production';
    res.cookie('token', token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'None' : 'Lax',
      maxAge: 12 * 60 * 60 * 1000 // 12 hours
    });

    return res.status(200).json({
      message: "You are logged in",
      user: {
        id: user._id,
        email: user.email,
        username: user.username,
      }
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Internal server error" });
  }

});

router.post('/forgot-password-request', authLimiter, async (req, res) => {
  const forgotPasswordSchema = z.object({
    email: z.string().email("Invalid email format").max(100, "Email is too long"),
  });

  const result = forgotPasswordSchema.safeParse(req.body);

  if (!result.success) {
    const errorMessage = result.error.errors[0].message;
    return res.status(400).json({ message: errorMessage });
  }

  const { email } = result.data;
  const now = Date.now();
  const lastRequestTime = passwordResetRateLimitMap.get(email);
  const COOLDOWN = 2 * 60 * 1000;

  if (lastRequestTime && now - lastRequestTime < COOLDOWN) {
    const waitTime = Math.ceil((COOLDOWN - (now - lastRequestTime)) / 1000);
    return res.status(429).json({ message: `Please wait ${waitTime} seconds before requesting another OTP.` });
  }

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: "No account found with this email" });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = Date.now() + 10 * 60 * 1000;
    const resetToken = crypto.randomBytes(32).toString("hex");

    passwordResetStore.set(email, {
      otp,
      otpExpiry,
      verified: false,
      resetToken,
    });
    passwordResetRateLimitMap.set(email, now);

    await sendOTPEmail(email, otp, {
      subject: "Password Reset OTP",
      messageText: "Your password reset OTP is",
      expiryText: "It expires in 10 minutes.",
    });

    return res.status(200).json({ message: "OTP sent to email." });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      message: "Failed to send reset OTP.",
      ...(process.env.NODE_ENV !== "production" ? { error: err.message } : {}),
    });
  }
});

router.post('/forgot-password-verify', authLimiter, async (req, res) => {
  const forgotPasswordVerifySchema = z.object({
    email: z.string().email("Invalid email format").max(100, "Email is too long"),
    otp: z.string().min(6, "OTP is required").max(6, "OTP must be 6 digits"),
  });

  const result = forgotPasswordVerifySchema.safeParse(req.body);

  if (!result.success) {
    const errorMessage = result.error.errors[0].message;
    return res.status(400).json({ message: errorMessage });
  }

  const { email, otp } = result.data;
  const record = passwordResetStore.get(email);

  if (!record) {
    return res.status(400).json({ message: "OTP not requested for this email" });
  }

  if (Date.now() > record.otpExpiry) {
    passwordResetStore.delete(email);
    return res.status(400).json({ message: "OTP has expired" });
  }

  if (otp !== record.otp) {
    return res.status(400).json({ message: "Invalid OTP" });
  }

  record.verified = true;
  passwordResetStore.set(email, record);

  return res.status(200).json({
    message: "OTP verified successfully",
    resetToken: record.resetToken,
  });
});

router.post('/reset-password', authLimiter, async (req, res) => {
  const resetPasswordSchema = z.object({
    email: z.string().email("Invalid email format").max(100, "Email is too long"),
    resetToken: z.string().min(10, "Reset token is required"),
    password: z.string().min(3, "Password must be at least 3 characters").max(50, "Password must be at most 50 characters"),
  });

  const result = resetPasswordSchema.safeParse(req.body);

  if (!result.success) {
    const errorMessage = result.error.errors[0].message;
    return res.status(400).json({ message: errorMessage });
  }

  const { email, resetToken, password } = result.data;
  const record = passwordResetStore.get(email);

  if (!record) {
    return res.status(400).json({ message: "Password reset session not found" });
  }

  if (!record.verified) {
    return res.status(400).json({ message: "OTP must be verified first" });
  }

  if (record.resetToken !== resetToken) {
    return res.status(400).json({ message: "Invalid reset session" });
  }

  if (Date.now() > record.otpExpiry) {
    passwordResetStore.delete(email);
    return res.status(400).json({ message: "Reset session expired" });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 5);

    await User.findOneAndUpdate(
      { email },
      { password: hashedPassword }
    );

    passwordResetStore.delete(email);

    return res.status(200).json({ message: "Password updated successfully" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Failed to reset password" });
  }
});

router.delete("/", userAuth, async (req, res) => {
  try {
    const { userId } = req.user;

    // 1. Mark User as Inactive (Soft Delete)
    // We clear the profilePic and could optionally prefix the username
    await User.findByIdAndUpdate(userId, { 
      isActive: false, 
      profilePic: null,
      username: `Deleted User (${userId.toString().slice(-4)})`
    });

    // 2. Delete ONLY unsold cars listed by this user
    // We MUST keep sold cars so the buyers' history is preserved
    await Car.deleteMany({ listedby: userId, sold: false });

    // 3. Cleanup social data (Privacy)
    const conversations = await Conversation.find({ members: userId });
    const conversationIds = conversations.map(conv => conv._id);

    await Conversation.deleteMany({ _id: { $in: conversationIds } });
    await Message.deleteMany({ conversationId: { $in: conversationIds } });

    res.status(200).json({ success: true, message: "User and related data deleted." });
  } catch (error) {
    console.error("Error deleting user and related data:", error);
    res.status(500).json({ success: false, error: "Server error" });
  }
});

router.get('/getgeneraluser/:id', globalLimiter, async(req,res)=>{

  
  
  let user=await User.findById(req.params.id);

  if(!user) {

    return res.status(400).json({message:'user not found'})

  }

  return res.status(200).json({user:user});

});


router.get('/getuser', globalLimiter, userAuth,async(req,res)=>{

  const {userId}=req.user;
  
  let user=await User.findById(userId).populate('likedlist');

  if(!user) {

    return res.status(400).json({message:'user not found'})

  }

  return res.status(200).json({user:user});

});

router.get('/dealer', globalLimiter, userAuth, async (req, res) => {
  const { userId } = req.user;
  

  let dealer = await User.findById(userId).populate('likedlist'); 

  if (!dealer) {
    return res.status(400).json({ message: 'dealer not found' });
  }

  let cars = await Car.find({ listedby: dealer._id }).populate('boughtBy', 'username email profilePic');

  return res.status(200).json({
    message: 'dealer found',
    dealer,
    cars,
  });
});


// 1. Get current user data (Verify Cookie)
router.get('/me', globalLimiter, userAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select("-password -__v");
    if (!user || !user.isActive) {
      return res.status(401).json({ message: "User not found or inactive" });
    }
    res.status(200).json({ user });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
});

// 2. Clear Cookie (Logout)
router.post('/logout', (req, res) => {
  const isProduction = process.env.NODE_ENV === 'production';
  res.clearCookie('token', {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'None' : 'Lax'
  });
  res.status(200).json({ message: "Logged out successfully" });
});

module.exports = router;
