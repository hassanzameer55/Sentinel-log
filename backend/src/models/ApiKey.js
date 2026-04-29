const mongoose = require('mongoose');

const apiKeySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  keyHash: {
    type: String,
    required: true,
    unique: true,
  },
  prefix: {
    type: String,
    required: true, // First few chars for display purposes (e.g. sentinel-xxxx)
  },
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  scopedServices: [{
    type: String, // service_id slugs
  }],
  lastUsedAt: {
    type: Date,
  },
  expiresAt: {
    type: Date,
  },
  isRevoked: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('ApiKey', apiKeySchema);
