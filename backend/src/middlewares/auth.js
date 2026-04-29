const jwt = require('jsonwebtoken');
const config = require('../config/env');
const User = require('../models/User');
const logger = require('../utils/logger');

/**
 * Protect routes - Verify JWT access token
 */
exports.protect = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ error: 'UNAUTHORIZED', message: 'Authentication required' });
    }

    // Verify token
    const decoded = jwt.verify(token, config.jwt.secret);

    // Check if user still exists
    const currentUser = await User.findById(decoded.id);
    if (!currentUser || !currentUser.isActive) {
      return res.status(401).json({ error: 'UNAUTHORIZED', message: 'User no longer exists or is inactive' });
    }

    // Grant access
    req.user = currentUser;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'TOKEN_EXPIRED', message: 'Session expired' });
    }
    return res.status(401).json({ error: 'INVALID_TOKEN', message: 'Authentication failed' });
  }
};

/**
 * Restrict access to specific roles
 */
exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: 'FORBIDDEN', 
        message: 'You do not have permission to perform this action' 
      });
    }
    next();
  };
};
