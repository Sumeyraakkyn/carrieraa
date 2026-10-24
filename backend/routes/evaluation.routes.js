'use strict';
const router = require('express').Router();
const { createEvaluation, getMyEvaluations } = require('../controllers/evaluation.controller');
const authMiddleware = require('../middleware/auth.middleware');
const adminMiddleware = require('../middleware/admin.middleware');

router.post('/', authMiddleware, adminMiddleware, createEvaluation);
router.get('/me', authMiddleware, getMyEvaluations);

module.exports = router;
