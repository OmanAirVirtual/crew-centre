import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FiLogOut, FiMenu } from 'react-icons/fi';
import './Career.css';

const FlightLegs = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [flights, setFlights] = useState([]);
    const [activeFamily, setActiveFamily] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const token = localStorage.getItem('careerToken');
        if (!token) {
            navigate('/career/login');
            return;
        }

        fetchUser();
        fetchFlights();
    }, [navigate]);

    const fetchUser = async () => {
        try {
            const token = localStorage.getItem('careerToken');
            const res = await axios.get('/api/career/auth/me', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setUser(res.data);
        } catch (err) {
            console.error('Error fetching user:', err);
        }
    };

    const fetchFlights = async () => {
        try {
            const token = localStorage.getItem('careerToken');
            const res = await axios.get('/api/career/flights', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setFlights(res.data.flights);
            setActiveFamily(res.data.activeFamily);
            setLoading(false);
        } catch (err) {
            console.error('Error fetching flights:', err);
            setError('Failed to load flights');
            setLoading(false);
        }
    };

    const handleDispatch = async (flightId) => {
        try {
            const token = localStorage.getItem('careerToken');
            await axios.post(`/api/career/flights/${flightId}/dispatch`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert('Flight dispatched successfully!');
            fetchFlights();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to dispatch flight');
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
                    <h2>Loading Flights...</h2>
                </div>
            </div>
        );
    }

    const totalDistance = flights.filter(f => f.status === 'COMPLETED').reduce((sum, f) => sum + f.distance, 0);
    const totalTime = flights.filter(f => f.status === 'COMPLETED').reduce((sum, f) => sum + (f.estimatedFlightTime || 0), 0);

    return (
        <div className="career-container">
            {/* Header */}
            <div className="career-header">
                <div className="career-header-left">
                    <button className="career-menu-btn" onClick={() => navigate('/career/dashboard')}>
                        <FiMenu />
                    </button>
                    <h1 className="career-title">Flight Legs</h1>
                </div>
                <div className="career-header-right">
                    <div className="career-user-info">
                        <p className="career-user-callsign">{user?.callsign}</p>
                        <p className="career-user-rank">{activeFamily || 'No active family'}</p>
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

                {!activeFamily && (
                    <div className="career-alert career-alert-warning">
                        You don't have an active aircraft family. Please go to Type Ratings and activate a family first.
                    </div>
                )}

                {/* Flights List */}
                <div style={{ marginBottom: '2rem' }}>
                    {flights.map((flight, index) => (
                        <div key={flight._id} className="career-card" style={{ marginBottom: '1rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                                <div>
                                    <h4 style={{ margin: 0, color: 'rgba(255, 255, 255, 0.5)', fontSize: '0.85rem' }}>
                                        {flight.legIdentifier}
                                    </h4>
                                    <h3 style={{ margin: '0.3rem 0', fontSize: '1.3rem', color: '#fff' }}>
                                        {flight.flightNumber} • {flight.origin} → {flight.destination}
                                    </h3>
                                    <p style={{ margin: 0, fontSize: '0.9rem', color: 'rgba(255, 255, 255, 0.6)' }}>
                                        {flight.distance} NM • {flight.estimatedFlightTime?.toFixed(2)} hrs flight time
                                    </p>
                                </div>
                                <span className={`career-badge ${flight.status === 'COMPLETED' ? 'badge-completed' :
                                        flight.status === 'DISPATCHED' ? 'badge-dispatched' :
                                            flight.status === 'AVAILABLE' ? 'badge-ready' :
                                                'badge-locked'
                                    }`}>
                                    {flight.status}
                                </span>
                            </div>

                            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                                {flight.status === 'AVAILABLE' && (
                                    <button
                                        className="career-btn career-btn-primary"
                                        onClick={() => handleDispatch(flight._id)}
                                    >
                                        📤 Dispatch Flight
                                    </button>
                                )}

                                {flight.status === 'DISPATCHED' && flight.assignedPilot?._id === user?.id && (
                                    <button
                                        className="career-btn career-btn-success"
                                        onClick={() => navigate(`/career/pirep/new?flightId=${flight._id}`)}
                                    >
                                        📝 File PIREP
                                    </button>
                                )}

                                {flight.status === 'COMPLETED' && (
                                    <button className="career-btn career-btn-success" disabled>
                                        ✅ Completed
                                    </button>
                                )}

                                {flight.status === 'LOCKED' && (
                                    <button className="career-btn career-btn-secondary" disabled>
                                        🔒 Locked
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Stats Panel */}
                {flights.length > 0 && (
                    <div className="career-card" style={{ background: 'rgba(0, 0, 0, 0.5)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-around', textAlign: 'center' }}>
                            <div>
                                <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#D4AF37' }}>Total Distance</div>
                                <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#fff', marginTop: '0.5rem' }}>
                                    {totalDistance} NM
                                </div>
                            </div>
                            <div>
                                <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#D4AF37' }}>Total Time</div>
                                <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#fff', marginTop: '0.5rem' }}>
                                    {totalTime.toFixed(2)} hrs
                                </div>
                            </div>
                            <div>
                                <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#D4AF37' }}>Aircraft</div>
                                <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#fff', marginTop: '0.5rem' }}>
                                    {flights[0]?.aircraftType || 'N/A'}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default FlightLegs;
