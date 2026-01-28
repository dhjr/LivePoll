const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
require("dotenv").config();
const connectDB = require("./db");
const Poll = require("./models/Poll");

const app = express();
const server = http.createServer(app);
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

connectDB();

const generatePollId = () =>
  Math.random().toString(36).substring(2, 8).toUpperCase();

io.on("connection", (socket) => {
  const userIP = socket.handshake.address;
  /* original line 21 was the redeclaration */
  console.log(`User connected: ${userIP}`);

  const removeVoteIfLastClient = async (pollId, socket) => {
    const userIP = socket.handshake.address;
    const roomName = `poll_${pollId}`;
    const room = io.sockets.adapter.rooms.get(roomName);

    let otherSocketsWithSameIP = 0;
    if (room) {
      for (const clientId of room) {
        // Don't count the current socket if it's the one leaving
        if (clientId === socket.id) continue;

        const clientSocket = io.sockets.sockets.get(clientId);
        if (clientSocket && clientSocket.handshake.address === userIP) {
          otherSocketsWithSameIP++;
        }
      }
    }

    // If no other sockets with same IP, remove vote
    if (otherSocketsWithSameIP === 0) {
      try {
        const poll = await Poll.findOne({ pollId });
        if (poll) {
          // Check if user voted in this poll
          const voteEntry = poll.userVotes.find((v) => v.ip === userIP);
          if (voteEntry) {
            const option = voteEntry.option;
            // Decrement result
            const currentCount = poll.results.get(option) || 0;
            poll.results.set(option, Math.max(0, currentCount - 1));

            // Remove from userVotes array
            poll.userVotes = poll.userVotes.filter((v) => v.ip !== userIP);

            await poll.save();
            io.to(roomName).emit("update_votes", poll.results);
            console.log(
              `Vote removed for ${userIP} in poll ${pollId} (User left)`,
            );
          }
        }
      } catch (err) {
        console.error("Error removing vote on exit:", err);
      }
    }
  };

  // Handle disconnect
  socket.on("disconnecting", async () => {
    // Check all rooms this user is in
    for (const room of socket.rooms) {
      if (room.startsWith("poll_")) {
        const pollId = room.split("_")[1];

        await removeVoteIfLastClient(pollId, socket);

        // AUTO-DELETION LOGIC (Optional with DB, but requested earlier)
        // If strictly persisting, we might NOT want to delete.
        // But if user wants cleanup:
        /*
            const roomObj = io.sockets.adapter.rooms.get(room);
            if (roomObj && roomObj.size === 1) { // 1 because this socket is still in it
                // await Poll.deleteOne({ pollId });
                // console.log(`Poll deleted (last user disconnected): ${pollId}`);
            }
            */
      }
    }
  });

  socket.on("disconnect", () => {
    console.log(`User disconnected: ${userIP}`);
  });

  // Explicit Leave Poll
  socket.on("leave_poll", async () => {
    const pollId = getPollId();
    if (pollId) {
      await removeVoteIfLastClient(pollId, socket);

      socket.leave(`poll_${pollId}`);
      console.log(`User left poll: ${pollId}`);

      /*
          const room = io.sockets.adapter.rooms.get(`poll_${pollId}`);
          if (!room || room.size === 0) {
             // await Poll.deleteOne({ pollId });
             // console.log(`Poll deleted (last user left): ${pollId}`);
          }
          */
    }
  });

  // Helpers to get current room/poll
  const getPollId = () => {
    // Find room starting with "poll_"
    const room = Array.from(socket.rooms).find((r) => r.startsWith("poll_"));
    return room ? room.split("_")[1] : null;
  };

  socket.on("create_poll", async (data) => {
    // Validate unique options
    const uniqueOptions = new Set(data.options);
    if (uniqueOptions.size !== data.options.length) {
      socket.emit("error", "Poll options must be unique");
      return;
    }

    const pollId = generatePollId();
    const initialResults = {};
    data.options.forEach((opt) => (initialResults[opt] = 0));
    try {
      const newPoll = await Poll.create({
        pollId,
        title: data.title,
        description: data.description,
        options: data.options,
        results: initialResults,
        userVotes: [],
      });
      socket.join(`poll_${pollId}`);
      // Note: mongoose object needs .toObject() or just spread properties carefully
      socket.emit("poll_created", {
        pollId,
        pollData: { ...newPoll.toObject(), userVotes: undefined },
      });
      console.log(`Poll created (DB): ${pollId}`);
    } catch (err) {
      console.error(err);
      socket.emit("error", "Failed to create poll");
    }
  });

  socket.on("join_poll", async (pollId) => {
    try {
      const poll = await Poll.findOne({ pollId });

      if (poll) {
        socket.join(`poll_${pollId}`);

        // Find if this user voted
        const voteEntry = poll.userVotes.find((v) => v.ip === userIP);

        socket.emit("poll_joined", {
          pollId,
          pollData: {
            title: poll.title,
            description: poll.description,
            options: poll.options,
            results: poll.results,
          },
          userPreviousVote: voteEntry ? voteEntry.option : null,
        });
        console.log(`User joined poll: ${pollId}`);
      } else {
        socket.emit("error", "Poll not found");
      }
    } catch (err) {
      console.error(err);
      socket.emit("error", "Error joining poll");
    }
  });

  socket.on("cast_vote", async (option) => {
    const pollId = getPollId();
    if (!pollId) return;

    try {
      const poll = await Poll.findOne({ pollId });
      if (!poll) return;

      // 1. Remove old vote if exists
      // Filter out any existing vote from this IP
      const oldVote = poll.userVotes.find((v) => v.ip === userIP);

      if (oldVote) {
        const oldOption = oldVote.option;
        const currentCount = poll.results.get(oldOption) || 0;
        poll.results.set(oldOption, Math.max(0, currentCount - 1));

        // Remove the old entry
        poll.userVotes = poll.userVotes.filter((v) => v.ip !== userIP);
      }

      // 2. Add new vote
      const currentOptionCount = poll.results.get(option) || 0;
      poll.results.set(option, currentOptionCount + 1);
      poll.userVotes.push({ ip: userIP, option });

      // 3. Save
      await poll.save();

      io.to(`poll_${pollId}`).emit("update_votes", poll.results);
    } catch (err) {
      console.error(err);
    }
  });

  socket.on("retract_vote", async () => {
    const pollId = getPollId();
    if (!pollId) return;

    try {
      const poll = await Poll.findOne({ pollId });
      if (!poll) return;

      const voteEntry = poll.userVotes.find((v) => v.ip === userIP);

      if (voteEntry) {
        const oldOption = voteEntry.option;
        const currentCount = poll.results.get(oldOption) || 0;
        poll.results.set(oldOption, Math.max(0, currentCount - 1));

        poll.userVotes = poll.userVotes.filter((v) => v.ip !== userIP);

        await poll.save();
        io.to(`poll_${pollId}`).emit("update_votes", poll.results);
      }
    } catch (err) {
      console.error(err);
    }
  }); // End retract_vote

  socket.on("get_recent_polls", async () => {
    console.log("Received get_recent_polls request");
    try {
      const recentPolls = await Poll.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .select("pollId title createdAt options"); // Select fields to send

      console.log(`Sending ${recentPolls.length} recent polls`);
      socket.emit("recent_polls", recentPolls);
    } catch (err) {
      console.error("Error fetching recent polls:", err);
    }
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
