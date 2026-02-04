const mongoose = require('mongoose');

const careerPIREPSchema = new mongoose.Schema({
    pilot: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    flight: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'CareerFlight',
        required: true,
    },

    // Flight Details
    pilotCallsign: {
        type: String,
        required: true,
    },
    pilotRank: {
        type: String,
        default: 'First Officer',
    },
    flightNumber: {
        type: String,
        required: true,
    },
    flightDate: {
        type: Date,
        required: true,
    },
    origin: {
        type: String,
        required: true,
        uppercase: true,
    },
    destination: {
        type: String,
        required: true,
        uppercase: true,
    },
    aircraftType: {
        type: String,
        required: true,
    },
    aircraftMultiplier: {
        type: Number,
        default: 1.0,
    },
    tailNumber: {
        type: String,
        default: '',
    },

    // Performance Metrics
    flightTimeHours: {
        type: Number,
        required: true,
        default: 0,
    },
    flightTimeMinutes: {
        type: Number,
        required: true,
        default: 0,
    },
    totalFuelKg: {
        type: Number,
        default: 0,
    },
    usedFuelKg: {
        type: Number,
        default: 0,
    },
    cargoKg: {
        type: Number,
        default: 0,
    },
    passengers: {
        type: Number,
        default: 0,
    },
    notes: {
        type: String,
        default: '',
    },

    // Earnings Breakdown
    baseRate: {
        type: Number,
        required: true,
        default: 0,
        // ₹/hr
    },
    multiplier: {
        type: Number,
        required: true,
        default: 1.0,
    },
    flightEarnings: {
        type: Number,
        default: 0,
        // Base earnings before bonuses
    },
    payloadBonus: {
        type: Number,
        default: 0,
    },
    grossEarnings: {
        type: Number,
        default: 0,
        // Before deductions
    },
    deductions: {
        type: Number,
        default: 0,
        // 15% tax
    },
    grandTotal: {
        type: Number,
        default: 0,
        // Final earnings
    },

    // Status
    status: {
        type: String,
        enum: ['PENDING', 'APPROVED', 'REJECTED'],
        default: 'PENDING',
    },
    reviewedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null,
    },
    reviewNotes: {
        type: String,
        default: '',
    },
    reviewedAt: {
        type: Date,
        default: null,
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

careerPIREPSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.model('CareerPIREP', careerPIREPSchema);
