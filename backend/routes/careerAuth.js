const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { requireCareerAuth } = require('../middleware/careerAuthMiddleware');

/**
 * POST /api/career/auth/login
 * Login with callsign + password
 */
router.post('/login', async (req, res) => {
    try {
        const { callsign, password } = req.body;

        if (!callsign || !password) {
            return res.status(400).json({ message: 'Callsign and password are required' });
        }

        // Find user by callsign
        const user = await User.findOne({ callsign: callsign.trim() });

        if (!user) {
            return res.status(401).json({ message: 'Invalid callsign or password' });
        }

        // Check password
        const isMatch = await user.comparePassword(password);

        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid callsign or password' });
        }

        // Check if user is approved for career mode
        if (!user.careerModeApproved) {
            return res.status(403).json({
                message: 'Your account is not approved for career mode access. Please contact an administrator.'
            });
        }

        // Generate token
        const token = jwt.sign(
            { userId: user._id, callsign: user.callsign },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '7d' }
        );

        res.json({
            token,
            user: {
                id: user._id,
                username: user.username,
                callsign: user.callsign,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role,
                careerRank: user.careerRank,
                careerActiveFamily: user.careerActiveFamily,
                careerEarnings: user.careerEarnings,
            }
        });
    } catch (error) {
        console.error('Career login error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

/**
 * GET /api/career/auth/me
 * Get current career user info
 */
router.get('/me', requireCareerAuth, async (req, res) => {
    try {
        const user = req.user;

        res.json({
            id: user._id,
            username: user.username,
            callsign: user.callsign,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            careerRank: user.careerRank,
            careerActiveFamily: user.careerActiveFamily,
            careerEarnings: user.careerEarnings,
            careerTotalDistance: user.careerTotalDistance,
            careerTotalTime: user.careerTotalTime,
        });
    } catch (error) {
        console.error('Get career user error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

/**
 * POST /api/career/auth/verify
 * Verify token and check career mode access
 */
router.post('/verify', requireCareerAuth, async (req, res) => {
    try {
        const user = req.user;

        if (!user.careerModeApproved) {
            return res.status(403).json({
                message: 'Career mode access revoked',
                approved: false
            });
        }

        res.json({
            approved: true,
            user: {
                id: user._id,
                callsign: user.callsign,
                role: user.role,
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Verification failed', error: error.message });
    }
});

module.exports = router;
