
const axios = require("axios");

const shipmentApi = axios.create({
  baseURL: process.env.SHIPMENT_SERVICE_URL,
  timeout: 5000,
});

async function shipmentExists(shipmentId, authHeader) {
  try {
    await shipmentApi.get(`/api/shipments/${shipmentId}`, {
      headers: {
        Authorization: authHeader,
      },
    });
    return true;
  } catch (err) {
    if (err.response?.status === 404) {
      return false;
    }

    throw err;
  }
}


async function getShipmentDashboardStatistics(authHeader) {
  const response = await shipmentApi.get("/api/shipments/dashboard/statistics", {
    headers: {
      Authorization: authHeader,
    },
  });

  return response.data;
}

module.exports = {
  shipmentExists,
  getShipmentDashboardStatistics,
};