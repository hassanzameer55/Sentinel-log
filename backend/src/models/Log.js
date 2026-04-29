const mongoose = require('mongoose');

const logSchema = new mongoose.Schema({
  timestamp: {
    type: Date,
    required: true,
    index: true,
  },
  level: {
    type: String,
    enum: ['EMERGENCY', 'ALERT', 'CRITICAL', 'ERROR', 'WARNING', 'NOTICE', 'INFO', 'DEBUG'],
    required: true,
    index: true,
  },
  service_id: {
    type: String,
    required: true,
    index: true,
  },
  message: {
    type: String,
    required: true,
  },
  request_id: {
    type: String,
    index: true,
  },
  metadata: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
  },
  ingested_at: {
    type: Date,
    default: Date.now,
  }
}, {
  timestamps: false, // We use our own timestamps
});

// Compound index for performance filtering (Requirement 3.1)
logSchema.index({ service_id: 1, level: 1, timestamp: -1 });

// Text index for full-text search (Requirement 3.3)
logSchema.index({ message: 'text' });

// TTL Index for auto-deletion after 30 days (Requirement 2.4)
// 30 days = 30 * 24 * 60 * 60 = 2,592,000 seconds
logSchema.index({ timestamp: 1 }, { expireAfterSeconds: 2592000 });

module.exports = mongoose.model('Log', logSchema);
