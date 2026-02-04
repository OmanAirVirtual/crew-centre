const mongoose = require('mongoose');

const careerFlightSchema = new mongoose.Schema({
    flightNumber: {
        type: String,
        required: true,
        trim: true,
        // e.g., "AI572", "AI992"
    },
    legIdentifier: {
        type: String,
        required: true,
        unique: true,
        // e.g., "LEG 4", "LEG 5" - unique identifier
    },
    origin: {
        type: String,
        required: true,
        uppercase: true,
        // ICAO code, e.g., "OMAA", "VABB"
    },
    destination: {
        type: String,
        required: true,
        uppercase: true,
        // ICAO code, e.g., "VABB", "VIDP"
    },
    aircraftType: {
        type: String,
        required: true,
        // e.g., "A320", "B738"
    },
    aircraftFamily: {
        type: String,
        required: true,
        // e.g., "A320 Family", "Boeing 737 family"
    },
    distance: {
        type: Number,
        required: true,
        default: 0,
        // Distance in nautical miles
    },
    estimatedFlightTime: {
        type: Number,
        default: 0,
        // Estimated flight time in hours (decimal)
    },
    status: {
        type: String,
        enum: ['AVAILABLE', 'DISPATCHED', 'COMPLETED', 'LOCKED'],
        default: 'AVAILABLE',
    },
    assignedPilot: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null,
    },
    dispatchedAt: {
        type: Date,
        default: null,
    },
    completedAt: {
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

careerFlightSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.model('CareerFlight', careerFlightSchema);
