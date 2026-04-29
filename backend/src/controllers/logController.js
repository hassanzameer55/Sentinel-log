const Joi = require('joi');
const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { redisClient } = require('../config/redis');
const ApiKey = require('../models/ApiKey');
const bcrypt = require('bcryptjs');
const logger = require('../utils/logger');

const FALLBACK_PATH = path.join(__dirname, '../../logs/fallback-buffer.ndjson');

// Joi Validation Schema
const logSchema = Joi.object({
  timestamp: Joi.date().iso().default(() => new Date()),
  level: Joi.string().valid('EMERGENCY', 'ALERT', 'CRITICAL', 'ERROR', 'WARNING', 'NOTICE', 'INFO', 'DEBUG').required(),
  service_id: Joi.string().alphanum().min(3).max(30).required(),
  message: Joi.string().max(5000).required(),
  request_id: Joi.string().guid({ version: ['uuidv4'] }).optional(),
  metadata: Joi.object().unknown(true).optional(),
});

/**
 * Helper: Save to local file if Redis is down (Requirement 1.7)
 */
const saveToFallback = (logData) => {
  const line = JSON.stringify(logData) + '\n';
  fs.appendFileSync(FALLBACK_PATH, line);
  logger.warn('Redis is down. Log saved to local fallback buffer.');
};

/**
 * Validate API Key against DB
 */
const validateKey = async (apiKey) => {
  if (!apiKey) return null;
  const prefix = apiKey.substring(0, 8);
  const foundKey = await ApiKey.findOne({ prefix, isRevoked: false });
  if (!foundKey) return null;
  const isValid = await bcrypt.compare(apiKey, foundKey.keyHash);
  return isValid ? foundKey : null;
};

/**
 * POST /api/v1/logs - Single log ingestion
 */
exports.ingestLog = async (req, res) => {
  try {
    const apiKey = await validateKey(req.headers['x-api-key']);
    if (!apiKey) return res.status(401).json({ error: 'UNAUTHORIZED', message: 'Invalid API Key' });

    const { error, value } = logSchema.validate(req.body);
    if (error) return res.status(400).json({ error: 'BAD_REQUEST', message: error.details[0].message });

    if (apiKey.scopedServices.length > 0 && !apiKey.scopedServices.includes(value.service_id)) {
      return res.status(403).json({ error: 'FORBIDDEN', message: 'Service ID not authorized for this key' });
    }

    if (redisClient.isOpen) {
      await redisClient.lPush('logs:queue', JSON.stringify(value));
    } else {
      saveToFallback(value);
    }

    res.status(202).json({ status: 'accepted' });
  } catch (error) {
    logger.error('Ingestion Error: %O', error);
    res.status(500).json({ error: 'INTERNAL_ERROR' });
  }
};

/**
 * POST /api/v1/logs/bulk - Bulk NDJSON ingestion (Requirement 1.4)
 */
exports.ingestBulk = async (req, res) => {
  try {
    const apiKey = await validateKey(req.headers['x-api-key']);
    if (!apiKey) return res.status(401).json({ error: 'UNAUTHORIZED' });

    let count = 0;
    const rl = readline.createInterface({
      input: req, // Express request is a stream
      terminal: false
    });

    for await (const line of rl) {
      if (!line.trim()) continue;
      try {
        const logData = JSON.parse(line);
        const { error, value } = logSchema.validate(logData);
        
        if (!error && (apiKey.scopedServices.length === 0 || apiKey.scopedServices.includes(value.service_id))) {
          if (redisClient.isOpen) {
            await redisClient.lPush('logs:queue', JSON.stringify(value));
          } else {
            saveToFallback(value);
          }
          count++;
        }
      } catch (e) {
        // Skip invalid JSON lines
      }
    }

    res.status(202).json({ status: 'accepted', processed: count });
  } catch (error) {
    logger.error('Bulk Ingestion Error: %O', error);
    res.status(500).json({ error: 'INTERNAL_ERROR' });
  }
};

/**
 * GET /api/v1/logs - Query and filter logs (Phase 4)
 */
