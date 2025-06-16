const express = require("express");
const router = express.Router();
const nodemailer = require("nodemailer");
require('dotenv').config();
const jwt = require("jsonwebtoken");
const User = require("../models/User"); 
const { z } = require('zod');
const otpStore = new Map();
const bcrypt=require("bcrypt");
const userAuth = require("../middleware/authentication/user");
const  Car  = require("../models/Car");
const rateLimitMap = new Map(); // email -> timestamp of last OTP request

router.post("/signup-request", async (req, res) => {
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
  });

  const validationResult = signupRequestSchema.safeParse(req.body);

  if (!validationResult.success) {
    const errors = validationResult.error.errors.map(err => err.message);
    return res.status(400).json({ message: errors[0] }); 
  }

  const { username, email, password } = validationResult.data;

  
  const now = Date.now();
  const lastRequestTime = rateLimitMap.get(email);
  const COOLDOWN = 2 * 60 * 1000; 

  if (lastRequestTime && now - lastRequestTime < COOLDOWN) {
    const waitTime = Math.ceil((COOLDOWN - (now - lastRequestTime)) / 1000);
    return res.status(429).json({ message: `Please wait ${waitTime} seconds before requesting another OTP.` });
  }

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = Date.now() + 5 * 60 * 1000; // 5 mins

    otpStore.set(email, { otp, otpExpiry, username, password });
    rateLimitMap.set(email, now); // ✅ Update rate limit timestamp

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: '"DriveCircle" <drivecircle05@gmail.com>',
      to: email,
      subject: "OTP Verification",
      html: `<p>Your OTP is <b>${otp}</b>. It is valid for 5 minutes.</p>`,
    };

    // await transporter.sendMail(mailOptions);
    console.log(otp);

    res.status(200).json({ message: "OTP sent to email." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to send OTP." });
  }
});

router.post("/signup-verify", async (req, res) => {
  const { email, otp } = req.body;

  const record = otpStore.get(email);
  if (!record) {
    return res.status(400).json({ message: "OTP not requested for this email" });
  }

  const { otp: storedOtp, otpExpiry, username, password } = record;

  if (Date.now() > otpExpiry) {
    otpStore.delete(email);
    return res.status(400).json({ message: "OTP has expired" });
  }

  if (otp !== storedOtp) {
    return res.status(400).json({ message: "Invalid OTP" });
  }
  console.log('you entered'+otp);
  console.log('stored otp is'+storedOtp);

  const hashedPassword=await bcrypt.hash(password,5);

  const isInstituteEmail = email.endsWith("@pec.edu.in");

  try {
    // Save user to DB only after OTP is valid
    const newUser = new User({
      username,
      email,
      password:hashedPassword,
      isVerified: true,
      role: isInstituteEmail ? "dealer" : "customer",
    });

    await newUser.save();

    // Clean up OTP from memory
    otpStore.delete(email);

    res.status(201).json({ message: "User registered successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error saving user" });
  }
});

router.post('/signin',async(req,res)=>{

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

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(400).json({ message: "Wrong password" });
    }

    const token = jwt.sign(
      { userId: user._id, email: user.email,username:user.username,role:user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.status(200).json({
      message: "You are logged in",
      token, 
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

router.get('/getuser',userAuth,async(req,res)=>{

  const {userId}=req.user;
  console.log(userId);
  let user=await User.findById(userId);

  if(!user) {

    return res.status(400).json({message:'user not found'})

  }

  return res.status(200).json({user:user});

});


router.get('/dealer',userAuth,async(req,res)=>{

  const {userId}=req.user;
  console.log(userId);
  let dealer=await User.findById(userId);

  if(!dealer) {

    return res.status(400).json({message:'dealer not found'})

  }

  console.log(dealer);

  let cars=await Car.find({listedby:dealer._id});
  

  return res.status(200).json({message:'dealer found',dealer:dealer,cars:cars});

});


module.exports = router;
