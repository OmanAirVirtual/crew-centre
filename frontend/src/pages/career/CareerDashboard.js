import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { FiUser, FiDollarSign, FiClock, FiMapPin, FiLogOut, FiMenu, FiSettings } from 'react-icons/fi';
import './Career.css';

const CareerDashboard = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const token = localStorage.getItem('careerToken');
        if (!token) {
            navigate('/career/login');
            return;
        }

        fetchUserData();
        fetchStats();
    }, [navigate]);

    const fetchUserData = async () => {
        try {
            const token = localStorage.getItem('careerToken');
            const res = await axios.get('/api/career/auth/me', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setUser(res.data);
            setLoading(false);
        } catch (err) {
            console.error('Error fetching user:', err);
            if (err.response?.status === 401 || err.response?.status === 403) {
                handleLogout();
            }
        }
    };

    const fetchStats = async () => {
        try {
            const token = localStorage.getItem('careerToken');
            const res = await axios.get('/api/career/stats/me', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setStats(res.data.stats);
        } catch (err) {
            console.error('Error fetching stats:', err);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('careerToken');
        localStorage.removeItem('careerUser');
        navigate('/career/login');
    };

    if (loading) {
        return (
            <div className="career-container">
                <div className="career-content" style={{ textAlign: 'center', paddingTop: '5rem' }}>
                    <h2>Loading Career Dashboard...</h2>
                </div>
            </div>
        );
    }

    const isAdmin = user && ['CEO', 'CAO', 'CMO', 'CFI', 'Chief Pilot', 'Crew Centre Manager'].includes(user.role);

    return (
        <div className="career-container">
            {/* Header */}
            <div className="career-header">
                <div className="career-header-left">
                    <button className="career-menu-btn">
                        <FiMenu />
                    </button>
                    <h1 className="career-title">Oman Air Virtual - Career Mode</h1>
                </div>
                <div className="career-header-right">
                    <div className="career-user-info">
                        <p className="career-user-callsign">{user?.callsign || 'GUEST'}</p>
                        <p className="career-user-rank">{user?.careerRank || 'Cadet'}</p>
                    </div>
                    <button onClick={handleLogout} className="career-logout-btn">
                        <FiLogOut /> Logout
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="career-content">
                {error && (
                    <div className="career-alert career-alert-error">
                        {error}
                    </div>
                )}

                {/* Welcome Section */}
                <div className="career-card">
                    <div className="career-card-header">
                        <FiUser className="career-card-icon" />
                        <h2 className="career-card-title">Welcome, {user?.firstName || user?.callsign}!</h2>
                    </div>
                    <p style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                        Current Active Family: <strong style={{ color: '#D4AF37' }}>
                            {user?.careerActiveFamily || 'No active family selected'}
                        </strong>
                    </p>
                </div>

                {/* Stats Grid */}
                <div className="career-stats-grid">
                    <div className="career-stat-box">
                        <div className="career-stat-value">
                            ${user?.careerEarnings?.toLocaleString() || '0'}
                        </div>
                        <div className="career-stat-label">Total Earnings</div>
                    </div>
                    <div className="career-stat-box">
                        <div className="career-stat-value">
                            {stats?.totalFlightTime?.toFixed(1) || '0.0'}
                        </div>
                        <div className="career-stat-label">Flight Hours</div>
                    </div>
                    <div className="career-stat-box">
                        <div className="career-stat-value">
                            {stats?.totalFlights || '0'}
                        </div>
                        <div className="career-stat-label">Completed Flights</div>
                    </div>
                    <div className="career-stat-box">
                        <div className="career-stat-value">
                            {stats?.totalDistance?.toLocaleString() || '0'}
                        </div>
                        <div className="career-stat-label">NM Flown</div>
                    </div>
                </div>

                {/* Navigation Cards */}
                <div className="career-grid">
                    <Link to="/career/type-ratings" className="career-nav-card">
                        <div className="career-nav-icon">✈️</div>
                        <h3>Type Ratings</h3>
                        <p>View and purchase aircraft type ratings</p>
                    </Link>

                    <Link to="/career/flights" className="career-nav-card">
                        <div className="career-nav-icon">📋</div>
                        <h3>Flight Legs</h3>
                        <p>Dispatch and manage your flights</p>
                    </Link>

                    <Link to="/career/pirep/new" className="career-nav-card">
                        <div className="career-nav-icon">📝</div>
                        <h3>File PIREP</h3>
                        <p>Submit a new pilot report</p>
                    </Link>

                    <Link to="/career/history" className="career-nav-card">
                        <div className="career-nav-icon">🗺️</div>
                        <h3>Flight History</h3>
                        <p>View your flight map and history</p>
                    </Link>

                    <Link to="/career/leaderboard" className="career-nav-card">
                        <div className="career-nav-icon">🏆</div>
                        <h3>Leaderboard</h3>
                        <p>Compare with other pilots</p>
                    </Link>

                    {isAdmin && (
                        <Link to="/career/admin" className="career-nav-card career-nav-card-admin">
                            <div className="career-nav-icon">⚙️</div>
                            <h3>Admin Panel</h3>
                            <p>Manage career mode system</p>
                        </Link>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CareerDashboard;
