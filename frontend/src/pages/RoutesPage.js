import React, { useState, useEffect, useContext, useCallback } from 'react';
import axios from 'axios';
import { FiMapPin, FiClock } from 'react-icons/fi';
import { FaPlane } from 'react-icons/fa';
import { AuthContext } from '../context/AuthContext';

const RoutesPage = () => {
  const { user } = useContext(AuthContext);
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [searchICAO, setSearchICAO] = useState('');
  const [searchAircraft, setSearchAircraft] = useState('');
  const [createForm, setCreateForm] = useState({
    routeNumber: '',
    flightNumber: '',
    departureIcao: '',
    departureName: '',
    departureCity: '',
    departureCountry: '',
    arrivalIcao: '',
    arrivalName: '',
    arrivalCity: '',
    arrivalCountry: '',
    aircraft: '',
    distance: '',
    duration: '',
    frequency: 'Daily',
    codeshare: false,
    active: true,
  });

  const canManageRoutes = ['CEO', 'CAO', 'Routes Manager'].includes(user?.role);

  const fetchRoutes = useCallback(async () => {
    try {
      const url = filter === 'codeshare'
        ? '/api/routes?codeshare=true'
        : '/api/routes';
      const response = await axios.get(url);
      setRoutes(response.data.filter(r => r.active));
    } catch (error) {
      console.error('Error fetching routes:', error);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchRoutes();
  }, [fetchRoutes]);

  const handleCreateRoute = async (e) => {
    e.preventDefault();
    if (!canManageRoutes) return;

    setCreating(true);
    try {
      const payload = {
        routeNumber: createForm.routeNumber.trim(),
        flightNumber: createForm.flightNumber.trim(),
        departure: {
          icao: createForm.departureIcao.trim().toUpperCase(),
          name: createForm.departureName.trim(),
          city: createForm.departureCity.trim(),
          country: createForm.departureCountry.trim(),
        },
        arrival: {
          icao: createForm.arrivalIcao.trim().toUpperCase(),
          name: createForm.arrivalName.trim(),
          city: createForm.arrivalCity.trim(),
          country: createForm.arrivalCountry.trim(),
        },
        aircraft: createForm.aircraft.trim(),
        distance: Number(createForm.distance),
        duration: Number(createForm.duration),
        frequency: createForm.frequency.trim() || 'Daily',
        codeshare: !!createForm.codeshare,
        active: !!createForm.active,
      };

      await axios.post('/api/routes', payload);
      setShowCreate(false);
      setCreateForm({
        routeNumber: '',
        flightNumber: '',
        departureIcao: '',
        departureName: '',
        departureCity: '',
        departureCountry: '',
        arrivalIcao: '',
        arrivalName: '',
        arrivalCity: '',
        arrivalCountry: '',
        aircraft: '',
        distance: '',
        duration: '',
        frequency: 'Daily',
        codeshare: false,
        active: true,
      });
      fetchRoutes();
    } catch (error) {
      alert('Error creating route: ' + (error.response?.data?.message || error.message));
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return <div className="container"><div className="card">Loading...</div></div>;
  }

  return (
    <div className="container">
      <div className="card">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h1 style={{ color: '#333', margin: 0 }}>Routes</h1>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
              <button
                className={filter === 'all' ? 'btn btn-primary' : 'btn btn-secondary'}
                onClick={() => setFilter('all')}
              >
                All Routes
              </button>
              <button
                className={filter === 'codeshare' ? 'btn btn-primary' : 'btn btn-secondary'}
                onClick={() => setFilter('codeshare')}
              >
                Codeshare Routes
              </button>
              {canManageRoutes && (
                <button
                  className="btn btn-primary"
                  onClick={() => setShowCreate((v) => !v)}
                >
                  {showCreate ? 'Close' : 'Add Route'}
                </button>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem', background: '#f8f9fa', padding: '1rem', borderRadius: '8px', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '200px' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#666' }}>Search Airport (ICAO)</label>
              <input
                className="input"
                placeholder="e.g. OOMS or EDDF"
                value={searchICAO}
                onChange={(e) => setSearchICAO(e.target.value)}
              />
            </div>
            <div style={{ flex: 1, minWidth: '200px' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#666' }}>Filter by Aircraft</label>
              <input
                className="input"
                placeholder="e.g. Boeing 787"
                value={searchAircraft}
                onChange={(e) => setSearchAircraft(e.target.value)}
              />
            </div>
          </div>
        </div>

        {canManageRoutes && showCreate && (
          <div className="card" style={{ marginBottom: '2rem', background: '#f8f9fa' }}>
            <h2 style={{ marginBottom: '1rem', color: '#333' }}>Create Route</h2>
            <form onSubmit={handleCreateRoute}>
              <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
                <div>
                  <label>Route Number</label>
                  <input className="input" value={createForm.routeNumber} onChange={(e) => setCreateForm((s) => ({ ...s, routeNumber: e.target.value }))} required />
                </div>
                <div>
                  <label>Flight Number</label>
                  <input className="input" value={createForm.flightNumber} onChange={(e) => setCreateForm((s) => ({ ...s, flightNumber: e.target.value }))} required />
                </div>
                <div>
                  <label>Aircraft</label>
                  <input className="input" value={createForm.aircraft} onChange={(e) => setCreateForm((s) => ({ ...s, aircraft: e.target.value }))} required />
                </div>
                <div>
                  <label>Distance (nm)</label>
                  <input className="input" type="number" min="1" value={createForm.distance} onChange={(e) => setCreateForm((s) => ({ ...s, distance: e.target.value }))} required />
                </div>
                <div>
                  <label>Duration (minutes)</label>
                  <input className="input" type="number" min="1" value={createForm.duration} onChange={(e) => setCreateForm((s) => ({ ...s, duration: e.target.value }))} required />
                </div>
                <div>
                  <label>Frequency</label>
                  <input className="input" value={createForm.frequency} onChange={(e) => setCreateForm((s) => ({ ...s, frequency: e.target.value }))} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
                <div>
                  <h3 style={{ margin: '0 0 0.5rem', color: '#333' }}>Departure</h3>
                  <input className="input" placeholder="ICAO (e.g. OOMS)" value={createForm.departureIcao} onChange={(e) => setCreateForm((s) => ({ ...s, departureIcao: e.target.value }))} required />
                  <input className="input" placeholder="Airport name" value={createForm.departureName} onChange={(e) => setCreateForm((s) => ({ ...s, departureName: e.target.value }))} required />
                  <input className="input" placeholder="City" value={createForm.departureCity} onChange={(e) => setCreateForm((s) => ({ ...s, departureCity: e.target.value }))} required />
                  <input className="input" placeholder="Country" value={createForm.departureCountry} onChange={(e) => setCreateForm((s) => ({ ...s, departureCountry: e.target.value }))} required />
                </div>
                <div>
                  <h3 style={{ margin: '0 0 0.5rem', color: '#333' }}>Arrival</h3>
                  <input className="input" placeholder="ICAO (e.g. OMDB)" value={createForm.arrivalIcao} onChange={(e) => setCreateForm((s) => ({ ...s, arrivalIcao: e.target.value }))} required />
                  <input className="input" placeholder="Airport name" value={createForm.arrivalName} onChange={(e) => setCreateForm((s) => ({ ...s, arrivalName: e.target.value }))} required />
                  <input className="input" placeholder="City" value={createForm.arrivalCity} onChange={(e) => setCreateForm((s) => ({ ...s, arrivalCity: e.target.value }))} required />
                  <input className="input" placeholder="Country" value={createForm.arrivalCountry} onChange={(e) => setCreateForm((s) => ({ ...s, arrivalCountry: e.target.value }))} required />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginTop: '1rem', alignItems: 'center' }}>
                <label style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <input
                    type="checkbox"
                    checked={createForm.codeshare}
                    onChange={(e) => setCreateForm((s) => ({ ...s, codeshare: e.target.checked }))}
                  />
                  Codeshare
                </label>
                <label style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <input
                    type="checkbox"
                    checked={createForm.active}
                    onChange={(e) => setCreateForm((s) => ({ ...s, active: e.target.checked }))}
                  />
                  Active
                </label>
                <button className="btn btn-primary" type="submit" disabled={creating}>
                  {creating ? 'Creating...' : 'Create Route'}
                </button>
              </div>
            </form>
          </div>
        )}

        {routes.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#666', padding: '2rem' }}>
            No routes found
          </p>
        ) : (
          <div className="grid">
            {routes.filter(route => {
              const matchesICAO = !searchICAO ||
                route.departure.icao.toLowerCase().includes(searchICAO.toLowerCase()) ||
                route.arrival.icao.toLowerCase().includes(searchICAO.toLowerCase());

              const matchesAircraft = !searchAircraft ||
                route.aircraft.toLowerCase().includes(searchAircraft.toLowerCase());

              return matchesICAO && matchesAircraft;
            }).map((route) => (
              <div key={route._id} className="card" style={{ marginBottom: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                  <div>
                    <h3 style={{ color: '#667eea', marginBottom: '0.5rem' }}>
                      {route.flightNumber}
                    </h3>
                    {route.codeshare && (
                      <span style={{
                        background: '#667eea',
                        color: 'white',
                        padding: '0.25rem 0.75rem',
                        borderRadius: '12px',
                        fontSize: '0.85rem'
                      }}>
                        Codeshare
                      </span>
                    )}
                  </div>
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <FiMapPin style={{ color: '#28a745' }} />
                    <strong>{route.departure.icao}</strong> - {route.departure.name}
                    <span style={{ color: '#666', marginLeft: '0.5rem' }}>
                      {route.departure.city}, {route.departure.country}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <FiMapPin style={{ color: '#dc3545' }} />
                    <strong>{route.arrival.icao}</strong> - {route.arrival.name}
                    <span style={{ color: '#666', marginLeft: '0.5rem' }}>
                      {route.arrival.city}, {route.arrival.country}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '2rem', color: '#666' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <FaPlane />
                    {route.aircraft}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <FiClock />
                    {Math.floor(route.duration / 60)}h {route.duration % 60}m
                  </div>
                  <div>
                    {route.distance} nm
                  </div>
                </div>

                {route.codeshare && route.codesharePartners?.length > 0 && (
                  <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #e0e0e0' }}>
                    <strong style={{ fontSize: '0.9rem', color: '#666' }}>Codeshare Partners:</strong>
                    <div style={{ marginTop: '0.5rem' }}>
                      {route.codesharePartners.map((partner, idx) => (
                        <span key={idx} style={{
                          background: '#f0f0f0',
                          padding: '0.25rem 0.5rem',
                          borderRadius: '4px',
                          marginRight: '0.5rem',
                          fontSize: '0.85rem'
                        }}>
                          {partner.airline} {partner.flightNumber}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default RoutesPage;
