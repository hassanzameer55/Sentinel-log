const express = require('express');
const apiKeyController = require('../controllers/apiKeyController');
const { protect, restrictTo } = require('../middlewares/auth');

const router = express.Router();

router.use(protect); // All routes protected

router.route('/')
  .get(restrictTo('ADMIN', 'SUPER_ADMIN'), apiKeyController.listKeys)
  .post(restrictTo('ADMIN', 'SUPER_ADMIN'), apiKeyController.createKey);

router.delete('/:id', restrictTo('ADMIN', 'SUPER_ADMIN'), apiKeyController.revokeKey);

module.exports = router;
