const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Verify career mode JWT token and attach user to request
 */
const requireCareerAuth = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');

        if (!token) {
            return res.status(401).json({ message: 'Career mode authentication required' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        const user = await User.findById(decoded.userId);

        if (!user) {
            return res.status(401).json({ message: 'User not found' });
        }

        req.user = user;
        req.userId = user._id;
        next();
    } catch (error) {
        return res.status(401).json({ message: 'Invalid or expired token' });
    }
};

/**
 * Check if user is approved for career mode
 */
const requireCareerApproval = async (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: 'Authentication required' });
        }

        if (!req.user.careerModeApproved) {
            return res.status(403).json({
                message: 'Career mode access not approved. Please contact an administrator.'
            });
        }

        next();
    } catch (error) {
        return res.status(500).json({ message: 'Server error', error: error.message });
    }
};

/**
 * Check if user has career mode admin role
 * Admin roles: CEO, CAO, CMO, CFI, Chief Pilot, Crew Centre Manager
 */
const requireCareerAdmin = async (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: 'Authentication required' });
        }

        const adminRoles = ['CEO', 'CAO', 'CMO', 'CFI', 'Chief Pilot', 'Crew Centre Manager'];

        if (!adminRoles.includes(req.user.role)) {
            return res.status(403).json({
                message: 'Admin access required. Only authorized staff can access this resource.'
            });
        }

        next();
    } catch (error) {
        return res.status(500).json({ message: 'Server error', error: error.message });
    }
};

module.exports = {
    requireCareerAuth,
    requireCareerApproval,
    requireCareerAdmin,
};
