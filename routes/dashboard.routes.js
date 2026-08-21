const express = require('express');
const router = express.Router();
const { getStatistics } = require('../controllers/dashboard.controller');

// Normal route: /dashboard/statistics (when service mounted at /dashboard)
router.get('/statistics', getStatistics);

// Accept requests that have an extra `/dashboard` prefix (e.g. /dashboard/dashboard/statistics)
router.get('/dashboard/statistics', getStatistics);

module.exports = router;
