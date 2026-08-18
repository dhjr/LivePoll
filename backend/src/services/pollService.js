const redis = require("../config/redis");

const POLL_EXPIRY = 86400; // 24 hours in seconds

const generatePollId = () =>
  Math.random().toString(36).substring(2, 8).toUpperCase();

/**
 * Saves a new poll object in Redis using atomic Hash keys.
 */
const savePollToRedis = async (pollId, pollData) => {
  const metaKey = `poll:${pollId}:meta`;
  const votesKey = `poll:${pollId}:votes`;
  const userVotesKey = `poll:${pollId}:uservotes`;

  const pipeline = redis.pipeline();

  pipeline.hset(metaKey, {
    pollId: pollData.pollId,
    title: pollData.title,
    description: pollData.description || "",
    options: JSON.stringify(pollData.options),
    createdBy: pollData.createdBy,
    createdAt: new Date(pollData.createdAt).toISOString(),
  });
  pipeline.expire(metaKey, POLL_EXPIRY);

  const votesHash = {};
  pollData.options.forEach((opt) => {
    votesHash[opt] = 0;
  });
  pipeline.hset(votesKey, votesHash);
  pipeline.expire(votesKey, POLL_EXPIRY);

  pipeline.expire(userVotesKey, POLL_EXPIRY);

  await pipeline.exec();
};

/**
 * Retrieves full poll state from Redis.
 */
const getPollFromRedis = async (pollId) => {
  const metaKey = `poll:${pollId}:meta`;
  const votesKey = `poll:${pollId}:votes`;
  const userVotesKey = `poll:${pollId}:uservotes`;

  const [meta, votesRaw, userVotesRaw] = await Promise.all([
    redis.hgetall(metaKey),
    redis.hgetall(votesKey),
    redis.hgetall(userVotesKey),
  ]);

  if (!meta || !meta.pollId) {
    return null;
  }

  const options = meta.options ? JSON.parse(meta.options) : [];

  const results = {};
  options.forEach((opt) => {
    results[opt] = parseInt((votesRaw && votesRaw[opt]) || "0", 10);
  });

  const userVotes = [];
  const detailedVotes = {};
  options.forEach((opt) => (detailedVotes[opt] = []));

  Object.entries(userVotesRaw || {}).forEach(([uId, dataStr]) => {
    try {
      const voteData = JSON.parse(dataStr);
      userVotes.push({
        userId: uId,
        username: voteData.username,
        option: voteData.option,
      });
      if (detailedVotes[voteData.option]) {
        detailedVotes[voteData.option].push(voteData.username);
      }
    } catch (e) {
      // Ignore parse errors
    }
  });

  return {
    pollId: meta.pollId,
    title: meta.title,
    description: meta.description,
    options,
    results,
    detailedVotes,
    userVotes,
    createdBy: meta.createdBy,
    createdAt: meta.createdAt,
  };
};

/**
 * Atomically casts or updates a vote to prevent Read-Modify-Write race conditions.
 */
const castVoteAtomic = async (pollId, userId, username, option) => {
  const votesKey = `poll:${pollId}:votes`;
  const userVotesKey = `poll:${pollId}:uservotes`;

  const existingVoteStr = await redis.hget(userVotesKey, userId);
  let oldOption = null;
  if (existingVoteStr) {
    try {
      const existingVote = JSON.parse(existingVoteStr);
      oldOption = existingVote.option;
    } catch (e) {}
  }

  if (oldOption === option) {
    return;
  }

  const pipeline = redis.pipeline();

  if (oldOption) {
    pipeline.hincrby(votesKey, oldOption, -1);
  }

  pipeline.hincrby(votesKey, option, 1);
  pipeline.hset(userVotesKey, userId, JSON.stringify({ option, username }));

  await pipeline.exec();
};

/**
 * Atomically retracts a vote.
 */
const retractVoteAtomic = async (pollId, userId) => {
  const votesKey = `poll:${pollId}:votes`;
  const userVotesKey = `poll:${pollId}:uservotes`;

  const existingVoteStr = await redis.hget(userVotesKey, userId);
  if (!existingVoteStr) return;

  let oldOption = null;
  try {
    const existingVote = JSON.parse(existingVoteStr);
    oldOption = existingVote.option;
  } catch (e) {}

  if (!oldOption) return;

  const pipeline = redis.pipeline();
  pipeline.hincrby(votesKey, oldOption, -1);
  pipeline.hdel(userVotesKey, userId);

  await pipeline.exec();
};

module.exports = {
  generatePollId,
  savePollToRedis,
  getPollFromRedis,
  castVoteAtomic,
  retractVoteAtomic,
};
