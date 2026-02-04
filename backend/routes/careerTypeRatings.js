const express = require('express');
const router = express.Router();
const CareerTypeRating = require('../models/CareerTypeRating');
const CareerStats = require('../models/CareerStats');
const User = require('../models/User');
const { requireCareerAuth, requireCareerApproval, requireCareerAdmin } = require('../middleware/careerAuthMiddleware');

/**
 * GET /api/career/type-ratings
 * List all type ratings with user ownership status
 */
router.get('/', requireCareerAuth, requireCareerApproval, async (req, res) => {
    try {
        const userId = req.userId;

        // Get all type ratings
        const typeRatings = await CareerTypeRating.find().sort({ purchasePrice: 1 });

        // Get user's career stats to check owned types
        let careerStats = await CareerStats.findOne({ pilot: userId }).populate('ownedTypeRatings');

        if (!careerStats) {
            // Create initial career stats if not exists
            careerStats = await CareerStats.create({ pilot: userId });
        }

        const ownedTypeIds = careerStats.ownedTypeRatings.map(t => t._id.toString());
        const currentActiveTypeId = careerStats.currentActiveType?.toString();

        // Enrich type ratings with ownership status
        const enrichedRatings = typeRatings.map(rating => {
            const isOwned = ownedTypeIds.includes(rating._id.toString());
            const isActive = rating._id.toString() === currentActiveTypeId;

            let status = 'AVAILABLE';
            if (isOwned) status = 'OWNED';
            if (rating.isLocked) status = 'LOCKED';

            return {
                ...rating.toObject(),
                status,
                isActive,
            };
        });

        res.json({ typeRatings: enrichedRatings });
    } catch (error) {
        console.error('Get type ratings error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

/**
 * POST /api/career/type-ratings
 * Create type rating (admin only)
 */
router.post('/', requireCareerAuth, requireCareerAdmin, async (req, res) => {
    try {
        const typeRating = await CareerTypeRating.create(req.body);
        res.status(201).json({ typeRating });
    } catch (error) {
        console.error('Create type rating error:', error);
        res.status(500).json({ message: 'Failed to create type rating', error: error.message });
    }
});

/**
 * PUT /api/career/type-ratings/:id
 * Update type rating (admin only)
 */
router.put('/:id', requireCareerAuth, requireCareerAdmin, async (req, res) => {
    try {
        const typeRating = await CareerTypeRating.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!typeRating) {
            return res.status(404).json({ message: 'Type rating not found' });
        }

        res.json({ typeRating });
    } catch (error) {
        console.error('Update type rating error:', error);
        res.status(500).json({ message: 'Failed to update type rating', error: error.message });
    }
});

/**
 * DELETE /api/career/type-ratings/:id
 * Delete type rating (admin only)
 */
router.delete('/:id', requireCareerAuth, requireCareerAdmin, async (req, res) => {
    try {
        const typeRating = await CareerTypeRating.findByIdAndDelete(req.params.id);

        if (!typeRating) {
            return res.status(404).json({ message: 'Type rating not found' });
        }

        res.json({ message: 'Type rating deleted successfully' });
    } catch (error) {
        console.error('Delete type rating error:', error);
        res.status(500).json({ message: 'Failed to delete type rating', error: error.message });
    }
});

/**
 * POST /api/career/type-ratings/:id/purchase
 * Purchase/request type rating
 */
router.post('/:id/purchase', requireCareerAuth, requireCareerApproval, async (req, res) => {
    try {
        const userId = req.userId;
        const typeRatingId = req.params.id;

        // Get type rating
        const typeRating = await CareerTypeRating.findById(typeRatingId);
        if (!typeRating) {
            return res.status(404).json({ message: 'Type rating not found' });
        }

        // Check if locked
        if (typeRating.isLocked) {
            return res.status(403).json({ message: 'This type rating is locked. Rank requirement not met.' });
        }

        // Get user and career stats
        const user = await User.findById(userId);
        let careerStats = await CareerStats.findOne({ pilot: userId });

        if (!careerStats) {
            careerStats = await CareerStats.create({ pilot: userId });
        }

        // Check if already owned
        const alreadyOwned = careerStats.ownedTypeRatings.some(t => t.toString() === typeRatingId);
        if (alreadyOwned) {
            return res.status(400).json({ message: 'You already own this type rating' });
        }

        // Check if user has enough earnings
        if (user.careerEarnings < typeRating.purchasePrice) {
            return res.status(400).json({
                message: `Insufficient funds. You need ₹${typeRating.purchasePrice} but have ₹${user.careerEarnings}`
            });
        }

        // Deduct price and add to owned types
        user.careerEarnings -= typeRating.purchasePrice;
        await user.save();

        careerStats.ownedTypeRatings.push(typeRatingId);
        await careerStats.save();

        res.json({
            message: 'Type rating purchased successfully',
            newBalance: user.careerEarnings,
        });
    } catch (error) {
        console.error('Purchase type rating error:', error);
        res.status(500).json({ message: 'Failed to purchase type rating', error: error.message });
    }
});

/**
 * POST /api/career/type-ratings/:id/activate
 * Set active aircraft family
 */
router.post('/:id/activate', requireCareerAuth, requireCareerApproval, async (req, res) => {
    try {
        const userId = req.userId;
        const typeRatingId = req.params.id;

        // Get type rating
        const typeRating = await CareerTypeRating.findById(typeRatingId);
        if (!typeRating) {
            return res.status(404).json({ message: 'Type rating not found' });
        }

        // Get career stats
        let careerStats = await CareerStats.findOne({ pilot: userId });
        if (!careerStats) {
            careerStats = await CareerStats.create({ pilot: userId });
        }

        // Check ownership
        const isOwned = careerStats.ownedTypeRatings.some(t => t.toString() === typeRatingId);
        if (!isOwned) {
            return res.status(403).json({ message: 'You must own this type rating to activate it' });
        }

        // Update active family
        careerStats.currentActiveFamily = typeRating.aircraftFamily;
        careerStats.currentActiveType = typeRatingId;
        await careerStats.save();

        // Update user
        const user = await User.findById(userId);
        user.careerActiveFamily = typeRating.aircraftFamily;
        await user.save();

        res.json({
            message: 'Aircraft family activated successfully',
            activeFamily: typeRating.aircraftFamily,
        });
    } catch (error) {
        console.error('Activate type rating error:', error);
        res.status(500).json({ message: 'Failed to activate type rating', error: error.message });
    }
});

module.exports = router;
