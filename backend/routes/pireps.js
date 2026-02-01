const express = require('express');
const PIREP = require('../models/PIREP');
const User = require('../models/User');
const { auth, adminAuth } = require('../middleware/auth');

const router = express.Router();

// Submit PIREP
router.post('/', auth, async (req, res) => {
  try {
    const pilot = await User.findById(req.user._id);

    const pirep = new PIREP({
      ...req.body,
      pilotId: req.user._id,
      pilotName: `${pilot.firstName} ${pilot.lastName}`,
      callsign: pilot.callsign || req.body.callsign
    });

    await pirep.save();

    // Update pilot stats
    await User.findByIdAndUpdate(req.user._id, {
      $inc: {
        totalFlights: 1,
        totalHours: req.body.flightTime / 60
      }
    });

    res.status(201).json(pirep);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all PIREPs (with filters)
router.get('/', auth, async (req, res) => {
  try {
    const { status, pilotId } = req.query;
    const query = {};

    if (status) query.status = status;
    if (pilotId) query.pilotId = pilotId;

    // Pilots and Event Leaders see only their own PIREPs
    if (req.user.role === 'pilot' || req.user.role === 'Event Leader') {
      query.pilotId = req.user._id;
    }

    const pireps = await PIREP.find(query)
      .populate('pilotId', 'username firstName lastName')
      .populate('reviewedBy', 'username firstName lastName')
      .sort({ createdAt: -1 });

    res.json(pireps);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get single PIREP
router.get('/:id', auth, async (req, res) => {
  try {
    const pirep = await PIREP.findById(req.params.id)
      .populate('pilotId', 'username firstName lastName')
      .populate('reviewedBy', 'username firstName lastName');

    if (!pirep) {
      return res.status(404).json({ message: 'PIREP not found' });
    }

    // Check if user has access (pilots and Event Leaders see only their own)
    if ((req.user.role === 'pilot' || req.user.role === 'Event Leader') && pirep.pilotId._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(pirep);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Review PIREP (Admin only)
router.patch('/:id/review', auth, adminAuth('CEO', 'CAO', 'CMO', 'CFI', 'Crew Centre Manager'), async (req, res) => {
  try {
    const { status } = req.body;

    const pirep = await PIREP.findByIdAndUpdate(
      req.params.id,
      {
        status,
        reviewedBy: req.user._id,
        reviewedAt: new Date()
      },
      { new: true }
    );

    if (!pirep) {
      return res.status(404).json({ message: 'PIREP not found' });
    }

    res.json(pirep);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
