const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const connectDB = require("./db");
const Poll = require("./models/Poll");
require("dotenv").config();

const app = express();
const server = http.createServer(app);

// Connect to Database
connectDB();

const SECRET_KEY = process.env.JWT_SECRET || "your-secret-key-change-this";

// Middleware
app.use(
  cors({
    origin: process.env.CORS_ORIGIN
      ? process.env.CORS_ORIGIN.split(",")
      : [
          "http://localhost:3000",
          "http://192.168.0.106:3000",
          "http://10.135.184.72:3000",
        ],
    methods: ["GET", "POST"],
  }),
);
app.use(express.json());

const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN
      ? process.env.CORS_ORIGIN.split(",")
      : [
          "http://localhost:3000",
          "http://192.168.0.106:3000",
          "http://10.135.184.72:3000",
        ],
    methods: ["GET", "POST"],
  },
});

const generatePollId = () =>
  Math.random().toString(36).substring(2, 8).toUpperCase();

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
  const token = jwt.sign({ userId, username }, SECRET_KEY, {
    expiresIn: "24h",
  });

  res.json({ token, userId, username });
});

// --- Socket.IO Middleware ---

io.use((socket, next) => {
  const token = socket.handshake.auth.token;

  if (!token) {
    return next(new Error("Authentication error: No token provided"));
  }

  jwt.verify(token, SECRET_KEY, (err, decoded) => {
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

  // Helper to remove vote if user disconnects (Optional - simplified for Guest Mode)
  // In a robust "Guest" system, we might NOT want to remove votes on disconnect
  // immediately if we want to allow reconnects.
  // However, for "live" polling where presence matters, we often keep the vote
  // UNLESS explicitly retracted, or we treat them as persistent.
  // The user requested: "if we refresh the page, it shouldn't be an issue".
  // So we should NOT remove votes on disconnect/refresh automatically,
  // because the user will reconnect with the SAME token/userId.

  // Helpers to get current room/poll
  const getPollId = () => {
    const room = Array.from(socket.rooms).find((r) => r.startsWith("poll_"));
    return room ? room.split("_")[1] : null;
  };

  socket.on("disconnect", () => {
    console.log(`User disconnected: ${username}`);
  });

  socket.on("create_poll", async (data) => {
    try {
      // Validate unique options
      const uniqueOptions = new Set(data.options);
      if (uniqueOptions.size !== data.options.length) {
        socket.emit("error", "Poll options must be unique");
        return;
      }

      const pollId = generatePollId();
      const initialResults = {};
      data.options.forEach((opt) => (initialResults[opt] = 0));

      const newPoll = new Poll({
        pollId,
        title: data.title,
        description: data.description,
        options: data.options,
        results: initialResults,
        userVotes: [], // Stores { userId, option }
        createdBy: userId, // Track creator
        createdAt: new Date(),
      });

      await newPoll.save();

      socket.join(`poll_${pollId}`);
      // Helper to convert Map to Object for frontend
      const pollData = newPoll.toObject();

      socket.emit("poll_created", {
        pollId,
        pollData: { ...pollData, userVotes: undefined },
      });
      console.log(`Poll created (DB): ${pollId} by ${username}`);
    } catch (err) {
      console.error("Error creating poll:", err);
      socket.emit("error", "Failed to create poll");
    }
  });

  socket.on("join_poll", async (pollId) => {
    try {
      const poll = await Poll.findOne({ pollId });

      if (poll) {
        socket.join(`poll_${pollId}`);

        // Find if this user voted
        const voteEntry = poll.userVotes.find((v) => v.userId === userId);

        socket.emit("poll_joined", {
          pollId,
          pollData: {
            title: poll.title,
            description: poll.description,
            options: poll.options,
            results: poll.results, // Mongoose Map becomes object-like in JSON
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

  socket.on("cast_vote", async (option) => {
    const pollId = getPollId();
    if (!pollId) return;

    try {
      const poll = await Poll.findOne({ pollId });
      if (!poll) return;

      // 1. Remove old vote if exists
      const oldVoteIndex = poll.userVotes.findIndex((v) => v.userId === userId);

      if (oldVoteIndex !== -1) {
        const oldVote = poll.userVotes[oldVoteIndex];
        const oldOption = oldVote.option;

        // Decrement result
        // Mongoose Map .get() / .set()
        const currentCount = poll.results.get(oldOption) || 0;
        poll.results.set(oldOption, Math.max(0, currentCount - 1));

        // Remove the old entry
        poll.userVotes.splice(oldVoteIndex, 1);
      }

      // 2. Add new vote
      const currentOptionCount = poll.results.get(option) || 0;
      poll.results.set(option, currentOptionCount + 1);
      poll.userVotes.push({ userId, option });

      await poll.save();

      io.to(`poll_${pollId}`).emit("update_votes", poll.results);
      console.log(`Vote cast manually by ${username} in poll ${pollId}`);
    } catch (err) {
      console.error("Error casting vote:", err);
    }
  });

  socket.on("retract_vote", async () => {
    const pollId = getPollId();
    if (!pollId) return;

    try {
      const poll = await Poll.findOne({ pollId });
      if (!poll) return;

      const voteEntryIndex = poll.userVotes.findIndex(
        (v) => v.userId === userId,
      );

      if (voteEntryIndex !== -1) {
        const voteEntry = poll.userVotes[voteEntryIndex];
        const oldOption = voteEntry.option;

        const currentCount = poll.results.get(oldOption) || 0;
        poll.results.set(oldOption, Math.max(0, currentCount - 1));

        poll.userVotes.splice(voteEntryIndex, 1);

        await poll.save();

        io.to(`poll_${pollId}`).emit("update_votes", poll.results);
        console.log(`Vote retracted by ${username} in poll ${pollId}`);
      }
    } catch (err) {
      console.error("Error retracting vote:", err);
    }
  });

  // Explicit Leave Poll
  socket.on("leave_poll", () => {
    const pollId = getPollId();
    if (pollId) {
      socket.leave(`poll_${pollId}`);
      console.log(`User ${username} left poll: ${pollId}`);
    }
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
