const express = require("express");
const Car = require("../models/Car");
const Comment = require("../models/Comment");
const { GoogleGenAI } = require("@google/genai");
const userAuth = require("../middleware/authentication/user");
const User = require("../models/User");
const CarImageUploadJob = require("../models/CarImageUploadJob");
const redis = require("../redisClient");
const { carImageQueue } = require("../queues/carImageQueue");
const { creationLimiter, globalLimiter } = require("../middleware/rateLimiter");
const router = express.Router();

require("dotenv").config();

const CAR_LIST_CACHE_PREFIX = "cars:list:";
const CAR_DETAIL_CACHE_PREFIX = "cars:detail:";
const CAR_CACHE_TTL_SECONDS = Number(process.env.REDIS_CAR_CACHE_TTL || 0);
const cloudName = (process.env.CLOUDINARY_CLOUD_NAME || "").trim();
const uploadPreset = (process.env.CLOUDINARY_UPLOAD_PRESET || "").trim();

const buildListCacheKey = (filters) => {
  const sortedEntries = Object.entries(filters).sort(([a], [b]) => a.localeCompare(b));
  return `${CAR_LIST_CACHE_PREFIX}${JSON.stringify(Object.fromEntries(sortedEntries))}`;
};

const buildDetailCacheKey = (carId) => `${CAR_DETAIL_CACHE_PREFIX}${carId}`;

const setCacheValue = async (key, payload) => {
  const value = JSON.stringify(payload);

  // TTL = 0 means keep forever until explicit invalidation.
  if (CAR_CACHE_TTL_SECONDS > 0) {
    await redis.set(key, value, "EX", CAR_CACHE_TTL_SECONDS);
    return;
  }

  await redis.set(key, value);
};

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
    await redis.del(buildDetailCacheKey(carId));
  }
};

const buildImagePublicId = (carId, index) => {
  const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
  return `drivewise/cars/${carId}/img-${uniqueSuffix}-${index + 1}`;
};

const uploadImagePayloadToCloudinary = async (fileInput, carId, index) => {
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
    throw new Error(result?.error?.message || `Cloudinary upload failed for image ${index + 1}`);
  }

  return result.secure_url;
};

const fallbackUploadImages = async ({ carId, imagePayloads, payloadDocId }) => {
  const uploadedImages = [];
  const failures = [];

  for (let i = 0; i < imagePayloads.length; i++) {
    // Mark this image as uploading
    if (payloadDocId) {
      await CarImageUploadJob.updateOne(
        { _id: payloadDocId, 'imageStatuses.index': i },
        { $set: { 'imageStatuses.$.status': 'uploading' } }
      );
    }

    try {
      const url = await uploadImagePayloadToCloudinary(imagePayloads[i], carId, i);
      uploadedImages.push(url);

      if (payloadDocId) {
        await CarImageUploadJob.updateOne(
          { _id: payloadDocId, 'imageStatuses.index': i },
          { $set: { 'imageStatuses.$.status': 'completed' } }
        );
      }
    } catch (err) {
      const errMsg = err.message || 'unknown error';
      failures.push(`image ${i + 1}: ${errMsg}`);

      if (payloadDocId) {
        await CarImageUploadJob.updateOne(
          { _id: payloadDocId, 'imageStatuses.index': i },
          { $set: { 'imageStatuses.$.status': 'failed', 'imageStatuses.$.error': errMsg } }
        );
      }
    }
  }

  return { uploadedImages, failures };
};

