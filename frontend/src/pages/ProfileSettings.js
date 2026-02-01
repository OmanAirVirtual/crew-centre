import React, { useState, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { FiUser, FiMail, FiEdit, FiHash } from 'react-icons/fi';
import './Auth.css';

const ProfileSettings = () => {
    const { user, updateUser } = useContext(AuthContext);
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        email: user?.email || '',
        username: user?.username || '',
        firstName: user?.firstName || '',
        lastName: user?.lastName || '',
        discordId: user?.discordId || ''
    });

    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setMessage('');

        try {
            const response = await axios.put('/api/auth/profile', formData);

            // Update user context with new data
            updateUser(response.data.user);

            setMessage('Profile updated successfully!');
            setTimeout(() => {
                navigate('/dashboard');
            }, 1500);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to update profile');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <div className="auth-header">
                    <FiEdit className="auth-icon" />
                    <h1>Profile Settings</h1>
                    <p>Update your account information</p>
                </div>

                {message && (
                    <div style={{
                        padding: '1rem',
                        marginBottom: '1rem',
                        background: '#d4edda',
                        color: '#155724',
                        borderRadius: '8px',
                        border: '1px solid #c3e6cb'
                    }}>
                        {message}
                    </div>
                )}

                {error && (
                    <div style={{
                        padding: '1rem',
                        marginBottom: '1rem',
                        background: '#f8d7da',
                        color: '#721c24',
                        borderRadius: '8px',
                        border: '1px solid #f5c6cb'
                    }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
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
                            placeholder="your.email@example.com"
                        />
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
                            placeholder="Your username"
                        />
                    </div>

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
                            placeholder="Your first name"
                        />
                    </div>


                    <div className="form-group">
                        <label>
                            <FiUser /> Last Name (Optional)
                        </label>
                        <input
                            type="text"
                            name="lastName"
                            value={formData.lastName}
                            onChange={handleChange}
                            placeholder="Your last name"
                        />
                    </div>

                    <div className="form-group">
                        <label>
                            <FiHash /> Discord ID (Required)
                        </label>
                        <input
                            type="text"
                            name="discordId"
                            value={formData.discordId}
                            onChange={handleChange}
                            required
                            placeholder="Your Discord ID"
                        />
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={loading}
                        style={{ width: '100%' }}
                    >
                        {loading ? 'Updating...' : 'Update Profile'}
                    </button>

                    <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => navigate('/dashboard')}
                        style={{ width: '100%', marginTop: '1rem' }}
                    >
                        Cancel
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ProfileSettings;
