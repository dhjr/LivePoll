const jwt = require("jsonwebtoken");
const { JWT_SECRET } = require("../middleware/auth");

/**
 * Guest Login Controller
 */
const login = (req, res) => {
  const { username } = req.body;

  if (!username || username.trim() === "") {
    return res.status(400).json({ error: "Username is required" });
  }

  const userId = `${username}_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

  const token = jwt.sign({ userId, username }, JWT_SECRET, {
    expiresIn: "24h", // Updated to 24 hours
  });

  res.json({ token, userId, username });
};

module.exports = {
  login,
};
