import React, { useState, useContext, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { FiUserPlus, FiUser, FiMail, FiLock, FiRadio } from 'react-icons/fi';
import './Auth.css';

const Register = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    discordId: '',
    callsign: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [signupsEnabled, setSignupsEnabled] = useState(true);
  const [checkingStatus, setCheckingStatus] = useState(true);
  const { register } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    const checkSignupStatus = async () => {
      try {
        const response = await axios.get('/api/auth/signup-status');
        setSignupsEnabled(response.data.enabled);
      } catch (err) {
        console.error('Error checking signup status:', err);
      } finally {
        setCheckingStatus(false);
      }
    };
    checkSignupStatus();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!signupsEnabled) {
      setError('Registration is currently disabled.');
      return;
    }
    setError('');
    setLoading(true);

    try {
      await register(formData);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  if (checkingStatus) {
    return <div className="auth-container"><div className="auth-card">Checking status...</div></div>;
  }

  if (!signupsEnabled) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <FiUserPlus className="auth-icon" />
            <h1>Signups Closed</h1>
            <p style={{ marginTop: '1rem', color: '#f5576c', fontWeight: 'bold' }}>
              Please go back and login with default credentials
            </p>
          </div>
          <div style={{ marginTop: '2rem', textAlign: 'center' }}>
            <Link to="/login" className="btn btn-primary">Go to Login</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <FiUserPlus className="auth-icon" />
          <h1>Join Oman Air Virtual</h1>
          <p>Create your pilot account</p>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-row">
            <div className="form-group">
              <label>
                <FiUser /> First Name
              </label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                required
                placeholder="First Name"
              />
            </div>

            <div className="form-group">
              <label>
                <FiUser /> Last Name
              </label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                placeholder="Last Name (Optional)"
              />
            </div>
          </div>

          <div className="form-group">
            <label>
              <FiUser /> Username
            </label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              required
              placeholder="Choose a username"
            />
          </div>

          <div className="form-group">
            <label>
              <FiMail /> Email
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="Enter your email"
            />
          </div>

          <div className="form-group">
            <label>
              <FiRadio /> Discord ID
            </label>
            <input
              type="text"
              name="discordId"
              value={formData.discordId}
              onChange={handleChange}
              required
              placeholder="Your Discord Username/ID"
            />
          </div>

          <div className="form-group">
            <label>
              <FiRadio /> Callsign (Optional)
            </label>
            <input
              type="text"
              name="callsign"
              value={formData.callsign}
              onChange={handleChange}
              placeholder="e.g., 000WY"
            />
          </div>

          <div className="form-group">
            <label>
              <FiLock /> Password
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              minLength="6"
              placeholder="Minimum 6 characters"
            />
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Registering...' : 'Register'}
          </button>
        </form>

        <p className="auth-footer">
          Already have an account? <Link to="/login">Login here</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
