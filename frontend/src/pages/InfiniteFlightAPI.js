import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { FiRadio } from 'react-icons/fi';

const JsonBox = ({ title, data }) => {
  if (!data) return null;
  return (
    <div className="card" style={{ marginTop: '1.5rem' }}>
      <h3 style={{ marginBottom: '1rem', color: '#333' }}>{title}</h3>
      <pre
        style={{
          background: '#0b1020',
          color: '#e6e8ee',
          padding: '1rem',
          borderRadius: '12px',
          overflowX: 'auto',
          fontSize: '0.9rem',
          lineHeight: 1.4,
        }}
      >
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  );
};

const InfiniteFlightAPI = () => {
  const [error, setError] = useState('');
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [flights, setFlights] = useState([]);
  const [selectedFlight, setSelectedFlight] = useState(null);
  const [route, setRoute] = useState([]);
  const [flightPlan, setFlightPlan] = useState(null);
  const [atc, setAtc] = useState([]);
  const [notams, setNotams] = useState([]);
  const [worldStatus, setWorldStatus] = useState([]);
  const [tracks, setTracks] = useState([]);

  const [userStats, setUserStats] = useState(null);
  const [userGrade, setUserGrade] = useState(null);
  const [userFlights, setUserFlights] = useState(null);
  const [userAtcSessions, setUserAtcSessions] = useState(null);

  useEffect(() => {
    const loadSessions = async () => {
      try {
        setError('');
        const res = await axios.get('/api/tracking/sessions');
        const list = res.data.sessions || [];
        setSessions(list);
        if (list.length > 0) {
          setSelectedSession(list[0]);
        }
      } catch (e) {
        setError(e.response?.data?.message || e.message || 'Failed to load sessions');
      }
    };
    loadSessions();
  }, []);

  useEffect(() => {
    if (!selectedSession) return;
    const fetchForSession = async () => {
      try {
        setError('');
        const sessionId = selectedSession.id;
        const [flightsRes, atcRes, notamRes, worldRes, tracksRes] = await Promise.all([
          axios.get(`/api/tracking/flights?sessionId=${encodeURIComponent(sessionId)}`),
          axios.get(`/api/tracking/atc?sessionId=${encodeURIComponent(sessionId)}`),
          axios.get(`/api/tracking/notams?sessionId=${encodeURIComponent(sessionId)}`),
          axios.get(`/api/tracking/world-status?sessionId=${encodeURIComponent(sessionId)}`),
          axios.get('/api/tracking/tracks'),
        ]);
        setFlights(flightsRes.data.flights || []);
        setAtc(atcRes.data.atc || []);
        setNotams(notamRes.data.notams || []);
        setWorldStatus(worldRes.data.airports || []);
        setTracks(tracksRes.data.tracks || []);
        setSelectedFlight(null);
        setRoute([]);
        setFlightPlan(null);
      } catch (e) {
        setError(e.response?.data?.message || e.message || 'Failed to load session data');
      }
    };
    fetchForSession();
  }, [selectedSession]);

  const loadFlightDetails = async (flight) => {
    if (!selectedSession || !flight) return;
    try {
      setError('');
      setSelectedFlight(flight);
      setRoute([]);
      setFlightPlan(null);
      setUserStats(null);
      setUserGrade(null);
      setUserFlights(null);
      setUserAtcSessions(null);

      const sessionId = selectedSession.id;
      const flightId = flight.flightId;
      const userId = flight.userId;

      const [routeRes, planRes, statsRes, gradeRes, userFlightsRes, userAtcRes] = await Promise.all([
        axios.get(`/api/tracking/flight-route?sessionId=${encodeURIComponent(sessionId)}&flightId=${encodeURIComponent(flightId)}`),
        axios.get(`/api/tracking/flight-plan?sessionId=${encodeURIComponent(sessionId)}&flightId=${encodeURIComponent(flightId)}`),
        axios.post('/api/tracking/user-stats', { userIds: userId ? [userId] : [] }),
        userId ? axios.get(`/api/tracking/user-grade?userId=${encodeURIComponent(userId)}`) : Promise.resolve({ data: null }),
        userId ? axios.get(`/api/tracking/user-flights?userId=${encodeURIComponent(userId)}&page=1`) : Promise.resolve({ data: null }),
        userId ? axios.get(`/api/tracking/user-atc-sessions?userId=${encodeURIComponent(userId)}&page=1`) : Promise.resolve({ data: null }),
      ]);

      setRoute(routeRes.data.points || []);
      setFlightPlan(planRes.data.flightPlan || null);
      setUserStats(statsRes.data.users || null);
      setUserGrade(gradeRes.data?.grade || null);
      setUserFlights(userFlightsRes.data?.flights || null);
      setUserAtcSessions(userAtcRes.data?.sessions || null);
    } catch (e) {
      setError(e.response?.data?.message || e.message || 'Failed to load flight details');
    }
  };

  return (
    <div className="container">
      <div className="card">
        <h1 style={{ color: '#333', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <FiRadio /> Infinite Flight Live API
        </h1>
        <p style={{ marginTop: '0.5rem', color: '#666' }}>
          This page auto-loads Infinite Flight sessions, flights and related data. No IDs to paste; click to drill down.
        </p>

        {error && <div className="alert alert-error" style={{ marginTop: '1rem' }}>{error}</div>}

        {/* Sessions */}
        <h2 style={{ marginTop: '1.5rem', color: '#333' }}>Sessions</h2>
        {sessions.length === 0 ? (
          <p style={{ color: '#666', marginTop: '0.5rem' }}>No sessions available.</p>
        ) : (
          <div className="grid" style={{ marginTop: '0.75rem' }}>
            {sessions.map((s) => (
              <div
                key={s.id}
                className="card"
                style={{
                  marginBottom: 0,
                  border: selectedSession?.id === s.id ? '2px solid #667eea' : '1px solid #e0e0e0',
                  cursor: 'pointer',
                }}
                onClick={() => setSelectedSession(s)}
              >
                <h3 style={{ color: '#667eea', marginBottom: '0.25rem' }}>{s.name}</h3>
                <div style={{ color: '#666', fontSize: '0.9rem' }}>
                  <div>Users: {s.userCount}/{s.maxUsers}</div>
                  <div>World: {s.worldType}</div>
                  <div>Min Grade: {s.minimumGradeLevel + 1}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Flights */}
        {selectedSession && (
          <>
            <h2 style={{ marginTop: '2rem', color: '#333' }}>
              Flights in {selectedSession.name}
            </h2>
            {flights.length === 0 ? (
              <p style={{ color: '#666', marginTop: '0.5rem' }}>No flights found.</p>
            ) : (
              <div className="grid" style={{ marginTop: '0.75rem' }}>
                {flights.slice(0, 40).map((f) => (
                  <div
                    key={f.flightId}
                    className="card"
                    style={{
                      marginBottom: 0,
                      border: selectedFlight?.flightId === f.flightId ? '2px solid #667eea' : '1px solid #e0e0e0',
                      cursor: 'pointer',
                    }}
                    onClick={() => loadFlightDetails(f)}
                  >
                    <h3 style={{ color: '#667eea', marginBottom: '0.25rem' }}>{f.callsign || '(no callsign)'}</h3>
                    <div style={{ color: '#666', fontSize: '0.9rem' }}>
                      <div>Pilot: {f.username || '—'}</div>
                      <div>Alt: {Math.round(f.altitude)} ft</div>
                      <div>Speed: {Math.round(f.speed)} kts</div>
                      <div>Heading: {Math.round(f.heading)}°</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Details for selected flight */}
      {selectedFlight && (
        <>
          <JsonBox title="Flight Route (Get Flight Route)" data={route} />
          <JsonBox title="Flight Plan (Get Flight Plan)" data={flightPlan} />
          <JsonBox title="User Stats (Get User Stats)" data={userStats} />
          <JsonBox title="User Grade (Get User Grade)" data={userGrade} />
          <JsonBox title="User Flights (Get User Flights)" data={userFlights} />
          <JsonBox title="User ATC Sessions (Get User ATC Sessions)" data={userAtcSessions} />
        </>
      )}

      {/* Session-wide info */}
      {atc.length > 0 && <JsonBox title="ATC (Get ATC)" data={atc} />}
      {notams.length > 0 && <JsonBox title="NOTAMs (Get NOTAMs)" data={notams} />}
      {worldStatus.length > 0 && <JsonBox title="World Status (Get World Status)" data={worldStatus} />}
      {tracks.length > 0 && <JsonBox title="Oceanic Tracks (Get Oceanic Tracks)" data={tracks} />}
    </div>
  );
};

export default InfiniteFlightAPI;

