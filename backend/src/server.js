const app = require('./app');
const config = require('./config/env');
const connectDB = require('./config/db');
const { connectRedis } = require('./config/redis');
const { initSocket } = require('./config/socket');
const startWorker = require('./services/worker');
const startAlerting = require('./services/alertEvaluator');
const logger = require('./utils/logger');

const startServer = async () => {
  // Connect to Databases
  await connectDB();
  await connectRedis();

  const port = config.port;
  const server = app.listen(port, () => {
    logger.info(`Server running in ${config.env} mode on port ${port}`);
  });

  // Initialize Socket.io
  initSocket(server);

  // Start background processes
  startWorker();
  startAlerting();

  const port = config.port;
  const server = app.listen(port, () => {
    logger.info(`Server running in ${config.env} mode on port ${port}`);
  });

  // Handle unhandled rejections
  process.on('unhandledRejection', (err) => {
    logger.error('Unhandled Rejection! Shutting down...');
    logger.error(err.name, err.message);
    server.close(() => {
      process.exit(1);
    });
  });
};

startServer();
