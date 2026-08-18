const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const { createAdapter } = require("@socket.io/redis-adapter");
const cors = require("cors");

const { pubClient, subClient } = require("./config/redis");
const { login } = require("./controllers/authController");
const { verifySocketToken } = require("./middleware/auth");
const registerPollHandlers = require("./sockets/pollHandler");

const app = express();
const server = http.createServer(app);

// CORS configuration with dynamic local origin verification
const envOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(",").map((origin) => origin.trim())
  : [];

const corsOriginCheck = (origin, callback) => {
  // Allow requests with no origin (like mobile apps, curl, or server-to-server)
  if (!origin) return callback(null, true);

  // Allow any local development origin (localhost, 127.0.0.1, local LAN IPs) on any port
  const isLocalhost = /^http:\/\/(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+)(:\d+)?$/.test(origin);

  if (isLocalhost || envOrigins.includes(origin) || envOrigins.includes("*")) {
    return callback(null, true);
  }

  console.warn(`⚠️ Blocked by CORS: ${origin}`);
  return callback(new Error(`CORS error: Origin ${origin} not allowed`));
};

app.use(
  cors({
    origin: corsOriginCheck,
    methods: ["GET", "POST"],
    credentials: true,
  }),
);
app.use(express.json());

// HTTP Routes
app.post("/login", login);

// Socket.IO Setup with Redis Pub/Sub Adapter
const io = new Server(server, {
  cors: {
    origin: corsOriginCheck,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Attach Redis Pub/Sub Adapter for horizontal multi-instance scaling
io.adapter(createAdapter(pubClient, subClient));

// Middleware
io.use(verifySocketToken);

// Connections & Event Handlers
io.on("connection", (socket) => {
  registerPollHandlers(io, socket);
});

module.exports = { app, server, io };
