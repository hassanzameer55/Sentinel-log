const mongoose = require('mongoose');

const refreshTokenSchema = new mongoose.Schema({
  token: {
    type: String,
    required: true,
    unique: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  expiresAt: {
    type: Date,
    required: true,
  },
  createdByIp: String,
  revokedAt: Date,
  revokedByIp: String,
  replacedByToken: String,
  isUsed: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true,
});

refreshTokenSchema.virtual('isExpired').get(function () {
  return Date.now() >= this.expiresAt;
});

refreshTokenSchema.virtual('isActive').get(function () {
  return !this.revokedAt && !this.isExpired;
});

module.exports = mongoose.model('RefreshToken', refreshTokenSchema);
