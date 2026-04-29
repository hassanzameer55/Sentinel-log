require('dotenv').config();

const config = {
  env: process.env.NODE_ENV || 'development',
  port: process.env.PORT || 5000,
  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/sentinel_log',
  },
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'super-secret-key',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'super-secret-refresh-key',
    expiry: '15m',
    refreshExpiry: '7d',
  },
};

module.exports = config;
