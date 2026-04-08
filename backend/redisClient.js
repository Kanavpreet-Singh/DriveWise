const Redis = require("ioredis");

const redisUrl = (process.env.REDIS_URL || "").trim();

if (!redisUrl) {
  throw new Error("Missing REDIS_URL in environment. Set REDIS_URL for cloud Redis.");
}

if (!/^rediss?:\/\//i.test(redisUrl)) {
  throw new Error(
    "Invalid REDIS_URL. ioredis requires a redis:// or rediss:// connection string. " +
      "Do not use Upstash REST URL (https://...) here."
  );
}

const redis = new Redis(redisUrl, {
  maxRetriesPerRequest: 2,
  retryStrategy: () => null,
});

redis.on("error", (err) => {
  console.error("Redis error:", err.message);
});

module.exports = redis;