exports.getLogs = async (req, res) => {
  try {
    const { 
      service_id, 
      level, 
      startTime, 
      endTime, 
      search, 
      limit = 50,
      next_cursor // timestamp_id format
    } = req.query;

    const query = {};

    // 1. Apply Filters
    if (service_id) query.service_id = service_id;
    if (level) query.level = level;
    if (startTime || endTime) {
      query.timestamp = {};
      if (startTime) query.timestamp.$gte = new Date(startTime);
      if (endTime) query.timestamp.$lte = new Date(endTime);
    }

    // 2. Full-Text Search
    if (search) {
      query.$text = { $search: search };
    }

    // 3. Cursor-based Pagination (Requirement 5.2)
    if (next_cursor) {
      const [ts, id] = next_cursor.split('_');
      query.$or = [
        { timestamp: { $lt: new Date(ts) } },
        { timestamp: new Date(ts), _id: { $lt: id } }
      ];
    }

    // 4. Execute Query
    const logs = await Log.find(query)
      .sort({ timestamp: -1, _id: -1 }) // Sort by newest first
      .limit(parseInt(limit) + 1) // Fetch one extra to check if there is a next page
      .lean();

    // 5. Build Pagination Metadata
    let nextCursor = null;
    if (logs.length > limit) {
      const lastItem = logs[limit - 1];
      nextCursor = `${lastItem.timestamp.toISOString()}_${lastItem._id}`;
      logs.pop(); // Remove the extra item
    }

    res.status(200).json({
      status: 'success',
      results: logs.length,
      next_cursor: nextCursor,
      data: logs
    });
  } catch (error) {
    logger.error('Query Error: %O', error);
    res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Failed to fetch logs' });
  }
};

/**
 * GET /api/v1/logs/trace/:requestId - Distributed Tracing (Requirement 5.4)
 */
exports.getTrace = async (req, res) => {
  try {
    const { requestId } = req.params;

    const logs = await Log.find({ request_id: requestId })
      .sort({ timestamp: 1 }) // Chronological order for tracing
      .lean();

    if (logs.length === 0) {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'No trace found for this ID' });
    }

    // Calculate trace duration
    const duration = logs[logs.length - 1].timestamp - logs[0].timestamp;
    const services = [...new Set(logs.map(l => l.service_id))];

    res.status(200).json({
      status: 'success',
      metadata: {
        requestId,
        duration_ms: duration,
        hop_count: services.length,
        services
      },
      data: logs
    });
  } catch (error) {
    logger.error('Trace Error: %O', error);
    res.status(500).json({ error: 'INTERNAL_ERROR' });
  }
};

/**
 * GET /api/v1/logs/stats - Aggregated analytics (Phase 7)
 */
exports.getStats = async (req, res) => {
  try {
    const { days = 7 } = req.query;
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const [levelStats, timeStats, serviceStats] = await Promise.all([
      // 1. Level Distribution
      Log.aggregate([
        { $match: { timestamp: { $gte: since } } },
        { $group: { _id: '$level', count: { $sum: 1 } } }
      ]),
      
      // 2. Logs over time (Daily buckets)
      Log.aggregate([
        { $match: { timestamp: { $gte: since } } },
        {
          $group: {
            _id: {
              $dateToString: { format: '%Y-%m-%d', date: '$timestamp' }
            },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ]),

      // 3. Service Distribution
      Log.aggregate([
        { $match: { timestamp: { $gte: since } } },
        { $group: { _id: '$service_id', count: { $sum: 1 } } },
        { $limit: 10 }
      ])
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        levels: levelStats,
        timeline: timeStats,
        services: serviceStats
      }
    });
  } catch (error) {
    logger.error('Stats Error: %O', error);
    res.status(500).json({ error: 'INTERNAL_ERROR' });
  }
};

/**
 * GET /api/v1/logs/export - Export logs to JSON/CSV (Requirement 1.5)
 */
exports.exportLogs = async (req, res) => {
  try {
    const { format = 'json' } = req.query;
    const logs = await Log.find().limit(1000).lean();

    if (format === 'csv') {
      const headers = 'timestamp,level,service_id,message\n';
      const rows = logs.map(l => 
        `${l.timestamp.toISOString()},${l.level},${l.service_id},"${l.message.replace(/"/g, '""')}"`
      ).join('\n');
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=sentinel-logs.csv');
      return res.send(headers + rows);
    }

    res.status(200).json(logs);
  } catch (error) {
    res.status(500).json({ error: 'EXPORT_FAILED' });
  }
};
