import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FiMail, FiLock, FiKey } from 'react-icons/fi';
import './Auth.css';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRequestOTP = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);
    try {
      await axios.post('/api/auth/forgot-password', { email: email.trim() });
      setMessage('OTP sent to your email. Check your inbox (and spam folder).');
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send OTP.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setLoading(true);
    try {
      await axios.post('/api/auth/reset-password-with-otp', {
        email: email.trim(),
        otp: otp.trim(),
        newPassword,
      });
      setMessage('Password reset successfully. Redirecting to login...');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <FiKey className="auth-icon" />
          <h1>Forgot Password</h1>
          <p>Oman Air Virtual – reset your password</p>
        </div>

        {error && <div className="alert alert-error">{error}</div>}
        {message && <div className="alert alert-success">{message}</div>}

        {step === 1 ? (
          <form onSubmit={handleRequestOTP} className="auth-form">
            <div className="form-group">
              <label><FiMail /> Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="Enter your registered email"
              />
            </div>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Sending…' : 'Send OTP to Email'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleResetPassword} className="auth-form">
            <div className="form-group">
              <label>Email</label>
              <input type="email" value={email} readOnly disabled style={{ opacity: 0.8 }} />
            </div>
            <div className="form-group">
              <label><FiKey /> OTP (6 digits)</label>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                required
                placeholder="Enter OTP from email"
                maxLength={6}
                autoComplete="one-time-code"
              />
            </div>
            <div className="form-group">
              <label><FiLock /> New password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={6}
                placeholder="At least 6 characters"
              />
            </div>
            <div className="form-group">
              <label><FiLock /> Confirm password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                placeholder="Confirm new password"
              />
            </div>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Resetting…' : 'Reset Password'}
            </button>
            <p style={{ marginTop: '1rem', fontSize: '0.9rem' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setStep(1)} style={{ padding: '0.5rem 1rem' }}>
                Back to email
              </button>
            </p>
          </form>
        )}

        <p className="auth-footer">
          Remember your password? <Link to="/login">Login</Link>
        </p>
      </div>
    </div>
  );
};

export default ForgotPassword;
