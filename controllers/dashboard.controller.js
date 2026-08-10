const prisma = require("../config/prisma");
const { getShipmentDashboardStatistics } = require("../services/shipmentService");

// GET /dashboard/statistics

/**
 * integrated with core service to fetch the ship statistics from the core service.
 * 
 * 
 * 
 * const totalShips = await prisma.ship.count();

const shipsActive = await prisma.ship.count({
  where: {
    availabilityState: "ACTIVE",
  },
});

const shipsAtSea = await prisma.ship.count({
  where: {
    availabilityState: "AT_SEA",
  },
});

const shipsDocked = await prisma.ship.count({
  where: {
    availabilityState: "DOCKED",
  },
});

const shipsInMaintenance = await prisma.ship.count({
  where: {
    availabilityState: "MAINTENANCE",
  },
});

const shipsByState = await prisma.ship.groupBy({
  by: ["availabilityState"],
  _count: {
    availabilityState: true,
  },
});

const recentShips = await prisma.ship.findMany({
  orderBy: {
    id: "desc",
  },
  take: 5,
  select: {
    id: true,
    name: true,
    availabilityState: true,
    imoNumber: true,
    flag: true,
  },
});
 */

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