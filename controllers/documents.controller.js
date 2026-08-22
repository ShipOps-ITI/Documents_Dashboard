const fs = require("fs");
const path = require("path");
const prisma = require("../config/prisma");

const { shipmentExists, getAccessibleShipmentIds } = require("../services/shipmentService");
const UPLOADS_DIR = path.join(__dirname, "..", "uploads");

async function canAccessDocument(document, req) {
  if (!document.shipment_id) return req.user.role !== "CUSTOMER";
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

    const { shipment_id, type } = req.body;
    if (!shipment_id) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: '"shipment_id" is required.' });
    }
    if (shipment_id) {
      const exists = await shipmentExists(
        Number(shipment_id),
        req.headers.authorization
      );

      if (!exists) {
        if (req.file) {
          fs.unlinkSync(req.file.path);
        }

        return res.status(404).json({
          error: "Shipment not found.",
        });
      }
    }

    if (!type) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({
        error:
          '"type" is required (e.g. Invoice, Bill of Lading, Packing List, Customs Document).',
      });
    }

    const document = await prisma.documents.create({
      data: {
        shipment_id: shipment_id ? Number(shipment_id) : null,
        filename: req.file.filename,
        original_name: req.file.originalname,
        type,
        uploaded_by: req.user.userId,
      },
    });

    return res.status(201).json(document);
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
        where: { shipment_id: { in: shipmentIds } },
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

    return res.json(documents);
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

    return res.json(document);
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

    const filePath = path.join(UPLOADS_DIR, document.filename);

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

    const filePath = path.join(UPLOADS_DIR, document.filename);

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

module.exports = {
  uploadDocument,
  listDocuments,
  getDocumentById,
  downloadDocument,
  deleteDocument,
};
