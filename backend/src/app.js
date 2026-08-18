const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const { login } = require("./controllers/authController");
const { verifySocketToken } = require("./middleware/auth");
const registerPollHandlers = require("./sockets/pollHandler");

const app = express();
const server = http.createServer(app);

// CORS configuration
const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(",").map((origin) => origin.trim())
  : [];

console.log("Allowed Origins:", allowedOrigins);

app.use(
  cors({
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true,
  }),
);
app.use(express.json());

// HTTP Routes
app.post("/login", login);

// Socket.IO Setup
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Middleware
io.use(verifySocketToken);

// Connections & Event Handlers
io.on("connection", (socket) => {
  registerPollHandlers(io, socket);
});

module.exports = { app, server, io };
