'use strict';
const router = require('express').Router();
const { getAllCVs, updateCVStatus, getPendingCount, getDashboardStats } = require('../controllers/admin.controller');
const authMiddleware = require('../middleware/auth.middleware');
const adminMiddleware = require('../middleware/admin.middleware');

// Tüm admin route'ları hem auth hem de admin rol kontrolünden geçer
router.get('/cvs', authMiddleware, adminMiddleware, getAllCVs);
router.post('/cvs/status', authMiddleware, adminMiddleware, updateCVStatus);
router.get('/pending-count', authMiddleware, adminMiddleware, getPendingCount);
router.get('/dashboard-stats', authMiddleware, adminMiddleware, getDashboardStats);

module.exports = router;
