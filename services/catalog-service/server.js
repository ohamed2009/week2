require("dotenv").config();
const app = require("./src/app");
const connectDB = require("./src/config/db");

const PORT = process.env.PORT || 4002;

async function start() {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`[catalog-service] listening on port ${PORT}`);
  });
}

start();
