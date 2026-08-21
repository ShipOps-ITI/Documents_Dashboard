const express = require('express');
const router = express.Router();
const { getStatistics } = require('../controllers/dashboard.controller');
const authenticate = require('../middleware/authenticate');

router.get('/statistics', authenticate, getStatistics);

// Accept requests that have an extra `/dashboard` prefix (e.g. /dashboard/dashboard/statistics)
router.get('/dashboard/statistics', getStatistics);

module.exports = router;
