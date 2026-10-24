'use strict';
const router = require('express').Router();
const { getPythonRecommendation, getPythonPerformancePrediction, getPythonModelMetrics } = require('../controllers/python_ai.controller');
const authMiddleware = require('../middleware/auth.middleware');

// GET /api/python-ai/recommendation
router.get('/recommendation', authMiddleware, getPythonRecommendation);

// GET /api/python-ai/performance
router.get('/performance', authMiddleware, getPythonPerformancePrediction);

// GET /api/python-ai/metrics
router.get('/metrics', authMiddleware, getPythonModelMetrics);

module.exports = router;
