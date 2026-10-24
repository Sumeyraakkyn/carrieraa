'use strict';
const router = require('express').Router();
const { getProgress } = require('../controllers/progress.controller');
const authMiddleware = require('../middleware/auth.middleware');

router.get('/me', authMiddleware, getProgress);

module.exports = router;