const runFallbackUploadInBackground = ({ carId, payloadDocId, fallbackReason }) => {
  setImmediate(async () => {
    try {
      const payloadDoc = await CarImageUploadJob.findById(payloadDocId);
      if (!payloadDoc || !Array.isArray(payloadDoc.imagePayloads) || payloadDoc.imagePayloads.length === 0) {
        await Car.findByIdAndUpdate(carId, {
          imageProcessingStatus: 'failed',
          imageProcessingError: `Fallback payload missing: ${fallbackReason}`,
        });
        return;
      }

      await Car.findByIdAndUpdate(carId, {
        imageProcessingStatus: 'processing',
        imageProcessingError: null,
        imageJobId: null,
      });

      payloadDoc.status = 'processing';
      payloadDoc.error = null;
      await payloadDoc.save();

      const { uploadedImages, failures } = await fallbackUploadImages({
        carId,
        imagePayloads: payloadDoc.imagePayloads,
        payloadDocId,
      });

      const keptImages = Array.isArray(payloadDoc.keepExistingImages)
        ? payloadDoc.keepExistingImages
        : [];
      const finalImages = [...keptImages, ...uploadedImages];

      const nextStatus = failures.length > 0 ? 'failed' : 'completed';
      const nextError =
        failures.length > 0
          ? `Partial upload failure (${uploadedImages.length}/${payloadDoc.imagePayloads.length}). ${failures.join(' | ')}`
          : null;

      await Car.findByIdAndUpdate(carId, {
        image: finalImages,
        imageProcessingStatus: nextStatus,
        imageProcessingError: nextError,
      });

      payloadDoc.status = nextStatus;
      payloadDoc.error = nextError;
      if (nextStatus === 'completed') {
        payloadDoc.imagePayloads = [];
        payloadDoc.keepExistingImages = [];
      }
      await payloadDoc.save();

      await invalidateCarCaches(carId);
    } catch (error) {
      await Car.findByIdAndUpdate(carId, {
        imageProcessingStatus: 'failed',
        imageProcessingError: `Fallback upload failed: ${error.message}`,
      });
      await CarImageUploadJob.findByIdAndUpdate(payloadDocId, {
        status: 'failed',
        error: error.message,
      });
      try {
        await invalidateCarCaches(carId);
      } catch (cacheInvalidationError) {
        console.error('Redis invalidation error (/car/add fallback failure):', cacheInvalidationError.message);
      }
    }
  });
};

