const mongoose = require('mongoose');

const pirepSchema = new mongoose.Schema({
  pilotId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  pilotName: {
    type: String,
    required: true
  },
  callsign: {
    type: String,
    required: true
  },
  flightNumber: {
    type: String,
    required: true
  },
  aircraft: {
    type: String,
    required: true
  },
  departure: {
    icao: { type: String, required: true },
    name: { type: String, required: true }
  },
  arrival: {
    icao: { type: String, required: true },
    name: { type: String, required: true }
  },
  departureTime: {
    type: Date,
    required: true
  },
  arrivalTime: {
    type: Date,
    required: true
  },
  flightTime: {
    type: Number, // in minutes
    required: true
  },
  fuelUsed: {
    type: Number,
    required: true
  },
  passengers: {
    type: Number,
    default: 0
  },
  cargo: {
    type: Number,
    default: 0
  },
  route: {
    type: String,
    default: ''
  },
  remarks: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reviewedAt: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('PIREP', pirepSchema);
