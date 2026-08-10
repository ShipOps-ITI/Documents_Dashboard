const prisma = require("../config/prisma");
const { getShipmentDashboardStatistics } = require("../services/shipmentService");

// GET /dashboard/statistics
async function getStatistics(req, res) {
  try {
    const [
      totalShips,
      shipsInTransit,
      delayedShips,
      shipsByStatus,
      latestShips,
      shipmentDashboard,
    ] = await Promise.all([
      prisma.ships.count(),

      prisma.ships.count({
        where: {
          status: "In Transit",
        },
      }),

      prisma.ships.count({
        where: {
          status: "Delayed",
        },
      }),

      prisma.ships.groupBy({
        by: ["status"],
        _count: {
          status: true,
        },
      }),

      prisma.ships.findMany({
        orderBy: {
          id: "desc",
        },
        take: 5,
        select: {
          id: true,
          name: true,
          status: true,
          eta: true,
        },
      }),

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
      totalShips,
      shipsInTransit,
      delayedShips,
      totalShipments,
      deliveredShipments,
      pendingShipments,

      charts: {
        shipsByStatus: shipsByStatus.map((item) => ({
          status: item.status,
          count: item._count.status,
        })),

        shipmentsByStatus: shipmentsByStatus.map((item) => ({
          status: item.status,
          count: item.count,
        })),
      },

      latestShips,
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