import axios from 'axios';
import mockData from '../data/mockEvents.json';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api',
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json',
  },
});

const parseJsonSafely = (val, fallback = []) => {
  if (!val) return fallback;
  if (typeof val === 'string') {
    try {
      return JSON.parse(val);
    } catch {
      return fallback;
    }
  }
  return val;
};

export function generate24HourEphemeris(sat = {}, noradId = 43111) {
  const numNorad = parseInt(noradId, 10) || 43111;
  const incDeg = sat?.inclination_deg ?? sat?.inclination ?? (50 + (numNorad % 45));
  const incRad = (incDeg * Math.PI) / 180;
  const altKm = sat?.perigee_km ?? sat?.altitude_km ?? (480 + (numNorad % 250));
  const rEarth = 6378.137;
  const a = rEarth + altKm; // Semi-major axis in km (~6850 km)
  const mu = 398600.4418; // Earth gravitational parameter km^3/s^2
  const orbitalPeriodSec = 2 * Math.PI * Math.sqrt(Math.pow(a, 3) / mu); // ~5680s (~94.8 min)
  const orbitalVelocity = Math.sqrt(mu / a); // ~7.6 km/s
  const raanRad = (((numNorad * 137.5) % 360) * Math.PI) / 180; // Unique RAAN per NORAD ID

  const points = [];
  const totalSeconds = 24 * 3600; // 24 hours = 86400s
  const stepSeconds = 300; // 1 sample every 5 minutes = 289 points

  const baseDate = new Date();
  baseDate.setUTCHours(0, 0, 0, 0); // Start at 00:00:00 UTC
  const baseTimeMs = baseDate.getTime();

  for (let t = 0; t <= totalSeconds; t += stepSeconds) {
    const meanMotion = (2 * Math.PI) / orbitalPeriodSec;
    const meanAnomaly = (meanMotion * t) % (2 * Math.PI);

    // Orbital plane coordinates
    const xOrb = a * Math.cos(meanAnomaly);
    const yOrb = a * Math.sin(meanAnomaly);

    // Orbital plane velocities
    const vxOrb = -orbitalVelocity * Math.sin(meanAnomaly);
    const vyOrb = orbitalVelocity * Math.cos(meanAnomaly);

    // Transform to ECI Coordinates (rotate by inclination and RAAN)
    const cosRaan = Math.cos(raanRad);
    const sinRaan = Math.sin(raanRad);
    const cosInc = Math.cos(incRad);
    const sinInc = Math.sin(incRad);

    const xEci = xOrb * cosRaan - yOrb * cosInc * sinRaan;
    const yEci = xOrb * sinRaan + yOrb * cosInc * cosRaan;
    const zEci = yOrb * sinInc;

    const vxEci = vxOrb * cosRaan - vyOrb * cosInc * sinRaan;
    const vyEci = vxOrb * sinRaan + vyOrb * cosInc * cosRaan;
    const vzEci = vyOrb * sinInc;

    const pointTime = new Date(baseTimeMs + t * 1000).toISOString();

    points.push({
      x: Number(xEci.toFixed(2)),
      y: Number(yEci.toFixed(2)),
      z: Number(zEci.toFixed(2)),
      x_km: Number(xEci.toFixed(2)),
      y_km: Number(yEci.toFixed(2)),
      z_km: Number(zEci.toFixed(2)),
      vx: Number(vxEci.toFixed(2)),
      vy: Number(vyEci.toFixed(2)),
      vz: Number(vzEci.toFixed(2)),
      vx_km_s: Number(vxEci.toFixed(2)),
      vy_km_s: Number(vyEci.toFixed(2)),
      vz_km_s: Number(vzEci.toFixed(2)),
      timestamp_utc: pointTime,
      timestamp: pointTime,
    });
  }

  return points;
}

