const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis').default || require('rate-limit-redis');
const redisClient = require('../redisClient');

// Helper to create store with unique prefix
const createRedisStore = (prefix) => new RedisStore({
  sendCommand: (...args) => redisClient.call(...args),
  prefix: prefix,
});

// Custom response handler to include IP
const customHandler = (req, res, next, options) => {
  res.status(options.statusCode).json({
    success: false,
    message: typeof options.message === 'string' ? options.message : options.message.message,
    ip: req.ip
  });
};

const authLimiter = rateLimit({
  store: createRedisStore('rl:auth:'),
  windowMs: 15 * 60 * 1000, 
  max: 15, 
  standardHeaders: true, 
  legacyHeaders: false, 
  message: { success: false, message: 'Too many authentication attempts from this IP, please try again after 15 minutes.' },
  handler: customHandler
});

const paymentLimiter = rateLimit({
  store: createRedisStore('rl:payment:'),
  windowMs: 10 * 60 * 1000, 
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many payment requests from this IP, please try again after 10 minutes.' },
  handler: customHandler
});

const creationLimiter = rateLimit({
  store: createRedisStore('rl:creation:'),
  windowMs: 15 * 60 * 1000, 
  max: 50,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many data mutation requests from this IP, please try again after 15 minutes.' },
  handler: customHandler
});

const globalLimiter = rateLimit({
  store: createRedisStore('rl:global:'),
  windowMs: 1 * 60 * 1000, 
  max: 150,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many general requests from this IP, please try again later.' },
  handler: customHandler
});

module.exports = {
  authLimiter,
  paymentLimiter,
  creationLimiter,
  globalLimiter
};
