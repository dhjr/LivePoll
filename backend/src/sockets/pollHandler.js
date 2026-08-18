const {
  generatePollId,
  savePollToRedis,
  getPollFromRedis,
  castVoteAtomic,
  retractVoteAtomic,
} = require("../services/pollService");

const registerPollHandlers = (io, socket) => {
  const { userId, username } = socket.user;
  console.log(`User connected: ${username} (${userId})`);

  const broadcastRoomUsers = async (pollId) => {
    try {
      const sockets = await io.in(`poll_${pollId}`).fetchSockets();
      const users = sockets.map((s) => ({
        userId: s.user.userId,
        username: s.user.username,
      }));

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

  // 1. Create Poll
  socket.on("create_poll", async (data) => {
    try {
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
        userVotes: [],
        createdBy: userId,
        createdAt: new Date(),
      };

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

  // 2. Join Poll
  socket.on("join_poll", async (pollId) => {
    try {
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
            results: poll.results,
            detailedVotes: poll.detailedVotes,
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

  // 3. Cast Vote
  socket.on("cast_vote", async (option) => {
    const pollId = getPollId();
    if (!pollId) return;

    try {
      await castVoteAtomic(pollId, userId, username, option);
      const poll = await getPollFromRedis(pollId);

      if (poll) {
        io.to(`poll_${pollId}`).emit("update_votes", {
          results: poll.results,
          detailedVotes: poll.detailedVotes,
        });
        console.log(`Vote cast (Atomic Redis) by ${username} in poll ${pollId}`);
      }
    } catch (err) {
      console.error("Error casting vote:", err);
    }
  });

  // 4. Retract Vote
  socket.on("retract_vote", async () => {
    const pollId = getPollId();
    if (!pollId) return;

    try {
      await retractVoteAtomic(pollId, userId);
      const poll = await getPollFromRedis(pollId);

      if (poll) {
        io.to(`poll_${pollId}`).emit("update_votes", {
          results: poll.results,
          detailedVotes: poll.detailedVotes,
        });
        console.log(`Vote retracted (Atomic Redis) by ${username} in poll ${pollId}`);
      }
    } catch (err) {
      console.error("Error retracting vote:", err);
    }
  });

  // 5. Leave Poll
  socket.on("leave_poll", () => {
    const pollId = getPollId();
    if (pollId) {
      socket.leave(`poll_${pollId}`);
      socket.currentPollId = null;
      console.log(`User ${username} left poll: ${pollId}`);
      broadcastRoomUsers(pollId);
    }
  });
};

module.exports = registerPollHandlers;
