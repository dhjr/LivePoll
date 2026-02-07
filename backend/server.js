const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const Redis = require("ioredis");
require("dotenv").config();

// --- Configuration ---
const PORT = process.env.PORT || 3001;
const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";
const JWT_SECRET = process.env.JWT_SECRET; // Must be set in .env
const POLL_EXPIRY = 86400; // 24 hours in seconds

if (!JWT_SECRET) {
  console.error("❌ FATAL: JWT_SECRET is not defined in .env");
  process.exit(1);
}

const app = express();
const server = http.createServer(app);

// Redis Client
// Redis is used as the "Source of Truth" for all poll data.
// It persists data even if this server restarts.
const redis = new Redis(REDIS_URL);

redis.on("connect", () => console.log("✅ Redis connected"));
redis.on("error", (err) => console.error("❌ Redis error:", err));

// Configuration
const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(",").map((origin) => origin.trim())
  : [];

console.log("Allowed Origins:", allowedOrigins);

// Middleware
app.use(
  cors({
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true,
  }),
);
app.use(express.json());

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// --- Helper Functions ---

const generatePollId = () =>
  Math.random().toString(36).substring(2, 8).toUpperCase();

/**
 * Calculates poll results (counts per option) from the list of user votes.
 */
const calculateResults = (poll) => {
  const results = {};
  poll.options.forEach((opt) => (results[opt] = 0));
  poll.userVotes.forEach((v) => {
    if (results[v.option] !== undefined) results[v.option]++;
  });
  return results;
};

/**
 * Organizes votes by option to show who voted for what.
 */
const getDetailedVotes = (poll) => {
  const detailedVotes = {};
  poll.options.forEach((opt) => (detailedVotes[opt] = []));
  poll.userVotes.forEach((v) => {
    if (detailedVotes[v.option]) {
      detailedVotes[v.option].push(v.username);
    }
  });
  return detailedVotes;
};

// --- Redis Data Access Layer ---

/**
 * Retrieves a poll object from Redis by ID.
 * Redis Key: "poll:{pollId}" -> Value: JSON String
 */
const getPollFromRedis = async (pollId) => {
  const data = await redis.get(`poll:${pollId}`);
  return data ? JSON.parse(data) : null;
};

/**
 * Saves or updates a poll object in Redis.
 * Sets an expiration time so old polls don't clog up memory forever.
 */
const savePollToRedis = async (pollId, pollData) => {
  await redis.set(
    `poll:${pollId}`,
    JSON.stringify(pollData),
    "EX",
    POLL_EXPIRY,
  );
};

// --- HTTP Routes ---

