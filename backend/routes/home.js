const express = require('express');
const User = require('../models/User');
const Route = require('../models/Route');
const PIREP = require('../models/PIREP');

const router = express.Router();

const STAFF_ROLES = ['CEO', 'CAO', 'CMO', 'CFI', 'Recruiter', 'Routes Manager', 'Crew Centre Manager'];
const PILOT_ROLES = ['pilot', 'Event Leader', 'Chief Pilot'];

// Public home page stats (no auth)
router.get('/stats', async (req, res) => {
  try {
    const [routesCount, codeshareCount, pirepsCount, pilotsCount, staffCount] = await Promise.all([
      Route.countDocuments({ active: true }),
      Route.countDocuments({ active: true, codeshare: true }),
      PIREP.countDocuments(),
      User.countDocuments({ role: { $in: PILOT_ROLES }, status: 'active' }),
      User.countDocuments({ role: { $in: STAFF_ROLES }, status: 'active' }),
    ]);

    // Override with custom values for public display
    res.json({
      routes: routesCount,
      codeshare: '15+',
      pireps: '750+',
      pilots: '95+',
      staff: '10+',
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Public staff list (names and roles only, no sensitive data)
router.get('/staff', async (req, res) => {
  try {
    const staff = await User.find({ role: { $in: STAFF_ROLES }, status: 'active' })
      .select('firstName lastName role')
      .sort({ role: 1, lastName: 1 });

    res.json(staff);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
