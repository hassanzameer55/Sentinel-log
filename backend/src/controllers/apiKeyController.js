const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const ApiKey = require('../models/ApiKey');
const logger = require('../utils/logger');

exports.createKey = async (req, res) => {
  try {
    const { name, scopedServices, expiresAt } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'BAD_REQUEST', message: 'Key name is required' });
    }

    // Generate 64-char hex key
    const rawKey = crypto.randomBytes(32).toString('hex');
    const keyHash = await bcrypt.hash(rawKey, 12);
    const prefix = rawKey.substring(0, 8);

    const apiKey = await ApiKey.create({
      name,
      keyHash,
      prefix,
      creator: req.user._id,
      scopedServices: scopedServices || [],
      expiresAt: expiresAt ? new Date(expiresAt) : null,
    });

    logger.info(`API Key created: ${name} by user ${req.user.email}`);

    res.status(201).json({
      status: 'success',
      data: {
        id: apiKey._id,
        name: apiKey.name,
        key: rawKey, // SENT ONLY ONCE
        prefix: apiKey.prefix,
        scopedServices: apiKey.scopedServices,
        expiresAt: apiKey.expiresAt,
      },
      message: 'IMPORTANT: Store this key safely. It will not be shown again.'
    });
  } catch (error) {
    logger.error('API Key Creation Error: %O', error);
    res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Failed to create API key' });
  }
};

exports.revokeKey = async (req, res) => {
  try {
    const apiKey = await ApiKey.findById(req.params.id);
    if (!apiKey) {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'API key not found' });
    }

    apiKey.isRevoked = true;
    await apiKey.save();

    logger.info(`API Key revoked: ${apiKey.name} by user ${req.user.email}`);

    res.status(200).json({ status: 'success', message: 'API key revoked successfully' });
  } catch (error) {
    logger.error('API Key Revocation Error: %O', error);
    res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Failed to revoke API key' });
  }
};

exports.listKeys = async (req, res) => {
  try {
    const keys = await ApiKey.find({ isRevoked: false }).select('-keyHash');
    res.status(200).json({ status: 'success', data: keys });
  } catch (error) {
    res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Failed to list API keys' });
  }
};
