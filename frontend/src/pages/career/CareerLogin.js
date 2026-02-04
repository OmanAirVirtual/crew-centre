import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Career.css';

const CareerLogin = () => {
    const navigate = useNavigate();
    const [callsign, setCallsign] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const res = await axios.post('/api/career/auth/login', { callsign, password });

            // Store token in localStorage
            localStorage.setItem('careerToken', res.data.token);
            localStorage.setItem('careerUser', JSON.stringify(res.data.user));

            // Redirect to career dashboard
            navigate('/career/dashboard');
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="career-login-container">
            <div className="career-login-bg"></div>
            <div className="career-login-card">
                <div className="career-login-header">
                    <h1>Oman Air Virtual</h1>
                    <h2>Career Mode</h2>
                </div>

                <form onSubmit={handleLogin} className="career-login-form">
                    {error && (
                        <div className="career-alert career-alert-error">
                            {error}
                        </div>
                    )}

                    <div className="career-form-group">
                        <label htmlFor="callsign">Callsign</label>
                        <input
                            type="text"
                            id="callsign"
                            value={callsign}
                            onChange={(e) => setCallsign(e.target.value)}
                            placeholder="Enter your callsign"
                            required
                            autoFocus
                        />
                    </div>

                    <div className="career-form-group">
                        <label htmlFor="password">Password</label>
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter your password"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        className="career-btn career-btn-primary"
                        disabled={loading}
                    >
                        {loading ? 'Logging in...' : 'Login to Career Mode'}
                    </button>
                </form>

                <div className="career-login-footer">
                    <p>Need access? Contact your administrator.</p>
                    <button
                        onClick={() => navigate('/')}
                        className="career-link-btn"
                    >
                        ← Back to Home
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CareerLogin;
