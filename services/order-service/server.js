require('dotenv').config();

const app = require('./src/app');
const connectDB = require('./src/config/db');

const PORT = process.env.PORT || 4003;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`order-service listening on port ${PORT}`);
  });
});
