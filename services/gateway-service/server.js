require("dotenv").config();
const app = require("./src/app");

const PORT = process.env.PORT || 4000;

async function start() {
  app.listen(PORT, () => {
    console.log(`[gateway-service] listening on port ${PORT}`);
  });
}

start();
