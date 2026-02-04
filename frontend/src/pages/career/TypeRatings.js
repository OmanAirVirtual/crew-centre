import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FiLogOut, FiMenu } from 'react-icons/fi';
import './Career.css';

const TypeRatings = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [typeRatings, setTypeRatings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const token = localStorage.getItem('careerToken');
        if (!token) {
            navigate('/career/login');
            return;
        }

        fetchUser();
        fetchTypeRatings();
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

    const fetchTypeRatings = async () => {
        try {
            const token = localStorage.getItem('careerToken');
            const res = await axios.get('/api/career/type-ratings', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setTypeRatings(res.data.typeRatings);
            setLoading(false);
        } catch (err) {
            console.error('Error fetching type ratings:', err);
            setError('Failed to load type ratings');
            setLoading(false);
        }
    };

    const handlePurchase = async (typeRatingId) => {
        if (!window.confirm('This will deduct the purchase price from your earnings. Continue?')) {
            return;
        }

        try {
            const token = localStorage.getItem('careerToken');
            await axios.post(`/api/career/type-ratings/${typeRatingId}/purchase`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert('Type rating purchased successfully!');
            fetchTypeRatings();
            fetchUser();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to purchase type rating');
        }
    };

    const handleActivate = async (typeRatingId) => {
        if (!window.confirm('Switching aircraft family will affect which flights you can dispatch. Continue?')) {
            return;
        }

        try {
            const token = localStorage.getItem('careerToken');
            const res = await axios.post(`/api/career/type-ratings/${typeRatingId}/activate`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert(res.data.message);
            fetchTypeRatings();
            fetchUser();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to activate type rating');
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
                    <h2>Loading Type Ratings...</h2>
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
                    <h1 className="career-title">Type Ratings Available</h1>
                </div>
                <div className="career-header-right">
                    <div className="career-user-info">
                        <p className="career-user-callsign">{user?.callsign}</p>
                        <p className="career-user-rank">Balance: ${user?.careerEarnings?.toLocaleString() || '0'}</p>
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

                {user?.careerActiveFamily && (
                    <div className="career-card">
                        <p style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                            Current Active Family: <strong style={{ color: '#D4AF37' }}>{user.careerActiveFamily}</strong>
                        </p>
                    </div>
                )}

                <div className="career-grid">
                    {typeRatings.map((rating) => (
                        <div key={rating._id} className="career-card type-rating-card">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                                <h3 style={{ fontSize: '1.3rem', color: '#fff', margin: 0 }}>
                                    {rating.typeName} Type Rating
                                </h3>
                                <span className={`career-badge ${rating.status === 'OWNED' ? 'badge-owned' :
                                    rating.status === 'LOCKED' ? 'badge-locked' :
                                        'badge-available'
                                    }`}>
                                    {rating.status}
                                </span>
                            </div>

                            <div style={{ marginBottom: '1rem' }}>
                                <h4 style={{ fontSize: '1.8rem', color: '#D4AF37', margin: '0.5rem 0' }}>
                                    ${rating.purchasePrice?.toLocaleString()}
                                </h4>
                                <p style={{ fontSize: '0.9rem', color: 'rgba(255, 255, 255, 0.6)', margin: 0 }}>
                                    {rating.typeName}
                                </p>
                                <p style={{ fontSize: '0.85rem', color: 'rgba(255, 255, 255, 0.5)', margin: '0.3rem 0' }}>
                                    Seats: {rating.seats} • Multiplier: {rating.multiplier}×
                                </p>
                                <p style={{ fontSize: '0.85rem', color: 'rgba(255, 255, 255, 0.5)', margin: 0 }}>
                                    {rating.description}
                                </p>
                            </div>

                            {rating.status === 'OWNED' && rating.isActive && (
                                <button className="career-btn career-btn-success" style={{ width: '100%' }} disabled>
                                    Currently Active
                                </button>
                            )}

                            {rating.status === 'OWNED' && !rating.isActive && (
                                <button
                                    className="career-btn career-btn-primary"
                                    style={{ width: '100%' }}
                                    onClick={() => handleActivate(rating._id)}
                                >
                                    Request Family Switch
                                </button>
                            )}

                            {rating.status === 'AVAILABLE' && (
                                <button
                                    className="career-btn career-btn-primary"
                                    style={{ width: '100%' }}
                                    onClick={() => handlePurchase(rating._id)}
                                >
                                    Purchase Type Rating
                                </button>
                            )}

                            {rating.status === 'LOCKED' && (
                                <>
                                    <p style={{ fontSize: '0.85rem', color: '#fde047', margin: '0.5rem 0' }}>
                                        ⚠️ Rank Required: {rating.rankRequired}
                                    </p>
                                    <button className="career-btn career-btn-secondary" style={{ width: '100%' }} disabled>
                                        Locked
                                    </button>
                                </>
                            )}

                            {rating.status === 'OWNED' && !rating.isActive && (
                                <p style={{ fontSize: '0.8rem', color: '#fde047', marginTop: '0.75rem' }}>
                                    ⚠️ Purchasing this will lock your current aircraft family
                                </p>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default TypeRatings;
