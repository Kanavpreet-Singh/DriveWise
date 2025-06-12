const express = require("express");
const router = express.Router();
const nodemailer = require("nodemailer");
require('dotenv').config();
const User = require("../models/User"); 
const { z } = require('zod');
const otpStore = new Map();

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

  try {
    
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = Date.now() + 5 * 60 * 1000; // 5 mins

    
    otpStore.set(email, { otp, otpExpiry, username, password });

    
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

  //  await transporter.sendMail(mailOptions);
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

  try {
    // Save user to DB only after OTP is valid
    const newUser = new User({
      username,
      email,
      password,
      isVerified: true,
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


module.exports = router;
