const Redis = require("ioredis");
require("dotenv").config();

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

// Redis Data Client
const redis = new Redis(REDIS_URL);
redis.on("connect", () => console.log("✅ Redis Data Client connected"));
redis.on("error", (err) => console.error("❌ Redis Data Client error:", err));

// Redis Pub/Sub Clients for Socket.IO Adapter
const pubClient = redis;
const subClient = pubClient.duplicate();

subClient.on("connect", () => console.log("✅ Redis Sub Client connected"));
subClient.on("error", (err) => console.error("❌ Redis Sub Client error:", err));

module.exports = {
  redis,
  pubClient,
  subClient,
};
