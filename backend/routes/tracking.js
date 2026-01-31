const express = require('express');
const axios = require('axios');
const { auth } = require('../middleware/auth');

const router = express.Router();

const IF_BASE_URL = 'https://api.infiniteflight.com/public/v2';
const DEFAULT_WORLD_TYPE = 3; // Expert

// Per Infinite Flight Live API, data must not be permanently stored. Caching is permitted.
let aircraftCache = {
  fetchedAt: 0,
  byId: new Map(),
};

function getApiKey(req) {
  const raw = process.env.INFINITE_FLIGHT_API_KEY || req.headers['x-api-key'];
  const key = typeof raw === 'string' ? raw.trim() : '';
  return key || null;
}

async function ifGet(path, apiKey) {
  const url = `${IF_BASE_URL}${path}`;
  const resp = await axios.get(url, {
    headers: { Authorization: `Bearer ${apiKey}` },
    timeout: 10000,
  });
  return resp.data;
}

async function ifPost(path, apiKey, body) {
  const url = `${IF_BASE_URL}${path}`;
  const resp = await axios.post(url, body, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    timeout: 10000,
  });
  return resp.data;
}

function assertOkAny(data, context) {
  if (!data || typeof data !== 'object') {
    throw new Error(`${context}: empty response`);
  }
  if (typeof data.errorCode === 'number' && data.errorCode !== 0) {
    throw new Error(`${context}: Infinite Flight errorCode=${data.errorCode}`);
  }
  if (!('result' in data)) {
    throw new Error(`${context}: missing result`);
  }
}

function assertOkArray(data, context) {
  assertOkAny(data, context);
  if (!Array.isArray(data.result)) {
    throw new Error(`${context}: missing result array`);
  }
}

async function getAircraftMap(apiKey) {
  const now = Date.now();
  const oneHour = 60 * 60 * 1000;
  if (aircraftCache.fetchedAt && now - aircraftCache.fetchedAt < oneHour && aircraftCache.byId.size > 0) {
    return aircraftCache.byId;
  }

  const data = await ifGet('/aircraft', apiKey);
  assertOkArray(data, 'Get Aircraft');

  const next = new Map();
  for (const a of data.result) {
    if (a && a.id && a.name) next.set(a.id, a.name);
  }
  aircraftCache = { fetchedAt: now, byId: next };
  return aircraftCache.byId;
}

async function getSessions(apiKey) {
  const data = await ifGet('/sessions', apiKey);
  assertOkArray(data, 'Get Sessions');
  return data.result;
}

async function getFlights(apiKey, sessionId) {
  const data = await ifGet(`/sessions/${sessionId}/flights`, apiKey);
  assertOkArray(data, 'Get Flights');
  return data.result;
}