// Guest Login
app.post("/login", (req, res) => {
  const { username } = req.body;

  if (!username || username.trim() === "") {
    return res.status(400).json({ error: "Username is required" });
  }

  // Generate a unique ID for this session
  const userId = `${username}_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

  // Create Token
  const token = jwt.sign({ userId, username }, JWT_SECRET, {
    expiresIn: "1m", // Token expires in 1 minute (as per your request)
  });

  res.json({ token, userId, username });
});

// --- Socket.IO Middleware ---

io.use((socket, next) => {
  const token = socket.handshake.auth.token;

  if (!token) {
    return next(new Error("Authentication error: No token provided"));
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return next(new Error("Authentication error: Invalid token"));
    }
    socket.user = decoded; // Attach user data to socket
    next();
  });
});

// --- Socket Events ---

io.on("connection", (socket) => {
  const { userId, username } = socket.user;
  console.log(`User connected: ${username} (${userId})`);

  // Helper to broadcast active users in a room
  const broadcastRoomUsers = async (pollId) => {
    try {
      const sockets = await io.in(`poll_${pollId}`).fetchSockets();
      const users = sockets.map((s) => ({
        userId: s.user.userId,
        username: s.user.username,
      }));
      // Remove duplicates
      const uniqueUsers = Array.from(new Set(users.map((u) => u.userId))).map(
        (id) => users.find((u) => u.userId === id),
      );

      io.to(`poll_${pollId}`).emit("update_users", uniqueUsers);
    } catch (err) {
      console.error("Error broadcasting room users:", err);
    }
  };

  const getPollId = () => {
    const room = Array.from(socket.rooms).find((r) => r.startsWith("poll_"));
    return room ? room.split("_")[1] : null;
  };

  socket.on("disconnect", () => {
    console.log(`User disconnected: ${username}`);
    if (socket.currentPollId) {
      broadcastRoomUsers(socket.currentPollId);
    }
  });

  // --- 1. Create Poll ---
  socket.on("create_poll", async (data) => {
    try {
      // Logic: Validate inputs
      const uniqueOptions = new Set(data.options);
      if (uniqueOptions.size !== data.options.length) {
        socket.emit("error", "Poll options must be unique");
        return;
      }

      const pollId = generatePollId();
      const initialResults = {};
      data.options.forEach((opt) => (initialResults[opt] = 0));

      const newPoll = {
        pollId,
        title: data.title,
        description: data.description,
        options: data.options,
        results: initialResults,
        userVotes: [], // Array to track individual votes: [{ userId, username, option }]
        createdBy: userId,
        createdAt: new Date(),
      };

      // Redis Operation: Save the new poll object
      await savePollToRedis(pollId, newPoll);

      socket.join(`poll_${pollId}`);
      socket.currentPollId = pollId;
      broadcastRoomUsers(pollId);

      socket.emit("poll_created", {
        pollId,
        pollData: { ...newPoll, userVotes: undefined },
      });
      console.log(`Poll created (Redis): ${pollId} by ${username}`);
    } catch (err) {
      console.error("Error creating poll:", err);
      socket.emit("error", "Failed to create poll");
    }
  });

  // --- 2. Join Poll ---
  socket.on("join_poll", async (pollId) => {
    try {
      // Redis Operation: Fetch poll data
      const poll = await getPollFromRedis(pollId);

      if (poll) {
        socket.join(`poll_${pollId}`);
        socket.currentPollId = pollId;

        socket.to(`poll_${pollId}`).emit("user_joined", { username });
        broadcastRoomUsers(pollId);

        const voteEntry = poll.userVotes.find((v) => v.userId === userId);

        socket.emit("poll_joined", {
          pollId,
          pollData: {
            title: poll.title,
            description: poll.description,
            options: poll.options,
            results: calculateResults(poll),
            detailedVotes: getDetailedVotes(poll),
          },
          userPreviousVote: voteEntry ? voteEntry.option : null,
        });
        console.log(`User ${username} joined poll: ${pollId}`);
      } else {
        socket.emit("error", "Poll not found");
      }
    } catch (err) {
      console.error("Error joining poll:", err);
      socket.emit("error", "Failed to join poll");
    }
  });

  // --- 3. Cast Vote ---
  socket.on("cast_vote", async (option) => {
    const pollId = getPollId();
    if (!pollId) return;

    try {
      // Redis: Get latest state
      const poll = await getPollFromRedis(pollId);

      if (poll) {
        // Logic: Add or Update vote
        const existingVoteIndex = poll.userVotes.findIndex(
          (v) => v.userId === userId,
        );

        if (existingVoteIndex !== -1) {
          poll.userVotes[existingVoteIndex].option = option;
        } else {
          poll.userVotes.push({ userId, username, option });
        }

        // Redis: Save updated state
        await savePollToRedis(pollId, poll);

        // Broadcast updates
        io.to(`poll_${pollId}`).emit("update_votes", {
          results: calculateResults(poll),
          detailedVotes: getDetailedVotes(poll),
        });
        console.log(`Vote cast by ${username} in poll ${pollId}`);
      }
    } catch (err) {
      console.error("Error casting vote:", err);
    }
  });

  // --- 4. Retract Vote ---
  socket.on("retract_vote", async () => {
    const pollId = getPollId();
    if (!pollId) return;

    try {
      // Redis: Get latest state
      const poll = await getPollFromRedis(pollId);

      if (poll) {
        // Logic: Remove vote
        poll.userVotes = poll.userVotes.filter((v) => v.userId !== userId);

        // Redis: Save updated state
        await savePollToRedis(pollId, poll);

        io.to(`poll_${pollId}`).emit("update_votes", {
          results: calculateResults(poll),
          detailedVotes: getDetailedVotes(poll),
        });
        console.log(`Vote retracted by ${username} in poll ${pollId}`);
      }
    } catch (err) {
      console.error("Error retracting vote:", err);
    }
  });

  socket.on("leave_poll", () => {
    const pollId = getPollId();
    if (pollId) {
      socket.leave(`poll_${pollId}`);
      socket.currentPollId = null;
      console.log(`User ${username} left poll: ${pollId}`);
      broadcastRoomUsers(pollId);
    }
  });
});

server.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
