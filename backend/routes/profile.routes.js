'use strict';
const router = require('express').Router();
const { getProfile, saveProfile, saveCvBuilder, savePotentialScore, updateAvatar } = require('../controllers/profile.controller');
const authMiddleware = require('../middleware/auth.middleware');

router.get('/me', authMiddleware, getProfile);
router.post('/', authMiddleware, saveProfile);
router.post('/cv-builder', authMiddleware, saveCvBuilder);
router.post('/potential-results', authMiddleware, savePotentialScore);
router.patch('/avatar', authMiddleware, updateAvatar);

module.exports = router;
