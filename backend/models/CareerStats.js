const mongoose = require('mongoose');

const careerStatsSchema = new mongoose.Schema({
    pilot: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true,
    },

    // Aggregated Statistics
    totalDistance: {
        type: Number,
        default: 0,
        // Total nautical miles flown
    },
    totalFlightTime: {
        type: Number,
        default: 0,
        // Total hours (decimal)
    },
    totalEarnings: {
        type: Number,
        default: 0,
        // Total career earnings
    },
    totalFlights: {
        type: Number,
        default: 0,
        // Number of completed flights
    },

    // Owned Aircraft Types
    ownedTypeRatings: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'CareerTypeRating',
    }],

    // Current Active Family
    currentActiveFamily: {
        type: String,
        default: '',
        // Currently active aircraft family
    },
    currentActiveType: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'CareerTypeRating',
        default: null,
    },

    // Rank/Level
    rank: {
        type: String,
        default: 'Cadet',
        // e.g., "Cadet", "First Officer", "Senior FO", "Captain"
    },
    level: {
        type: Number,
        default: 1,
    },

    // Route Statistics (for map visualization)
    routeHistory: [{
        origin: String,
        destination: String,
        count: { type: Number, default: 1 },
        lastFlown: { type: Date, default: Date.now },
    }],

    createdAt: {
        type: Date,
        default: Date.now,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    }
});

careerStatsSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.model('CareerStats', careerStatsSchema);
