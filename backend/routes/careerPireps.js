const express = require('express');
const router = express.Router();
const CareerPIREP = require('../models/CareerPIREP');
const CareerFlight = require('../models/CareerFlight');
const CareerStats = require('../models/CareerStats');
const CareerTypeRating = require('../models/CareerTypeRating');
const User = require('../models/User');
const { calculateEarnings } = require('../utils/earningsCalculator');
const { requireCareerAuth, requireCareerApproval, requireCareerAdmin } = require('../middleware/careerAuthMiddleware');

/**
 * GET /api/career/pireps
 * List user's PIREPs
 */
router.get('/', requireCareerAuth, requireCareerApproval, async (req, res) => {
    try {
        const userId = req.userId;
        const pireps = await CareerPIREP.find({ pilot: userId })
            .populate('flight')
            .sort({ createdAt: -1 });

        res.json({ pireps });
    } catch (error) {
        console.error('Get PIREPs error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

/**
 * GET /api/career/pireps/:id
 * Get single PIREP details
 */
router.get('/:id', requireCareerAuth, requireCareerApproval, async (req, res) => {
    try {
        const pirep = await CareerPIREP.findById(req.params.id)
            .populate('flight')
            .populate('pilot', 'callsign firstName lastName');

        if (!pirep) {
            return res.status(404).json({ message: 'PIREP not found' });
        }

        res.json({ pirep });
    } catch (error) {
        console.error('Get PIREP error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

/**
 * POST /api/career/pireps
 * File new PIREP with auto-calculation
 */
router.post('/', requireCareerAuth, requireCareerApproval, async (req, res) => {
    try {
        const userId = req.userId;
        const user = await User.findById(userId);

        const {
            flightId,
            flightDate,
            pilotRank,
            flightTimeHours,
            flightTimeMinutes,
            totalFuelKg,
            usedFuelKg,
            cargoKg,
            passengers,
            notes,
            aircraftType,
            tailNumber,
        } = req.body;

        // Validate required fields
        if (!flightId || flightTimeHours === undefined || flightTimeMinutes === undefined) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        // Get flight details
        const flight = await CareerFlight.findById(flightId);
        if (!flight) {
            return res.status(404).json({ message: 'Flight not found' });
        }

        // Check flight is dispatched to this user
        if (flight.assignedPilot?.toString() !== userId.toString()) {
            return res.status(403).json({ message: 'You are not assigned to this flight' });
        }

        // Get aircraft type rating for base rate and multiplier
        let typeRating = await CareerTypeRating.findOne({ typeName: aircraftType || flight.aircraftType });

        if (!typeRating) {
            // Fallback: Try looking up by family (e.g., flight is B738, rating is B737)
            typeRating = await CareerTypeRating.findOne({ aircraftFamily: flight.aircraftFamily });
        }

        if (!typeRating) {
            return res.status(404).json({ message: `Aircraft type rating not found for ${flight.aircraftType} (${flight.aircraftFamily})` });
        }

        // Calculate earnings
        const earnings = calculateEarnings({
            baseRate: typeRating.baseRate,
            multiplier: typeRating.multiplier,
            flightTimeHours: Number(flightTimeHours) || 0,
            flightTimeMinutes: Number(flightTimeMinutes) || 0,
            passengers: Number(passengers) || 0,
            cargoKg: Number(cargoKg) || 0,
        });

        // Create PIREP
        const pirep = await CareerPIREP.create({
            pilot: userId,
            flight: flightId,
            pilotCallsign: user.callsign,
            pilotRank: pilotRank || user.careerRank,
            flightNumber: flight.flightNumber,
            flightDate: flightDate || new Date(),
            origin: flight.origin,
            destination: flight.destination,
            aircraftType: aircraftType || flight.aircraftType,
            aircraftMultiplier: typeRating.multiplier,
            tailNumber: tailNumber || '',
            flightTimeHours: Number(flightTimeHours) || 0,
            flightTimeMinutes: Number(flightTimeMinutes) || 0,
            totalFuelKg: Number(totalFuelKg) || 0,
            usedFuelKg: Number(usedFuelKg) || 0,
            cargoKg: Number(cargoKg) || 0,
            passengers: Number(passengers) || 0,
            notes: notes || '',
            baseRate: typeRating.baseRate,
            multiplier: typeRating.multiplier,
            flightEarnings: earnings.flightEarnings,
            payloadBonus: earnings.payloadBonus,
            grossEarnings: earnings.grossEarnings,
            deductions: earnings.deductions,
            grandTotal: earnings.grandTotal,
            status: 'PENDING',
        });

        res.status(201).json({ pirep, earnings });
    } catch (error) {
        console.error('Create PIREP error:', error);
        res.status(500).json({ message: 'Failed to create PIREP', error: error.message });
    }
});

/**
 * PUT /api/career/pireps/:id
 * Update PIREP
 */
router.put('/:id', requireCareerAuth, requireCareerApproval, async (req, res) => {
    try {
        const userId = req.userId;
        const pirepId = req.params.id;

        const pirep = await CareerPIREP.findById(pirepId);
        if (!pirep) {
            return res.status(404).json({ message: 'PIREP not found' });
        }

        // Only owner can update their own PIREP
        if (pirep.pilot.toString() !== userId.toString()) {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        // Only pending PIREPs can be updated
        if (pirep.status !== 'PENDING') {
            return res.status(400).json({ message: 'Cannot update approved or rejected PIREP' });
        }

        // Recalculate if performance metrics changed
        const {
            flightTimeHours,
            flightTimeMinutes,
            passengers,
            cargoKg,
        } = req.body;

        if (flightTimeHours !== undefined || flightTimeMinutes !== undefined ||
            passengers !== undefined || cargoKg !== undefined) {
            const earnings = calculateEarnings({
                baseRate: pirep.baseRate,
                multiplier: pirep.multiplier,
                flightTimeHours: Number(flightTimeHours ?? pirep.flightTimeHours),
                flightTimeMinutes: Number(flightTimeMinutes ?? pirep.flightTimeMinutes),
                passengers: Number(passengers ?? pirep.passengers),
                cargoKg: Number(cargoKg ?? pirep.cargoKg),
            });

            req.body.flightEarnings = earnings.flightEarnings;
            req.body.payloadBonus = earnings.payloadBonus;
            req.body.grossEarnings = earnings.grossEarnings;
            req.body.deductions = earnings.deductions;
            req.body.grandTotal = earnings.grandTotal;
        }

        Object.assign(pirep, req.body);
        await pirep.save();

        res.json({ pirep });
    } catch (error) {
        console.error('Update PIREP error:', error);
        res.status(500).json({ message: 'Failed to update PIREP', error: error.message });
    }
});

/**
 * DELETE /api/career/pireps/:id
 * Delete PIREP
 */
router.delete('/:id', requireCareerAuth, requireCareerApproval, async (req, res) => {
    try {
        const userId = req.userId;
        const pirep = await CareerPIREP.findById(req.params.id);

        if (!pirep) {
            return res.status(404).json({ message: 'PIREP not found' });
        }

        // Only owner can delete
        if (pirep.pilot.toString() !== userId.toString()) {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        await pirep.deleteOne();
        res.json({ message: 'PIREP deleted successfully' });
    } catch (error) {
        console.error('Delete PIREP error:', error);
        res.status(500).json({ message: 'Failed to delete PIREP', error: error.message });
    }
});

/**
 * POST /api/career/pireps/:id/approve
 * Approve PIREP (admin only)
 */
router.post('/:id/approve', requireCareerAuth, requireCareerAdmin, async (req, res) => {
    try {
        const adminId = req.userId;
        const pirepId = req.params.id;

        const pirep = await CareerPIREP.findById(pirepId);
        if (!pirep) {
            return res.status(404).json({ message: 'PIREP not found' });
        }

        if (pirep.status !== 'PENDING') {
            return res.status(400).json({ message: 'PIREP is not pending' });
        }

        // Update PIREP status
        pirep.status = 'APPROVED';
        pirep.reviewedBy = adminId;
        pirep.reviewedAt = new Date();
        pirep.reviewNotes = req.body.notes || '';
        await pirep.save();

        // Update user earnings and stats
        const user = await User.findById(pirep.pilot);
        user.careerEarnings += pirep.grandTotal;
        user.careerTotalTime += (pirep.flightTimeHours + pirep.flightTimeMinutes / 60);

        // Check for promotion
        if (typeof user.checkPromotion === 'function') {
            await user.checkPromotion();
        }

        await user.save();

        // Update career stats
        let careerStats = await CareerStats.findOne({ pilot: pirep.pilot });
        if (!careerStats) {
            careerStats = await CareerStats.create({ pilot: pirep.pilot });
        }

        const flight = await CareerFlight.findById(pirep.flight);
        if (flight) {
            careerStats.totalDistance += flight.distance;
            user.careerTotalDistance += flight.distance;
            await user.save();
        }

        careerStats.totalEarnings += pirep.grandTotal;
        careerStats.totalFlightTime += (pirep.flightTimeHours + pirep.flightTimeMinutes / 60);
        careerStats.totalFlights += 1;

        // Update route history
        if (flight) {
            const routeIndex = careerStats.routeHistory.findIndex(
                r => r.origin === flight.origin && r.destination === flight.destination
            );

            if (routeIndex >= 0) {
                careerStats.routeHistory[routeIndex].count += 1;
                careerStats.routeHistory[routeIndex].lastFlown = new Date();
            } else {
                careerStats.routeHistory.push({
                    origin: flight.origin,
                    destination: flight.destination,
                    count: 1,
                    lastFlown: new Date(),
                });
            }
        }

        await careerStats.save();

        // Mark flight as completed
        if (flight && flight.status === 'DISPATCHED') {
            flight.status = 'COMPLETED';
            flight.completedAt = new Date();
            await flight.save();
        }

        res.json({ message: 'PIREP approved successfully', pirep });
    } catch (error) {
        console.error('Approve PIREP error:', error);
        res.status(500).json({ message: 'Failed to approve PIREP', error: error.message });
    }
});

/**
 * POST /api/career/pireps/:id/reject
 * Reject PIREP (admin only)
 */
router.post('/:id/reject', requireCareerAuth, requireCareerAdmin, async (req, res) => {
    try {
        const adminId = req.userId;
        const pirepId = req.params.id;

        const pirep = await CareerPIREP.findById(pirepId);
        if (!pirep) {
            return res.status(404).json({ message: 'PIREP not found' });
        }

        if (pirep.status !== 'PENDING') {
            return res.status(400).json({ message: 'PIREP is not pending' });
        }

        // Update PIREP status
        pirep.status = 'REJECTED';
        pirep.reviewedBy = adminId;
        pirep.reviewedAt = new Date();
        pirep.reviewNotes = req.body.notes || 'PIREP rejected';
        await pirep.save();

        // Reset flight to dispatched (allow re-filing)
        const flight = await CareerFlight.findById(pirep.flight);
        if (flight && flight.status === 'COMPLETED') {
            flight.status = 'DISPATCHED';
            flight.completedAt = null;
            await flight.save();
        }

        res.json({ message: 'PIREP rejected', pirep });
    } catch (error) {
        console.error('Reject PIREP error:', error);
        res.status(500).json({ message: 'Failed to reject PIREP', error: error.message });
    }
});

module.exports = router;