router.get('/allcars', globalLimiter, async (req, res) => {
  try {
    const filters = {};
    const allowedFields = ['brand', 'fuelType', 'transmission', 'seats', 'category'];
    allowedFields.forEach((field) => {
      if (req.query[field]) {
        filters[field] = req.query[field];
      }
    });

    const cacheKey = buildListCacheKey(filters);

    try {
      const cachedCars = await redis.get(cacheKey);
      if (cachedCars) {
        console.log("CACHE HIT: /car/allcars", cacheKey);
        res.set("X-Cache-Source", "REDIS");
        return res.status(200).json(JSON.parse(cachedCars));
      }
      console.log("CACHE MISS: /car/allcars", cacheKey);
    } catch (cacheReadError) {
      console.error("Redis read error (/allcars):", cacheReadError.message);
    }

    const cars = await Car.find(filters);
    const responsePayload = { cars };

    try {
      await setCacheValue(cacheKey, responsePayload);
    } catch (cacheWriteError) {
      console.error("Redis write error (/allcars):", cacheWriteError.message);
    }

    res.set("X-Cache-Source", "DB");
    res.status(200).json(responsePayload);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});


router.get("/requestedcars", globalLimiter, async (req, res) => {
  try {
    const userQuery = req.query.q;
    if (!userQuery) {
      return res.status(400).json({ message: "Missing query parameter ?q=" });
    }

    // Ask Gemini
    let response;
    try {
      response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: `
    Extract car filters from the natural language query into JSON only.
    Input query: "${userQuery}"
  `,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: "object",
            properties: {
              brand: { type: "string", enum: ["Toyota", "Hyundai", "Suzuki", "Honda", "Tata", "Mahindra", "Kia", "BMW", "Mercedes-Benz", "Audi", "Tesla", "Volkswagen", "null"] },
              minPrice: { type: "integer", nullable: true },
              maxPrice: { type: "integer", nullable: true },
              category: { type: "string", enum: ["Hatchback", "Sedan", "SUV", "Luxury", "Super Luxury", "null"] },
              fuelType: { type: "string", enum: ["Petrol", "Diesel", "CNG", "Electric", "Hybrid", "null"] },
              transmission: { type: "string", enum: ["Manual", "Automatic", "null"] },
              year: { type: "integer", nullable: true },
              seats: { type: "integer", nullable: true },
              colorOptions: { type: "array", items: { type: "string" } }
            },
            required: ["brand", "minPrice", "maxPrice", "category", "fuelType", "transmission", "year", "seats", "colorOptions"],
            additionalProperties: false
          }
        }
      });
    } catch (error) {
      const aiErrorMessage = error?.message || "";
      const aiErrorStatus = Number(error?.status || error?.code || 0);
      const isGeminiKeyIssue =
        aiErrorStatus === 401 ||
        aiErrorStatus === 403 ||
        /api\s*key|invalid|expired|unauthori|forbidden|permission/i.test(aiErrorMessage);

      if (isGeminiKeyIssue) {
        return res.status(503).json({
          code: "GEMINI_KEY_ERROR",
          message: "AI smart search is unavailable right now. Please use filter-based search.",
        });
      }

      return res.status(502).json({
        code: "GEMINI_SERVICE_ERROR",
        message: "AI smart search is temporarily unavailable. Please try again later.",
      });
    }

    const text = response.text?.trim?.() || "";

    // Parse JSON safely
    let filters;
    try {
      filters = JSON.parse(text);
    } catch (parseErr) {
      console.error("Failed to parse Gemini response:", text);
      return res.status(500).json({ message: "Invalid AI response format" });
    }



    let query = {};

    // Brand
    if (filters.brand && filters.brand !== "null") {
      query.brand = filters.brand;
    }

    // Category
    if (filters.category && filters.category !== "null") {
      query.category = filters.category;
    }

    // Fuel Type
    if (filters.fuelType && filters.fuelType !== "null") {
      query.fuelType = filters.fuelType;
    }

    // Transmission
    if (filters.transmission && filters.transmission !== "null") {
      query.transmission = filters.transmission;
    }

    // Seats
    if (filters.seats) {
      query.seats = filters.seats;
    }

    // Year
    if (filters.year) {
      query.year = filters.year;
    }

    // Color Options (match if requested colors exist in array)
    if (filters.colorOptions && filters.colorOptions.length > 0) {
      query.colorOptions = { $in: filters.colorOptions };
    }

    // Price Range
    if (filters.minPrice && filters.maxPrice) {
      query.price = { $gte: filters.minPrice, $lte: filters.maxPrice };
    } else if (filters.minPrice) {
      query.price = { $gte: filters.minPrice };
    } else if (filters.maxPrice) {
      query.price = { $lte: filters.maxPrice };
    }

    // Fetch cars
    const cars = await Car.find(query);

    res.status(200).json(cars);

  } catch (error) {
    console.error("Error in /requestedcars:", error);
    res.status(500).json({ message: "Server error" });
  }
});



