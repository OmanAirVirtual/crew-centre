const express = require('express');
const router = express.Router();
const CareerFlight = require('../models/CareerFlight');
const CareerStats = require('../models/CareerStats');
const { requireCareerAuth, requireCareerApproval, requireCareerAdmin } = require('../middleware/careerAuthMiddleware');

/**
 * GET /api/career/flights
 * List flights filtered by active family
 */
router.get('/', requireCareerAuth, requireCareerApproval, async (req, res) => {
    try {
        const userId = req.userId;

        // Get user's active family
        const careerStats = await CareerStats.findOne({ pilot: userId });
        const activeFamily = careerStats?.currentActiveFamily || '';

        // Get flights for active family
        let query = {};
        if (activeFamily) {
            query.aircraftFamily = activeFamily;
        }

        const flights = await CareerFlight.find(query)
            .populate('assignedPilot', 'callsign firstName lastName')
            .sort({ flightNumber: 1 });

        res.json({ flights, activeFamily });
    } catch (error) {
        console.error('Get flights error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

/**
 * POST /api/career/flights
 * Create flight/leg (admin only)
 */
router.post('/', requireCareerAuth, requireCareerAdmin, async (req, res) => {
    try {
        const flight = await CareerFlight.create(req.body);
        res.status(201).json({ flight });
    } catch (error) {
        console.error('Create flight error:', error);
        res.status(500).json({ message: 'Failed to create flight', error: error.message });
    }
});

/**
 * PUT /api/career/flights/:id
 * Update flight (admin only)
 */
router.put('/:id', requireCareerAuth, requireCareerAdmin, async (req, res) => {
    try {
        const flight = await CareerFlight.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!flight) {
            return res.status(404).json({ message: 'Flight not found' });
        }

        res.json({ flight });
    } catch (error) {
        console.error('Update flight error:', error);
        res.status(500).json({ message: 'Failed to update flight', error: error.message });
    }
});

/**
 * DELETE /api/career/flights/:id
 * Delete flight (admin only)
 */
router.delete('/:id', requireCareerAuth, requireCareerAdmin, async (req, res) => {
    try {
        const flight = await CareerFlight.findByIdAndDelete(req.params.id);

        if (!flight) {
            return res.status(404).json({ message: 'Flight not found' });
        }

        res.json({ message: 'Flight deleted successfully' });
    } catch (error) {
        console.error('Delete flight error:', error);
        res.status(500).json({ message: 'Failed to delete flight', error: error.message });
    }
});

/**
 * POST /api/career/flights/:id/dispatch
 * Dispatch a flight
 */
router.post('/:id/dispatch', requireCareerAuth, requireCareerApproval, async (req, res) => {
    try {
        const userId = req.userId;
        const flightId = req.params.id;

        const flight = await CareerFlight.findById(flightId);
        if (!flight) {
            return res.status(404).json({ message: 'Flight not found' });
        }

        if (flight.status !== 'AVAILABLE') {
            return res.status(400).json({ message: 'Flight is not available for dispatch' });
        }

        // Check if user's active family matches flight family
        const careerStats = await CareerStats.findOne({ pilot: userId });
        if (careerStats?.currentActiveFamily !== flight.aircraftFamily) {
            return res.status(403).json({
                message: `You must have ${flight.aircraftFamily} as your active family to dispatch this flight`
            });
        }

        // Dispatch flight
        flight.status = 'DISPATCHED';
        flight.assignedPilot = userId;
        flight.dispatchedAt = new Date();
        await flight.save();

        res.json({ message: 'Flight dispatched successfully', flight });
    } catch (error) {
        console.error('Dispatch flight error:', error);
        res.status(500).json({ message: 'Failed to dispatch flight', error: error.message });
    }
});

/**
 * POST /api/career/flights/:id/complete
 * Mark flight as completed
 */
router.post('/:id/complete', requireCareerAuth, requireCareerApproval, async (req, res) => {
    try {
        const userId = req.userId;
        const flightId = req.params.id;

        const flight = await CareerFlight.findById(flightId);
        if (!flight) {
            return res.status(404).json({ message: 'Flight not found' });
        }

        if (flight.assignedPilot?.toString() !== userId.toString()) {
            return res.status(403).json({ message: 'You are not assigned to this flight' });
        }

        if (flight.status !== 'DISPATCHED') {
            return res.status(400).json({ message: 'Flight is not in dispatched state' });
        }

        flight.status = 'COMPLETED';
        flight.completedAt = new Date();
        await flight.save();

        res.json({ message: 'Flight completed successfully', flight });
    } catch (error) {
        console.error('Complete flight error:', error);
        res.status(500).json({ message: 'Failed to complete flight', error: error.message });
    }
});

module.exports = router;
