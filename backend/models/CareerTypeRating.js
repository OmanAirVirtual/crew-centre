const mongoose = require('mongoose');

const careerTypeRatingSchema = new mongoose.Schema({
    typeName: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        // e.g., "A320", "B738", "B788", etc.
    },
    aircraftFamily: {
        type: String,
        required: true,
        // e.g., "A320 Family", "Boeing 737 family", etc.
    },
    purchasePrice: {
        type: Number,
        required: true,
        default: 0,
        // Price in currency (₹)
    },
    baseRate: {
        type: Number,
        required: true,
        default: 0,
        // Base hourly rate (₹/hr)
    },
    multiplier: {
        type: Number,
        required: true,
        default: 1.0,
        // Earnings multiplier (e.g., 1.00x, 1.15x)
    },
    seats: {
        type: Number,
        default: 0,
        // Number of seats
    },
    description: {
        type: String,
        default: '',
        // e.g., "Narrow-body workhorse • Airbus family"
    },
    bodyType: {
        type: String,
        enum: ['Narrow-body', 'Wide-body', 'Regional'],
        default: 'Narrow-body',
    },
    rankRequired: {
        type: String,
        default: '',
        // e.g., "Senior FO", "Captain"
    },
    isLocked: {
        type: Boolean,
        default: false,
        // If true, requires rank/approval to unlock
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    }
});

careerTypeRatingSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.model('CareerTypeRating', careerTypeRatingSchema);
