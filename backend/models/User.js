const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  discordId: {
    type: String,
    required: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  firstName: {
    type: String,
    required: true
  },
  lastName: {
    type: String
  },
  callsign: {
    type: String,
    default: ''
  },
  role: {
    type: String,
    enum: ['pilot', 'Event Leader', 'Chief Pilot', 'CEO', 'CAO', 'CMO', 'CFI', 'Recruiter', 'Routes Manager', 'Crew Centre Manager'],
    default: 'pilot'
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended'],
    default: 'active'
  },
  examCompleted: {
    type: Boolean,
    default: false
  },
  examScore: {
    type: Number,
    default: 0
  },
  totalHours: {
    type: Number,
    default: 0
  },
  totalFlights: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
