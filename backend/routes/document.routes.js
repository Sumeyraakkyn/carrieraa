'use strict';
const router = require('express').Router();
const { uploadDocument, getMyDocuments, reanalyzeCv } = require('../controllers/document.controller');
const authMiddleware = require('../middleware/auth.middleware');
const upload = require('../middleware/upload.middleware');

router.post('/', authMiddleware, upload.single('document'), uploadDocument);
router.get('/me', authMiddleware, getMyDocuments);
router.post('/:documentId/reanalyze', authMiddleware, reanalyzeCv);

module.exports = router;
