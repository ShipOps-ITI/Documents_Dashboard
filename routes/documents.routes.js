const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
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

router.post('/upload', upload.single('file'), uploadDocument);
router.get('/', listDocuments);
router.get('/:id', getDocumentById);
router.get('/:id/download', downloadDocument);
router.delete('/:id', deleteDocument);

module.exports = router;
