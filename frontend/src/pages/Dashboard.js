import React, { useState, useEffect, useContext, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { getPilotRank } from '../utils/pilotRanks';
import axios from 'axios';
import { FiFileText, FiMap, FiRadio, FiBook, FiTrendingUp, FiClock, FiAward } from 'react-icons/fi';
import './Dashboard.css';

const PILOT_ROLES = ['pilot', 'Event Leader'];

const Dashboard = () => {
  const { user, fetchUser } = useContext(AuthContext);
  const hoursForRank = typeof user?.totalHours === 'number' ? user.totalHours : 0;
  const isPilot = user && PILOT_ROLES.includes(user.role);
  const rank = isPilot ? getPilotRank(hoursForRank) : null;
  const [stats, setStats] = useState({
    totalFlights: 0,
    totalHours: 0,
    pendingPIREPs: 0
  });

  const fetchStats = useCallback(async () => {
    try {
      const response = await axios.get('/api/pireps?pilotId=' + user.id);
      const pireps = response.data;
      const pending = pireps.filter(p => p.status === 'pending').length;

      setStats({
        totalFlights: user.totalFlights || pireps.length,
        totalHours: user.totalHours || 0,
        pendingPIREPs: pending
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  }, [user.id, user.totalHours, user.totalFlights]);

  useEffect(() => {
    fetchUser(); // Refresh user data (stats) from backend on every visit
    fetchStats();
  }, [fetchUser, fetchStats]);

  return (
    <div className="dashboard">
      <div className="container">
        <div className="dashboard-header">
          <h1>Welcome, {user.firstName}!</h1>
          <p>Oman Air Virtual Crew Center</p>
        </div>

        {rank && (
          <div className="rank-card">
            <div className="rank-card-header">
              <FiAward className="rank-icon" />
              <div>
                <h2 className="rank-title">{rank.name}</h2>
                <p className="rank-hours">{hoursForRank.toFixed(1)} flight hours</p>
              </div>
            </div>
            <p className="rank-unlocks"><strong>Unlocks:</strong> {rank.unlocks}</p>
            {rank.nextRank && (
              <div className="rank-progress-wrap">
                <div className="rank-progress-label">
                  <span>Next: {rank.nextRank} ({rank.nextHours}h)</span>
                  <span>{rank.progress.toFixed(0)}%</span>
                </div>
                <div className="rank-progress-bar">
                  <div className="rank-progress-fill" style={{ width: `${rank.progress}%` }} />
                </div>
              </div>
            )}
          </div>
        )}

        {!user.examCompleted && (
          <div className="alert alert-info">
            <FiBook /> You need to complete the pilot exam before submitting PIREPs.
            <Link to="/exams" className="btn btn-primary" style={{ marginLeft: '1rem' }}>
              Take Exam
            </Link>
          </div>
        )}

        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
              <FiTrendingUp />
            </div>
            <div className="stat-content">
              <h3>{stats.totalFlights}</h3>
              <p>Total Flights</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
              <FiClock />
            </div>
            <div className="stat-content">
              <h3>{typeof stats.totalHours === 'number' ? stats.totalHours.toFixed(1) : stats.totalHours}h</h3>
              <p>Total Hours</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }}>
              <FiFileText />
            </div>
            <div className="stat-content">
              <h3>{stats.pendingPIREPs}</h3>
              <p>Pending PIREPs</p>
            </div>
          </div>
        </div>

        <div className="quick-actions">
          <h2>Quick Actions</h2>
          <div className="actions-grid">
            <Link to="/pirep/submit" className="action-card">
              <FiFileText className="action-icon" />
              <h3>Submit PIREP</h3>
              <p>File your flight report</p>
            </Link>

            <Link to="/routes" className="action-card">
              <FiMap className="action-icon" />
              <h3>View Routes</h3>
              <p>Browse available routes</p>
            </Link>

            <Link to="/tracking" className="action-card">
              <FiRadio className="action-icon" />
              <h3>Live Tracking</h3>
              <p>Track flights in real-time</p>
            </Link>

            {!user.examCompleted && (
              <Link to="/exams" className="action-card">
                <FiBook className="action-icon" />
                <h3>Take Exam</h3>
                <p>Complete pilot certification</p>
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