router.post('/add', creationLimiter, userAuth, async (req, res) => {
  const {
    name,
    brand,
    price,

    category,
    fuelType,
    transmission,
    year,
    seats,
    imagePayloads,
    imageFileNames,
    location
  } = req.body;

  if (!name || !brand || !price || !category || !location) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  if (!Array.isArray(imagePayloads) || imagePayloads.length < 2) {
    return res.status(400).json({ message: 'Please provide at least 2 images' });
  }

  if (imagePayloads.length > 10) {
    return res.status(400).json({ message: 'Maximum 10 images allowed' });
  }


  try {
    const newCar = new Car({
      name,
      brand,
      price,
      category,
      fuelType,
      transmission,
      year,
      seats,
      image: [],
      imageProcessingStatus: 'queued',
      imageProcessingError: null,
      colorOptions: ['white', 'black'],
      listedby: req.user.userId,
      location: {
        type: 'Point',
        coordinates: location.coordinates
      }
    });

    await newCar.save();

    const carId = newCar._id.toString();

    const payloadDoc = await CarImageUploadJob.create({
      carId,
      imagePayloads,
      keepExistingImages: [],
      imageStatuses: imagePayloads.map((_, i) => ({
        index: i,
        fileName: Array.isArray(imageFileNames) && imageFileNames[i] ? imageFileNames[i] : `Image ${i + 1}`,
        status: 'queued',
        error: null,
      })),
      status: 'queued',
      error: null,
    });

    const runFallbackResponse = async (fallbackReason) => {
      if (!cloudName || !uploadPreset) {
        await Car.findByIdAndUpdate(carId, {
          imageProcessingStatus: 'failed',
          imageProcessingError: `Fallback unavailable: ${fallbackReason}`,
        });
        return res.status(503).json({
          message: 'Car added but image processing is unavailable right now.',
          fallbackUsed: false,
          car: await Car.findById(carId),
        });
      }

      runFallbackUploadInBackground({ carId, payloadDocId: payloadDoc._id.toString(), fallbackReason });

      return res.status(202).json({
        message: 'Car added. Image processing started in background via backend fallback.',
        fallbackUsed: true,
        car: await Car.findById(carId),
      });
    };

    let activeWorkers = 0;
    try {
      activeWorkers = await carImageQueue.getWorkersCount();
    } catch (workerCheckError) {
      console.error('Worker count check failed:', workerCheckError.message);
    }

    if (activeWorkers === 0) {
      return await runFallbackResponse('No active BullMQ worker');
    }

    try {
      const job = await carImageQueue.add(
        'car-images-upload',
        {
          carId,
          userId: req.user.userId,
          payloadDocId: payloadDoc._id.toString(),
        },
        {
          jobId: `car-images-${payloadDoc._id.toString()}`,
        }
      );

      newCar.imageJobId = job.id?.toString?.() || null;
      await newCar.save();

      await CarImageUploadJob.findByIdAndUpdate(payloadDoc._id, {
        status: 'queued',
        error: null,
      });
    } catch (enqueueError) {
      console.error('Queue enqueue failed, using fallback upload:', enqueueError.message);
      return await runFallbackResponse('Queue enqueue failed');
    }

    try {
      await invalidateCarCaches(carId);
    } catch (cacheInvalidationError) {
      console.error("Redis invalidation error (/car/add):", cacheInvalidationError.message);
    }

    res.status(200).json({
      message: 'Car added. Images are being processed in background.',
      imageJobId: newCar.imageJobId,
      car: newCar,
    });
  } catch (error) {
    console.error('Error adding car:', error);
    res.status(500).json({ message: 'Something went wrong' });
  }
});

