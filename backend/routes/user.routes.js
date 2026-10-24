'use strict';
const router = require('express').Router();
const { listUsers } = require('../controllers/user.controller');
const authMiddleware = require('../middleware/auth.middleware');
const adminMiddleware = require('../middleware/admin.middleware');

router.get('/', authMiddleware, adminMiddleware, listUsers);

module.exports = router;
