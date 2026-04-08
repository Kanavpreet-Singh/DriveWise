const path = require("path");
const dotenv = require("dotenv");

dotenv.config({ path: path.resolve(__dirname, ".env") });
const IORedis = require("ioredis");
const mongoose = require("mongoose");
const { Worker, QueueEvents } = require("bullmq");
const http = require("http");

const redisUrl = (process.env.REDIS_URL || "").trim();
const queueName = (process.env.BULLMQ_QUEUE_NAME || "messaging-queue").trim();
const mongoUrl = (process.env.MONGO_URL || "").trim();
const cloudName = (process.env.CLOUDINARY_CLOUD_NAME || "").trim();
const uploadPreset = (process.env.CLOUDINARY_UPLOAD_PRESET || "").trim();
const CAR_LIST_CACHE_PREFIX = "cars:list:";
const CAR_DETAIL_CACHE_PREFIX = "cars:detail:";
const buildImagePublicId = (carId, index) => `drivewise/cars/${carId}/image-${index + 1}`;

if (!redisUrl) {
  throw new Error("Missing REDIS_URL in environment.");
}

if (!/^rediss?:\/\//i.test(redisUrl)) {
  throw new Error("Invalid REDIS_URL. Use redis:// or rediss://");
}

if (!mongoUrl) {
  throw new Error("Missing MONGO_URL in environment.");
}

if (!cloudName || !uploadPreset) {
  throw new Error("Missing CLOUDINARY_CLOUD_NAME or CLOUDINARY_UPLOAD_PRESET in environment.");
}

const carSchema = new mongoose.Schema(
  {
    image: { type: [String], default: [] },
    imageProcessingStatus: {
      type: String,
      enum: ["pending", "queued", "processing", "completed", "failed"],
      default: "pending",
    },
    imageProcessingError: { type: String, default: null },
    imageJobId: { type: String, default: null },
  },
  { collection: "cars", timestamps: true }
);

const Car = mongoose.models.Car || mongoose.model("Car", carSchema);

const carImageUploadJobSchema = new mongoose.Schema(
  {
    carId: { type: mongoose.Schema.Types.ObjectId, ref: "Car", required: true },
    imagePayloads: { type: [String], required: true, default: [] },
    keepExistingImages: { type: [String], default: [] },
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
    error: { type: String, default: null },
    expiresAt: { type: Date },
  },
  { collection: "carimageuploadjobs", timestamps: true }
);

const CarImageUploadJob =
  mongoose.models.CarImageUploadJob ||
  mongoose.model("CarImageUploadJob", carImageUploadJobSchema);

const connection = new IORedis(redisUrl, {
  maxRetriesPerRequest: null,
  enableReadyCheck: true,
});

connection.on("error", (err) => {
  console.error("[BullMQ] Redis error:", err.message);
});

const buildDetailCacheKey = (carId) => `${CAR_DETAIL_CACHE_PREFIX}${carId}`;

async function invalidateCarCaches(carId) {
  let cursor = "0";
  do {
    const [nextCursor, keys] = await connection.scan(
      cursor,
      "MATCH",
      `${CAR_LIST_CACHE_PREFIX}*`,
      "COUNT",
      100
    );
    cursor = nextCursor;
    if (keys.length > 0) {
      await connection.del(...keys);
    }
  } while (cursor !== "0");

  if (carId) {
    await connection.del(buildDetailCacheKey(carId));
  }
}

