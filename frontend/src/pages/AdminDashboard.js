import React, { useState, useEffect, useContext, useCallback } from 'react';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';
import { FiUsers, FiFileText, FiTrendingUp, FiCheckCircle, FiXCircle, FiUserPlus } from 'react-icons/fi';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import Loading from '../components/Loading';

const AdminDashboard = () => {
  const { user } = useContext(AuthContext);
  const [stats, setStats] = useState(null);
  const [pireps, setPireps] = useState([]);
  const [users, setUsers] = useState([]);
  const [examAttempts, setExamAttempts] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Password reset state
  const [resetEmail, setResetEmail] = useState('');
  const [resetPassword, setResetPassword] = useState('');
  const [resetConfirmPassword, setResetConfirmPassword] = useState('');
  const [resetMessage, setResetMessage] = useState('');
  const [resetError, setResetError] = useState('');
  const [resetLoading, setResetLoading] = useState(false);

  // Signup toggle state
  const [signupsEnabled, setSignupsEnabled] = useState(true);
  const [toggleLoading, setToggleLoading] = useState(false);

  const canManageUsers = ['CEO', 'CAO'].includes(user?.role);
  const canViewUsers = ['CEO', 'CAO', 'CMO', 'CFI', 'Recruiter', 'Routes Manager', 'Crew Centre Manager', 'Event Leader', 'Chief Pilot'].includes(user?.role);
  const canReviewExams = ['CEO', 'CAO', 'CFI', 'CMO', 'Recruiter'].includes(user?.role);
  const canReviewPIREPs = ['CEO', 'CAO', 'CMO', 'CFI', 'Crew Centre Manager'].includes(user?.role);
  const canEditStats = ['CFI'].includes(user?.role);
  const canResetPasswords = ['CEO', 'CAO', 'CFI'].includes(user?.role);

  const [homeStats, setHomeStats] = useState({ codeshare: '15+', pireps: '750+', pilots: '95+' });
  const [statsForm, setStatsForm] = useState({ codeshare: '15+', pireps: '750+', pilots: '95+' });

  const fetchData = useCallback(async () => {
    try {
      const requests = [
        axios.get('/api/admin/stats'),
      ];

      if (canReviewPIREPs) {
        requests.push(axios.get('/api/pireps?status=pending'));
      }
      if (canViewUsers) {
        requests.push(axios.get('/api/admin/users'));
      }
      if (canReviewExams) {
        requests.push(axios.get('/api/exams/attempts/all'));
      }

      const results = await Promise.all(requests);

      const statsRes = results[0];
      setStats(statsRes.data);

      // Map optional results by request presence/order
      let idx = 1;
      if (canReviewPIREPs) {
        setPireps(results[idx].data);
        idx += 1;
      } else {
        setPireps([]);
      }
      if (canViewUsers) {
        setUsers(results[idx].data);
        idx += 1;
      } else {
        setUsers([]);
      }
      if (canReviewExams) {
        setExamAttempts(results[idx].data);
      } else {
        setExamAttempts([]);
      }
    } catch (error) {
      console.error('Error fetching admin data:', error);
      setError('Failed to load dashboard data: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  }, [canReviewExams, canReviewPIREPs, canViewUsers]);

  useEffect(() => {
    fetchData();
    // Fetch signup status
    const fetchSignupStatus = async () => {
      try {
        const response = await axios.get('/api/auth/signup-status');
        setSignupsEnabled(response.data.enabled);
      } catch (err) {
        console.error('Error fetching signup status:', err);
      }
    };
    fetchSignupStatus();
  }, [fetchData]);

  const handleReviewPIREP = async (pirepId, status) => {
    try {
      await axios.patch(`/ api / pireps / ${pirepId}/review`, { status });
      fetchData();
    } catch (error) {
      alert('Error reviewing PIREP: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleUpdateUserRole = async (userId, role) => {
    try {
      await axios.patch(`/api/admin/users/${userId}/role`, { role });
      fetchData();
    } catch (error) {
      alert('Error updating user role: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleUpdateUserStatus = async (userId, status) => {
    try {
      await axios.patch(`/api/admin/users/${userId}/status`, { status });
      fetchData();
    } catch (error) {
      alert('Error updating user status: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleReviewExamAttempt = async (attemptId, status) => {
    try {
      await axios.patch(`/api/exams/attempts/${attemptId}/review`, { status });
      fetchData();
    } catch (error) {
      alert('Error reviewing exam attempt: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleCreateStandardExam = async () => {
    try {
      const payload = {
        title: 'Pilot Practical + Theory Exam (20 min)',
        description:
          '20 questions / 20 minutes. Includes 10 practical traffic-pattern questions. One question unlocks per minute.',
        passingScore: 70,
        timeLimit: 20,
        active: true,
        questions: [
          // Practical (10)
          {
            question:
              'In a standard left-hand traffic pattern, after takeoff you should turn crosswind at approximately:',
            options: ['200 ft AGL', '500 ft AGL', 'Pattern altitude (typically 1000 ft AGL)', 'When clear of the runway'],
            correctAnswer: 1,
            points: 1,
          },
          {
            question: 'The downwind leg is flown:',
            options: ['Into the wind', 'Parallel to the runway, opposite direction of landing', 'Perpendicular to the runway', 'On final approach'],
            correctAnswer: 1,
            points: 1,
          },
          {
            question: 'In the pattern, the base leg is:',
            options: ['Parallel to the runway in opposite direction of landing', 'The turn from crosswind to downwind', 'The leg flown perpendicular to the runway leading to final', 'The leg aligned with the runway for landing'],
            correctAnswer: 2,
            points: 1,
          },
          {
            question: 'On downwind, the correct time to begin your base turn is usually when:',
            options: ['You are abeam the threshold', 'The runway threshold is about 45° behind your wing', 'The runway is directly ahead', 'You see the windsock'],
            correctAnswer: 1,
            points: 1,
          },
          {
            question: 'If you overshoot final from base, the safest immediate action is generally to:',
            options: ['Steepen the bank to capture centerline', 'Increase speed to reduce drift', 'Shallow the bank / go-around as needed rather than tightening dangerously', 'Use full flaps immediately'],
            correctAnswer: 2,
            points: 1,
          },
          {
            question: 'A stabilized approach typically means:',
            options: ['Airspeed, configuration, and descent rate are within limits by a defined gate', 'You are always at idle power', 'You are descending at any rate as long as on centerline', 'You must be fully configured only after passing the threshold'],
            correctAnswer: 0,
            points: 1,
          },
          {
            question: 'During a go-around, the correct initial action sequence is best described as:',
            options: ['Flaps full → gear up → power up', 'Power up → pitch for climb → manage flaps/gear per procedure', 'Gear up → power up → flaps up', 'Pitch down → power up → flaps up'],
            correctAnswer: 1,
            points: 1,
          },
          {
            question: 'If you are too high on final, the safest correction is usually to:',
            options: ['Dive to regain glidepath', 'Increase flap and adjust power to re-stabilize (or go-around)', 'Turn S-turns close to the ground', 'Ignore it and land long'],
            correctAnswer: 1,
            points: 1,
          },
          {
            question: 'In the circuit, spacing on downwind should be adjusted primarily using:',
            options: ['Altitude only', 'Power/airspeed and minor track adjustments while maintaining pattern', 'Only flaps', 'Abrupt turns'],
            correctAnswer: 1,
            points: 1,
          },
          {
            question: 'Best practice for traffic scanning in the pattern is:',
            options: ['Only look inside at instruments', 'Only look at TCAS', 'Continuous outside scan with clearing turns as needed', 'Rely on ATC to separate everyone'],
            correctAnswer: 2,
            points: 1,
          },

          // Theory / procedures (10)
          {
            question: 'VFR stands for:',
            options: ['Visual Flight Rules', 'Variable Flight Routing', 'Vertical Flight Rate', 'Visual Frequency Radio'],
            correctAnswer: 0,
            points: 1,
          },
          {
            question: 'A METAR is primarily a:',
            options: ['Forecast', 'Current weather observation', 'NOTAM', 'Flight plan'],
            correctAnswer: 1,
            points: 1,
          },
          {
            question: 'Wake turbulence is strongest:',
            options: ['Above the generating aircraft', 'Directly behind and below the generating aircraft', 'Only on the ground', 'Only at high altitude'],
            correctAnswer: 1,
            points: 1,
          },
          {
            question: 'Squawk 7600 generally indicates:',
            options: ['Hijack', 'Radio failure', 'Emergency', 'VFR flight following'],
            correctAnswer: 1,
            points: 1,
          },
          {
            question: 'The primary purpose of a preflight briefing is to:',
            options: ['Check social media for screenshots', 'Understand weather, NOTAMs, and risks before flight', 'Skip planning to save time', 'Only choose a livery'],
            correctAnswer: 1,
            points: 1,
          },
          {
            question: 'If ATC issues “Hold short of runway 27”, you must:',
            options: ['Cross the runway quickly', 'Taxi onto the runway and stop', 'Stop before the holding point markings and wait', 'Stop on the centerline'],
            correctAnswer: 2,
            points: 1,
          },
          {
            question: 'A standard “QNH” setting refers to:',
            options: ['Pressure setting to read altitude above sea level', 'Heading reference', 'Outside air temperature', 'Wind speed'],
            correctAnswer: 0,
            points: 1,
          },
          {
            question: 'A rejected takeoff (RTO) at high speed should be initiated when:',
            options: ['Any minor caution appears', 'Only for significant safety issues (engine failure, fire, inability to fly)', 'Only after V1 always', 'Never'],
            correctAnswer: 1,
            points: 1,
          },
          {
            question: 'The best definition of a “stabilized approach” gate is:',
            options: ['Any point you choose', 'A required altitude/point by which the approach must be stable or go-around', 'Only used in VFR', 'A radio navigation aid'],
            correctAnswer: 1,
            points: 1,
          },
          {
            question: 'When unsure about an instruction, the best action is to:',
            options: ['Guess and continue', 'Ask ATC for clarification / read back and confirm', 'Turn off the radio', 'Increase speed'],
            correctAnswer: 1,
            points: 1,
          },
        ],
      };

      await axios.post('/api/exams', payload);
      alert('Exam created successfully.');
      fetchData();
      setActiveTab('exams');
    } catch (error) {
      alert('Error creating exam: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleResetUserPassword = async (e) => {
    e.preventDefault();
    setResetError('');
    setResetMessage('');

    // Validation
    if (!resetEmail || !resetPassword) {
      setResetError('Email and password are required');
      return;
    }
    if (resetPassword.length < 6) {
      setResetError('Password must be at least 6 characters');
      return;
    }
    if (resetPassword !== resetConfirmPassword) {
      setResetError('Passwords do not match');
      return;
    }

    setResetLoading(true);
    try {
      const response = await axios.post('/api/admin/reset-user-password', {
        email: resetEmail.trim(),
        newPassword: resetPassword
      });
      setResetMessage(response.data.message);
      // Clear form
      setResetEmail('');
      setResetPassword('');
      setResetConfirmPassword('');
    } catch (error) {
      setResetError(error.response?.data?.message || 'Failed to reset password');
    } finally {
      setResetLoading(false);
    }
  };

  const handleToggleSignups = async () => {
    setToggleLoading(true);
    try {
      const response = await axios.post('/api/auth/toggle-signups');
      setSignupsEnabled(response.data.enabled);
      alert(response.data.message);
    } catch (err) {
      alert('Error toggling signups: ' + (err.response?.data?.message || err.message));
    } finally {
      setToggleLoading(false);
    }
  };

  if (loading) {
    return <Loading />;
  }

  const chartData = [
    { name: 'Users', value: stats?.users?.total || 0 },
    { name: 'Active', value: stats?.users?.active || 0 },
    { name: 'PIREPs', value: stats?.pireps?.total || 0 },
    { name: 'Pending', value: stats?.pireps?.pending || 0 },
    { name: 'Approved', value: stats?.pireps?.approved || 0 }
  ];

  return (
    <div className="container">
      <h1 style={{ color: 'white', marginBottom: '2rem' }}>Admin Dashboard</h1>

      {error && (
        <div className="alert alert-danger" style={{ marginBottom: '1rem', background: '#f8d7da', color: '#721c24', padding: '1rem', borderRadius: '4px' }}>
          {error}
        </div>
      )}

      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
        <button
          className={activeTab === 'overview' ? 'btn btn-primary' : 'btn btn-secondary'}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        {canReviewPIREPs && (
          <button
            className={activeTab === 'pireps' ? 'btn btn-primary' : 'btn btn-secondary'}
            onClick={() => setActiveTab('pireps')}
          >
            PIREPs
          </button>
        )}
        {canReviewExams && (
          <button
            className={activeTab === 'exams' ? 'btn btn-primary' : 'btn btn-secondary'}
            onClick={() => setActiveTab('exams')}
          >
            Exams
          </button>
        )}
        {canViewUsers && (
          <button
            className={activeTab === 'users' ? 'btn btn-primary' : 'btn btn-secondary'}
            onClick={() => setActiveTab('users')}
          >
            Users
          </button>
        )}
        {canEditStats && (
          <button
            className={activeTab === 'stats' ? 'btn btn-primary' : 'btn btn-secondary'}
            onClick={() => setActiveTab('stats')}
          >
            Stats Editor
          </button>
        )}
        {canResetPasswords && (
          <button
            className={activeTab === 'reset-password' ? 'btn btn-primary' : 'btn btn-secondary'}
            onClick={() => setActiveTab('reset-password')}
          >
            Reset Password
          </button>
        )}
      </div>

      {activeTab === 'overview' && stats && (
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
              <FiUsers />
            </div>
            <div className="stat-content">
              <h3>{stats.users.total}</h3>
              <p>Total Users</p>
              <small>{stats.users.active} Active</small>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
              <FiFileText />
            </div>
            <div className="stat-content">
              <h3>{stats.pireps.total}</h3>
              <p>Total PIREPs</p>
              <small>{stats.pireps.pending} Pending</small>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon" style={{ background: signupsEnabled ? 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' : 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
              <FiUserPlus />
            </div>
            <div className="stat-content">
              <h3>{signupsEnabled ? 'Open' : 'Closed'}</h3>
              <p>Signups</p>
              <button
                className="btn"
                style={{
                  marginTop: '0.5rem',
                  padding: '0.25rem 0.5rem',
                  fontSize: '0.8rem',
                  backgroundColor: signupsEnabled ? '#dc3545' : '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
                onClick={handleToggleSignups}
                disabled={toggleLoading}
              >
                {toggleLoading ? '...' : (signupsEnabled ? 'Close Signups' : 'Open Signups')}
              </button>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }}>
              <FiTrendingUp />
            </div>
            <div className="stat-content">
              <h3>{stats.totalHours.toFixed(0)}h</h3>
              <p>Total Flight Hours</p>
            </div>
          </div>
        </div>
      )}

      <div className="card" style={{ marginTop: '2rem' }}>
        <h2 style={{ marginBottom: '1rem' }}>Statistics Chart</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="value" fill="#667eea" />
          </BarChart>
        </ResponsiveContainer>
      </div>


      {activeTab === 'pireps' && (
        <div className="card" style={{ marginTop: '2rem' }}>
          <h2 style={{ marginBottom: '1rem' }}>Pending PIREPs</h2>
          {pireps.length === 0 ? (
            <p style={{ color: '#666' }}>No pending PIREPs.</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #e0e0e0' }}>
                    <th style={{ padding: '1rem', textAlign: 'left' }}>Flight</th>
                    <th style={{ padding: '1rem', textAlign: 'left' }}>Pilot</th>
                    <th style={{ padding: '1rem', textAlign: 'left' }}>Route</th>
                    <th style={{ padding: '1rem', textAlign: 'left' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pireps.map((pirep) => (
                    <tr key={pirep._id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                      <td style={{ padding: '1rem' }}>{pirep.flightNumber}</td>
                      <td style={{ padding: '1rem' }}>
                        {pirep.pilotId?.firstName} {pirep.pilotId?.lastName}
                      </td>
                      <td style={{ padding: '1rem' }}>
                        {pirep.departure.icao} → {pirep.arrival.icao}
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <button
                          className="btn btn-success"
                          onClick={() => handleReviewPIREP(pirep._id, 'approved')}
                          style={{ marginRight: '0.5rem', padding: '0.5rem 1rem' }}
                        >
                          <FiCheckCircle /> Approve
                        </button>
                        <button
                          className="btn btn-danger"
                          onClick={() => handleReviewPIREP(pirep._id, 'rejected')}
                          style={{ padding: '0.5rem 1rem' }}
                        >
                          <FiXCircle /> Reject
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'exams' && (
        <div className="card" style={{ marginTop: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <h2 style={{ marginBottom: 0 }}>Exam Attempts (Pending Approval)</h2>
            {['CEO', 'CAO', 'CFI'].includes(user?.role) && (
              <button className="btn btn-primary" onClick={handleCreateStandardExam}>
                Create 20‑Question / 20‑Min Exam
              </button>
            )}
          </div>
          {examAttempts.filter(a => (a.status || 'pending') === 'pending').length === 0 ? (
            <p style={{ color: '#666' }}>No pending exam attempts.</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #e0e0e0' }}>
                    <th style={{ padding: '1rem', textAlign: 'left' }}>Exam</th>
                    <th style={{ padding: '1rem', textAlign: 'left' }}>Pilot</th>
                    <th style={{ padding: '1rem', textAlign: 'left' }}>Score</th>
                    <th style={{ padding: '1rem', textAlign: 'left' }}>Passed</th>
                    <th style={{ padding: '1rem', textAlign: 'left' }}>Completed</th>
                    <th style={{ padding: '1rem', textAlign: 'left' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {examAttempts
                    .filter((a) => (a.status || 'pending') === 'pending')
                    .map((a) => (
                      <tr key={a._id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                        <td style={{ padding: '1rem' }}>{a.examId?.title || '—'}</td>
                        <td style={{ padding: '1rem' }}>
                          {a.userId?.firstName} {a.userId?.lastName} ({a.userId?.email})
                        </td>
                        <td style={{ padding: '1rem' }}>{typeof a.score === 'number' ? `${a.score.toFixed(1)}%` : '—'}</td>
                        <td style={{ padding: '1rem' }}>{a.passed ? 'Yes' : 'No'}</td>
                        <td style={{ padding: '1rem' }}>{a.completedAt ? new Date(a.completedAt).toLocaleString() : '—'}</td>
                        <td style={{ padding: '1rem' }}>
                          <button
                            className="btn btn-success"
                            onClick={() => handleReviewExamAttempt(a._id, 'approved')}
                            style={{ marginRight: '0.5rem', padding: '0.5rem 1rem' }}
                            disabled={!a.passed}
                            title={!a.passed ? 'Cannot approve a failed attempt' : 'Approve'}
                          >
                            <FiCheckCircle /> Approve
                          </button>
                          <button
                            className="btn btn-danger"
                            onClick={() => handleReviewExamAttempt(a._id, 'rejected')}
                            style={{ padding: '0.5rem 1rem' }}
                          >
                            <FiXCircle /> Reject
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'users' && (
        <div className="card" style={{ marginTop: '2rem' }}>
          <h2 style={{ marginBottom: '1rem' }}>All Users</h2>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e0e0e0' }}>
                  <th style={{ padding: '1rem', textAlign: 'left' }}>Name</th>
                  <th style={{ padding: '1rem', textAlign: 'left' }}>Email</th>
                  <th style={{ padding: '1rem', textAlign: 'left' }}>Discord ID</th>
                  <th style={{ padding: '1rem', textAlign: 'left' }}>Role</th>
                  <th style={{ padding: '1rem', textAlign: 'left' }}>Status</th>
                  <th style={{ padding: '1rem', textAlign: 'left' }}>Stats</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u._id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                    <td style={{ padding: '1rem' }}>{u.firstName} {u.lastName}</td>
                    <td style={{ padding: '1rem' }}>{u.email}</td>
                    <td style={{ padding: '1rem' }}>{u.discordId || '—'}</td>
                    <td style={{ padding: '1rem' }}>
                      <select
                        value={u.role}
                        onChange={(e) => handleUpdateUserRole(u._id, e.target.value)}
                        style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #e0e0e0' }}
                        disabled={!canManageUsers}
                      >
                        <option value="pilot">Pilot</option>
                        <option value="Event Leader">Event Leader</option>
                        <option value="Chief Pilot">Chief Pilot</option>
                        <option value="CEO">CEO</option>
                        <option value="CAO">CAO</option>
                        <option value="CMO">CMO</option>
                        <option value="CFI">CFI</option>
                        <option value="Recruiter">Recruiter</option>
                        <option value="Routes Manager">Routes Manager</option>
                        <option value="Crew Centre Manager">Crew Centre Manager</option>
                      </select>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <select
                        value={u.status}
                        onChange={(e) => handleUpdateUserStatus(u._id, e.target.value)}
                        style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #e0e0e0' }}
                        disabled={!canManageUsers}
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                        <option value="suspended">Suspended</option>
                      </select>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <span style={{ color: '#666', display: 'block', marginBottom: '0.5rem' }}>
                        {u.totalFlights} flights, {u.totalHours.toFixed(1)}h
                      </span>
                      {u.examCompleted && ['CEO', 'CAO', 'CMO', 'CFI', 'Recruiter'].includes(user?.role) && (
                        <button
                          className="btn btn-danger"
                          style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }}
                          onClick={async () => {
                            if (window.confirm(`Are you sure you want to reset exam for ${u.firstName}? They will have to retake it.`)) {
                              try {
                                await axios.post(`/api/admin/users/${u._id}/reset-exam`);
                                alert('Exam reset successfully');
                                // Refresh local state if possible or just alert
                              } catch (err) {
                                alert('Error resetting exam');
                              }
                            }
                          }}
                        >
                          Reset Exam
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'stats' && canEditStats && (
        <div className="card">
          <h2 style={{ marginBottom: '1.5rem', color: '#333' }}>Homepage Stats Editor</h2>
          <p style={{ color: '#666', marginBottom: '1.5rem' }}>
            Update the statistics displayed on the public homepage. These are display-only values and don't affect actual counts.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', color: '#333' }}>
                Codeshare Routes
              </label>
              <input
                className="input"
                value={statsForm.codeshare}
                onChange={(e) => setStatsForm({ ...statsForm, codeshare: e.target.value })}
                placeholder="e.g. 15+"
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', color: '#333' }}>
                Total PIREPs
              </label>
              <input
                className="input"
                value={statsForm.pireps}
                onChange={(e) => setStatsForm({ ...statsForm, pireps: e.target.value })}
                placeholder="e.g. 750+"
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', color: '#333' }}>
                Total Pilots
              </label>
              <input
                className="input"
                value={statsForm.pilots}
                onChange={(e) => setStatsForm({ ...statsForm, pilots: e.target.value })}
                placeholder="e.g. 95+"
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem' }}>
            <button
              className="btn btn-primary"
              onClick={() => {
                setHomeStats(statsForm);
                alert('Stats updated! Note: This is a frontend-only change. The backend still returns hardcoded values.');
              }}
            >
              Update Stats
            </button>

            <button
              className="btn btn-secondary"
              onClick={() => {
                setStatsForm({ codeshare: '15+', pireps: '750+', pilots: '95+' });
              }}
            >
              Reset to Defaults
            </button>
          </div>

          <div style={{ marginTop: '2rem', padding: '1rem', background: '#f8f9fa', borderRadius: '8px' }}>
            <h3 style={{ margin: '0 0 0.5rem', color: '#333', fontSize: '1rem' }}>Current Homepage Values:</h3>
            <ul style={{ margin: 0, paddingLeft: '1.5rem', color: '#666' }}>
              <li>Codeshare: {homeStats.codeshare}</li>
              <li>PIREPs: {homeStats.pireps}</li>
              <li>Pilots: {homeStats.pilots}</li>
            </ul>
          </div>
        </div>
      )}

      {activeTab === 'reset-password' && canResetPasswords && (
        <div className="card" style={{ marginTop: '2rem' }}>
          <h2 style={{ marginBottom: '1rem' }}>Reset User Password</h2>
          <p style={{ color: '#666', marginBottom: '1.5rem' }}>
            Reset any user's password by entering their email address and a new password.
          </p>

          {resetError && (
            <div className="alert alert-error" style={{ marginBottom: '1rem', background: '#f8d7da', color: '#721c24', padding: '1rem', borderRadius: '4px' }}>
              {resetError}
            </div>
          )}
          {resetMessage && (
            <div className="alert alert-success" style={{ marginBottom: '1rem', background: '#d4edda', color: '#155724', padding: '1rem', borderRadius: '4px' }}>
              {resetMessage}
            </div>
          )}

          <form onSubmit={handleResetUserPassword} style={{ maxWidth: '500px' }}>
            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                User Email
              </label>
              <input
                type="email"
                className="input"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                placeholder="user@example.com"
                required
                disabled={resetLoading}
              />
            </div>

            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                New Password
              </label>
              <input
                type="password"
                className="input"
                value={resetPassword}
                onChange={(e) => setResetPassword(e.target.value)}
                placeholder="Minimum 6 characters"
                required
                minLength={6}
                disabled={resetLoading}
              />
            </div>

            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                Confirm Password
              </label>
              <input
                type="password"
                className="input"
                value={resetConfirmPassword}
                onChange={(e) => setResetConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                required
                disabled={resetLoading}
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={resetLoading}
            >
              {resetLoading ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
