const express = require('express');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const User = require('../models/User');
const { auth } = require('../middleware/auth');

const router = express.Router();

// In-memory OTP store: { email: { otp: string, expiresAt: Date } }
const otpStore = new Map();
const OTP_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes

// In-memory signup toggle (can be toggled by CFI/CEO/CAO)
let signupsEnabled = true;

function generateOTP() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function getMailer() {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!host || !user || !pass) return null;
  return nodemailer.createTransport({
    host,
    port: port ? parseInt(port, 10) : 587,
    secure: port === '465',
    auth: { user, pass },
    connectionTimeout: 10000, // 10 seconds
    greetingTimeout: 10000,   // 10 seconds
    socketTimeout: 10000,     // 10 seconds
  });
}

async function sendOTPEmail(email, otp) {
  const transport = getMailer();
  const from = process.env.FROM_EMAIL || process.env.SMTP_USER || 'noreply@omanairvirtual.com';
  const appName = 'Oman Air Virtual';
  if (!transport) {
    console.log('[Forgot Password] OTP for', email, ':', otp, '(SMTP not configured – set SMTP_HOST, SMTP_USER, SMTP_PASS)');
    return;
  }
  await transport.sendMail({
    from: `"${appName}" <${from}>`,
    to: email,
    subject: `Your password reset code – ${appName}`,
    text: `Your one-time password (OTP) is: ${otp}. It expires in 10 minutes. If you did not request this, ignore this email.`,
    html: `<p>Your one-time password (OTP) is: <strong>${otp}</strong>.</p><p>It expires in 10 minutes.</p><p>If you did not request this, please ignore this email.</p>`,
  });
}

// Get signup status (public endpoint)
router.get('/signup-status', (req, res) => {
  res.json({ enabled: signupsEnabled });
});

// Toggle signups (CFI, CEO, CAO only)
router.post('/toggle-signups', auth, adminAuth('CEO', 'CAO', 'CFI'), (req, res) => {
  signupsEnabled = !signupsEnabled;
  res.json({
    enabled: signupsEnabled,
    message: signupsEnabled ? 'Signups enabled' : 'Signups disabled'
  });
});

// Get signup status (public endpoint)
router.get('/signup-status', (req, res) => {
  res.json({ enabled: signupsEnabled });
});

// Toggle signups (CFI, CEO, CAO only)
router.post('/toggle-signups', auth, adminAuth('CEO', 'CAO', 'CFI'), (req, res) => {
  signupsEnabled = !signupsEnabled;
  res.json({
    enabled: signupsEnabled,
    message: signupsEnabled ? 'Signups enabled' : 'Signups disabled'
  });
});

// Register
router.post('/register', async (req, res) => {
  try {
    // Check if signups are enabled
    if (!signupsEnabled) {
      return res.status(403).json({
        message: 'Signups are currently disabled. Please go back and login with default credentials'
      });
    }

    const { username, email, password, firstName, lastName, callsign, discordId } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create new user
    const user = new User({
      username,
      email,
      password,
      firstName,
      lastName,
      discordId,
      callsign: callsign || ''
    });

    await user.save();

    // Generate token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    res.status(201).json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        examCompleted: user.examCompleted
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        examCompleted: user.examCompleted,
        totalHours: user.totalHours,
        totalFlights: user.totalFlights
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get current user
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Forgot password – send OTP to email
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email || typeof email !== 'string') {
      return res.status(400).json({ message: 'Email is required' });
    }
    const user = await User.findOne({ email: email.trim().toLowerCase() });
    if (!user) {
      return res.status(400).json({ message: 'No account found with this email' });
    }
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MS);
    otpStore.set(email.trim().toLowerCase(), { otp, expiresAt });

    try {
      await sendOTPEmail(user.email, otp);
      res.json({ message: 'OTP sent to your email. Check your inbox (and spam).' });
    } catch (emailError) {
      console.error('Failed to send OTP email:', emailError.message);
      // OTP is stored, but email failed to send
      res.status(500).json({
        message: 'Failed to send OTP email. Please check your email configuration or try again later.'
      });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Reset password with OTP
router.post('/reset-password-with-otp', async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) {
      return res.status(400).json({ message: 'Email, OTP and new password are required' });
    }
    const key = email.trim().toLowerCase();
    const stored = otpStore.get(key);
    if (!stored) {
      return res.status(400).json({ message: 'Invalid or expired OTP. Request a new one.' });
    }
    if (new Date() > stored.expiresAt) {
      otpStore.delete(key);
      return res.status(400).json({ message: 'OTP has expired. Request a new one.' });
    }
    if (stored.otp !== String(otp).trim()) {
      return res.status(400).json({ message: 'Invalid OTP.' });
    }
    const user = await User.findOne({ email: key });
    if (!user) {
      otpStore.delete(key);
      return res.status(400).json({ message: 'User not found.' });
    }
    user.password = newPassword;
    await user.save();
    otpStore.delete(key);
    res.json({ message: 'Password reset successfully. You can log in with your new password.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update user profile
router.put('/profile', auth, async (req, res) => {
  try {
    const { email, username, firstName, lastName, discordId } = req.body;
    const userId = req.user._id;

    // Find current user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if email or username is being changed and if they're already taken
    if (email && email !== user.email) {
      const existingEmail = await User.findOne({ email: email.trim().toLowerCase() });
      if (existingEmail) {
        return res.status(400).json({ message: 'Email already in use' });
      }
      user.email = email.trim().toLowerCase();
    }

    if (username && username !== user.username) {
      const existingUsername = await User.findOne({ username: username.trim() });
      if (existingUsername) {
        return res.status(400).json({ message: 'Username already taken' });
      }
      user.username = username.trim();
    }

    // Update other fields
    if (firstName !== undefined) user.firstName = firstName.trim();
    if (lastName !== undefined) user.lastName = lastName ? lastName.trim() : '';
    if (discordId !== undefined) user.discordId = discordId.trim();

    await user.save();

    res.json({
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        discordId: user.discordId,
        role: user.role,
        examCompleted: user.examCompleted
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
