const express = require("express");
const Razorpay = require("razorpay");
const crypto = require("crypto");
const mongoose = require("mongoose");
const Car = require("../models/Car");
const Payment = require("../models/Payment");
const userAuth = require("../middleware/authentication/user");
const redis = require("../redisClient");

require("dotenv").config();

const router = express.Router();

const RESERVATION_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes

let razorpayInstance = null;
const getRazorpay = () => {
  if (!razorpayInstance) {
    razorpayInstance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
  }
  return razorpayInstance;
};

const CAR_LIST_CACHE_PREFIX = "cars:list:";
const CAR_DETAIL_CACHE_PREFIX = "cars:detail:";

const invalidateCarListCaches = async () => {
  let cursor = "0";
  do {
    const [nextCursor, keys] = await redis.scan(cursor, "MATCH", `${CAR_LIST_CACHE_PREFIX}*`, "COUNT", 100);
    cursor = nextCursor;
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  } while (cursor !== "0");
};

const invalidateCarCaches = async (carId) => {
  await invalidateCarListCaches();
  if (carId) {
    await redis.del(`${CAR_DETAIL_CACHE_PREFIX}${carId}`);
  }
};

// ─── STEP 1: Create Razorpay Order & Reserve Car ───────────────────────
router.post("/create-order/:id", userAuth, async (req, res) => {
  try {
    const carId = req.params.id;
    const userId = req.user.userId;

    // Fixed Booking Amount for demo/test purposes (stays within Razorpay limits)
    const BOOKING_AMOUNT = 10000; // ₹10,000

    // Atomic reservation: only reserve if available OR if the previous reservation expired
    const reservationCutoff = new Date(Date.now() - RESERVATION_TIMEOUT_MS);

    const car = await Car.findOneAndUpdate(
      {
        _id: carId,
        sold: { $ne: true },
        $or: [
          { paymentStatus: "available" },
          { paymentStatus: null },
          { paymentStatus: { $exists: false } },
          { paymentStatus: "pending", reservedAt: { $lt: reservationCutoff } },
        ],
      },
      {
        $set: {
          paymentStatus: "pending",
          reservedBy: userId,
          reservedAt: new Date(),
        },
      },
      { new: true }
    );

    if (!car) {
      // Check why it failed
      const existingCar = await Car.findById(carId);
      if (!existingCar) {
        return res.status(404).json({ message: "Car not found" });
      }
      if (existingCar.sold || existingCar.paymentStatus === "sold") {
        return res.status(400).json({ message: "This car has already been sold" });
      }
      if (existingCar.paymentStatus === "pending") {
        return res.status(409).json({
          message: "Another user is currently checking out this car. Please try again in a few minutes.",
        });
      }
      return res.status(400).json({ message: "Car is not available for purchase" });
    }

    if (car.listedby.toString() === userId) {
      // Release the reservation since dealer can't buy their own car
      await Car.findByIdAndUpdate(carId, {
        paymentStatus: "available",
        reservedBy: null,
        reservedAt: null,
      });
      return res.status(400).json({ message: "You cannot buy your own car" });
    }

    // Create Razorpay order (amount in paise)
    const options = {
      amount: BOOKING_AMOUNT * 100, // Fixed ₹10,000 for booking
      currency: "INR",
      receipt: `rcpt_${carId.slice(-8)}_${Date.now().toString(36)}`,
      notes: {
        carId: carId,
        buyerId: userId,
        carName: car.name,
        type: "Booking Amount"
      },
    };

    const order = await getRazorpay().orders.create(options);

    // Save payment record
    await Payment.create({
      carId,
      buyerId: userId,
      dealerId: car.listedby,
      razorpayOrderId: order.id,
      amount: BOOKING_AMOUNT, // Record the booking amount paid
      status: "created",
    });

    // Save order ID on the car
    await Car.findByIdAndUpdate(carId, { razorpayOrderId: order.id });

    res.status(200).json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      carName: car.name,
      key: process.env.RAZORPAY_KEY_ID,
      paymentType: "Booking Amount"
    });
  } catch (error) {
    console.error("Create order error:", error);

    // Rollback: release the reservation if order creation failed
    const carId = req.params.id;
    try {
      await Car.findByIdAndUpdate(carId, {
        paymentStatus: "available",
        reservedBy: null,
        reservedAt: null,
        razorpayOrderId: null,
      });
    } catch (rollbackErr) {
      console.error("Rollback failed:", rollbackErr.message);
    }

    res.status(500).json({ message: "Failed to initiate payment" });
  }
});

