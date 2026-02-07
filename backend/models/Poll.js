const mongoose = require("mongoose");
const PollSchema = new mongoose.Schema({
  pollId: {
    type: String,
    required: true,
    unique: true,
  },
  title: {
    type: String,
    required: true,
  },
  description: String,
  options: [String],
  // Map of Option Text -> Vote Count
  results: {
    type: Map,
    of: Number,
    default: {},
  },
  // We need to track who voted to prevent duplicate votes (and to remove them later)
  // Instead of a simple Map, we can use an array of objects
  userVotes: [
    {
      userId: String, // Changed from ip to userId
      option: String,
    },
  ],
  createdBy: String, // Track who created the poll
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Poll", PollSchema);
