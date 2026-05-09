const crypto = require('crypto');
const redisClient = require('../redisClient');

// Configuration
const BF_SIZE = 1000000; // 1 million bits (~125KB)
const NUM_HASH_FUNCTIONS = 7; // Number of hash functions for better accuracy

// Separate redis keys for usernames and emails
const BF_KEYS = {
  username: 'bf:usernames',
  email: 'bf:emails'
};

/**
 * Normalize element before hashing — always lowercase + trim
 */
function normalize(element) {
  return element.trim().toLowerCase();
}

// Simple, fast hashes using crypto digests and buffer reads
function hash1(element) {
  const d = crypto.createHash('sha256').update(element).digest();
  return d.readUInt32BE(0) % BF_SIZE;
}

function hash2(element) {
  const d = crypto.createHash('sha1').update(element).digest();
  return d.readUInt32BE(0) % BF_SIZE;
}

function getPositions(element) {
  const h1 = hash1(element);
  const h2 = hash2(element) || 1;
  const pos = [];
  for (let i = 0; i < NUM_HASH_FUNCTIONS; i++) pos.push((h1 + i * h2) % BF_SIZE);
  return pos;
}

/**
 * Initialize bloom filter on server startup
 * Load from Redis if exists, otherwise load from DB
 */
async function initializeBF(User, forceRebuild = false) {
  try {
    // Check if bloom filters already exist in Redis
    const usernameExists = await redisClient.exists(BF_KEYS.username);
    const emailExists = await redisClient.exists(BF_KEYS.email);

    if (usernameExists && emailExists && !forceRebuild) {
      console.log('✓ Bloom filters loaded from Redis');
      return;
    }

    // Clear stale bloom data before rebuilding
    if (forceRebuild) {
      await redisClient.del(BF_KEYS.username, BF_KEYS.email);
      console.log('Cleared stale bloom filters for rebuild');
    }

    console.log('Initializing bloom filters from database...');

    // Load all users from database
    // Use $ne: false to include users where isActive is true OR missing (legacy users)
    const users = await User.find({ isActive: { $ne: false } }, 'username email');

    // Add all usernames and emails to bloom filter (lowercase to match lookup normalization)
    for (const user of users) {
      await addToBF(user.username.toLowerCase(), 'username', false); // false = don't save to DB again
      await addToBF(user.email.toLowerCase(), 'email', false);
    }

    console.log(`✓ Bloom filters initialized with ${users.length} users`);
  } catch (err) {
    console.error('Error initializing bloom filters:', err);
    throw err;
  }
}

/**
 * Add element to bloom filter
 * @param {string} element - The element to add (username or email)
 * @param {string} type - 'username' or 'email'
 * @param {boolean} saveNew - Whether this is a new user being saved to DB
 */
async function addToBF(element, type, saveNew = true) {
  try {
    const key = BF_KEYS[type];
    if (!key) throw new Error(`Invalid type: ${type}`);

    const normalizedElement = normalize(element);
    const positions = getPositions(normalizedElement);

    // Use Redis pipeline for multiple SETBIT operations
    const pipeline = redisClient.pipeline();

    for (const position of positions) {
      pipeline.setbit(key, position, 1);
    }

    await pipeline.exec();

    if (saveNew) {
      console.log(`Added ${type}: ${normalizedElement} to bloom filter`);
    }
  } catch (err) {
    console.error(`Error adding to bloom filter (${type}):`, err);
    throw err;
  }
}

/**
 * Check if element might exist in bloom filter
 * Returns true if definitely NOT in set, false if MIGHT be in set
 * @param {string} element - The element to check
 * @param {string} type - 'username' or 'email'
 * @returns {boolean} true if available (not in set), false if might exist
 */
async function checkBF(element, type) {
  try {
    const key = BF_KEYS[type];
    if (!key) throw new Error(`Invalid type: ${type}`);

    const normalizedElement = normalize(element);
    const positions = getPositions(normalizedElement);

    // Check all bit positions
    const pipeline = redisClient.pipeline();

    for (const position of positions) {
      pipeline.getbit(key, position);
    }

    const results = await pipeline.exec();

    // If ALL bits are 0, element is definitely not in set
    // If ANY bit is 1, element might be in set
    const allBitsZero = results.every(([err, val]) => val === 0);

    return allBitsZero; // true = available, false = might be taken
  } catch (err) {
    console.error(`Error checking bloom filter (${type}):`, err);
    throw err;
  }
}

/**
 * Reset bloom filters (for development/testing only)
 */
async function resetBF() {
  try {
    await redisClient.del(BF_KEYS.username, BF_KEYS.email);
    console.log('Bloom filters reset');
  } catch (err) {
    console.error('Error resetting bloom filters:', err);
    throw err;
  }
}

module.exports = {
  initializeBF,
  addToBF,
  checkBF,
  resetBF,
  BF_SIZE,
  NUM_HASH_FUNCTIONS
};
