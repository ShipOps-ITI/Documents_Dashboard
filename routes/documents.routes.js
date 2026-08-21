const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const {
  uploadDocument,
  listDocuments,
  getDocumentById,
  downloadDocument,
  deleteDocument,
} = require('../controllers/documents.controller');

// NOTE: no auth middleware yet — add `authMiddleware` here once
// Member 1's JWT auth is ready, e.g.:
// router.get('/', authMiddleware, listDocuments);

router.post('/upload', authenticate, authorize('ADMIN', 'FLEET_MANAGER'), upload.single('file'), uploadDocument);
router.get('/', authenticate, listDocuments);
router.get('/:id', authenticate, getDocumentById);
router.get('/:id/download', authenticate, downloadDocument);
router.delete('/:id', authenticate, authorize('ADMIN', 'FLEET_MANAGER'), deleteDocument);

module.exports = router;
