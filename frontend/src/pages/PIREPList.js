import React, { useState, useEffect, useContext, useCallback } from 'react';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';
import { FiClock, FiCheckCircle, FiXCircle } from 'react-icons/fi';
import Loading from '../components/Loading';

const PIREPList = () => {
  const { user } = useContext(AuthContext);
  const [pireps, setPireps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  const fetchPIREPs = useCallback(async () => {
    try {
      const url = user.role === 'pilot'
        ? '/api/pireps'
        : `/api/pireps${filter !== 'all' ? `?status=${filter}` : ''}`;
      const response = await axios.get(url);
      setPireps(response.data);
    } catch (error) {
      console.error('Error fetching PIREPs:', error);
    } finally {
      setLoading(false);
    }
  }, [filter, user.role]);

  useEffect(() => {
    fetchPIREPs();
  }, [fetchPIREPs]);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved':
        return <FiCheckCircle style={{ color: '#28a745' }} />;
      case 'rejected':
        return <FiXCircle style={{ color: '#dc3545' }} />;
      default:
        return <FiClock style={{ color: '#ffc107' }} />;
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleString();
  };

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="container">
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h1 style={{ color: '#333' }}>PIREPs</h1>
          {user.role !== 'pilot' && (
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: '2px solid #e0e0e0' }}
            >
              <option value="all">All</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          )}
        </div>

        {pireps.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#666', padding: '2rem' }}>
            No PIREPs found
          </p>
        ) : (
          <div>
            {/* Desktop Table */}
            <div className="desktop-table">
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #e0e0e0' }}>
                    <th style={{ padding: '1rem', textAlign: 'left' }}>Flight</th>
                    <th style={{ padding: '1rem', textAlign: 'left' }}>Route</th>
                    <th style={{ padding: '1rem', textAlign: 'left' }}>Aircraft</th>
                    <th style={{ padding: '1rem', textAlign: 'left' }}>Time</th>
                    <th style={{ padding: '1rem', textAlign: 'left' }}>Status</th>
                    {user.role !== 'pilot' && (
                      <th style={{ padding: '1rem', textAlign: 'left' }}>Pilot</th>
                    )}
                    <th style={{ padding: '1rem', textAlign: 'left' }}>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {pireps.map((pirep) => (
                    <tr key={pirep._id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                      <td style={{ padding: '1rem' }}>{pirep.flightNumber}</td>
                      <td style={{ padding: '1rem' }}>
                        {pirep.departure.icao} → {pirep.arrival.icao}
                      </td>
                      <td style={{ padding: '1rem' }}>{pirep.aircraft}</td>
                      <td style={{ padding: '1rem' }}>{pirep.flightTime} min</td>
                      <td style={{ padding: '1rem' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          {getStatusIcon(pirep.status)}
                          {pirep.status}
                        </span>
                      </td>
                      {user.role !== 'pilot' && (
                        <td style={{ padding: '1rem' }}>
                          {pirep.pilotId?.firstName} {pirep.pilotId?.lastName}
                        </td>
                      )}
                      <td style={{ padding: '1rem' }}>{formatDate(pirep.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="mobile-cards">
              {pireps.map((pirep) => (
                <div key={pirep._id} style={{ padding: '1rem', borderBottom: '1px solid #e0e0e0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span style={{ fontWeight: 'bold' }}>{pirep.flightNumber}</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      {getStatusIcon(pirep.status)}
                      {pirep.status}
                    </span>
                  </div>
                  <div style={{ marginBottom: '0.5rem', color: '#666' }}>
                    {pirep.departure.icao} → {pirep.arrival.icao}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: '#666' }}>
                    <span>{pirep.aircraft}</span>
                    <span>{pirep.flightTime} min</span>
                  </div>
                  {user.role !== 'pilot' && (
                    <div style={{ marginTop: '0.5rem', fontSize: '0.9rem' }}>
                      Pilot: {pirep.pilotId?.firstName} {pirep.pilotId?.lastName}
                    </div>
                  )}
                  <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: '#999' }}>
                    {formatDate(pirep.createdAt)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PIREPList;
