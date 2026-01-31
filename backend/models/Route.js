const mongoose = require('mongoose');

const routeSchema = new mongoose.Schema({
  routeNumber: {
    type: String,
    required: true,
    unique: true
  },
  flightNumber: {
    type: String,
    required: true
  },
  departure: {
    icao: { type: String, required: true },
    name: { type: String, required: true },
    city: { type: String, required: true },
    country: { type: String, required: true }
  },
  arrival: {
    icao: { type: String, required: true },
    name: { type: String, required: true },
    city: { type: String, required: true },
    country: { type: String, required: true }
  },
  aircraft: {
    type: String,
    required: true
  },
  distance: {
    type: Number, // in nautical miles
    required: true
  },
  duration: {
    type: Number, // in minutes
    required: true
  },
  frequency: {
    type: String,
    default: 'Daily'
  },
  codeshare: {
    type: Boolean,
    default: false
  },
  codesharePartners: [{
    airline: String,
    flightNumber: String
  }],
  active: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Route', routeSchema);
