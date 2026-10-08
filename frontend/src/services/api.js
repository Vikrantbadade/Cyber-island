import { ENV } from '../config/env.js';

/** Error thrown for every failed API call. status 0 = network failure / server unreachable. */
export class ApiError extends Error {
  constructor(message, { status = 0, code = 'UNKNOWN' } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }

  get isNetwork() {
    return this.status === 0;
  }
}

const SESSION_LOST_MESSAGE =
  'Your session has expired or was opened on another device. Please log in again.';

class ApiService {
  constructor() {
    this.baseUrl = ENV.API_BASE_URL.replace(/\/+$/, '');
    this.accessToken = localStorage.getItem(ENV.STORAGE_TOKEN_KEY) || null;
    this.refreshToken = localStorage.getItem(ENV.STORAGE_REFRESH_KEY) || null;
    this.refreshPromise = null;
    /** Set by the session layer; called once when tokens become unusable. */
    this.onAuthLost = null;
  }

  // ---------------------------------------------------------------------------
  // Token storage
  // ---------------------------------------------------------------------------
  hasSession() {
    return Boolean(this.accessToken && this.refreshToken);
  }

  setTokens({ accessToken, refreshToken }) {
    if (accessToken) {
      this.accessToken = accessToken;
      localStorage.setItem(ENV.STORAGE_TOKEN_KEY, accessToken);
    }
    if (refreshToken) {
      this.refreshToken = refreshToken;
      localStorage.setItem(ENV.STORAGE_REFRESH_KEY, refreshToken);
    }
  }

  clearTokens() {
    this.accessToken = null;
    this.refreshToken = null;
    localStorage.removeItem(ENV.STORAGE_TOKEN_KEY);
    localStorage.removeItem(ENV.STORAGE_REFRESH_KEY);
  }

  handleAuthLost(message) {
    const hadSession = Boolean(this.accessToken || this.refreshToken);
    this.clearTokens();
    // Only notify once even if several in-flight requests fail together
    if (hadSession && this.onAuthLost) this.onAuthLost(message || SESSION_LOST_MESSAGE);
  }

  // ---------------------------------------------------------------------------
  // Transport
  // ---------------------------------------------------------------------------
  async send(endpoint, options = {}, auth = true) {
    const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
    if (auth && this.accessToken) headers.Authorization = `Bearer ${this.accessToken}`;

    let response;
    try {
      response = await fetch(`${this.baseUrl}${endpoint}`, { ...options, headers });
    } catch (e) {
      throw new ApiError('Cannot reach the island server. Check your connection.', {
        status: 0,
        code: 'NETWORK',
      });
    }

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      // Backend error shape: { error: { code, message } }
      throw new ApiError(data?.error?.message || `Request failed (HTTP ${response.status})`, {
        status: response.status,
        code: data?.error?.code || 'HTTP_ERROR',
      });
    }
    return data;
  }

  /** Exchange the refresh token for a new access token. true = refreshed, false = session is dead. */
  tryRefresh() {
    if (!this.refreshPromise) {
      this.refreshPromise = (async () => {
        try {
          const data = await this.send(
            '/auth/refresh',
            { method: 'POST', body: JSON.stringify({ refreshToken: this.refreshToken }) },
            false
          );
          this.setTokens({ accessToken: data.accessToken });
          return true;
        } catch (e) {
          // Only a rejected token means the session is gone; network / 5xx errors are transient
          if (e.status === 400 || e.status === 401 || e.status === 403) return false;
          throw e;
        } finally {
          this.refreshPromise = null;
        }
      })();
    }
    return this.refreshPromise;
  }

  /** Authenticated request with a single transparent refresh + retry on 401. */
  async request(endpoint, options = {}, auth = true) {
    try {
      return await this.send(endpoint, options, auth);
    } catch (err) {
      if (!auth || err.status !== 401) throw err;

      if (this.refreshToken && (await this.tryRefresh())) {
        try {
          return await this.send(endpoint, options, auth);
        } catch (retryErr) {
          if (retryErr.status === 401) this.handleAuthLost();
          throw retryErr;
        }
      }
      this.handleAuthLost();
      throw err;
    }
  }

  // ---------------------------------------------------------------------------
  // Auth
  // ---------------------------------------------------------------------------
  async login(loginName, password) {
    const data = await this.request(
      '/auth/login',
      { method: 'POST', body: JSON.stringify({ loginName, password }) },
      false
    );
    this.setTokens(data);
    return data;
  }

  // ---------------------------------------------------------------------------
  // Team + contest
  // ---------------------------------------------------------------------------
  getTeamProfile() {
    return this.request('/team/me');
  }

  getContestStatus() {
    return this.request('/contest/status');
  }

  getTeamProgress() {
    return this.request('/team/progress');
  }

  /**
   * Submit an answer for the team's next stage. The server checks it (the browser does not know the answers).
   * 200 { correct: true, progress } = recorded, 200 { correct: false } = wrong answer, 429 = too many wrong answers.
   */
  submitAnswer(stageId, answer) {
    return this.request(`/team/stages/${stageId}/submit`, {
      method: 'POST',
      body: JSON.stringify({ answer }),
    });
  }

  useHint(stageId) {
    return this.request(`/team/stages/${stageId}/hint`, { method: 'POST' });
  }
}

export const api = new ApiService();
