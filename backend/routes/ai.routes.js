'use strict';
const router = require('express').Router();
const {
  analyzeUser,
  getCvAnalysis,
  getCourseRecommendations,
  getAnomalies,
  compareEmployee,
  getWeeklyReport,
  sendSmartNotifications,
  simulateCareerPath,
  getBenchmark,
  matchCareerGoal,
} = require('../controllers/ai.controller');
const authMiddleware = require('../middleware/auth.middleware');
const adminMiddleware = require('../middleware/admin.middleware');

// Kullanıcı endpoint'leri
router.get('/analyze',                authMiddleware, analyzeUser);
router.get('/cv-analysis/:documentId',authMiddleware, getCvAnalysis);
router.get('/course-recommendations', authMiddleware, getCourseRecommendations);
router.post('/simulate',              authMiddleware, simulateCareerPath);
router.get('/benchmark',              authMiddleware, getBenchmark);
router.post('/match-career',          authMiddleware, matchCareerGoal);

// Admin endpoint'leri
router.get('/admin/anomalies',                    authMiddleware, adminMiddleware, getAnomalies);
router.get('/admin/compare/:userId',              authMiddleware, adminMiddleware, compareEmployee);
router.get('/admin/weekly-report',                authMiddleware, adminMiddleware, getWeeklyReport);
router.post('/admin/send-smart-notifications',    authMiddleware, adminMiddleware, sendSmartNotifications);

module.exports = router;
