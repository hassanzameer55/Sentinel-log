const mongoose = require('mongoose');

const alertRuleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  description: String,
  service_id: String,
  level: {
    type: String,
    enum: ['EMERGENCY', 'ALERT', 'CRITICAL', 'ERROR', 'WARNING', 'NOTICE', 'INFO', 'DEBUG'],
  },
  message_pattern: String, // Regex or simple string match
  threshold: {
    type: Number,
    required: true, // e.g. 10 occurrences
  },
  window_minutes: {
    type: Number,
    required: true, // e.g. in 5 minutes
    default: 5,
  },
  channels: {
    email: [String],
    slack_webhook: String,
    webhook_url: String,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  last_evaluated_at: Date,
  cooldown_minutes: {
    type: Number,
    default: 15, // Don't refire for 15 mins
  },
  last_fired_at: Date,
}, {
  timestamps: true,
});

module.exports = mongoose.model('AlertRule', alertRuleSchema);
