const express = require('express');
const Route = require('../models/Route');
const { auth, adminAuth } = require('../middleware/auth');

const router = express.Router();

// Get all routes
router.get('/', auth, async (req, res) => {
  try {
    const { codeshare, active } = req.query;
    const query = {};

    if (codeshare === 'true') {
      query.codeshare = true;
    }
    if (active !== undefined) {
      query.active = active === 'true';
    }

    const routes = await Route.find(query).sort({ routeNumber: 1 });
    res.json(routes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get single route
router.get('/:id', auth, async (req, res) => {
  try {
    const route = await Route.findById(req.params.id);
    if (!route) {
      return res.status(404).json({ message: 'Route not found' });
    }
    res.json(route);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create route (Admin only)
router.post('/', auth, adminAuth('CEO', 'CAO', 'Routes Manager'), async (req, res) => {
  try {
    const route = new Route(req.body);
    await route.save();
    res.status(201).json(route);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update route (Admin only)
router.put('/:id', auth, adminAuth('CEO', 'CAO', 'Routes Manager'), async (req, res) => {
  try {
    const route = await Route.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!route) {
      return res.status(404).json({ message: 'Route not found' });
    }
    res.json(route);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete route (Admin only)
router.delete('/:id', auth, adminAuth('CEO', 'CAO', 'Routes Manager'), async (req, res) => {
  try {
    const route = await Route.findByIdAndDelete(req.params.id);
    if (!route) {
      return res.status(404).json({ message: 'Route not found' });
    }
    res.json({ message: 'Route deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
