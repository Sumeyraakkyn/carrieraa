'use strict';
const router = require('express').Router();
const auth = require('../controllers/auth.controller');
const authMiddleware = require('../middleware/auth.middleware');

router.post('/register', auth.register);
router.post('/login', auth.login);
router.post('/forgot-password', auth.forgotPassword);
router.post('/verify-code', auth.verifyCode);
router.post('/reset-password', auth.resetPassword);
router.post('/change-password', authMiddleware, auth.changePassword);
// Token geçerlilik kontrolü için frontend tarafından kullanılır
router.get('/me', authMiddleware, auth.getMe);

module.exports = router;

