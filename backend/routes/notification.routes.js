'use strict';
const router = require('express').Router();
const { getNotifications, markAsRead } = require('../controllers/notification.controller');
const authMiddleware = require('../middleware/auth.middleware');

router.get('/me', authMiddleware, getNotifications);
router.post('/read', authMiddleware, markAsRead);

module.exports = router;
