const { Server } = require('socket.io');
const { redisClient } = require('./redis');
const logger = require('../utils/logger');

let io;

const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: "*", // Adjust for production
      methods: ["GET", "POST"]
    }
  });

  io.on('connection', (socket) => {
    logger.info(`Client connected to live feed: ${socket.id}`);
    
    socket.on('subscribe', (service_id) => {
      socket.join(`logs:${service_id}`);
      logger.debug(`Socket ${socket.id} joined room logs:${service_id}`);
    });

    socket.on('disconnect', () => {
      logger.info(`Client disconnected: ${socket.id}`);
    });
  });

  // Setup Redis Subscriber for real-time broadcasts
  const subscriber = redisClient.duplicate();
  subscriber.connect().then(() => {
    subscriber.subscribe('log-updates', (message) => {
      const log = JSON.parse(message);
      // Broadcast to global feed
      io.emit('new-log', log);
      // Broadcast to specific service room
      io.to(`logs:${log.service_id}`).emit('new-log', log);
    });
  });

  return io;
};

const getIO = () => {
  if (!io) throw new Error('Socket.io not initialized');
  return io;
};

module.exports = { initSocket, getIO };
