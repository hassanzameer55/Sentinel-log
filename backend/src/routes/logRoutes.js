const express = require('express');
const logController = require('../controllers/logController');
const { protect, restrictTo } = require('../middlewares/auth');

const router = express.Router();

// 1. Ingestion Endpoints (Public + API Key)
router.post('/', logController.ingestLog);
router.post('/bulk', logController.ingestBulk);

// 2. Query Endpoints (Protected + JWT)
router.use(protect); // All routes below require user auth

router.get('/', restrictTo('VIEWER', 'DEVELOPER', 'SRE', 'ADMIN', 'SUPER_ADMIN'), logController.getLogs);
router.get('/stats', restrictTo('DEVELOPER', 'SRE', 'ADMIN', 'SUPER_ADMIN'), logController.getStats);
router.get('/export', restrictTo('ADMIN', 'SUPER_ADMIN'), logController.exportLogs);
router.get('/trace/:requestId', restrictTo('DEVELOPER', 'SRE', 'ADMIN', 'SUPER_ADMIN'), logController.getTrace);

module.exports = router;
