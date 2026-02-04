const express = require('express');
const router = express.Router();
const User = require('../models/User');
const CareerPIREP = require('../models/CareerPIREP');
const CareerStats = require('../models/CareerStats');
const { requireCareerAuth, requireCareerAdmin } = require('../middleware/careerAuthMiddleware');

/**
 * GET /api/career/admin/users
 * List all users with career approval status
 */
router.get('/users', requireCareerAuth, requireCareerAdmin, async (req, res) => {
    try {
        const users = await User.find()
            .select('username callsign firstName lastName email role status careerModeApproved careerEarnings careerRank createdAt')
            .sort({ createdAt: -1 });

        res.json({ users });
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

/**
 * POST /api/career/admin/users/:id/approve
 * Approve user for career mode
 */
router.post('/users/:id/approve', requireCareerAuth, requireCareerAdmin, async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        user.careerModeApproved = true;
        await user.save();

        // Create career stats if not exists
        let careerStats = await CareerStats.findOne({ pilot: user._id });
        if (!careerStats) {
            careerStats = await CareerStats.create({ pilot: user._id });
        }

        res.json({ message: 'User approved for career mode', user });
    } catch (error) {
        console.error('Approve user error:', error);
        res.status(500).json({ message: 'Failed to approve user', error: error.message });
    }
});

/**
 * POST /api/career/admin/users/:id/deny
 * Deny/revoke career mode access
 */
router.post('/users/:id/deny', requireCareerAuth, requireCareerAdmin, async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        user.careerModeApproved = false;
        await user.save();

        res.json({ message: 'Career mode access revoked', user });
    } catch (error) {
        console.error('Deny user error:', error);
        res.status(500).json({ message: 'Failed to deny user', error: error.message });
    }
});

/**
 * GET /api/career/admin/pending-pireps
 * List pending PIREP approvals
 */
router.get('/pending-pireps', requireCareerAuth, requireCareerAdmin, async (req, res) => {
    try {
        const pireps = await CareerPIREP.find({ status: 'PENDING' })
            .populate('pilot', 'callsign firstName lastName')
            .populate('flight')
            .sort({ createdAt: -1 });

        res.json({ pireps });
    } catch (error) {
        console.error('Get pending PIREPs error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

/**
 * GET /api/career/admin/analytics
 * Get overall system analytics
 */
router.get('/analytics', requireCareerAuth, requireCareerAdmin, async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        const approvedUsers = await User.countDocuments({ careerModeApproved: true });
        const totalPireps = await CareerPIREP.countDocuments();
        const pendingPireps = await CareerPIREP.countDocuments({ status: 'PENDING' });
        const approvedPireps = await CareerPIREP.countDocuments({ status: 'APPROVED' });

        // Get total earnings distributed
        const earningsResult = await CareerPIREP.aggregate([
            { $match: { status: 'APPROVED' } },
            { $group: { _id: null, total: { $sum: '$grandTotal' } } }
        ]);
        const totalEarnings = earningsResult.length > 0 ? earningsResult[0].total : 0;

        // Get total flight time
        const timeResult = await CareerStats.aggregate([
            { $group: { _id: null, total: { $sum: '$totalFlightTime' } } }
        ]);
        const totalFlightTime = timeResult.length > 0 ? timeResult[0].total : 0;

        res.json({
            analytics: {
                totalUsers,
                approvedUsers,
                totalPireps,
                pendingPireps,
                approvedPireps,
                totalEarnings: Math.round(totalEarnings),
                totalFlightTime: Math.round(totalFlightTime * 10) / 10,
            }
        });
    } catch (error) {
        console.error('Get analytics error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

module.exports = router;
