require("dotenv").config();
const { server } = require("./src/app");

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`✅ LivePoll Server running on port ${PORT}`);
});
