const express = require('express');
const router = express.Router();
const { getStatistics } = require('../controllers/dashboard.controller');

router.get('/statistics', getStatistics);

module.exports = router;
