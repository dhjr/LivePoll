const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { 
  cors: { 
    origin: ["http://localhost:3000", "http://192.168.0.106:3000"],
    methods: ["GET", "POST"]
  } 
});

// Map<pollId, { title, description, options, results: {option: count}, userVotes: Map<IP, option> }>
const polls = new Map();

const generatePollId = () => Math.random().toString(36).substring(2, 8).toUpperCase();

io.on('connection', (socket) => {
  const userIP = socket.handshake.address;
  /* original line 21 was the redeclaration */
  console.log(`User connected: ${userIP}`);
  // io.emit('user_connected', userIP); // Disabled per user request

  // Handle disconnect
  socket.on('disconnect', () => {
    console.log(`User disconnected: ${userIP}`);
    // io.emit('user_disconnected', userIP);
  });

  // Helpers to get current room/poll
  const getPollId = () => {
      // Find room starting with "poll_"
      const room = Array.from(socket.rooms).find(r => r.startsWith('poll_'));
      return room ? room.split('_')[1] : null;
  };

  socket.on('create_poll', (data) => {
    const pollId = generatePollId();
    const newPoll = {
      title: data.title,
      description: data.description,
      options: data.options,
      results: {},
      userVotes: new Map() // Store votes specific to this poll
    };

    // Initialize counts
    data.options.forEach(opt => newPoll.results[opt] = 0);

    polls.set(pollId, newPoll);
    
    // Join the creator to the room
    socket.join(`poll_${pollId}`);
    
    // Send back the ID and data
    socket.emit('poll_created', { pollId, pollData: { ...newPoll, userVotes: undefined } });
    console.log(`Poll created: ${pollId}`);
  });

  socket.on('join_poll', (pollId) => {
    const poll = polls.get(pollId);
    if (poll) {
        socket.join(`poll_${pollId}`);
        
        // Send initial data for THIS poll
        socket.emit('poll_joined', {
            pollId,
            pollData: {
                title: poll.title,
                description: poll.description,
                options: poll.options,
                results: poll.results
            },
            userPreviousVote: poll.userVotes.get(userIP) || null
        });
        console.log(`User joined poll: ${pollId}`);
    } else {
        socket.emit('error', 'Poll not found');
    }
  });

  socket.on('cast_vote', (option) => {
    const pollId = getPollId();
    if (!pollId) return;

    const poll = polls.get(pollId);
    if (!poll) return;

    // Handle previous vote removal
    if (poll.userVotes.has(userIP)) {
        const oldOption = poll.userVotes.get(userIP);
        if (poll.results[oldOption] !== undefined) {
            poll.results[oldOption] = Math.max(0, poll.results[oldOption] - 1);
        }
    }

    // Add new vote
    if (poll.results[option] !== undefined) {
        poll.results[option] += 1;
        poll.userVotes.set(userIP, option);
        io.to(`poll_${pollId}`).emit('update_votes', poll.results);
    }
  });

  socket.on('retract_vote', () => {
    const pollId = getPollId();
    if (!pollId) return;

    const poll = polls.get(pollId);
    if (!poll) return;

    if (poll.userVotes.has(userIP)) {
        const oldOption = poll.userVotes.get(userIP);
        if (poll.results[oldOption] !== undefined) {
            poll.results[oldOption] = Math.max(0, poll.results[oldOption] - 1);
        }
        poll.userVotes.delete(userIP);
        io.to(`poll_${pollId}`).emit('update_votes', poll.results);
    }
  });
});

server.listen(3001, () => console.log('✅ Server running on port 3001'));