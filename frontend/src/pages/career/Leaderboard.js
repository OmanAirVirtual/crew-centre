import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FiLogOut, FiMenu, FiTrendingUp, FiClock, FiDollarSign } from 'react-icons/fi';
import './Career.css';

const Leaderboard = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [leaderboard, setLeaderboard] = useState([]);
    const [metric, setMetric] = useState('earnings'); // earnings, hours, flights
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchUser = React.useCallback(async () => {
        try {
            const token = localStorage.getItem('careerToken');
            const res = await axios.get('/api/career/auth/me', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setUser(res.data);
        } catch (err) {
            console.error('Error fetching user:', err);
        }
    }, []);

    const fetchLeaderboard = React.useCallback(async () => {
        try {
            const token = localStorage.getItem('careerToken');
            const res = await axios.get(`/api/career/stats/leaderboard?metric=${metric}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setLeaderboard(res.data.leaderboard);
            setLoading(false);
        } catch (err) {
            console.error('Error fetching leaderboard:', err);
            setError('Failed to load leaderboard');
            setLoading(false);
        }
    }, [metric]);

    useEffect(() => {
        const token = localStorage.getItem('careerToken');
        if (!token) {
            navigate('/career/login');
            return;
        }

        fetchUser();
        fetchLeaderboard();
    }, [navigate, fetchUser, fetchLeaderboard]);

    const handleLogout = () => {
        localStorage.removeItem('careerToken');
        localStorage.removeItem('careerUser');
        navigate('/career/login');
    };

    const getMetricValue = (stats) => {
        if (metric === 'earnings') return `$${stats.totalEarnings?.toLocaleString() || '0'}`;
        if (metric === 'hours') return `${stats.totalFlightTime?.toFixed(1) || '0'} hrs`;
        if (metric === 'flights') return `${stats.totalFlights || '0'} flights`;
        return '0';
    };

    const getRankColor = (index) => {
        if (index === 0) return '#D4AF37'; // Gold
        if (index === 1) return '#C0C0C0'; // Silver
        if (index === 2) return '#CD7F32'; // Bronze
        return '#fff';
    };

    if (loading) {
        return (
            <div className="career-container">
                <div className="career-content" style={{ textAlign: 'center', paddingTop: '5rem' }}>
                    <h2>Loading Leaderboard...</h2>
                </div>
            </div>
        );
    }

    return (
        <div className="career-container">
            {/* Header */}
            <div className="career-header">
                <div className="career-header-left">
                    <button className="career-menu-btn" onClick={() => navigate('/career/dashboard')}>
                        <FiMenu />
                    </button>
                    <h1 className="career-title">Career Mode Leaderboard</h1>
                </div>
                <div className="career-header-right">
                    <div className="career-user-info">
                        <p className="career-user-callsign">{user?.callsign}</p>
                        <p className="career-user-rank">{user?.careerRank}</p>
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

                {/* Metric Selector */}
                <div className="career-card" style={{ marginBottom: '2rem' }}>
                    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                        <button
                            className={`career-btn ${metric === 'earnings' ? 'career-btn-primary' : 'career-btn-secondary'}`}
                            onClick={() => { setMetric('earnings'); setLoading(true); }}
                            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                        >
                            <FiDollarSign /> Top Earners
                        </button>
                        <button
                            className={`career-btn ${metric === 'hours' ? 'career-btn-primary' : 'career-btn-secondary'}`}
                            onClick={() => { setMetric('hours'); setLoading(true); }}
                            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                        >
                            <FiClock /> Most Hours
                        </button>
                        <button
                            className={`career-btn ${metric === 'flights' ? 'career-btn-primary' : 'career-btn-secondary'}`}
                            onClick={() => { setMetric('flights'); setLoading(true); }}
                            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                        >
                            <FiTrendingUp /> Most Flights
                        </button>
                    </div>
                </div>

                {/* Leaderboard Table */}
                <div className="career-card">
                    <div className="career-card-header">
                        <FiTrendingUp className="career-card-icon" />
                        <h2 className="career-card-title">
                            {metric === 'earnings' && 'Top Earners'}
                            {metric === 'hours' && 'Most Flight Hours'}
                            {metric === 'flights' && 'Most Flights Completed'}
                        </h2>
                    </div>

                    {leaderboard.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '3rem', color: 'rgba(255, 255, 255, 0.5)' }}>
                            <p style={{ fontSize: '1.1rem' }}>No data yet. Be the first to complete flights!</p>
                        </div>
                    ) : (
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ borderBottom: '2px solid rgba(139, 47, 47, 0.3)' }}>
                                        <th style={{ padding: '1rem', textAlign: 'left', color: '#D4AF37', width: '60px' }}>Rank</th>
                                        <th style={{ padding: '1rem', textAlign: 'left', color: '#D4AF37' }}>Pilot</th>
                                        <th style={{ padding: '1rem', textAlign: 'left', color: '#D4AF37' }}>Rank</th>
                                        <th style={{ padding: '1rem', textAlign: 'right', color: '#D4AF37' }}>
                                            {metric === 'earnings' && 'Total Earnings'}
                                            {metric === 'hours' && 'Flight Hours'}
                                            {metric === 'flights' && 'Flights'}
                                        </th>
                                        <th style={{ padding: '1rem', textAlign: 'right', color: '#D4AF37' }}>Distance (NM)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {leaderboard.map((entry, index) => (
                                        <tr
                                            key={entry._id}
                                            style={{
                                                borderBottom: '1px solid rgba(139, 47, 47, 0.2)',
                                                background: entry.pilot?._id === user?.id ? 'rgba(212, 175, 55, 0.1)' : 'transparent'
                                            }}
                                        >
                                            <td style={{ padding: '1rem', textAlign: 'center' }}>
                                                <div style={{
                                                    fontSize: '1.5rem',
                                                    fontWeight: 'bold',
                                                    color: getRankColor(index)
                                                }}>
                                                    {index === 0 && '🥇'}
                                                    {index === 1 && '🥈'}
                                                    {index === 2 && '🥉'}
                                                    {index > 2 && `#${index + 1}`}
                                                </div>
                                            </td>
                                            <td style={{ padding: '1rem' }}>
                                                <div>
                                                    <div style={{
                                                        color: entry.pilot?._id === user?.id ? '#D4AF37' : '#fff',
                                                        fontWeight: entry.pilot?._id === user?.id ? 'bold' : '600',
                                                        fontSize: '1.05rem'
                                                    }}>
                                                        {entry.pilot?.callsign || 'Unknown'}
                                                        {entry.pilot?._id === user?.id && ' (You)'}
                                                    </div>
                                                    <div style={{
                                                        color: 'rgba(255, 255, 255, 0.6)',
                                                        fontSize: '0.85rem',
                                                        marginTop: '0.2rem'
                                                    }}>
                                                        {entry.pilot?.firstName} {entry.pilot?.lastName}
                                                    </div>
                                                </div>
                                            </td>
                                            <td style={{ padding: '1rem', color: 'rgba(255, 255, 255, 0.8)' }}>
                                                {entry.pilot?.careerRank || 'N/A'}
                                            </td>
                                            <td style={{
                                                padding: '1rem',
                                                textAlign: 'right',
                                                fontSize: '1.1rem',
                                                fontWeight: '600',
                                                color: '#D4AF37'
                                            }}>
                                                {getMetricValue(entry)}
                                            </td>
                                            <td style={{
                                                padding: '1rem',
                                                textAlign: 'right',
                                                color: 'rgba(255, 255, 255, 0.7)'
                                            }}>
                                                {entry.totalDistance?.toLocaleString() || '0'} NM
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Your Stats */}
                {user && (
                    <div className="career-card" style={{ marginTop: '2rem', background: 'rgba(212, 175, 55, 0.05)', borderColor: 'rgba(212, 175, 55, 0.3)' }}>
                        <h3 style={{ marginBottom: '1rem', color: '#D4AF37', fontSize: '1.2rem' }}>
                            Your Stats
                        </h3>
                        <div className="career-stats-grid">
                            <div className="career-stat-box">
                                <div className="career-stat-value">${user.careerEarnings?.toLocaleString() || '0'}</div>
                                <div className="career-stat-label">Total Earnings</div>
                            </div>
                            <div className="career-stat-box">
                                <div className="career-stat-value">{user.careerTotalTime?.toFixed(1) || '0'}</div>
                                <div className="career-stat-label">Flight Hours</div>
                            </div>
                            <div className="career-stat-box">
                                <div className="career-stat-value">{user.careerTotalDistance?.toLocaleString() || '0'}</div>
                                <div className="career-stat-label">Distance (NM)</div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Leaderboard;
