const nodemailer = require('nodemailer');
const axios = require('axios');
const config = require('../config/env');
const logger = require('../utils/logger');

// Setup Email Transporter (Configure with your SMTP in .env)
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.mailtrap.io',
  port: process.env.SMTP_PORT || 2525,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

/**
 * Dispatch notifications to all configured channels for an alert
 */
exports.dispatchAlert = async (rule, count) => {
  const message = `ALERT: "${rule.name}" triggered. Threshold ${rule.threshold} exceeded with ${count} matches in the last ${rule.window_minutes} minutes.`;

  const notificationPromises = [];

  // 1. Send Email
  if (rule.channels?.email?.length > 0) {
    notificationPromises.push(
      transporter.sendMail({
        from: '"Sentinel Log" <alerts@sentinel.io>',
        to: rule.channels.email.join(','),
        subject: `[ALERT] ${rule.name}`,
        text: message,
        html: `<b>${message}</b>`,
      }).catch(err => logger.error('Email Dispatch Failed: %O', err))
    );
  }

  // 2. Send Slack Webhook
  if (rule.channels?.slack_webhook) {
    notificationPromises.push(
      axios.post(rule.channels.slack_webhook, {
        text: `🚨 *Sentinel Alert fired!* \n> Rule: ${rule.name}\n> Matches: ${count}\n> Message: ${message}`
      }).catch(err => logger.error('Slack Dispatch Failed: %O', err))
    );
  }

  // 3. Send Generic Webhook
  if (rule.channels?.webhook_url) {
    notificationPromises.push(
      axios.post(rule.channels.webhook_url, {
        alert: rule.name,
        count,
        timestamp: new Date().toISOString(),
        rule_id: rule._id
      }).catch(err => logger.error('Webhook Dispatch Failed: %O', err))
    );
  }

  await Promise.all(notificationPromises);
  logger.info(`Notifications dispatched for alert: ${rule.name}`);
};