// List sessions so the UI can choose a server
router.get('/sessions', auth, async (req, res) => {
  try {
    const apiKey = getApiKey(req);
    if (!apiKey) return res.status(400).json({ message: 'Infinite Flight API key required' });

    const sessions = await getSessions(apiKey);
    res.json({
      sessions: sessions.map((s) => ({
        id: s.id,
        name: s.name,
        worldType: s.worldType,
        userCount: s.userCount,
        maxUsers: s.maxUsers,
        minimumGradeLevel: s.minimumGradeLevel,
      })),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(502).json({ message: 'Failed to fetch Infinite Flight sessions', error: error.message });
  }
});

// Get live tracking data from Infinite Flight Live API
router.get('/live', auth, async (req, res) => {
  try {
    const apiKey = getApiKey(req);
    if (!apiKey) return res.status(400).json({ message: 'Infinite Flight API key required' });

    const filterWY = req.query.filterWY === 'true';
    const requestedSessionId = typeof req.query.sessionId === 'string' ? req.query.sessionId : null;
    const requestedWorldTypeRaw = req.query.worldType;
    const requestedWorldType =
      requestedWorldTypeRaw !== undefined && requestedWorldTypeRaw !== null
        ? Number.parseInt(String(requestedWorldTypeRaw), 10)
        : DEFAULT_WORLD_TYPE;

    const sessions = await getSessions(apiKey);
    const session =
      (requestedSessionId && sessions.find((s) => s.id === requestedSessionId)) ||
      sessions.find((s) => s.worldType === requestedWorldType) ||
      sessions[0];

    if (!session) {
      return res.status(502).json({ message: 'No Infinite Flight sessions available right now' });
    }

    const [aircraftById, flightsRaw] = await Promise.all([getAircraftMap(apiKey), getFlights(apiKey, session.id)]);

    let flights = flightsRaw.map((f) => ({
      flightId: f.flightId,
      userId: f.userId,
      callsign: f.callsign,
      username: f.username,
      virtualOrganization: f.virtualOrganization,
      aircraft: aircraftById.get(f.aircraftId) || f.aircraftId,
      aircraftId: f.aircraftId,
      liveryId: f.liveryId,
      altitude: typeof f.altitude === 'number' ? Math.round(f.altitude) : null,
      speed: typeof f.speed === 'number' ? Math.round(f.speed) : null,
      heading: typeof f.heading === 'number' ? Math.round(f.heading) : null,
      latitude: f.latitude,
      longitude: f.longitude,
      lastReport: f.lastReport,
      isConnected: f.isConnected,
      pilotState: f.pilotState,
    }));

    if (filterWY) {
      flights = flights.filter((f) => (f.callsign || '').toUpperCase().endsWith('WY'));
    }

    res.json({
      source: 'infiniteflight-live-api',
      session: {
        id: session.id,
        name: session.name,
        worldType: session.worldType,
        userCount: session.userCount,
      },
      flights,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(502).json({ message: 'Failed to fetch Infinite Flight live flights', error: error.message });
  }
});

// --------------------------
// Additional Infinite Flight Live API endpoints (proxied)
// --------------------------

// Get Flights (raw) for a session
router.get('/flights', auth, async (req, res) => {
  try {
    const apiKey = getApiKey(req);
    if (!apiKey) return res.status(400).json({ message: 'Infinite Flight API key required' });
    const sessionId = typeof req.query.sessionId === 'string' ? req.query.sessionId : '';
    if (!sessionId) return res.status(400).json({ message: 'sessionId is required' });

    const flights = await getFlights(apiKey, sessionId);
    res.json({ flights, timestamp: new Date().toISOString() });
  } catch (error) {
    res.status(502).json({ message: 'Failed to fetch flights', error: error.message });
  }
});

// Get Flight Route (position reports)
router.get('/flight-route', auth, async (req, res) => {
  try {
    const apiKey = getApiKey(req);
    if (!apiKey) return res.status(400).json({ message: 'Infinite Flight API key required' });
    const sessionId = typeof req.query.sessionId === 'string' ? req.query.sessionId : '';
    const flightId = typeof req.query.flightId === 'string' ? req.query.flightId : '';
    if (!sessionId || !flightId) return res.status(400).json({ message: 'sessionId and flightId are required' });

    const data = await ifGet(`/sessions/${sessionId}/flights/${flightId}/route`, apiKey);
    assertOkArray(data, 'Get Flight Route');
    res.json({ points: data.result, timestamp: new Date().toISOString() });
  } catch (error) {
    res.status(502).json({ message: 'Failed to fetch flight route', error: error.message });
  }
});

// Get Flight Plan
router.get('/flight-plan', auth, async (req, res) => {
  try {
    const apiKey = getApiKey(req);
    if (!apiKey) return res.status(400).json({ message: 'Infinite Flight API key required' });
    const sessionId = typeof req.query.sessionId === 'string' ? req.query.sessionId : '';
    const flightId = typeof req.query.flightId === 'string' ? req.query.flightId : '';
    if (!sessionId || !flightId) return res.status(400).json({ message: 'sessionId and flightId are required' });

    const data = await ifGet(`/sessions/${sessionId}/flights/${flightId}/flightplan`, apiKey);
    assertOkAny(data, 'Get Flight Plan');
    res.json({ flightPlan: data.result, timestamp: new Date().toISOString() });
  } catch (error) {
    res.status(502).json({ message: 'Failed to fetch flight plan', error: error.message });
  }
});

// Get ATC (active frequencies)
router.get('/atc', auth, async (req, res) => {
  try {
    const apiKey = getApiKey(req);
    if (!apiKey) return res.status(400).json({ message: 'Infinite Flight API key required' });
    const sessionId = typeof req.query.sessionId === 'string' ? req.query.sessionId : '';
    if (!sessionId) return res.status(400).json({ message: 'sessionId is required' });

    const data = await ifGet(`/sessions/${sessionId}/atc`, apiKey);
    assertOkArray(data, 'Get ATC');
    res.json({ atc: data.result, timestamp: new Date().toISOString() });
  } catch (error) {
    res.status(502).json({ message: 'Failed to fetch ATC', error: error.message });
  }
});

// Get User Stats (POST /users)
router.post('/user-stats', auth, async (req, res) => {
  try {
    const apiKey = getApiKey(req);
    if (!apiKey) return res.status(400).json({ message: 'Infinite Flight API key required' });

    const body = req.body || {};
    const data = await ifPost('/users', apiKey, body);
    assertOkArray(data, 'Get User Stats');
    res.json({ users: data.result, timestamp: new Date().toISOString() });
  } catch (error) {
    res.status(502).json({ message: 'Failed to fetch user stats', error: error.message });
  }
});

// Get User Grade (GET /users/{userId})
router.get('/user-grade', auth, async (req, res) => {
  try {
    const apiKey = getApiKey(req);
    if (!apiKey) return res.status(400).json({ message: 'Infinite Flight API key required' });
    const userId = typeof req.query.userId === 'string' ? req.query.userId : '';
    if (!userId) return res.status(400).json({ message: 'userId is required' });

    const data = await ifGet(`/users/${userId}`, apiKey);
    assertOkAny(data, 'Get User Grade');
    res.json({ grade: data.result, timestamp: new Date().toISOString() });
  } catch (error) {
    res.status(502).json({ message: 'Failed to fetch user grade', error: error.message });
  }
});

// Get ATIS (GET /sessions/{sessionId}/airport/{airportIcao}/atis)
router.get('/atis', auth, async (req, res) => {
  try {
    const apiKey = getApiKey(req);
    if (!apiKey) return res.status(400).json({ message: 'Infinite Flight API key required' });
    const sessionId = typeof req.query.sessionId === 'string' ? req.query.sessionId : '';
    const airportIcao = typeof req.query.airportIcao === 'string' ? req.query.airportIcao : '';
    if (!sessionId || !airportIcao) return res.status(400).json({ message: 'sessionId and airportIcao are required' });

    const data = await ifGet(`/sessions/${sessionId}/airport/${airportIcao}/atis`, apiKey);
    assertOkAny(data, 'Get ATIS');
    res.json({ atis: data.result, timestamp: new Date().toISOString() });
  } catch (error) {
    res.status(502).json({ message: 'Failed to fetch ATIS', error: error.message });
  }
});

// Get Airport Status (GET /sessions/{sessionId}/airport/{airportIcao}/status)
router.get('/airport-status', auth, async (req, res) => {
  try {
    const apiKey = getApiKey(req);
    if (!apiKey) return res.status(400).json({ message: 'Infinite Flight API key required' });
    const sessionId = typeof req.query.sessionId === 'string' ? req.query.sessionId : '';
    const airportIcao = typeof req.query.airportIcao === 'string' ? req.query.airportIcao : '';
    if (!sessionId || !airportIcao) return res.status(400).json({ message: 'sessionId and airportIcao are required' });

    const data = await ifGet(`/sessions/${sessionId}/airport/${airportIcao}/status`, apiKey);
    assertOkAny(data, 'Get Airport Status');
    res.json({ status: data.result, timestamp: new Date().toISOString() });
  } catch (error) {
    res.status(502).json({ message: 'Failed to fetch airport status', error: error.message });
  }
});

// Get World Status (GET /sessions/{sessionId}/world)
router.get('/world-status', auth, async (req, res) => {
  try {
    const apiKey = getApiKey(req);
    if (!apiKey) return res.status(400).json({ message: 'Infinite Flight API key required' });
    const sessionId = typeof req.query.sessionId === 'string' ? req.query.sessionId : '';
    if (!sessionId) return res.status(400).json({ message: 'sessionId is required' });

    const data = await ifGet(`/sessions/${sessionId}/world`, apiKey);
    assertOkArray(data, 'Get World Status');
    res.json({ airports: data.result, timestamp: new Date().toISOString() });
  } catch (error) {
    res.status(502).json({ message: 'Failed to fetch world status', error: error.message });
  }
});

// Get Oceanic Tracks (GET /tracks)
router.get('/tracks', auth, async (req, res) => {
  try {
    const apiKey = getApiKey(req);
    if (!apiKey) return res.status(400).json({ message: 'Infinite Flight API key required' });

    const data = await ifGet('/tracks', apiKey);
    assertOkArray(data, 'Get Oceanic Tracks');
    res.json({ tracks: data.result, timestamp: new Date().toISOString() });
  } catch (error) {
    res.status(502).json({ message: 'Failed to fetch oceanic tracks', error: error.message });
  }
});

// Get User Flights (GET /users/{userId}/flights?page=)
router.get('/user-flights', auth, async (req, res) => {
  try {
    const apiKey = getApiKey(req);
    if (!apiKey) return res.status(400).json({ message: 'Infinite Flight API key required' });
    const userId = typeof req.query.userId === 'string' ? req.query.userId : '';
    const page = typeof req.query.page === 'string' ? req.query.page : '';
    if (!userId) return res.status(400).json({ message: 'userId is required' });

    const query = page ? `?page=${encodeURIComponent(page)}` : '';
    const data = await ifGet(`/users/${userId}/flights${query}`, apiKey);
    assertOkAny(data, 'Get User Flights');
    res.json({ flights: data.result, timestamp: new Date().toISOString() });
  } catch (error) {
    res.status(502).json({ message: 'Failed to fetch user flights', error: error.message });
  }
});

// Get User Flight (GET /users/{userId}/flights/{flightId})
router.get('/user-flight', auth, async (req, res) => {
  try {
    const apiKey = getApiKey(req);
    if (!apiKey) return res.status(400).json({ message: 'Infinite Flight API key required' });
    const userId = typeof req.query.userId === 'string' ? req.query.userId : '';
    const flightId = typeof req.query.flightId === 'string' ? req.query.flightId : '';
    if (!userId || !flightId) return res.status(400).json({ message: 'userId and flightId are required' });

    const data = await ifGet(`/users/${userId}/flights/${flightId}`, apiKey);
    assertOkAny(data, 'Get User Flight');
    res.json({ flight: data.result, timestamp: new Date().toISOString() });
  } catch (error) {
    res.status(502).json({ message: 'Failed to fetch user flight', error: error.message });
  }
});

// Get User ATC Sessions (GET /users/{userId}/atc?page=)
router.get('/user-atc-sessions', auth, async (req, res) => {
  try {
    const apiKey = getApiKey(req);
    if (!apiKey) return res.status(400).json({ message: 'Infinite Flight API key required' });
    const userId = typeof req.query.userId === 'string' ? req.query.userId : '';
    const page = typeof req.query.page === 'string' ? req.query.page : '';
    if (!userId) return res.status(400).json({ message: 'userId is required' });

    const query = page ? `?page=${encodeURIComponent(page)}` : '';
    const data = await ifGet(`/users/${userId}/atc${query}`, apiKey);
    assertOkAny(data, 'Get User ATC Sessions');
    res.json({ sessions: data.result, timestamp: new Date().toISOString() });
  } catch (error) {
    res.status(502).json({ message: 'Failed to fetch user ATC sessions', error: error.message });
  }
});

// Get User ATC Session (GET /users/{userId}/atc/{atcSessionId})
router.get('/user-atc-session', auth, async (req, res) => {
  try {
    const apiKey = getApiKey(req);
    if (!apiKey) return res.status(400).json({ message: 'Infinite Flight API key required' });
    const userId = typeof req.query.userId === 'string' ? req.query.userId : '';
    const atcSessionId = typeof req.query.atcSessionId === 'string' ? req.query.atcSessionId : '';
    if (!userId || !atcSessionId) return res.status(400).json({ message: 'userId and atcSessionId are required' });

    const data = await ifGet(`/users/${userId}/atc/${atcSessionId}`, apiKey);
    assertOkAny(data, 'Get User ATC Session');
    res.json({ session: data.result, timestamp: new Date().toISOString() });
  } catch (error) {
    res.status(502).json({ message: 'Failed to fetch user ATC session', error: error.message });
  }
});

// Get NOTAMs (GET /sessions/{sessionId}/notams)
router.get('/notams', auth, async (req, res) => {
  try {
    const apiKey = getApiKey(req);
    if (!apiKey) return res.status(400).json({ message: 'Infinite Flight API key required' });
    const sessionId = typeof req.query.sessionId === 'string' ? req.query.sessionId : '';
    if (!sessionId) return res.status(400).json({ message: 'sessionId is required' });

    const data = await ifGet(`/sessions/${sessionId}/notams`, apiKey);
    assertOkArray(data, 'Get NOTAMs');
    res.json({ notams: data.result, timestamp: new Date().toISOString() });
  } catch (error) {
    res.status(502).json({ message: 'Failed to fetch NOTAMs', error: error.message });
  }
});

// Get Aircraft (raw)
router.get('/aircraft', auth, async (req, res) => {
  try {
    const apiKey = getApiKey(req);
    if (!apiKey) return res.status(400).json({ message: 'Infinite Flight API key required' });

    const data = await ifGet('/aircraft', apiKey);
    assertOkArray(data, 'Get Aircraft');
    res.json({ aircraft: data.result, timestamp: new Date().toISOString() });
  } catch (error) {
    res.status(502).json({ message: 'Failed to fetch aircraft', error: error.message });
  }
});

// Get Aircraft Liveries (GET /aircraft/{aircraftId}/liveries)
router.get('/aircraft-liveries', auth, async (req, res) => {
  try {
    const apiKey = getApiKey(req);
    if (!apiKey) return res.status(400).json({ message: 'Infinite Flight API key required' });
    const aircraftId = typeof req.query.aircraftId === 'string' ? req.query.aircraftId : '';
    if (!aircraftId) return res.status(400).json({ message: 'aircraftId is required' });

    const data = await ifGet(`/aircraft/${aircraftId}/liveries`, apiKey);
    assertOkArray(data, 'Get Aircraft Liveries');
    res.json({ liveries: data.result, timestamp: new Date().toISOString() });
  } catch (error) {
    res.status(502).json({ message: 'Failed to fetch aircraft liveries', error: error.message });
  }
});

// Get Liveries (GET /aircraft/liveries)
router.get('/liveries', auth, async (req, res) => {
  try {
    const apiKey = getApiKey(req);
    if (!apiKey) return res.status(400).json({ message: 'Infinite Flight API key required' });

    const data = await ifGet('/aircraft/liveries', apiKey);
    assertOkArray(data, 'Get Liveries');
    res.json({ liveries: data.result, timestamp: new Date().toISOString() });
  } catch (error) {
    res.status(502).json({ message: 'Failed to fetch liveries', error: error.message });
  }
});

// Get Airport Information (GET /airport/{airportIcao})
router.get('/airport-information', auth, async (req, res) => {
  try {
    const apiKey = getApiKey(req);
    if (!apiKey) return res.status(400).json({ message: 'Infinite Flight API key required' });
    const airportIcao = typeof req.query.airportIcao === 'string' ? req.query.airportIcao : '';
    if (!airportIcao) return res.status(400).json({ message: 'airportIcao is required' });

    const data = await ifGet(`/airport/${airportIcao}`, apiKey);
    assertOkAny(data, 'Get Airport Information');
    res.json({ airport: data.result, timestamp: new Date().toISOString() });
  } catch (error) {
    res.status(502).json({ message: 'Failed to fetch airport information', error: error.message });
  }
});

// Get 3D Airports (GET /airports)
router.get('/airports', auth, async (req, res) => {
  try {
    const apiKey = getApiKey(req);
    if (!apiKey) return res.status(400).json({ message: 'Infinite Flight API key required' });

    const data = await ifGet('/airports', apiKey);
    assertOkAny(data, 'Get 3D Airports');
    res.json({ airports: data.result, timestamp: new Date().toISOString() });
  } catch (error) {
    res.status(502).json({ message: 'Failed to fetch airports', error: error.message });
  }
});

module.exports = router;
