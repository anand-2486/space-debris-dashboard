import axios from 'axios';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

const parseJsonSafely = (value, fallback = []) => {
  if (value === null || value === undefined || value === '') {
    return fallback;
  }

  if (typeof value === 'string') {
    try {
      return JSON.parse(value);
    } catch {
      return fallback;
    }
  }

  return value;
};

const normalizeTrajectoryPoint = (point) => ({
  x_km: point.x_km,
  y_km: point.y_km,
  z_km: point.z_km,
  vx_km_s: point.vx_km_s,
  vy_km_s: point.vy_km_s,
  vz_km_s: point.vz_km_s,
  timestamp_utc: point.timestamp_utc,
});

export const apiService = {
  // -------------------------------------------------------
  // DASHBOARD
  // GET /api/dashboard
  // -------------------------------------------------------

  async getDashboard() {
    const response = await apiClient.get('/dashboard');
    return response.data;
  },

  // -------------------------------------------------------
  // SATELLITES — LIST
  // GET /api/satellites
  // -------------------------------------------------------

  async getSatellites(limit = 100, offset = 0) {
    const response = await apiClient.get('/satellites', {
      params: {
        limit,
        offset,
      },
    });

    return response.data?.satellites || [];
  },

  // -------------------------------------------------------
  // SATELLITES — DETAIL
  // GET /api/satellites/{norad_cat_id}
  // -------------------------------------------------------

  async getSatelliteById(noradCatId) {
    const response = await apiClient.get(`/satellites/${noradCatId}`);
    return response.data;
  },

  // -------------------------------------------------------
  // SATELLITES — TRAJECTORY
  // GET /api/satellites/{norad_cat_id}/trajectory
  // -------------------------------------------------------

  async getSatelliteTrajectory(noradCatId) {
    const response = await apiClient.get(
      `/satellites/${noradCatId}/trajectory`
    );

    const trajectory = response.data?.trajectory || [];

    return trajectory.map(normalizeTrajectoryPoint);
  },

  // -------------------------------------------------------
  // CONJUNCTIONS — LIST
  // GET /api/conjunctions
  // -------------------------------------------------------

  async getConjunctions(severity = null, limit = 100, offset = 0) {
    const params = {
      limit,
      offset,
    };

    if (severity && severity !== 'ALL') {
      params.severity = severity;
    }

    const response = await apiClient.get('/conjunctions', {
      params,
    });

    return (response.data?.conjunctions || []).map((conjunction) => ({
      ...conjunction,

      // object_a and object_b are OBJECT/NORAD IDS.
      object_a: conjunction.object_a,
      object_b: conjunction.object_b,

      reasons: parseJsonSafely(conjunction.reasons, []),
      distance_curve: parseJsonSafely(
        conjunction.distance_curve,
        []
      ),

      tca_timestamp: conjunction.tca_timestamp,
    }));
  },

  // -------------------------------------------------------
  // CONJUNCTION — DETAIL
  // GET /api/conjunctions/{conjunction_id}
  // -------------------------------------------------------

  async getConjunctionById(conjunctionId) {
    const response = await apiClient.get(
      `/conjunctions/${conjunctionId}`
    );

    const conjunction = response.data;

    return {
      ...conjunction,

      // These are object/NORAD IDs, NOT names.
      object_a: conjunction.object_a,
      object_b: conjunction.object_b,

      reasons: parseJsonSafely(conjunction.reasons, []),
      distance_curve: parseJsonSafely(
        conjunction.distance_curve,
        []
      ),

      tca_timestamp: conjunction.tca_timestamp,
    };
  },

  // -------------------------------------------------------
  // CONJUNCTION — TRAJECTORY
  // GET /api/conjunctions/{conjunction_id}/trajectory
  // -------------------------------------------------------

  async getConjunctionTrajectory(conjunctionId) {
    const response = await apiClient.get(
      `/conjunctions/${conjunctionId}/trajectory`
    );

    const data = response.data;

    const trajectoryA = (data.trajectory_a || []).map(
      normalizeTrajectoryPoint
    );

    const trajectoryB = (data.trajectory_b || []).map(
      normalizeTrajectoryPoint
    );

    return {
      conjunction_id: data.conjunction_id,
      object_a: data.object_a,
      object_b: data.object_b,
      tca_timestamp: data.tca_timestamp,
      trajectory_a: trajectoryA,
      trajectory_b: trajectoryB,
      distance_curve: parseJsonSafely(
        data.distance_curve,
        []
      ),
    };
  },

  // -------------------------------------------------------
  // HEALTH
  // GET /api/health
  // -------------------------------------------------------

  async getHealth() {
    const response = await apiClient.get('/health');
    return response.data;
  },

  // -------------------------------------------------------
  // REFRESH
  // -------------------------------------------------------

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