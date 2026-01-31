const express = require('express');
const User = require('../models/User');
const PIREP = require('../models/PIREP');
const { auth, adminAuth } = require('../middleware/auth');

const router = express.Router();

// Get all users
router.get('/users', auth, adminAuth('CEO', 'CAO', 'CMO', 'CFI', 'Recruiter', 'Routes Manager', 'Crew Centre Manager'), async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update user role
router.patch('/users/:id/role', auth, adminAuth('CEO', 'CAO'), async (req, res) => {
  try {
    const { role } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update user status
router.patch('/users/:id/status', auth, adminAuth('CEO', 'CAO', 'CMO'), async (req, res) => {
  try {
    const { status } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Reset user's exam status
router.post('/users/:id/reset-exam', auth, adminAuth('CEO', 'CAO', 'CFI', 'CMO', 'Recruiter'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.examCompleted = false;
    user.examScore = 0;
    await user.save();

    res.json({ message: 'User exam status reset successfully', user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get dashboard stats
router.get('/stats', auth, adminAuth('CEO', 'CAO', 'CMO', 'CFI', 'Crew Centre Manager'), async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ status: 'active' });
    const totalPIREPs = await PIREP.countDocuments();
    const pendingPIREPs = await PIREP.countDocuments({ status: 'pending' });
    const approvedPIREPs = await PIREP.countDocuments({ status: 'approved' });

    const totalHours = await User.aggregate([
      { $group: { _id: null, total: { $sum: '$totalHours' } } }
    ]);

    res.json({
      users: {
        total: totalUsers,
        active: activeUsers
      },
      pireps: {
        total: totalPIREPs,
        pending: pendingPIREPs,
        approved: approvedPIREPs
      },
      totalHours: totalHours[0]?.total || 0
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
