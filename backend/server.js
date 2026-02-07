const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const cors = require("cors");
require("dotenv").config();

const app = express();
const server = http.createServer(app);

// In-memory storage for polls
// Structure: { [pollId]: { title, description, options, results: { option: count }, userVotes: [{ userId, username, option }], createdBy, createdAt } }
const polls = {};

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
          "http://192.168.31.235:3000",
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
          "http://192.168.31.235:3000",
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

  // Helper to broadcast active users in a room
  const broadcastRoomUsers = async (pollId) => {
    try {
      const sockets = await io.in(`poll_${pollId}`).fetchSockets();
      const users = sockets.map((s) => ({
        userId: s.user.userId,
        username: s.user.username,
      }));
      // Remove duplicates (if any, though userId should be unique per socket)
      const uniqueUsers = Array.from(new Set(users.map((u) => u.userId))).map(
        (id) => users.find((u) => u.userId === id),
      );

      io.to(`poll_${pollId}`).emit("update_users", uniqueUsers);
    } catch (err) {
      console.error("Error broadcasting room users:", err);
    }
  };

  // Helpers to get current room/poll
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

  // Helper to calculate results dynamically
  const calculateResults = (poll) => {
    const results = {};
    poll.options.forEach((opt) => (results[opt] = 0));
    poll.userVotes.forEach((v) => {
      if (results[v.option] !== undefined) results[v.option]++;
    });
    return results;
  };

  socket.on("create_poll", (data) => {
    try {
      // Validate unique options
      const uniqueOptions = new Set(data.options);
      if (uniqueOptions.size !== data.options.length) {
        socket.emit("error", "Poll options must be unique");
        return;
      }

      const pollId = generatePollId();
      // Initial results are empty/zero
      const initialResults = {};
      data.options.forEach((opt) => (initialResults[opt] = 0));

      const newPoll = {
        pollId,
        title: data.title,
        description: data.description,
        options: data.options,
        results: initialResults,
        userVotes: [],
        createdBy: userId,
        createdAt: new Date(),
      };

      polls[pollId] = newPoll;

      socket.join(`poll_${pollId}`);
      socket.currentPollId = pollId;
      broadcastRoomUsers(pollId);

      // Send back everything except detailed user votes to creator initially
      socket.emit("poll_created", {
        pollId,
        pollData: { ...newPoll, userVotes: undefined },
      });
      console.log(`Poll created (In-Memory): ${pollId} by ${username}`);
    } catch (err) {
      console.error("Error creating poll:", err);
      socket.emit("error", "Failed to create poll");
    }
  });

  socket.on("join_poll", (pollId) => {
    try {
      const poll = polls[pollId];

      if (poll) {
        socket.join(`poll_${pollId}`);
        socket.currentPollId = pollId;

        // Notify others
        socket.to(`poll_${pollId}`).emit("user_joined", { username });
        broadcastRoomUsers(pollId);

        const voteEntry = poll.userVotes.find((v) => v.userId === userId);
        const dynamicResults = calculateResults(poll);

        const detailedVotes = {};
        poll.options.forEach((opt) => (detailedVotes[opt] = []));
        poll.userVotes.forEach((v) => {
          if (detailedVotes[v.option]) {
            detailedVotes[v.option].push(v.username);
          }
        });

        socket.emit("poll_joined", {
          pollId,
          pollData: {
            title: poll.title,
            description: poll.description,
            options: poll.options,
            results: dynamicResults,
            detailedVotes: detailedVotes,
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

  socket.on("cast_vote", (option) => {
    const pollId = getPollId();
    if (!pollId) return;

    try {
      const poll = polls[pollId];
      if (poll) {
        // Remove existing vote if any
        const existingVoteIndex = poll.userVotes.findIndex(
          (v) => v.userId === userId,
        );

        if (existingVoteIndex !== -1) {
          // Update vote
          poll.userVotes[existingVoteIndex].option = option;
        } else {
          // Add new vote
          poll.userVotes.push({ userId, username, option });
        }

        const results = calculateResults(poll);
        // poll.results = results; // Update cached results (in memory object reference is enough for calculation)

        // For detailed votes (who voted for what), we can construct it if needed by frontend
        // But current frontend logic mostly cares about counts in 'results'
        // If frontend needs detailed list of names per option:
        const detailedVotes = {};
        poll.options.forEach((opt) => (detailedVotes[opt] = []));
        poll.userVotes.forEach((v) => {
          if (detailedVotes[v.option]) detailedVotes[v.option].push(v.username);
        });

        io.to(`poll_${pollId}`).emit("update_votes", {
          results,
          detailedVotes,
        });
        console.log(`Vote cast by ${username} in poll ${pollId}`);
      }
    } catch (err) {
      console.error("Error casting vote:", err);
    }
  });

  socket.on("retract_vote", () => {
    const pollId = getPollId();
    if (!pollId) return;

    try {
      const poll = polls[pollId];
      if (poll) {
        // Remove vote
        poll.userVotes = poll.userVotes.filter((v) => v.userId !== userId);

        const results = calculateResults(poll);
        // poll.results = results;

        const detailedVotes = {};
        poll.options.forEach((opt) => (detailedVotes[opt] = []));
        poll.userVotes.forEach((v) => {
          if (detailedVotes[v.option]) detailedVotes[v.option].push(v.username);
        });

        io.to(`poll_${pollId}`).emit("update_votes", {
          results,
          detailedVotes,
        });
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
      socket.currentPollId = null;
      console.log(`User ${username} left poll: ${pollId}`);
      broadcastRoomUsers(pollId);
    }
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