export const apiService = {
  // GET /api/dashboard
  async getDashboard() {
    try {
      const response = await apiClient.get('/dashboard');
      return response.data;
    } catch (error) {
      console.warn('[API Service] Backend /dashboard unreachable, serving mock dashboard telemetry:', error.message);
      return {
        satellite_count: 501,
        conjunction_count: 0,
        severity_counts: {
          critical: 0,
          high: 0,
          medium: 0,
          low: 0,
        },
      };
    }
  },

  // GET /api/satellites
  async getSatellites(limit = 100, offset = 0) {
    try {
      const response = await apiClient.get('/satellites', { params: { limit, offset } });
      const list = response.data?.satellites || (Array.isArray(response.data) ? response.data : []);
      return list.map((sat) => ({
        norad_id: sat.norad_cat_id ?? sat.norad_id,
        norad_cat_id: sat.norad_cat_id ?? sat.norad_id,
        name: sat.object_name ?? sat.name,
        object_name: sat.object_name ?? sat.name,
        epoch: sat.epoch_utc ?? sat.epoch,
        epoch_utc: sat.epoch_utc ?? sat.epoch,
        inclination: sat.inclination ?? sat.inclination_deg,
        inclination_deg: sat.inclination ?? sat.inclination_deg,
        eccentricity: sat.eccentricity,
        mean_motion: sat.mean_motion,
        bstar: sat.bstar,
        operator: sat.operator || 'LEO Catalog',
        type: sat.type || 'Tracked Payload / Debris',
        apogee_km: sat.apogee_km || (sat.mean_motion ? Math.round(42164 / Math.pow(sat.mean_motion / 1.0027, 2/3) - 6378) : 520),
        perigee_km: sat.perigee_km || 498,
        period_min: sat.period_min || (sat.mean_motion ? Math.round(1440 / sat.mean_motion * 10) / 10 : 94.8),
      }));
    } catch (error) {
      console.warn('[API Service] Backend /satellites unreachable, serving mock satellites:', error.message);
      const satellitesMap = new Map();
      mockData.events.forEach((evt) => {
        const sat = evt.object_a;
        if (sat && !satellitesMap.has(sat.norad_id)) {
          satellitesMap.set(sat.norad_id, {
            ...sat,
            norad_cat_id: sat.norad_id,
            object_name: sat.name,
            active_threat_level: evt.severity,
            associated_event_id: evt.catalog_id || evt.id,
            tca: evt.tca,
            minimum_separation_km: evt.minimum_separation_km,
            threat_object: evt.object_b?.name || 'Debris',
          });
        }
      });
      return Array.from(satellitesMap.values());
    }
  },

  // GET /api/satellites/{norad_cat_id}
  async getSatelliteById(noradCatId) {
    try {
      const response = await apiClient.get(`/satellites/${noradCatId}`);
      const sat = response.data;
      return {
        ...sat,
        norad_id: sat.norad_cat_id ?? sat.norad_id,
        name: sat.object_name ?? sat.name,
        inclination_deg: sat.inclination ?? sat.inclination_deg,
      };
    } catch (error) {
      console.warn(`[API Service] Backend /satellites/${noradCatId} unreachable, serving mock data:`, error.message);
      const satellites = await this.getSatellites();
      const sat = satellites.find((s) => s.norad_id?.toString() === noradCatId?.toString() || s.norad_cat_id?.toString() === noradCatId?.toString());
      if (sat) return sat;
      return satellites[0] || null;
    }
  },

  // GET /api/satellites/{norad_cat_id}/trajectory
  async getSatelliteTrajectory(noradCatId, satelliteInfo = {}) {
    try {
      const response = await apiClient.get(`/satellites/${noradCatId}/trajectory`);
      const traj = response.data?.trajectory || (Array.isArray(response.data) ? response.data : []);
      if (traj && traj.length >= 20) {
        return traj.map((p) => ({
          x: p.x_km ?? p.x,
          y: p.y_km ?? p.y,
          z: p.z_km ?? p.z,
          x_km: p.x_km ?? p.x,
          y_km: p.y_km ?? p.y,
          z_km: p.z_km ?? p.z,
          vx: p.vx_km_s ?? p.vx,
          vy: p.vy_km_s ?? p.vy,
          vz: p.vz_km_s ?? p.vz,
          timestamp_utc: p.timestamp_utc,
          timestamp: p.timestamp_utc || p.timestamp,
        }));
      }
    } catch (error) {
      console.warn(`[API Service] Backend /satellites/${noradCatId}/trajectory unreachable or partial, generating 24h ephemeris:`, error.message);
    }

    // Return complete 24-hour orbital ephemeris
    return generate24HourEphemeris(satelliteInfo, noradCatId);
  },

  // GET /api/conjunctions
  async getConjunctions(severity = null, limit = 100, offset = 0) {
    try {
      const params = { limit, offset };
      if (severity && severity !== 'ALL') {
        params.severity = severity;
      }
      const response = await apiClient.get('/conjunctions', { params });
      const rawList = response.data?.conjunctions || (Array.isArray(response.data) ? response.data : []);
      return rawList.map((c) => {
        const reasons = parseJsonSafely(c.reasons, ['Nominal orbital screening']);
        const distance_curve = parseJsonSafely(c.distance_curve, []);
        const nameA = typeof c.object_a === 'object' ? c.object_a.name : c.object_a;
        const nameB = typeof c.object_b === 'object' ? c.object_b.name : c.object_b;
        const tca = c.tca_timestamp || c.tca;
        return {
          ...c,
          id: c.id || c.catalog_id,
          catalog_id: c.id || c.catalog_id,
          object_a: typeof c.object_a === 'object' ? c.object_a : { name: nameA, operator: 'Active Asset' },
          object_b: typeof c.object_b === 'object' ? c.object_b : { name: nameB, type: 'Debris' },
          tca,
          tca_timestamp: tca,
          reasons,
          distance_curve,
        };
      });
    } catch (error) {
      console.warn('[API Service] Backend /conjunctions unreachable, serving mock events:', error.message);
      return mockData.events;
    }
  },

  // Alias for backward compatibility
  async getEvents() {
    return this.getConjunctions();
  },

  // GET /api/conjunctions/{conjunction_id}
  async getConjunctionById(conjunctionId) {
    try {
      const response = await apiClient.get(`/conjunctions/${conjunctionId}`);
      const c = response.data;
      const reasons = parseJsonSafely(c.reasons, ['Nominal orbital screening']);
      const distance_curve = parseJsonSafely(c.distance_curve, []);
      const nameA = typeof c.object_a === 'object' ? c.object_a.name : c.object_a;
      const nameB = typeof c.object_b === 'object' ? c.object_b.name : c.object_b;
      const tca = c.tca_timestamp || c.tca;
      return {
        ...c,
        id: c.id || c.catalog_id || conjunctionId,
        catalog_id: c.id || c.catalog_id || conjunctionId,
        object_a: typeof c.object_a === 'object' ? c.object_a : { name: nameA, operator: 'Active Asset', norad_id: '—', intl_designator: '—', apogee_km: 520, perigee_km: 498, inclination_deg: 97.5 },
        object_b: typeof c.object_b === 'object' ? c.object_b : { name: nameB, type: 'Debris', norad_id: '—', intl_designator: '—', source_parent: 'Catalog Debris', apogee_km: 525, perigee_km: 495, inclination_deg: 97.6 },
        tca,
        tca_timestamp: tca,
        reasons,
        distance_curve,
      };
    } catch (error) {
      console.warn(`[API Service] Backend /conjunctions/${conjunctionId} unreachable, serving mock event:`, error.message);
      const found = mockData.events.find(
        (e) => e.id?.toString() === conjunctionId?.toString() || e.catalog_id?.toString() === conjunctionId?.toString()
      );
      return found || mockData.events[0];
    }
  },

  // Alias for backward compatibility
  async getEventById(identifier) {
    return this.getConjunctionById(identifier);
  },

  // GET /api/conjunctions/{conjunction_id}/trajectory
  async getConjunctionTrajectory(conjunctionId) {
    try {
      const response = await apiClient.get(`/conjunctions/${conjunctionId}/trajectory`);
      const data = response.data;
      const trajA = (data.trajectory_a || []).map((p) => ({
        x: p.x_km ?? p.x,
        y: p.y_km ?? p.y,
        z: p.z_km ?? p.z,
        x_km: p.x_km ?? p.x,
        y_km: p.y_km ?? p.y,
        z_km: p.z_km ?? p.z,
        vx: p.vx_km_s ?? p.vx,
        vy: p.vy_km_s ?? p.vy,
        vz: p.vz_km_s ?? p.vz,
        timestamp_utc: p.timestamp_utc,
      }));
      const trajB = (data.trajectory_b || []).map((p) => ({
        x: p.x_km ?? p.x,
        y: p.y_km ?? p.y,
        z: p.z_km ?? p.z,
        x_km: p.x_km ?? p.x,
        y_km: p.y_km ?? p.y,
        z_km: p.z_km ?? p.z,
        vx: p.vx_km_s ?? p.vx,
        vy: p.vy_km_s ?? p.vy,
        vz: p.vz_km_s ?? p.vz,
        timestamp_utc: p.timestamp_utc,
      }));
      return {
        object_a: trajA,
        object_b: trajB,
        trajectory_a: trajA,
        trajectory_b: trajB,
        distance_curve: parseJsonSafely(data.distance_curve, []),
      };
    } catch (error) {
      console.warn(`[API Service] Backend /conjunctions/${conjunctionId}/trajectory unreachable, serving mock trajectory:`, error.message);
      const event = mockData.events.find(
        (e) => e.id?.toString() === conjunctionId?.toString() || e.catalog_id?.toString() === conjunctionId?.toString()
      ) || mockData.events[0];
      return event.trajectories || null;
    }
  },

  // Refresh dashboard and conjunction data
  async refreshEphemeris() {
    const [dashboard, conjunctions] = await Promise.all([
      this.getDashboard(),
      this.getConjunctions(),
    ]);
    return {
      refreshed: true,
      dashboard,
      conjunctions,
      retrieved_at: new Date().toISOString(),
    };
  },
};

export default apiService;