// ─── STEP 2: Verify Payment & Mark Car as Sold (ACID Transaction) ─────
router.post("/verify-payment", userAuth, async (req, res) => {
  const session = await mongoose.startSession();

  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    const userId = req.user.userId;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ message: "Missing payment verification data" });
    }

    // 1. Verify signature
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ message: "Payment verification failed. Invalid signature." });
    }

    // 2. Start MongoDB Transaction for ACID guarantees
    session.startTransaction();

    // Find the car that was reserved by this user with this order
    // NOTE: We don't strictly require paymentStatus: "pending" here because 
    // a race condition with ondismiss/cancel-order might have reset it to "available"
    // while the payment was being processed. The razorpayOrderId is the source of truth.
    const car = await Car.findOne({
      razorpayOrderId: razorpay_order_id,
      reservedBy: new mongoose.Types.ObjectId(userId),
    }).session(session);

    if (!car) {
      await session.abortTransaction();
      return res.status(400).json({ message: "No matching reservation found for this order." });
    }

    if (car.sold || car.paymentStatus === "sold") {
      await session.commitTransaction(); // Already sold, success anyway
      return res.status(200).json({ message: "Car already purchased successfully.", car });
    }

    // 3. Mark car as sold
    car.sold = true;
    car.boughtBy = userId;
    car.paymentStatus = "sold";
    car.reservedBy = null;
    car.reservedAt = null;
    await car.save({ session });

    // 4. Update payment record
    await Payment.findOneAndUpdate(
      { razorpayOrderId: razorpay_order_id },
      {
        razorpayPaymentId: razorpay_payment_id,
        razorpaySignature: razorpay_signature,
        status: "paid",
      },
      { session }
    );

    // 5. Commit transaction
    await session.commitTransaction();

    // Invalidate caches (outside transaction, non-critical)
    try {
      await invalidateCarCaches(car._id.toString());
    } catch (cacheErr) {
      console.error("Cache invalidation error:", cacheErr.message);
    }

    res.status(200).json({ message: "Payment successful! Car purchased.", car });
  } catch (error) {
    await session.abortTransaction();
    console.error("Verify payment error:", error);
    res.status(500).json({ message: "Payment verification failed" });
  } finally {
    session.endSession();
  }
});

// ─── Cancel/Release reservation ───────────────────────────────────────
router.post("/cancel-order/:id", userAuth, async (req, res) => {
  try {
    const carId = req.params.id;
    const userId = req.user.userId;

    const car = await Car.findOneAndUpdate(
      {
        _id: carId,
        reservedBy: userId,
        paymentStatus: "pending",
      },
      {
        $set: {
          paymentStatus: "available",
          reservedBy: null,
          reservedAt: null,
          razorpayOrderId: null,
        },
      },
      { new: true }
    );

    if (!car) {
      return res.status(400).json({ message: "No reservation to cancel" });
    }

    // Mark payment as failed
    await Payment.findOneAndUpdate(
      { carId, buyerId: userId, status: "created" },
      { status: "failed" }
    );

    res.status(200).json({ message: "Reservation cancelled" });
  } catch (error) {
    console.error("Cancel order error:", error);
    res.status(500).json({ message: "Failed to cancel reservation" });
  }
});

// ─── Check car payment status (for UI) ────────────────────────────────
router.get("/payment-status/:id", async (req, res) => {
  try {
    const car = await Car.findById(req.params.id).select("paymentStatus reservedAt sold");
    if (!car) return res.status(404).json({ message: "Car not found" });

    // Auto-release expired reservations
    if (car.paymentStatus === "pending" && car.reservedAt) {
      const elapsed = Date.now() - new Date(car.reservedAt).getTime();
      if (elapsed > RESERVATION_TIMEOUT_MS) {
        await Car.findByIdAndUpdate(req.params.id, {
          paymentStatus: "available",
          reservedBy: null,
          reservedAt: null,
          razorpayOrderId: null,
        });
        return res.status(200).json({ paymentStatus: "available", sold: false });
      }
    }

    res.status(200).json({
      paymentStatus: car.paymentStatus,
      sold: car.sold,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to get payment status" });
  }
});

module.exports = router;