router.get('/image-status/:id', userAuth, async (req, res) => {
  try {
    const car = await Car.findById(req.params.id).select(
      'listedby image imageProcessingStatus imageProcessingError imageJobId'
    );

    if (!car) {
      return res.status(404).json({ message: 'Car not found' });
    }

    if (car.listedby.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    // Get the latest upload job for per-image statuses
    const latestJob = await CarImageUploadJob.findOne({ carId: req.params.id })
      .sort({ createdAt: -1 })
      .select('imageStatuses status error');

    return res.status(200).json({
      status: car.imageProcessingStatus,
      error: car.imageProcessingError,
      imageCount: car.image.length,
      imageJobId: car.imageJobId,
      imageStatuses: latestJob?.imageStatuses || [],
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch image processing status' });
  }
});

router.get('/:id', globalLimiter, async (req, res) => {
  try {
    const carId = req.params.id;
    const cacheKey = buildDetailCacheKey(carId);

    try {
      const cachedCar = await redis.get(cacheKey);
      if (cachedCar) {
        console.log("CACHE HIT: /car/:id", cacheKey);
        res.set("X-Cache-Source", "REDIS");
        return res.status(200).json(JSON.parse(cachedCar));
      }
      console.log("CACHE MISS: /car/:id", cacheKey);
    } catch (cacheReadError) {
      console.error("Redis read error (/car/:id):", cacheReadError.message);
    }

    const car = await Car.findById(carId);
    if (!car) return res.status(404).json({ message: "Car not found" });

    const responsePayload = { car };

    try {
      await setCacheValue(cacheKey, responsePayload);
    } catch (cacheWriteError) {
      console.error("Redis write error (/car/:id):", cacheWriteError.message);
    }

    res.set("X-Cache-Source", "DB");
    res.status(200).json(responsePayload);
  } catch (err) {
    res.status(500).json({ message: "Error fetching car" });
  }
});
router.post('/:id', creationLimiter, userAuth, async (req, res) => {
  try {
    const {
      name,
      brand,
      price,

      category,
      fuelType,
      transmission,
      year,
      seats,
      keepImages,
      newImagePayloads,
      newImageFileNames,
    } = req.body;

    const carId = req.params.id;

    let car = await Car.findById(carId);
    if (!car) {
      return res.status(404).json({ message: 'Car not found' });
    }


    if (car.listedby.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Unauthorized to edit this car' });
    }

    const safeKeepImages = Array.isArray(keepImages) ? keepImages.filter(Boolean) : [];
    const safeNewImagePayloads = Array.isArray(newImagePayloads)
      ? newImagePayloads.filter((payload) => typeof payload === 'string' && payload.trim())
      : [];

    const totalFinalImages = safeKeepImages.length + safeNewImagePayloads.length;
    if (totalFinalImages < 2) {
      return res.status(400).json({ message: 'Please keep or upload at least 2 images in total.' });
    }

    if (totalFinalImages > 10) {
      return res.status(400).json({ message: 'Maximum 10 images allowed.' });
    }

    car.name = name;
    car.brand = brand;
    car.price = price;
    car.category = category;
    car.fuelType = fuelType;
    car.transmission = transmission;
    car.year = year;
    car.seats = seats;

    if (safeNewImagePayloads.length === 0) {
      car.image = safeKeepImages;
      car.imageProcessingStatus = 'completed';
      car.imageProcessingError = null;
      car.imageJobId = null;
      await car.save();

      try {
        await invalidateCarCaches(carId);
      } catch (cacheInvalidationError) {
        console.error("Redis invalidation error (/car/:id update no-queue):", cacheInvalidationError.message);
      }

      return res.status(200).json({ message: 'Car updated successfully', car });
    }

    car.image = safeKeepImages;
    car.imageProcessingStatus = 'queued';
    car.imageProcessingError = null;
    await car.save();

    const payloadDoc = await CarImageUploadJob.create({
      carId,
      imagePayloads: safeNewImagePayloads,
      keepExistingImages: safeKeepImages,
      imageStatuses: safeNewImagePayloads.map((_, i) => ({
        index: i,
        fileName: Array.isArray(newImageFileNames) && newImageFileNames[i] ? newImageFileNames[i] : `Image ${i + 1}`,
        status: 'queued',
        error: null,
      })),
      status: 'queued',
      error: null,
    });

    const runEditFallbackResponse = async (fallbackReason) => {
      if (!cloudName || !uploadPreset) {
        await Car.findByIdAndUpdate(carId, {
          imageProcessingStatus: 'failed',
          imageProcessingError: `Fallback unavailable: ${fallbackReason}`,
        });
        return res.status(503).json({
          message: 'Car updated but image processing is unavailable right now.',
          fallbackUsed: false,
          car: await Car.findById(carId),
        });
      }

      runFallbackUploadInBackground({
        carId,
        payloadDocId: payloadDoc._id.toString(),
        fallbackReason,
      });

      return res.status(202).json({
        message: 'Car updated. New images are processing in background.',
        fallbackUsed: true,
        car: await Car.findById(carId),
      });
    };

    let activeWorkers = 0;
    try {
      activeWorkers = await carImageQueue.getWorkersCount();
    } catch (workerCheckError) {
      console.error('Worker count check failed (edit):', workerCheckError.message);
    }

    if (activeWorkers === 0) {
      return await runEditFallbackResponse('No active BullMQ worker');
    }

    try {
      const job = await carImageQueue.add(
        'car-images-upload',
        {
          carId,
          userId: req.user.userId,
          payloadDocId: payloadDoc._id.toString(),
        },
        {
          jobId: `car-images-${payloadDoc._id.toString()}`,
        }
      );

      car.imageJobId = job.id?.toString?.() || null;
      await car.save();
    } catch (enqueueError) {
      console.error('Queue enqueue failed (edit), using fallback upload:', enqueueError.message);
      return await runEditFallbackResponse('Queue enqueue failed');
    }

    try {
      await invalidateCarCaches(carId);
    } catch (cacheInvalidationError) {
      console.error("Redis invalidation error (/car/:id update):", cacheInvalidationError.message);
    }

    return res.status(200).json({
      message: 'Car updated. New images are being processed in background.',
      car,
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Something went wrong while updating the car' });
  }
});
router.post('/like/:id', creationLimiter, userAuth, async (req, res) => {
  try {
    const { userId } = req.user;
    const carId = req.params.id;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Prevent duplicate likes
    if (!user.likedlist.includes(carId)) {
      user.likedlist.push(carId);
      await user.save();
    }

    return res.status(200).json({ message: 'Car added to wishlist' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/unlike/:id', creationLimiter, userAuth, async (req, res) => {
  const { userId } = req.user;
  const carId = req.params.id;

  const user = await User.findById(userId);
  if (!user) return res.status(404).json({ message: 'User not found' });

  user.likedlist = user.likedlist.filter(id => id.toString() !== carId);
  await user.save();

  res.status(200).json({ message: 'Unliked' });
});

router.post("/comment/:id", creationLimiter, userAuth, async (req, res) => {
  const { comment } = req.body;

  const { userId } = req.user

  const id = req.params.id;



  let r = new Comment({
    car: id,
    user: userId,
    text: comment
  });

  await r.save();

  res.status(200).json({ message: 'comment added' });

});

router.get("/comment/:id", globalLimiter, async (req, res) => {
  const id = req.params.id;

  try {
    const comments = await Comment.find({ car: id })
      .populate('user', 'username email profilePic')
      .sort({ createdAt: -1 });

    res.status(200).json({ comments });
  } catch (error) {
    console.error('Error fetching comments:', error);
    res.status(500).json({ message: 'Failed to fetch comments' });
  }
});

router.delete('/:id', creationLimiter, userAuth, async (req, res) => {
  const id = req.params.id;

  try {
    const car = await Car.findById(id);

    if (!car) {
      return res.status(404).json({ message: 'Car not found' });
    }


    if (car.listedby.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Unauthorized to delete this listing' });
    }


    await Car.findByIdAndDelete(id);
    await Comment.deleteMany({ car: id });

    try {
      await invalidateCarCaches(id);
    } catch (cacheInvalidationError) {
      console.error("Redis invalidation error (/car/:id delete):", cacheInvalidationError.message);
    }

    res.status(200).json({ message: 'Listing deleted successfully' });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ message: 'Something went wrong while deleting' });
  }
});

router.get('/bought/my', globalLimiter, userAuth, async (req, res) => {
  try {
    const cars = await Car.find({ boughtBy: req.user.userId });
    res.status(200).json({ cars });
  } catch (error) {
    console.error('Error fetching bought cars:', error);
    res.status(500).json({ message: 'Failed to fetch purchased cars' });
  }
});

module.exports = router;
