'use strict';
const router = require('express').Router();
const { completeCourse, getMyCourses, uncompleteCourse } = require('../controllers/course.controller');
const authMiddleware = require('../middleware/auth.middleware');

router.post('/complete', authMiddleware, completeCourse);
router.get('/me', authMiddleware, getMyCourses);
router.delete('/:id', authMiddleware, uncompleteCourse);

module.exports = router;
