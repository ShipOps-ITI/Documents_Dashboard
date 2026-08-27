const fs = require("fs");
const path = require("path");
const prisma = require("../config/prisma");

const { shipmentExists, getAccessibleShipmentIds } = require("../services/shipmentService");
const UPLOADS_DIR = path.join(__dirname, "..", "uploads");
const REVIEW_STATUSES = new Set(["APPROVED", "REJECTED"]);
const UPLOAD_STATUSES = new Set(["DRAFT", "SUBMITTED"]);
const DOCUMENT_TYPES = new Set(["Bill of Lading", "Commercial Invoice", "Packing List", "Certificate of Origin", "Customs Declaration", "Insurance Certificate", "Other"]);

function removeUploadedFile(file) {
  if (file?.path && fs.existsSync(file.path)) fs.unlinkSync(file.path);
}

function serializeDocument(document) {
  if (!document) return document;
  const isExpired = document.expires_at
    && new Date(document.expires_at).getTime() < Date.now()
    && document.status !== "REJECTED";
  return { ...document, effective_status: isExpired ? "EXPIRED" : document.status };
}

async function canAccessDocument(document, req) {
  // A document belongs to the company through its shipment. Legacy documents
  // without a shipment are deliberately not exposed to company users.
  if (!document.shipment_id) return false;
  return shipmentExists(document.shipment_id, req.headers.authorization);
}

// POST /documents/upload
async function uploadDocument(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: 'No file was uploaded. Use form-data with a "file" field.',
      });
    }

    const { shipment_id, cargo_id, type, reference_number, expires_at, status } = req.body;
    if (!shipment_id) {
      removeUploadedFile(req.file);
      return res.status(400).json({ error: '"shipment_id" is required.' });
    }
    if (shipment_id) {
      const exists = await shipmentExists(
        Number(shipment_id),
        req.headers.authorization
      );

      if (!exists) {
        if (req.file) {
          removeUploadedFile(req.file);
        }

        return res.status(404).json({
          error: "Shipment not found.",
        });
      }
    }

    if (!type) {
      removeUploadedFile(req.file);
      return res.status(400).json({
        error:
          '"type" is required (e.g. Invoice, Bill of Lading, Packing List, Customs Document).',
      });
    }
    if (!DOCUMENT_TYPES.has(type)) {
      removeUploadedFile(req.file);
      return res.status(400).json({ error: "Unsupported document type." });
    }

    const uploadStatus = String(status || "SUBMITTED").toUpperCase();
    if (!UPLOAD_STATUSES.has(uploadStatus)) {
      removeUploadedFile(req.file);
      return res.status(400).json({ error: "Document status must be DRAFT or SUBMITTED." });
    }

    // The Company Admin owns the workspace and can publish their own files
    // immediately. Fleet Manager uploads keep the review workflow.
    const isCompanyAdmin = req.user.role === "COMPANY_ADMIN";
    const finalStatus = isCompanyAdmin ? "APPROVED" : uploadStatus;

    const document = await prisma.documents.create({
      data: {
        shipment_id: shipment_id ? Number(shipment_id) : null,
        filename: req.file.filename,
        original_name: req.file.originalname,
        type,
        cargo_id: cargo_id ? Number(cargo_id) : null,
        reference_number: reference_number?.trim() || null,
        expires_at: expires_at ? new Date(expires_at) : null,
        status: finalStatus,
        uploaded_by: req.user.userId,
        ...(isCompanyAdmin ? {
          reviewed_by: req.user.userId,
          reviewed_at: new Date(),
          review_note: "Automatically approved by Company Admin upload.",
        } : {}),
      },
    });

    return res.status(201).json(serializeDocument(document));
  } catch (err) {
    console.error("uploadDocument error:", err);
    return res
      .status(500)
      .json({ error: "Server error while uploading document." });
  }
}

// GET /documents?shipment_id=optional
async function listDocuments(req, res) {
  try {
    const { shipment_id } = req.query;

    let documents;

    if (req.user.role !== "ADMIN") {
      const shipmentIds = await getAccessibleShipmentIds(req.headers.authorization);
      documents = await prisma.documents.findMany({
        where: {
          shipment_id: shipment_id
            ? { in: shipmentIds.filter((id) => Number(id) === Number(shipment_id)) }
            : { in: shipmentIds },
        },
        orderBy: { upload_date: "desc" },
      });
    } else if (shipment_id) {
      documents = await prisma.documents.findMany({
        where: {
          shipment_id: Number(shipment_id),
        },
        orderBy: {
          upload_date: "desc",
        },
      });
    } else {
      documents = await prisma.documents.findMany({
        orderBy: {
          upload_date: "desc",
        },
      });
    }

    return res.json(documents.map(serializeDocument));
  } catch (err) {
    console.error("listDocuments error:", err);
    return res
      .status(500)
      .json({ error: "Server error while listing documents." });
  }
}

