const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const mongoSanitize = require('express-mongo-sanitize');
const rateLimit = require('express-rate-limit');
const logger = require('./utils/logger');

const app = express();

// Security Middlewares
app.use(helmet());
app.use(cors());
app.use(cookieParser());
app.use(mongoSanitize());

// Auth Rate Limiting
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'TOO_MANY_REQUESTS', message: 'Too many login attempts' }
});

// Log Ingestion Rate Limiting (Requirement 1.1)
const ingestionLimiter = rateLimit({
  windowMs: 10 * 1000, // 10 seconds
  max: 1000,
  keyGenerator: (req) => req.headers['x-api-key'] || req.ip,
  message: { error: 'RATE_LIMIT_EXCEEDED', message: 'Ingestion rate limit exceeded' }
});

app.use('/api/v1/auth', authLimiter);
app.use('/api/v1/logs', ingestionLimiter);

// Request Parsing
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Routes
const authRoutes = require('./routes/authRoutes');
const apiKeyRoutes = require('./routes/apiKeyRoutes');
const logRoutes = require('./routes/logRoutes');

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/keys', apiKeyRoutes);
app.use('/api/v1/logs', logRoutes);

// Health Check
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'UP',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  logger.error('Unhandled Error: %O', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'production' ? 'An unexpected error occurred' : err.message
  });
});

module.exports = app;
