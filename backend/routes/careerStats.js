const express = require('express');
const router = express.Router();
const CareerStats = require('../models/CareerStats');
const CareerPIREP = require('../models/CareerPIREP');
const { requireCareerAuth, requireCareerApproval } = require('../middleware/careerAuthMiddleware');

/**
 * GET /api/career/stats/me
 * Get current user's career statistics
 */
router.get('/me', requireCareerAuth, requireCareerApproval, async (req, res) => {
    try {
        const userId = req.userId;

        let careerStats = await CareerStats.findOne({ pilot: userId })
            .populate('ownedTypeRatings')
            .populate('currentActiveType');

        if (!careerStats) {
            careerStats = await CareerStats.create({ pilot: userId });
        }

        res.json({ stats: careerStats });
    } catch (error) {
        console.error('Get stats error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

/**
 * GET /api/career/stats/history
 * Get flight history for map visualization
 */
router.get('/history', requireCareerAuth, requireCareerApproval, async (req, res) => {
    try {
        const userId = req.userId;
        const timeFilter = req.query.filter || 'all'; // all, 30days, 7days

        // Build date filter
        let dateFilter = {};
        const now = new Date();
        if (timeFilter === '30days') {
            const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            dateFilter = { createdAt: { $gte: thirtyDaysAgo } };
        } else if (timeFilter === '7days') {
            const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            dateFilter = { createdAt: { $gte: sevenDaysAgo } };
        }

        // Get approved PIREPs
        const pireps = await CareerPIREP.find({
            pilot: userId,
            status: 'APPROVED',
            ...dateFilter
        }).populate('flight');

        // Build route history with coordinates
        const routeHistory = [];
        const routeCounts = {};

        for (const pirep of pireps) {
            const key = `${pirep.origin}-${pirep.destination}`;
            if (!routeCounts[key]) {
                routeCounts[key] = {
                    origin: pirep.origin,
                    destination: pirep.destination,
                    count: 0,
                };
            }
            routeCounts[key].count += 1;
        }

        Object.values(routeCounts).forEach(route => {
            routeHistory.push(route);
        });

        res.json({ routeHistory, totalFlights: pireps.length });
    } catch (error) {
        console.error('Get flight history error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

/**
 * GET /api/career/stats/leaderboard
 * Get top pilots by various metrics
 */
router.get('/leaderboard', requireCareerAuth, requireCareerApproval, async (req, res) => {
    try {
        const metric = req.query.metric || 'earnings'; // earnings, hours, flights

        let sortField = 'totalEarnings';
        if (metric === 'hours') sortField = 'totalFlightTime';
        if (metric === 'flights') sortField = 'totalFlights';

        const leaderboard = await CareerStats.find()
            .populate('pilot', 'callsign firstName lastName careerRank')
            .sort({ [sortField]: -1 })
            .limit(10);

        res.json({ leaderboard, metric });
    } catch (error) {
        console.error('Get leaderboard error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

module.exports = router;
