import React, { useMemo, useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import { FiRadio, FiFilter } from 'react-icons/fi';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const LiveTracking = () => {
  const [flights, setFlights] = useState([]);
  const [loading, setLoading] = useState(true);
  // Default to showing only WY callsigns; user can uncheck to see all
  const [filterWY, setFilterWY] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [sessionInfo, setSessionInfo] = useState(null);
  const [error, setError] = useState('');
  const [sessions, setSessions] = useState([]);
  const [worldType, setWorldType] = useState(3); // Expert
  const [sessionId, setSessionId] = useState('');
  const [selectedFlightId, setSelectedFlightId] = useState('');
  const [flightRoute, setFlightRoute] = useState([]);
  const [flightPlan, setFlightPlan] = useState(null);
  const [liveryInfo, setLiveryInfo] = useState(null);
  const [originAirport, setOriginAirport] = useState(null);
  const [destinationAirport, setDestinationAirport] = useState(null);
  const [detailsError, setDetailsError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const selectedFlight = useMemo(() => flights.find((f) => f.flightId === selectedFlightId) || null, [
    flights,
    selectedFlightId,
  ]);

  useEffect(() => {
    fetchSessions();
  }, []);

  useEffect(() => {
    if (!selectedFlightId || !sessionInfo?.id) return;
    fetchFlightDetails(sessionInfo.id, selectedFlightId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedFlightId, sessionInfo?.id]);

  const fetchSessions = async () => {
    try {
      const resp = await axios.get('/api/tracking/sessions');
      setSessions(resp.data.sessions || []);
    } catch (e) {
      // non-fatal; tracking can still use default selection
      console.error('Error fetching sessions:', e);
    }
  };

  const fetchFlights = useCallback(async () => {
    try {
      setError('');
      const params = new URLSearchParams();
      params.set('filterWY', String(filterWY));
      if (sessionId) params.set('sessionId', sessionId);
      else params.set('worldType', String(worldType));

      const response = await axios.get(`/api/tracking/live?${params.toString()}`);
      setFlights(response.data.flights || []);
      setSessionInfo(response.data.session || null);
    } catch (error) {
      console.error('Error fetching flights:', error);
      setError(error.response?.data?.message || 'Failed to load live tracking');
    } finally {
      setLoading(false);
    }
  }, [filterWY, sessionId, worldType]);

  useEffect(() => {
    fetchFlights();
    let interval;
    if (autoRefresh) {
      interval = setInterval(fetchFlights, 10000); // Refresh every 10 seconds
    }
    return () => clearInterval(interval);
  }, [autoRefresh, fetchFlights]);

  const fetchFlightDetails = async (sid, fid) => {
    try {
      setDetailsError('');
      setFlightRoute([]);
      setFlightPlan(null);
       setLiveryInfo(null);
       setOriginAirport(null);
       setDestinationAirport(null);

      const [routeResp, planResp] = await Promise.allSettled([
        axios.get(`/api/tracking/flight-route?sessionId=${encodeURIComponent(sid)}&flightId=${encodeURIComponent(fid)}`),
        axios.get(`/api/tracking/flight-plan?sessionId=${encodeURIComponent(sid)}&flightId=${encodeURIComponent(fid)}`),
      ]);

      if (routeResp.status === 'fulfilled') {
        setFlightRoute(routeResp.value.data.points || []);
      } else {
        // Route is only supported on Training/Expert per docs; ignore quietly unless user wants to see why.
        console.warn('Route fetch failed:', routeResp.reason);
      }

      if (planResp.status === 'fulfilled') {
        setFlightPlan(planResp.value.data.flightPlan || null);
      } else {
        console.warn('Flight plan fetch failed:', planResp.reason);
      }

      const flight = flights.find((f) => String(f.flightId) === String(fid));
      if (flight) {
        // Livery info
        if (flight.aircraftId && flight.liveryId) {
          try {
            const livRes = await axios.get(
              `/api/tracking/aircraft-liveries?aircraftId=${encodeURIComponent(flight.aircraftId)}`
            );
            const allLiveries = livRes.data.liveries || [];
            const found = allLiveries.find((l) => l.id === flight.liveryId);
            if (found) setLiveryInfo(found);
          } catch (err) {
            console.warn('Livery fetch failed:', err);
          }
        }

        // Origin / destination via world status (inbound/outbound lists)
        try {
          const worldRes = await axios.get(
            `/api/tracking/world-status?sessionId=${encodeURIComponent(sid)}`
          );
          const airports = worldRes.data.airports || [];
          let origin = null;
          let dest = null;
          for (const a of airports) {
            if (!origin && Array.isArray(a.outboundFlights) && a.outboundFlights.includes(fid)) {
              origin = { icao: a.airportIcao, name: a.airportName };
            }
            if (!dest && Array.isArray(a.inboundFlights) && a.inboundFlights.includes(fid)) {
              dest = { icao: a.airportIcao, name: a.airportName };
            }
            if (origin && dest) break;
          }
          setOriginAirport(origin);
          setDestinationAirport(dest);
        } catch (err) {
          console.warn('World status fetch failed:', err);
        }
      }
    } catch (e) {
      setDetailsError(e.response?.data?.message || 'Failed to load flight details');
    }
  };

  const routePolyline = useMemo(() => {
    if (!Array.isArray(flightRoute) || flightRoute.length === 0) return [];
    return flightRoute
      .filter((p) => typeof p.latitude === 'number' && typeof p.longitude === 'number')
      .map((p) => [p.latitude, p.longitude]);
  }, [flightRoute]);

  const filteredFlights = useMemo(() => {
    const q = searchTerm.trim().toUpperCase();
    if (!q) return flights;
    return flights.filter((f) => (f.callsign || '').toUpperCase().includes(q));
  }, [flights, searchTerm]);

  if (loading && flights.length === 0) {
    return <div className="container"><div className="card">Loading flight data...</div></div>;
  }

  return (
    <div className="container">
        <div className="card" style={{ paddingTop: '1.5rem' }}>
          {/* Floating header rectangle */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '2rem',
              padding: '1rem 1.5rem',
              borderRadius: '16px',
              boxShadow: '0 12px 30px rgba(0,0,0,0.12)',
              background: 'linear-gradient(135deg, rgba(102,126,234,0.95) 0%, rgba(118,75,162,0.96) 100%)',
              color: 'white',
              gap: '1.5rem',
            }}
          >
            <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0, fontSize: '1.6rem' }}>
              <FiRadio /> Oman Air Virtual – Live Tracking
            </h1>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <span style={{ fontWeight: 600 }}>Server</span>
                <select
                value={sessionId || `world:${worldType}`}
                onChange={(e) => {
                  const v = e.target.value;
                  if (v.startsWith('session:')) {
                    setSessionId(v.slice('session:'.length));
                  } else if (v.startsWith('world:')) {
                    setSessionId('');
                    setWorldType(Number.parseInt(v.slice('world:'.length), 10));
                  }
                }}
                style={{
                  padding: '0.4rem 0.75rem',
                  borderRadius: '999px',
                  border: 'none',
                  fontSize: '0.9rem',
                }}
              >
                <option value="world:3">Expert (default)</option>
                <option value="world:2">Training</option>
                <option value="world:1">Casual</option>
                <option value="world:0">Solo</option>
                <option value="world:4">Private</option>
                {sessions.length > 0 && <option disabled>────────</option>}
                {sessions.map((s) => (
                  <option key={s.id} value={`session:${s.id}`}>
                    {s.name} ({s.userCount}/{s.maxUsers})
                  </option>
                ))}
              </select>
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem' }}>
              <input
                type="checkbox"
                checked={filterWY}
                onChange={(e) => setFilterWY(e.target.checked)}
              />
              <FiFilter /> Only WY callsigns
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem' }}>
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
              />
              Auto Refresh
            </label>
          </div>
          </div>

        {error && <div className="alert alert-error">{error}</div>}

        {/* Map at top */}
        <div style={{ height: '600px', borderRadius: '12px', overflow: 'hidden', border: '2px solid #e0e0e0', marginBottom: '2rem' }}>
          <MapContainer
            center={[25.2532, 55.3657]} // Dubai area
            zoom={6}
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            {routePolyline.length > 1 && (
              <Polyline positions={routePolyline} pathOptions={{ color: '#667eea', weight: 3, opacity: 0.8 }} />
            )}
            {flights.map((flight, idx) => {
              if (flight.latitude && flight.longitude) {
                const icon = L.divIcon({
                  className: 'plane-marker',
                  html: `<div style="transform: rotate(${flight.heading || 0}deg); font-size: 18px;">✈️</div>`,
                });
                return (
                  <Marker
                    key={flight.flightId || idx}
                    position={[flight.latitude, flight.longitude]}
                    icon={icon}
                  >
                    <Popup>
                      <div>
                        <strong>{flight.callsign}</strong><br />
                        {flight.aircraft || '—'}<br />
                        {flight.username ? `Pilot: ${flight.username}` : 'Pilot: —'}<br />
                        Alt: {flight.altitude} ft<br />
                        Speed: {flight.speed ?? '—'} kts<br />
                        Heading: {flight.heading}°
                        <div style={{ marginTop: '0.5rem' }}>
                          <button
                            type="button"
                            className="btn btn-primary"
                            style={{ padding: '0.35rem 0.6rem' }}
                            onClick={() => setSelectedFlightId(String(flight.flightId || ''))}
                          >
                            View details
                          </button>
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                );
              }
              return null;
            })}
          </MapContainer>
        </div>

        {sessionInfo && (
          <div className="alert alert-info" style={{ marginBottom: '1.5rem' }}>
            Showing <strong>{sessionInfo.name}</strong> (users: {sessionInfo.userCount})
          </div>
        )}

        {/* Selected flight details under map */}
        {selectedFlight && (
          <div className="card" style={{ marginBottom: '2rem' }}>
                <h2 style={{ marginBottom: '0.5rem', color: '#333' }}>
                  Selected: {selectedFlight.callsign}
                </h2>
                {detailsError && <div className="alert alert-error">{detailsError}</div>}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', color: '#666' }}>
                  <div><strong>Aircraft:</strong> {selectedFlight.aircraft || '—'}</div>
                  {liveryInfo && (
                    <div><strong>Livery:</strong> {liveryInfo.name}</div>
                  )}
                  <div><strong>Pilot:</strong> {selectedFlight.username || '—'}</div>
                  <div><strong>Alt:</strong> {selectedFlight.altitude ?? '—'} ft</div>
                  <div><strong>Speed:</strong> {selectedFlight.speed ?? '—'} kts</div>
                  <div><strong>Heading:</strong> {selectedFlight.heading ?? '—'}°</div>
                  <div><strong>Last report:</strong> {selectedFlight.lastReport || '—'}</div>
                </div>

                {(originAirport || destinationAirport) && (
                  <div style={{ marginTop: '1rem', color: '#666' }}>
                    <strong>Route:</strong>{' '}
                    {originAirport
                      ? `${originAirport.icao} (${originAirport.name})`
                      : '—'}{' '}
                    →{' '}
                    {destinationAirport
                      ? `${destinationAirport.icao} (${destinationAirport.name})`
                      : '—'}
                  </div>
                )}

                {flightPlan?.flightPlanItems && (
                  <div style={{ marginTop: '1rem' }}>
                    <strong>Flight plan:</strong>{' '}
                    <div style={{ marginTop: '0.5rem', color: '#666', fontFamily: 'monospace', fontSize: '0.9rem' }}>
                      ================== FLIGHT PLAN ==================
                      <ul style={{ listStyle: 'none', paddingLeft: 0, marginTop: '0.5rem' }}>
                        {flightPlan.flightPlanItems.slice(0, 40).map((wp, idx) => (
                          <li key={idx} style={{ padding: '0.15rem 0' }}>
                            {idx + 1}. {wp?.name || '(unknown)'}
                          </li>
                        ))}
                      </ul>
                      =================================================
                    </div>
                  </div>
                )}

                {liveryInfo && (
                  <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ width: '160px', height: '80px', borderRadius: '8px', overflow: 'hidden', background: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ fontSize: '0.75rem', color: '#666', textAlign: 'center', padding: '0.5rem' }}>
                        Livery art not provided by API
                      </span>
                    </div>
                    <div style={{ color: '#666' }}>
                      <strong>Livery details:</strong>
                      <div>Name: {liveryInfo.name}</div>
                      <div>ID: {liveryInfo.id}</div>
                    </div>
                  </div>
                )}
              </div>
        )}

        {/* Flight list at bottom */}
        {flights.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#666' }}>
            <FiRadio style={{ fontSize: '4rem', marginBottom: '1rem', opacity: 0.3 }} />
            <p>No flights currently being tracked</p>
            {filterWY && <p style={{ marginTop: '0.5rem', fontSize: '0.9rem' }}>Try disabling the WY filter</p>}
          </div>
        ) : (
          <>
            <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ color: '#333' }}>Flights</h2>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by callsign (e.g. WY)..."
                style={{
                  padding: '0.5rem 0.75rem',
                  borderRadius: '8px',
                  border: '2px solid #e0e0e0',
                  minWidth: '220px',
                }}
              />
            </div>
            <div style={{ marginBottom: '2rem' }}>
              <div style={{ 
                background: '#f8f9fa', 
                padding: '1rem', 
                borderRadius: '8px',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '1rem'
              }}>
                {filteredFlights.map((flight, idx) => (
                  <div
                    key={flight.flightId || idx}
                    onClick={() => setSelectedFlightId(String(flight.flightId || ''))}
                    style={{
                      background: 'white', 
                      padding: '1rem', 
                      borderRadius: '8px',
                      border: selectedFlightId === flight.flightId ? '2px solid #667eea' : '1px solid #e0e0e0',
                      cursor: 'pointer'
                    }}
                  >
                    <div style={{ fontWeight: 'bold', color: '#667eea', marginBottom: '0.5rem' }}>
                      {flight.callsign}
                    </div>
                    <div style={{ fontSize: '0.9rem', color: '#666' }}>
                      <div>{flight.aircraft || '—'}</div>
                      <div>{flight.username ? `Pilot: ${flight.username}` : 'Pilot: —'}</div>
                      <div>FL {flight.altitude ? Math.floor(flight.altitude / 100) : 'N/A'}</div>
                      <div>{flight.speed ?? '—'} kts</div>
                      <button
                        type="button"
                        className="btn btn-primary"
                        style={{ marginTop: '0.75rem', padding: '0.4rem 0.75rem' }}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setSelectedFlightId(String(flight.flightId || ''));
                        }}
                      >
                        View details
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default LiveTracking;
