const jwt = require("jsonwebtoken");
require("dotenv").config();

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  console.error("❌ FATAL: JWT_SECRET is not defined in .env");
  process.exit(1);
}

/**
 * Socket.IO Authentication Middleware
 * Verifies JWT token attached in socket handshake auth.
 */
const verifySocketToken = (socket, next) => {
  const token = socket.handshake.auth.token;

  if (!token) {
    return next(new Error("Authentication error: No token provided"));
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return next(new Error("Authentication error: Invalid token"));
    }
    socket.user = decoded;
    next();
  });
};

module.exports = {
  verifySocketToken,
  JWT_SECRET,
};
