import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FiLogOut, FiMenu, FiCheck, FiX } from 'react-icons/fi';
import './Career.css';

const CareerAdmin = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [users, setUsers] = useState([]);
    const [pendingPireps, setPendingPireps] = useState([]);
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState('users'); // users, pireps, analytics

    const fetchUser = React.useCallback(async () => {
        try {
            const token = localStorage.getItem('careerToken');
            const res = await axios.get('/api/career/auth/me', {
                headers: { Authorization: `Bearer ${token}` }
            });

            // Check if user has admin role
            const adminRoles = ['CEO', 'CAO', 'CMO', 'CFI', 'Chief Pilot', 'Crew Centre Manager'];
            if (!adminRoles.includes(res.data.role)) {
                alert('Unauthorized: Admin access required');
                navigate('/career/dashboard');
                return;
            }

            setUser(res.data);
        } catch (err) {
            console.error('Error fetching user:', err);
            navigate('/career/dashboard');
        }
    }, [navigate]);

    const fetchData = React.useCallback(async () => {
        try {
            const token = localStorage.getItem('careerToken');

            if (activeTab === 'users') {
                const res = await axios.get('/api/career/admin/users', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setUsers(res.data.users);
            } else if (activeTab === 'pireps') {
                const res = await axios.get('/api/career/admin/pending-pireps', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setPendingPireps(res.data.pireps);
            } else if (activeTab === 'analytics') {
                const res = await axios.get('/api/career/admin/analytics', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setAnalytics(res.data.analytics);
            }

            setLoading(false);
        } catch (err) {
            console.error('Error fetching data:', err);
            setError('Failed to load admin data');
            setLoading(false);
        }
    }, [activeTab]);

    useEffect(() => {
        const token = localStorage.getItem('careerToken');
        if (!token) {
            navigate('/career/login');
            return;
        }

        fetchUser();
        fetchData();
    }, [navigate, activeTab, fetchUser, fetchData]);

    const handleApproveUser = async (userId) => {
        try {
            const token = localStorage.getItem('careerToken');
            await axios.post(`/api/career/admin/users/${userId}/approve`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert('User approved for career mode');
            fetchData();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to approve user');
        }
    };

    const handleDenyUser = async (userId) => {
        if (!window.confirm('Revoke career mode access for this user?')) return;

        try {
            const token = localStorage.getItem('careerToken');
            await axios.post(`/api/career/admin/users/${userId}/deny`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert('Career mode access revoked');
            fetchData();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to deny user');
        }
    };

    const handleApprovePirep = async (pirepId) => {
        const notes = window.prompt('Add review notes (optional):');

        try {
            const token = localStorage.getItem('careerToken');
            await axios.post(`/api/career/pireps/${pirepId}/approve`, { notes }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert('PIREP approved');
            fetchData();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to approve PIREP');
        }
    };

    const handleRejectPirep = async (pirepId) => {
        const notes = window.prompt('Reason for rejection:');
        if (!notes) return;

        try {
            const token = localStorage.getItem('careerToken');
            await axios.post(`/api/career/pireps/${pirepId}/reject`, { notes }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert('PIREP rejected');
            fetchData();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to reject PIREP');
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
                    <h2>Loading Admin Panel...</h2>
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
                    <h1 className="career-title">Career Mode - Admin Panel</h1>
                </div>
                <div className="career-header-right">
                    <div className="career-user-info">
                        <p className="career-user-callsign">{user?.callsign}</p>
                        <p className="career-user-rank">{user?.role}</p>
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

                {/* Tabs */}
                <div className="career-card" style={{ padding: '0' }}>
                    <div style={{ display: 'flex', borderBottom: '1px solid rgba(139, 47, 47, 0.3)' }}>
                        <button
                            onClick={() => { setActiveTab('users'); setLoading(true); }}
                            style={{
                                flex: 1,
                                padding: '1rem',
                                background: activeTab === 'users' ? 'rgba(139, 47, 47, 0.3)' : 'transparent',
                                border: 'none',
                                color: activeTab === 'users' ? '#D4AF37' : 'rgba(255, 255, 255, 0.7)',
                                fontSize: '1rem',
                                fontWeight: activeTab === 'users' ? '600' : '400',
                                cursor: 'pointer',
                                transition: 'all 0.3s ease',
                            }}
                        >
                            User Approval
                        </button>
                        <button
                            onClick={() => { setActiveTab('pireps'); setLoading(true); }}
                            style={{
                                flex: 1,
                                padding: '1rem',
                                background: activeTab === 'pireps' ? 'rgba(139, 47, 47, 0.3)' : 'transparent',
                                border: 'none',
                                color: activeTab === 'pireps' ? '#D4AF37' : 'rgba(255, 255, 255, 0.7)',
                                fontSize: '1rem',
                                fontWeight: activeTab === 'pireps' ? '600' : '400',
                                cursor: 'pointer',
                                transition: 'all 0.3s ease',
                            }}
                        >
                            Pending PIREPs
                        </button>
                        <button
                            onClick={() => { setActiveTab('analytics'); setLoading(true); }}
                            style={{
                                flex: 1,
                                padding: '1rem',
                                background: activeTab === 'analytics' ? 'rgba(139, 47, 47, 0.3)' : 'transparent',
                                border: 'none',
                                color: activeTab === 'analytics' ? '#D4AF37' : 'rgba(255, 255, 255, 0.7)',
                                fontSize: '1rem',
                                fontWeight: activeTab === 'analytics' ? '600' : '400',
                                cursor: 'pointer',
                                transition: 'all 0.3s ease',
                            }}
                        >
                            Analytics
                        </button>
                    </div>
                </div>

                {/* User Approval Tab */}
                {activeTab === 'users' && (
                    <div className="career-card">
                        <h2 style={{ marginBottom: '1.5rem', color: '#fff' }}>User Approval Management</h2>
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ borderBottom: '2px solid rgba(139, 47, 47, 0.3)' }}>
                                        <th style={{ padding: '0.75rem', textAlign: 'left', color: '#D4AF37' }}>Callsign</th>
                                        <th style={{ padding: '0.75rem', textAlign: 'left', color: '#D4AF37' }}>Name</th>
                                        <th style={{ padding: '0.75rem', textAlign: 'left', color: '#D4AF37' }}>Role</th>
                                        <th style={{ padding: '0.75rem', textAlign: 'center', color: '#D4AF37' }}>Status</th>
                                        <th style={{ padding: '0.75rem', textAlign: 'center', color: '#D4AF37' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.map(u => (
                                        <tr key={u._id} style={{ borderBottom: '1px solid rgba(139, 47, 47, 0.2)' }}>
                                            <td style={{ padding: '0.75rem', color: '#fff' }}>{u.callsign || 'N/A'}</td>
                                            <td style={{ padding: '0.75rem', color: 'rgba(255, 255, 255, 0.8)' }}>
                                                {u.firstName} {u.lastName}
                                            </td>
                                            <td style={{ padding: '0.75rem', color: 'rgba(255, 255, 255, 0.7)' }}>{u.role}</td>
                                            <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                                                <span className={`career-badge ${u.careerModeApproved ? 'badge-approved' : 'badge-pending'}`}>
                                                    {u.careerModeApproved ? 'Approved' : 'Pending'}
                                                </span>
                                            </td>
                                            <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                                                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                                                    {!u.careerModeApproved && (
                                                        <button
                                                            onClick={() => handleApproveUser(u._id)}
                                                            className="career-btn career-btn-success"
                                                            style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
                                                        >
                                                            <FiCheck /> Approve
                                                        </button>
                                                    )}
                                                    {u.careerModeApproved && (
                                                        <button
                                                            onClick={() => handleDenyUser(u._id)}
                                                            className="career-btn career-btn-danger"
                                                            style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
                                                        >
                                                            <FiX /> Revoke
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Pending PIREPs Tab */}
                {activeTab === 'pireps' && (
                    <div>
                        {pendingPireps.length === 0 ? (
                            <div className="career-card" style={{ textAlign: 'center', padding: '3rem' }}>
                                <p style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '1.1rem' }}>
                                    No pending PIREPs to review
                                </p>
                            </div>
                        ) : (
                            pendingPireps.map(pirep => (
                                <div key={pirep._id} className="career-card" style={{ marginBottom: '1rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                                        <div>
                                            <h3 style={{ margin: 0, color: '#fff' }}>
                                                {pirep.flightNumber} • {pirep.origin} → {pirep.destination}
                                            </h3>
                                            <p style={{ margin: '0.5rem 0 0 0', color: 'rgba(255, 255, 255, 0.7)' }}>
                                                Pilot: {pirep.pilot?.callsign} • {pirep.flightTimeHours}h {pirep.flightTimeMinutes}m
                                            </p>
                                        </div>
                                        <span className="career-badge badge-pending">Pending</span>
                                    </div>
                                    <div style={{ padding: '1rem', background: 'rgba(0, 0, 0, 0.3)', borderRadius: '8px', marginBottom: '1rem' }}>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', color: 'rgba(255, 255, 255, 0.8)', fontSize: '0.9rem' }}>
                                            <div><strong>Aircraft:</strong> {pirep.aircraftType}</div>
                                            <div><strong>Passengers:</strong> {pirep.passengers}</div>
                                            <div><strong>Cargo:</strong> {pirep.cargoKg} kg</div>
                                            <div><strong>Fuel Used:</strong> {pirep.usedFuelKg} kg</div>
                                            <div><strong>Earnings:</strong> ${pirep.grandTotal?.toFixed(2)}</div>
                                            <div><strong>Date:</strong> {new Date(pirep.flightDate).toLocaleDateString()}</div>
                                        </div>
                                        {pirep.notes && (
                                            <div style={{ marginTop: '1rem', padding: '0.75rem', background: 'rgba(0, 0, 0, 0.3)', borderRadius: '6px' }}>
                                                <strong>Notes:</strong> {pirep.notes}
                                            </div>
                                        )}
                                    </div>
                                    <div style={{ display: 'flex', gap: '1rem' }}>
                                        <button
                                            onClick={() => handleApprovePirep(pirep._id)}
                                            className="career-btn career-btn-success"
                                        >
                                            <FiCheck /> Approve PIREP
                                        </button>
                                        <button
                                            onClick={() => handleRejectPirep(pirep._id)}
                                            className="career-btn career-btn-danger"
                                        >
                                            <FiX /> Reject PIREP
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {/* Analytics Tab */}
                {activeTab === 'analytics' && analytics && (
                    <div>
                        <div className="career-stats-grid">
                            <div className="career-stat-box">
                                <div className="career-stat-value">{analytics.totalUsers}</div>
                                <div className="career-stat-label">Total Users</div>
                            </div>
                            <div className="career-stat-box">
                                <div className="career-stat-value">{analytics.approvedUsers}</div>
                                <div className="career-stat-label">Approved Users</div>
                            </div>
                            <div className="career-stat-box">
                                <div className="career-stat-value">{analytics.totalPireps}</div>
                                <div className="career-stat-label">Total PIREPs</div>
                            </div>
                            <div className="career-stat-box">
                                <div className="career-stat-value">{analytics.pendingPireps}</div>
                                <div className="career-stat-label">Pending PIREPs</div>
                            </div>
                            <div className="career-stat-box">
                                <div className="career-stat-value">${analytics.totalEarnings?.toLocaleString()}</div>
                                <div className="career-stat-label">Total Earnings</div>
                            </div>
                            <div className="career-stat-box">
                                <div className="career-stat-value">{analytics.totalFlightTime} hrs</div>
                                <div className="career-stat-label">Total Flight Time</div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CareerAdmin;
