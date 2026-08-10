require('dotenv').config();
const express = require('express');
const cors = require('cors');

const documentsRoutes = require('./routes/documents.routes');
const dashboardRoutes = require('./routes/dashboard.routes');

const app = express();

app.use(cors());
app.use(express.json());

// Simple health check — hit this first in Postman to confirm the server is up.
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'ShipOps backend (Member 4 module) is running.' });
});

app.use('/documents', documentsRoutes);
app.use('/dashboard', dashboardRoutes);

// Catch-all error handler (e.g. multer file-type/size rejections land here)
app.use((err, req, res, next) => {
  console.error(err.message);
  res.status(400).json({ error: err.message });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
