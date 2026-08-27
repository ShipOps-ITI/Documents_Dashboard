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
  reviewDocument,
  submitDocument,
} = require('../controllers/documents.controller');

// NOTE: no auth middleware yet — add `authMiddleware` here once
// Member 1's JWT auth is ready, e.g.:
// router.get('/', authMiddleware, listDocuments);

router.post('/upload', authenticate, authorize('ADMIN', 'COMPANY_ADMIN', 'FLEET_MANAGER'), upload.single('file'), uploadDocument);
// Customers may only read files connected to shipments assigned to them. The
// controller verifies that shipment access before returning any document.
router.get('/', authenticate, authorize('ADMIN', 'COMPANY_ADMIN', 'FLEET_MANAGER', 'CUSTOMER'), listDocuments);
router.get('/:id', authenticate, authorize('ADMIN', 'COMPANY_ADMIN', 'FLEET_MANAGER', 'CUSTOMER'), getDocumentById);
router.get('/:id/download', authenticate, authorize('ADMIN', 'COMPANY_ADMIN', 'FLEET_MANAGER', 'CUSTOMER'), downloadDocument);
router.patch('/:id/review', authenticate, authorize('ADMIN', 'COMPANY_ADMIN'), reviewDocument);
router.patch('/:id/submit', authenticate, authorize('ADMIN', 'COMPANY_ADMIN', 'FLEET_MANAGER'), submitDocument);
router.delete('/:id', authenticate, authorize('ADMIN', 'COMPANY_ADMIN', 'FLEET_MANAGER'), deleteDocument);

module.exports = router;
