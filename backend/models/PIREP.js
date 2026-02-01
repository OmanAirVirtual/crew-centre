const mongoose = require('mongoose');
const fetch = require('node-fetch');

const WEBHOOK_URL = "https://discord.com/api/webhooks/1467467050799861871/7A7bewup_oIw5BKqgEJaKuQ0WazMCXkp4fJwBR-HWbAbUeTnmlkGVCUeF-f3LCcUU9TU";

const pirepSchema = new mongoose.Schema({
  pilotId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  pilotName: { type: String, required: true },
  callsign: { type: String, required: true },
  flightNumber: { type: String, required: true },
  aircraft: { type: String, required: true },

  departure: {
    icao: { type: String, required: true },
    name: { type: String, required: true }
  },

  arrival: {
    icao: { type: String, required: true },
    name: { type: String, required: true }
  },

  departureTime: { type: Date, required: true },
  arrivalTime: { type: Date, required: true },

  flightTime: { type: Number, required: true }, // minutes
  fuelUsed: { type: Number, required: true },
  passengers: { type: Number, default: 0 },
  cargo: { type: Number, default: 0 },

  route: { type: String, default: '' },
  remarks: { type: String, default: '' },

  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },

  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reviewedAt: { type: Date },

  createdAt: { type: Date, default: Date.now }
});


// ✅ Convert minutes → "12h 34m"
function formatFlightTime(minutes) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h ${m}m`;
}


// ✅ SEND DISCORD EMBED AFTER SAVE
pirepSchema.post('save', async function(doc) {
  try {
    const embed = {
      title: "✈️ New PIREP Submitted",
      color: 0x00ff00,
      fields: [
        { name: "Pilot", value: doc.pilotName },
        { name: "Route", value: `${doc.departure.icao}-${doc.arrival.icao}` },
        { name: "Flight No.", value: doc.flightNumber },
        { name: "Flight Time", value: formatFlightTime(doc.flightTime) },
        { name: "Operator", value: "Oman Air" }, // change if dynamic
        { name: "Date", value: doc.createdAt.toISOString().split('T')[0] }
      ]
    };

    await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ embeds: [embed] })
    });

  } catch (err) {
    console.error("Discord webhook error:", err);
  }
});

module.exports = mongoose.model('PIREP', pirepSchema);