// GET /documents/:id
async function getDocumentById(req, res) {
  try {
    const { id } = req.params;

    const document = await prisma.documents.findUnique({
      where: {
        id: Number(id),
      },
    });

    if (!document) {
      return res.status(404).json({ error: "Document not found." });
    }

    if (!(await canAccessDocument(document, req))) {
      return res.status(404).json({ error: "Document not found." });
    }

    return res.json(serializeDocument(document));
  } catch (err) {
    console.error("getDocumentById error:", err);
    return res
      .status(500)
      .json({ error: "Server error while fetching document." });
  }
}

// GET /documents/:id/download
async function downloadDocument(req, res) {
  try {
    const { id } = req.params;

    const document = await prisma.documents.findUnique({
      where: {
        id: Number(id),
      },
    });

    if (!document) {
      return res.status(404).json({ error: "Document not found." });
    }

    if (!(await canAccessDocument(document, req))) {
      return res.status(404).json({ error: "Document not found." });
    }

    const filePath = path.join(UPLOADS_DIR, path.basename(document.filename)); // nosemgrep: javascript.express.security.audit.express-path-join-resolve-traversal.express-path-join-resolve-traversal

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        error:
          "File missing from disk (DB record exists but file was moved/deleted).",
      });
    }

    return res.download(filePath, document.original_name);
  } catch (err) {
    console.error("downloadDocument error:", err);
    return res
      .status(500)
      .json({ error: "Server error while downloading document." });
  }
}

// DELETE /documents/:id
async function deleteDocument(req, res) {
  try {
    const { id } = req.params;

    const document = await prisma.documents.findUnique({
      where: {
        id: Number(id),
      },
    });

    if (!document) {
      return res.status(404).json({ error: "Document not found." });
    }

    if (!(await canAccessDocument(document, req))) {
      return res.status(404).json({ error: "Document not found." });
    }

    const filePath = path.join(UPLOADS_DIR, path.basename(document.filename)); // nosemgrep: javascript.express.security.audit.express-path-join-resolve-traversal.express-path-join-resolve-traversal

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    await prisma.documents.delete({
      where: {
        id: Number(id),
      },
    });

    return res.json({
      message: "Document deleted.",
      id: Number(id),
    });
  } catch (err) {
    console.error("deleteDocument error:", err);
    return res
      .status(500)
      .json({ error: "Server error while deleting document." });
  }
}

// PATCH /documents/:id/review
async function reviewDocument(req, res) {
  try {
    const document = await prisma.documents.findUnique({ where: { id: Number(req.params.id) } });
    if (!document || !(await canAccessDocument(document, req))) {
      return res.status(404).json({ error: "Document not found." });
    }

    const status = String(req.body.status || "").toUpperCase();
    if (!REVIEW_STATUSES.has(status)) {
      return res.status(400).json({ error: "Review status must be APPROVED or REJECTED." });
    }
    if (document.status !== "SUBMITTED") {
      return res.status(400).json({ error: "Only submitted documents can be approved or rejected." });
    }

    const updated = await prisma.documents.update({
      where: { id: document.id },
      data: {
        status,
        review_note: req.body.review_note?.trim() || null,
        reviewed_by: req.user.userId,
        reviewed_at: new Date(),
      },
    });
    return res.json(serializeDocument(updated));
  } catch (err) {
    console.error("reviewDocument error:", err);
    return res.status(500).json({ error: "Server error while reviewing document." });
  }
}

// PATCH /documents/:id/submit
async function submitDocument(req, res) {
  try {
    const document = await prisma.documents.findUnique({ where: { id: Number(req.params.id) } });
    if (!document || !(await canAccessDocument(document, req))) {
      return res.status(404).json({ error: "Document not found." });
    }
    if (document.status !== "DRAFT") {
      return res.status(400).json({ error: "Only draft documents can be submitted." });
    }
    const updated = await prisma.documents.update({
      where: { id: document.id },
      data: { status: "SUBMITTED" },
    });
    return res.json(serializeDocument(updated));
  } catch (err) {
    console.error("submitDocument error:", err);
    return res.status(500).json({ error: "Server error while submitting document." });
  }
}

module.exports = {
  uploadDocument,
  listDocuments,
  getDocumentById,
  downloadDocument,
  deleteDocument,
  reviewDocument,
  submitDocument,
};
