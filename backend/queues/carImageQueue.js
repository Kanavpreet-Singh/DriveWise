const { Queue } = require("bullmq");

const redisUrl = (process.env.REDIS_URL || "").trim();
const queueName = (process.env.BULLMQ_QUEUE_NAME || "messaging-queue").trim();

if (!redisUrl) {
  throw new Error("Missing REDIS_URL in environment.");
}

if (!/^rediss?:\/\//i.test(redisUrl)) {
  throw new Error("Invalid REDIS_URL. Use redis:// or rediss://");
}

const connection = {
  url: redisUrl,
  maxRetriesPerRequest: null,
};

const carImageQueue = new Queue(queueName, {
  connection,
  defaultJobOptions: {
    removeOnComplete: 100,
    removeOnFail: 200,
    attempts: 2,
    backoff: {
      type: "fixed",
      delay: 5000,
    },
  },
});

module.exports = {
  carImageQueue,
  queueName,
};
