const mongoose = require("mongoose");
const { Schema, model } = mongoose;

const paymentSchema = new Schema({
  carId: {
    type: Schema.Types.ObjectId,
    ref: 'Car',
    required: true,
  },
  buyerId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  dealerId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  razorpayOrderId: {
    type: String,
    required: true,
  },
  razorpayPaymentId: {
    type: String,
    default: null,
  },
  razorpaySignature: {
    type: String,
    default: null,
  },
  amount: {
    type: Number,
    required: true,
  },
  currency: {
    type: String,
    default: 'INR',
  },
  status: {
    type: String,
    enum: ['created', 'paid', 'failed'],
    default: 'created',
  },
}, { timestamps: true });

const Payment = model('Payment', paymentSchema);
module.exports = Payment;
