import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';
import { FiSend } from 'react-icons/fi';

const PIREPSubmit = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    flightNumber: '',
    aircraft: '',
    departure: { icao: '', name: '' },
    arrival: { icao: '', name: '' },
    departureTime: '',
    arrivalTime: '',
    flightTime: '',
    fuelUsed: '',
    passengers: '',
    cargo: '',
    route: '',
    remarks: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('departure.') || name.startsWith('arrival.')) {
      const [parent, child] = name.split('.');
      setFormData({
        ...formData,
        [parent]: { ...formData[parent], [child]: value }
      });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const calculateFlightTime = () => {
    if (formData.departureTime && formData.arrivalTime) {
      const dep = new Date(formData.departureTime);
      const arr = new Date(formData.arrivalTime);
      const diff = (arr - dep) / (1000 * 60); // minutes
      setFormData({ ...formData, flightTime: diff });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const submitData = {
        ...formData,
        departureTime: new Date(formData.departureTime),
        arrivalTime: new Date(formData.arrivalTime),
        flightTime: parseInt(formData.flightTime),
        fuelUsed: parseFloat(formData.fuelUsed),
        passengers: parseInt(formData.passengers) || 0,
        cargo: parseFloat(formData.cargo) || 0
      };

      await axios.post('/api/pireps', submitData);
      setSuccess(true);
      setTimeout(() => {
        navigate('/pirep/list');
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit PIREP');
    } finally {
      setLoading(false);
    }
  };

  if (!user.examCompleted) {
    return (
      <div className="container">
        <div className="card">
          <div className="alert alert-info">
            You must complete the pilot exam before submitting PIREPs.
            <a href="/exams" className="btn btn-primary" style={{ marginLeft: '1rem' }}>
              Take Exam
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="card">
        <h1 style={{ marginBottom: '2rem', color: '#333' }}>Submit PIREP</h1>

        {success && (
          <div className="alert alert-success">
            PIREP submitted successfully! Redirecting...
          </div>
        )}

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="grid">
            <div className="form-group">
              <label>Flight Number</label>
              <input
                type="text"
                name="flightNumber"
                value={formData.flightNumber}
                onChange={handleChange}
                required
                placeholder="e.g., WY101"
              />
            </div>

            <div className="form-group">
              <label>Aircraft</label>
              <input
                type="text"
                name="aircraft"
                value={formData.aircraft}
                onChange={handleChange}
                required
                placeholder="e.g., Boeing 787-9"
              />
            </div>
          </div>

          <h3 style={{ marginTop: '2rem', marginBottom: '1rem' }}>Departure</h3>
          <div className="grid">
            <div className="form-group">
              <label>ICAO Code</label>
              <input
                type="text"
                name="departure.icao"
                value={formData.departure.icao}
                onChange={handleChange}
                required
                placeholder="e.g., OMDB"
                maxLength="4"
                style={{ textTransform: 'uppercase' }}
              />
            </div>

            <div className="form-group">
              <label>Airport Name</label>
              <input
                type="text"
                name="departure.name"
                value={formData.departure.name}
                onChange={handleChange}
                required
                placeholder="e.g., Dubai International"
              />
            </div>
          </div>

          <h3 style={{ marginTop: '2rem', marginBottom: '1rem' }}>Arrival</h3>
          <div className="grid">
            <div className="form-group">
              <label>ICAO Code</label>
              <input
                type="text"
                name="arrival.icao"
                value={formData.arrival.icao}
                onChange={handleChange}
                required
                placeholder="e.g., EGLL"
                maxLength="4"
                style={{ textTransform: 'uppercase' }}
              />
            </div>

            <div className="form-group">
              <label>Airport Name</label>
              <input
                type="text"
                name="arrival.name"
                value={formData.arrival.name}
                onChange={handleChange}
                required
                placeholder="e.g., London Heathrow"
              />
            </div>
          </div>

          <div className="grid">
            <div className="form-group">
              <label>Departure Time</label>
              <input
                type="datetime-local"
                name="departureTime"
                value={formData.departureTime}
                onChange={handleChange}
                onBlur={calculateFlightTime}
                required
              />
            </div>

            <div className="form-group">
              <label>Arrival Time</label>
              <input
                type="datetime-local"
                name="arrivalTime"
                value={formData.arrivalTime}
                onChange={handleChange}
                onBlur={calculateFlightTime}
                required
              />
            </div>
          </div>

          <div className="grid">
            <div className="form-group">
              <label>Flight Time (minutes)</label>
              <input
                type="number"
                name="flightTime"
                value={formData.flightTime}
                onChange={handleChange}
                required
                min="1"
              />
            </div>

            <div className="form-group">
              <label>Fuel Used (kg)</label>
              <input
                type="number"
                name="fuelUsed"
                value={formData.fuelUsed}
                onChange={handleChange}
                required
                min="0"
                step="0.01"
              />
            </div>
          </div>

          <div className="grid">
            <div className="form-group">
              <label>Passengers</label>
              <input
                type="number"
                name="passengers"
                value={formData.passengers}
                onChange={handleChange}
                min="0"
              />
            </div>

            <div className="form-group">
              <label>Cargo (kg)</label>
              <input
                type="number"
                name="cargo"
                value={formData.cargo}
                onChange={handleChange}
                min="0"
                step="0.01"
              />
            </div>
          </div>

          <div className="form-group">
            <label>Route</label>
            <input
              type="text"
              name="route"
              value={formData.route}
              onChange={handleChange}
              placeholder="e.g., OMDB DCT EGLL"
            />
          </div>

          <div className="form-group">
            <label>Remarks</label>
            <textarea
              name="remarks"
              value={formData.remarks}
              onChange={handleChange}
              rows="4"
              placeholder="Any additional remarks..."
            />
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading}>
            <FiSend /> {loading ? 'Submitting...' : 'Submit PIREP'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default PIREPSubmit;
