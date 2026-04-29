const cron = require('node-cron');
const AlertRule = require('../models/AlertRule');
const Log = require('../models/Log');
const logger = require('../utils/logger');

/**
 * Evaluate a single alert rule
 */
const evaluateRule = async (rule) => {
  const windowStart = new Date(Date.now() - rule.window_minutes * 60 * 1000);
  
  // Check cooldown
  if (rule.last_fired_at) {
    const cooldownEnd = new Date(rule.last_fired_at.getTime() + rule.cooldown_minutes * 60 * 1000);
    if (new Date() < cooldownEnd) return;
  }

  const query = {
    timestamp: { $gte: windowStart }
  };

  if (rule.service_id) query.service_id = rule.service_id;
  if (rule.level) query.level = rule.level;
  if (rule.message_pattern) {
    query.message = { $regex: rule.message_pattern, $options: 'i' };
  }

  const count = await Log.countDocuments(query);

  if (count >= rule.threshold) {
    logger.warn(`ALERT FIRED: ${rule.name}. Threshold ${rule.threshold} exceeded with ${count} matches.`);
    
    rule.last_fired_at = Date.now();
    await rule.save();

    // TODO: Integrate with Notification Dispatcher (Email, Slack, etc.)
  }
};

/**
 * Start the Alerting Cron Job
 */
const startAlerting = () => {
  logger.info('Alerting Engine started (Interval: 1m)');
  
  // Run every minute
  cron.schedule('* * * * *', async () => {
    try {
      const activeRules = await AlertRule.find({ isActive: true });
      for (const rule of activeRules) {
        await evaluateRule(rule);
      }
    } catch (error) {
      logger.error('Alert Evaluation Error: %O', error);
    }
  });
};

module.exports = startAlerting;
