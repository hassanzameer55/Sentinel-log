const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const RefreshToken = require('../models/RefreshToken');
const config = require('../config/env');
const logger = require('../utils/logger');

const signToken = (id) => {
  return jwt.sign({ id }, config.jwt.secret, { expiresIn: config.jwt.expiry });
};

const createRefreshToken = async (user, ipAddress) => {
  const token = crypto.randomBytes(40).toString('hex');
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  return await RefreshToken.create({
    token,
    user: user._id,
    expiresAt,
    createdByIp: ipAddress,
  });
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'BAD_REQUEST', message: 'Email and password are required' });
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ error: 'UNAUTHORIZED', message: 'Invalid credentials' });
    }

    if (user.lockUntil && user.lockUntil > Date.now()) {
      return res.status(423).json({ error: 'LOCKED', message: 'Account is temporarily locked' });
    }

    const accessToken = signToken(user._id);
    const refreshToken = await createRefreshToken(user, req.ip);

    // Set refresh token in HttpOnly cookie
    res.cookie('refreshToken', refreshToken.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.status(200).json({
      status: 'success',
      accessToken,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        allowedServices: user.allowedServices
      }
    });
  } catch (error) {
    logger.error('Login Error: %O', error);
    res.status(500).json({ error: 'INTERNAL_ERROR', message: 'An error occurred during login' });
  }
};

exports.refreshToken = async (req, res) => {
  const token = req.cookies.refreshToken;
  if (!token) return res.status(401).json({ error: 'UNAUTHORIZED', message: 'No refresh token provided' });

  try {
    const refreshToken = await RefreshToken.findOne({ token }).populate('user');
    
    if (!refreshToken || !refreshToken.isActive) {
      // Possible reuse attack!
      if (refreshToken && refreshToken.isUsed) {
        logger.warn(`Refresh token reuse detected for user ${refreshToken.user._id}! Revoking all tokens.`);
        await RefreshToken.updateMany({ user: refreshToken.user._id }, { revokedAt: Date.now() });
      }
      return res.status(401).json({ error: 'UNAUTHORIZED', message: 'Invalid refresh token' });
    }

    // Rotate token
    const newUserToken = await createRefreshToken(refreshToken.user, req.ip);
    refreshToken.revokedAt = Date.now();
    refreshToken.replacedByToken = newUserToken.token;
    refreshToken.isUsed = true;
    await refreshToken.save();

    const accessToken = signToken(refreshToken.user._id);

    res.cookie('refreshToken', newUserToken.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.status(200).json({ status: 'success', accessToken });
  } catch (error) {
    logger.error('Refresh Token Error: %O', error);
    res.status(500).json({ error: 'INTERNAL_ERROR', message: 'An error occurred during token refresh' });
  }
};

exports.logout = async (req, res) => {
  const token = req.cookies.refreshToken;
  if (token) {
    await RefreshToken.findOneAndUpdate({ token }, { revokedAt: Date.now() });
  }
  res.clearCookie('refreshToken');
  res.status(204).json({ status: 'success' });
};
