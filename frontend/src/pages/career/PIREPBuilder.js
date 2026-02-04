import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { FiLogOut, FiMenu } from 'react-icons/fi';
import './Career.css';

const PIREPBuilder = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const flightIdParam = queryParams.get('flightId');

    const [user, setUser] = useState(null);
    const [flight, setFlight] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Form fields
    const [formData, setFormData] = useState({
        pilotRank: 'First Officer',
        flightDate: new Date().toISOString().split('T')[0],
        flightTimeHours: 0,
        flightTimeMinutes: 0,
        totalFuelKg: 0,
        usedFuelKg: 0,
        cargoKg: 0,
        passengers: 0,
        tailNumber: '',
        notes: '',
    });

    const [earnings, setEarnings] = useState(null);

    useEffect(() => {
        const token = localStorage.getItem('careerToken');
        if (!token) {
            navigate('/career/login');
            return;
        }

        fetchUser();
        if (flightIdParam) {
            fetchFlight(flightIdParam);
        } else {
            setLoading(false);
        }
    }, [navigate, flightIdParam]);

    const fetchUser = async () => {
        try {
            const token = localStorage.getItem('careerToken');
            const res = await axios.get('/api/career/auth/me', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setUser(res.data);
            setFormData(prev => ({ ...prev, pilotRank: res.data.careerRank || 'First Officer' }));
        } catch (err) {
            console.error('Error fetching user:', err);
        }
    };

    const fetchFlight = async (flightId) => {
        try {
            const token = localStorage.getItem('careerToken');
            const res = await axios.get('/api/career/flights', {
                headers: { Authorization: `Bearer ${token}` }
            });
            const foundFlight = res.data.flights.find(f => f._id === flightId);
            if (foundFlight) {
                setFlight(foundFlight);
                setFormData(prev => ({
                    ...prev,
                    flightTimeHours: Math.floor(foundFlight.estimatedFlightTime || 0),
                    flightTimeMinutes: Math.round(((foundFlight.estimatedFlightTime || 0) % 1) * 60),
                }));
            }
            setLoading(false);
        } catch (err) {
            console.error('Error fetching flight:', err);
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!flight) {
            alert('Please select a dispatched flight first');
            return;
        }

        try {
            const token = localStorage.getItem('careerToken');
            const res = await axios.post('/api/career/pireps', {
                flightId: flight._id,
                ...formData,
                aircraftType: flight.aircraftType,
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setEarnings(res.data.earnings);
            alert('PIREP filed successfully! Awaiting admin approval.');
            navigate('/career/flights');
        } catch (err) {
            console.error('Error filing PIREP:', err);
            alert(err.response?.data?.message || 'Failed to file PIREP');
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('careerToken');
        localStorage.removeItem('careerUser');
        navigate('/career/login');
    };

    const calculatePreview = () => {
        const hours = Number(formData.flightTimeHours) || 0;
        const minutes = Number(formData.flightTimeMinutes) || 0;
        const totalHours = hours + minutes / 60;

        // Simplified calculation for preview
        const baseRate = 100; // Placeholder
        const multiplier = 1.0;
        const flightEarnings = baseRate * totalHours * multiplier;
        const payloadBonus = (Number(formData.passengers) || 0) * 1 + (Number(formData.cargoKg) || 0) * 0.1;
        const grossEarnings = flightEarnings + payloadBonus;
        const deductions = grossEarnings * 0.15;
        const grandTotal = grossEarnings - deductions;

        return {
            flightEarnings: flightEarnings.toFixed(2),
            payloadBonus: payloadBonus.toFixed(2),
            grossEarnings: grossEarnings.toFixed(2),
            deductions: deductions.toFixed(2),
            grandTotal: grandTotal.toFixed(2),
        };
    };

    const preview = calculatePreview();

    if (loading) {
        return (
            <div className="career-container">
                <div className="career-content" style={{ textAlign: 'center', paddingTop: '5rem' }}>
                    <h2>Loading...</h2>
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
                    <h1 className="career-title">PIREP Builder</h1>
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

                {!flight && (
                    <div className="career-alert career-alert-warning">
                        No flight selected. Please dispatch a flight from the Flight Legs page first.
                    </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                    {/* Left Panel: Form */}
                    <div className="career-card">
                        <h2 style={{ marginBottom: '1.5rem', color: '#fff' }}>Flight Details</h2>

                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div className="career-form-group">
                                <label>Pilot Callsign</label>
                                <input type="text" value={user?.callsign || ''} disabled />
                            </div>

                            <div className="career-form-group">
                                <label>Rank</label>
                                <select name="pilotRank" value={formData.pilotRank} onChange={handleChange}>
                                    <option>Cadet</option>
                                    <option>First Officer</option>
                                    <option>Senior FO</option>
                                    <option>Captain</option>
                                </select>
                            </div>

                            <div className="career-form-group">
                                <label>Date</label>
                                <input type="date" name="flightDate" value={formData.flightDate} onChange={handleChange} />
                            </div>

                            <div className="career-form-group">
                                <label>Flight Number</label>
                                <input type="text" value={flight?.flightNumber || ''} disabled />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div className="career-form-group">
                                    <label>Departure (ICAO)</label>
                                    <input type="text" value={flight?.origin || ''} disabled />
                                </div>
                                <div className="career-form-group">
                                    <label>Arrival (ICAO)</label>
                                    <input type="text" value={flight?.destination || ''} disabled />
                                </div>
                            </div>

                            <div className="career-form-group">
                                <label>Aircraft</label>
                                <input type="text" value={flight?.aircraftType || ''} disabled />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div className="career-form-group">
                                    <label>Flight Time (Hours)</label>
                                    <input type="number" name="flightTimeHours" value={formData.flightTimeHours} onChange={handleChange} min="0" />
                                </div>
                                <div className="career-form-group">
                                    <label>Flight Time (Minutes)</label>
                                    <input type="number" name="flightTimeMinutes" value={formData.flightTimeMinutes} onChange={handleChange} min="0" max="59" />
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div className="career-form-group">
                                    <label>Total Fuel (Kg)</label>
                                    <input type="number" name="totalFuelKg" value={formData.totalFuelKg} onChange={handleChange} min="0" />
                                </div>
                                <div className="career-form-group">
                                    <label>Used Fuel (Kg)</label>
                                    <input type="number" name="usedFuelKg" value={formData.usedFuelKg} onChange={handleChange} min="0" />
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div className="career-form-group">
                                    <label>Cargo (Kg)</label>
                                    <input type="number" name="cargoKg" value={formData.cargoKg} onChange={handleChange} min="0" />
                                </div>
                                <div className="career-form-group">
                                    <label>Passengers (PAX)</label>
                                    <input type="number" name="passengers" value={formData.passengers} onChange={handleChange} min="0" />
                                </div>
                            </div>

                            <div className="career-form-group">
                                <label>Notes</label>
                                <textarea
                                    name="notes"
                                    value={formData.notes}
                                    onChange={handleChange}
                                    rows="3"
                                    placeholder="Smooth climb. Light crosswind on final. No violations."
                                    style={{ resize: 'vertical' }}
                                />
                            </div>

                            <button type="submit" className="career-btn career-btn-primary" disabled={!flight}>
                                Generate / Submit
                            </button>
                        </form>
                    </div>

                    {/* Right Panel: Receipt Preview */}
                    <div className="career-card" style={{ background: 'rgba(245, 245, 245, 0.98)', color: '#000' }}>
                        <div style={{ borderBottom: '2px solid #000', paddingBottom: '1rem', marginBottom: '1rem' }}>
                            <h4 style={{ margin: 0, color: '#8B2F2F' }}>Oman Air Virtual</h4>
                            <h3 style={{ margin: '0.3rem 0', color: '#000' }}>Career Mode Receipt</h3>
                            <p style={{ margin: 0, fontSize: '0.85rem', color: '#666' }}>Receipt #: OAV-0000</p>
                        </div>

                        <div style={{ marginBottom: '1.5rem' }}>
                            <h4 style={{ color: '#8B2F2F', marginBottom: '0.75rem' }}>FLIGHT SUMMARY</h4>
                            <div style={{ fontSize: '0.9rem', lineHeight: '1.8', color: '#333' }}>
                                <div><strong>Pilot:</strong> {user?.callsign} • {formData.pilotRank}</div>
                                <div><strong>Flight No.</strong> {flight?.flightNumber || '—'}</div>
                                <div><strong>From → To:</strong> {flight?.origin || '—'} → {flight?.destination || '—'}</div>
                                <div><strong>Aircraft:</strong> {flight?.aircraftType || '—'}</div>
                            </div>
                        </div>

                        <div style={{ marginBottom: '1.5rem' }}>
                            <h4 style={{ color: '#8B2F2F', marginBottom: '0.75rem' }}>PERFORMANCE</h4>
                            <div style={{ fontSize: '0.9rem', lineHeight: '1.8', color: '#333' }}>
                                <div><strong>Flight Time:</strong> {formData.flightTimeHours}h {formData.flightTimeMinutes}m</div>
                                <div><strong>Passengers:</strong> {formData.passengers}</div>
                                <div><strong>Cargo:</strong> {formData.cargoKg} kg</div>
                                <div><strong>Fuel Used:</strong> {formData.usedFuelKg} kg</div>
                            </div>
                        </div>

                        <div style={{ marginBottom: '1.5rem' }}>
                            <h4 style={{ color: '#8B2F2F', marginBottom: '0.75rem' }}>EARNINGS</h4>
                            <div style={{ fontSize: '0.9rem', lineHeight: '2', color: '#333' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span>Base Rate ($/hr):</span>
                                    <span>$0</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span>Multiplier:</span>
                                    <span>×1.00</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span>Flight Earnings:</span>
                                    <span>${preview.flightEarnings}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span>Payload Bonus:</span>
                                    <span>${preview.payloadBonus}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '0.5rem', borderTop: '1px solid #ccc' }}>
                                    <span>Deductions (15% Tax):</span>
                                    <span>${preview.deductions}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '0.75rem', marginTop: '0.75rem', borderTop: '2px solid #000', fontWeight: 'bold', fontSize: '1.1rem' }}>
                                    <span>Grand Total:</span>
                                    <span style={{ color: '#8B2F2F' }}>${preview.grandTotal}</span>
                                </div>
                            </div>
                        </div>

                        <div style={{ textAlign: 'center', paddingTop: '1rem', borderTop: '1px dashed #999' }}>
                            <p style={{ fontSize: '0.75rem', color: '#666', margin: 0 }}>
                                Generated on client side • Logged securely in the OAV database
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PIREPBuilder;
