'use strict';

const router = require('express').Router();
const authMiddleware = require('../middleware/auth.middleware');
const { getRewardsOverview } = require('../controllers/reward.controller');

router.get('/overview', authMiddleware, getRewardsOverview);

module.exports = router;
