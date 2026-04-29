const { redisClient } = require('../config/redis');
const Log = require('../models/Log');
const logger = require('../utils/logger');

const BATCH_SIZE = 500;
const DRAIN_INTERVAL = 5000; // 5 seconds

/**
 * Worker to drain Redis queue and persist to MongoDB
 */
const startWorker = async () => {
  logger.info('Log Persistence Worker started');

  let batch = [];
  
  const flushBatch = async () => {
    if (batch.length === 0) return;
    
    try {
      const logsToInsert = batch.map(l => JSON.parse(l));
      await Log.insertMany(logsToInsert, { ordered: false });
      
      // Publish to Redis Pub/Sub for real-time layer
      logsToInsert.forEach(log => {
        redisClient.publish('log-updates', JSON.stringify(log));
      });

      logger.debug(`Worker persisted ${batch.length} logs to MongoDB`);
      batch = [];
    } catch (error) {
      logger.error('Worker Persistence Error: %O', error);
      // In a real scenario, we'd push failed logs to a Dead Letter Queue
    }
  };

  // Interval flush
  setInterval(flushBatch, DRAIN_INTERVAL);

  // Main loop
  while (true) {
    try {
      // Blocking pop from the right side of the list
      const log = await redisClient.brPop('logs:queue', 0);
      
      if (log) {
        batch.push(log.element);
        
        if (batch.length >= BATCH_SIZE) {
          await flushBatch();
        }
      }
    } catch (error) {
      logger.error('Worker loop error: %O', error);
      // Wait a bit before retrying on error
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
};

module.exports = startWorker;
