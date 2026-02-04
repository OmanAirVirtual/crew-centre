import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { MapContainer, TileLayer, Polyline } from 'react-leaflet';
import { FiLogOut, FiMenu } from 'react-icons/fi';
import 'leaflet/dist/leaflet.css';
import './Career.css';
import { airportCoords } from './airportData';

const FlightHistory = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [routeHistory, setRouteHistory] = useState([]);
    const [timeFilter, setTimeFilter] = useState('all');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const token = localStorage.getItem('careerToken');
        if (!token) {
            navigate('/career/login');
            return;
        }

        fetchUser();
        fetchHistory();
    }, [navigate, timeFilter]);

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

    const fetchHistory = async () => {
        try {
            const token = localStorage.getItem('careerToken');
            const res = await axios.get(`/api/career/stats/history?filter=${timeFilter}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setRouteHistory(res.data.routeHistory || []);
            setLoading(false);
        } catch (err) {
            console.error('Error fetching history:', err);
            setError('Failed to load flight history');
            setLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('careerToken');
        localStorage.removeItem('careerUser');
        navigate('/career/login');
    };

    // Get coordinates from the extensive database
    const getAirportCoords = (icao) => {
        return airportCoords[icao] || [25.0, 55.0]; // Default to Dubai region if not found
    };

    const getRouteColor = (count) => {
        if (count >= 3) return '#D4AF37'; // Gold for many flights
        if (count >= 2) return '#f472b6'; // Pink for multiple
        return '#22d3ee'; // Cyan for single
    };

    if (loading) {
        return (
            <div className="career-container">
                <div className="career-content" style={{ textAlign: 'center', paddingTop: '5rem' }}>
                    <h2>Loading Flight History...</h2>
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
                    <h1 className="career-title">Your Flight History</h1>
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

                <div className="career-card">
                    <div style={{ marginBottom: '1rem', display: 'flex', gap: '1rem', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h2 style={{ margin: 0, color: '#fff' }}>Flight Routes Map</h2>
                        <div style={{ display: 'flex', gap: '0.75rem' }}>
                            <button
                                className={`career-btn ${timeFilter === 'all' ? 'career-btn-primary' : 'career-btn-secondary'}`}
                                style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
                                onClick={() => setTimeFilter('all')}
                            >
                                All Time
                            </button>
                            <button
                                className={`career-btn ${timeFilter === '30days' ? 'career-btn-primary' : 'career-btn-secondary'}`}
                                style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
                                onClick={() => setTimeFilter('30days')}
                            >
                                Last 30 Days
                            </button>
                            <button
                                className={`career-btn ${timeFilter === '7days' ? 'career-btn-primary' : 'career-btn-secondary'}`}
                                style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
                                onClick={() => setTimeFilter('7days')}
                            >
                                Last 7 Days
                            </button>
                        </div>
                    </div>

                    <div style={{ height: '600px', borderRadius: '12px', overflow: 'hidden', border: '2px solid rgba(139, 47, 47, 0.3)' }}>
                        <MapContainer
                            center={[25, 55]}
                            zoom={4}
                            style={{ height: '100%', width: '100%', background: '#1a1a1a' }}
                        >
                            <TileLayer
                                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
                            />

                            {routeHistory.map((route, idx) => {
                                const originCoords = getAirportCoords(route.origin);
                                const destCoords = getAirportCoords(route.destination);
                                const color = getRouteColor(route.count);

                                return (
                                    <Polyline
                                        key={idx}
                                        positions={[originCoords, destCoords]}
                                        pathOptions={{
                                            color: color,
                                            weight: 3,
                                            opacity: 0.8,
                                        }}
                                    />
                                );
                            })}
                        </MapContainer>
                    </div>

                    {/* Legend */}
                    <div style={{ marginTop: '1rem', display: 'flex', gap: '2rem', justifyContent: 'center', fontSize: '0.85rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <div style={{ width: '30px', height: '3px', background: '#22d3ee', borderRadius: '2px' }}></div>
                            <span style={{ color: 'rgba(255, 255, 255, 0.7)' }}>1 flight</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <div style={{ width: '30px', height: '3px', background: '#f472b6', borderRadius: '2px' }}></div>
                            <span style={{ color: 'rgba(255, 255, 255, 0.7)' }}>Many flights</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <div style={{ width: '30px', height: '3px', background: '#D4AF37', borderRadius: '2px' }}></div>
                            <span style={{ color: 'rgba(255, 255, 255, 0.7)' }}>Frequent route</span>
                        </div>
                    </div>
                </div>

                {/* Route List */}
                {routeHistory.length > 0 && (
                    <div className="career-card">
                        <h3 style={{ marginBottom: '1rem', color: '#fff' }}>Routes Flown</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1rem' }}>
                            {routeHistory.map((route, idx) => (
                                <div key={idx} style={{
                                    background: 'rgba(0, 0, 0, 0.3)',
                                    padding: '1rem',
                                    borderRadius: '8px',
                                    border: '1px solid rgba(139, 47, 47, 0.3)',
                                }}>
                                    <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#D4AF37', marginBottom: '0.5rem' }}>
                                        {route.origin} → {route.destination}
                                    </div>
                                    <div style={{ fontSize: '0.9rem', color: 'rgba(255, 255, 255, 0.7)' }}>
                                        Flights: {route.count}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {routeHistory.length === 0 && (
                    <div className="career-card" style={{ textAlign: 'center', padding: '3rem' }}>
                        <p style={{ fontSize: '1.1rem', color: 'rgba(255, 255, 255, 0.5)' }}>
                            No flight history yet. Complete some flights to see them here!
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default FlightHistory;
