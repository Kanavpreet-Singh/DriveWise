const mongoose = require("mongoose");
const { Schema, model } = mongoose;

const carImageUploadJobSchema = new Schema(
  {
    carId: {
      type: Schema.Types.ObjectId,
      ref: "Car",
      required: true,
      index: true,
    },
    imagePayloads: {
      type: [String],
      required: true,
      default: [],
    },
    keepExistingImages: {
      type: [String],
      default: [],
    },
    imageStatuses: [
      {
        _id: false,
        index: { type: Number, required: true },
        fileName: { type: String, default: "Image" },
        status: {
          type: String,
          enum: ["queued", "uploading", "completed", "failed"],
          default: "queued",
        },
        error: { type: String, default: null },
      },
    ],
    status: {
      type: String,
      enum: ["queued", "processing", "completed", "failed"],
      default: "queued",
    },
    error: {
      type: String,
      default: null,
    },
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
  },
  { timestamps: true }
);

carImageUploadJobSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const CarImageUploadJob = model("CarImageUploadJob", carImageUploadJobSchema);
module.exports = CarImageUploadJob;