async function uploadToCloudinary(fileInput, carId, index) {
  const formData = new FormData();
  formData.append("file", fileInput);
  formData.append("upload_preset", uploadPreset);
  formData.append("public_id", buildImagePublicId(carId, index));

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/upload`,
    {
      method: "POST",
      body: formData,
    }
  );

  const result = await response.json();

  if (!response.ok || !result.secure_url) {
    throw new Error(result?.error?.message || "Cloudinary upload failed");
  }

  return result.secure_url;
}

const worker = new Worker(
  queueName,
  async (job) => {
    if (job.name !== "car-images-upload") {
      console.log(`[BullMQ] Ignored job ${job.id} (${job.name})`);
      return { skipped: true };
    }

    const { carId, payloadDocId } = job.data || {};

    if (!carId || !payloadDocId) {
      console.warn(
        `[BullMQ] Skipping job ${job.id} — missing carId or payloadDocId. Actual data:`,
        JSON.stringify(job.data)
      );
      return { skipped: true, reason: "missing carId or payloadDocId" };
    }

    const payloadDoc = await CarImageUploadJob.findById(payloadDocId);
    if (!payloadDoc || !Array.isArray(payloadDoc.imagePayloads) || payloadDoc.imagePayloads.length < 1) {
      throw new Error("Image payload document missing or invalid");
    }

    await Car.findByIdAndUpdate(carId, {
      imageProcessingStatus: "processing",
      imageProcessingError: null,
      imageJobId: job.id?.toString?.() || null,
    });

    payloadDoc.status = "processing";
    payloadDoc.error = null;
    await payloadDoc.save();

    // Upload images sequentially so the UI can track per-image progress
    const uploadedImages = [];
    const failures = [];

    for (let i = 0; i < payloadDoc.imagePayloads.length; i++) {
      // Mark this image as uploading
      await CarImageUploadJob.updateOne(
        { _id: payloadDoc._id, "imageStatuses.index": i },
        { $set: { "imageStatuses.$.status": "uploading" } }
      );

      try {
        const url = await uploadToCloudinary(payloadDoc.imagePayloads[i], carId, i);
        uploadedImages.push(url);

        await CarImageUploadJob.updateOne(
          { _id: payloadDoc._id, "imageStatuses.index": i },
          { $set: { "imageStatuses.$.status": "completed" } }
        );
      } catch (err) {
        const errMsg = err.message || "unknown error";
        failures.push(`image ${i + 1}: ${errMsg}`);

        await CarImageUploadJob.updateOne(
          { _id: payloadDoc._id, "imageStatuses.index": i },
          { $set: { "imageStatuses.$.status": "failed", "imageStatuses.$.error": errMsg } }
        );
      }
    }

    const keptImages = Array.isArray(payloadDoc.keepExistingImages)
      ? payloadDoc.keepExistingImages
      : [];
    const finalImages = [...keptImages, ...uploadedImages];

    if (failures.length > 0) {
      const failMessage = `Partial upload failure (${uploadedImages.length}/${payloadDoc.imagePayloads.length}). ${failures.join(" | ")}`;
      await Car.findByIdAndUpdate(carId, {
        image: finalImages,
        imageProcessingStatus: "failed",
        imageProcessingError: failMessage,
        imageJobId: job.id?.toString?.() || null,
      });

      payloadDoc.status = "failed";
      payloadDoc.error = failMessage;
      await payloadDoc.save();

      await invalidateCarCaches(carId);
      throw new Error(`Partial upload failure (${uploadedImages.length}/${payloadDoc.imagePayloads.length})`);
    }

    await Car.findByIdAndUpdate(carId, {
      image: finalImages,
      imageProcessingStatus: "completed",
      imageProcessingError: null,
      imageJobId: job.id?.toString?.() || null,
    });

    payloadDoc.status = "completed";
    payloadDoc.error = null;
    payloadDoc.imagePayloads = [];
    payloadDoc.keepExistingImages = [];
    await payloadDoc.save();

    await invalidateCarCaches(carId);

    return { ok: true, uploadedCount: uploadedImages.length };
  },
  {
    connection,
    concurrency: Number(process.env.BULLMQ_WORKER_CONCURRENCY || 5),
  }
);

const queueEvents = new QueueEvents(queueName, { connection });

worker.on("ready", () => {
  console.log(`[BullMQ] Worker is ready for queue: ${queueName}`);
});

worker.on("completed", (job) => {
  console.log(`[BullMQ] Job completed: ${job.id}`);
});

worker.on("failed", (job, err) => {
  console.error(`[BullMQ] Job failed: ${job?.id}`, err.message);
});

queueEvents.on("error", (err) => {
  console.error("[BullMQ] QueueEvents error:", err.message);
});

async function shutdown(signal) {
  console.log(`[BullMQ] ${signal} received. Shutting down worker...`);
  await worker.close();
  await queueEvents.close();
  await mongoose.connection.close();
  await connection.quit();
  process.exit(0);
}

async function startWorker() {
  await mongoose.connect(mongoUrl);
  console.log("[BullMQ] Worker connected to MongoDB");
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

startWorker().catch((error) => {
  console.error("[BullMQ] Failed to start worker:", error.message);
  process.exit(1);
});

// --- Minimal HTTP server for Render Health Check ---
const port = process.env.PORT || 3001;
const healthServer = http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("Worker is healthy\n");
});

healthServer.listen(port, () => {
  console.log(`[Render] Health check server listening on port ${port}`);
});
