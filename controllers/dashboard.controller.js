const { getShipmentDashboardStatistics, getCoreShipStatistics } = require("../services/shipmentService");

// GET /dashboard/statistics
async function getStatistics(req, res) {
  try {
    // Customers receive only their shipment summary. Operational vessel
    // statistics are internal to the shipping company.
    if (req.user.role === "CUSTOMER") {
      const shipmentDashboard = await getShipmentDashboardStatistics(req.headers.authorization);
      return res.json({
        totalShips: 0,
        shipsInTransit: 0,
        delayedShips: 0,
        ...shipmentDashboard,
        charts: {
          shipsByStatus: [],
          shipmentsByStatus: shipmentDashboard.shipmentsByStatus ?? [],
        },
        latestShips: [],
      });
    }

    const [shipDashboard, shipmentDashboard] = await Promise.all([
      getCoreShipStatistics(req.headers.authorization),
      getShipmentDashboardStatistics(req.headers.authorization),
    ]);

    
    const {
      totalShipments,
      deliveredShipments,
      pendingShipments,
      shipmentsByStatus,
      latestShipments,
    } = shipmentDashboard;

    return res.json({
      totalShips: shipDashboard.totalShips,
      shipsInTransit: shipDashboard.shipsAtSea,
      delayedShips: shipDashboard.shipsInMaintenance,
      totalShipments,
      deliveredShipments,
      pendingShipments,

      charts: {
        shipsByStatus: shipDashboard.shipsByStatus,

        shipmentsByStatus: shipmentsByStatus.map((item) => ({
          status: item.status,
          count: item.count,
        })),
      },

      latestShips: shipDashboard.latestShips.map((ship) => ({
        ...ship,
        status: ship.availabilityState,
        eta: ship.lastAisUpdateAt,
      })),
      latestShipments,
    });
  } catch (err) {
    console.error("getStatistics error:", err);
    return res.status(500).json({
      error: "Server error while computing dashboard statistics.",
    });
  }
}

module.exports = { getStatistics };
