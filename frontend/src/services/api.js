import { ENV } from '../config/env.js';

class ApiService {
  constructor() {
    this.baseUrl = ENV.API_BASE_URL;
    this.token = localStorage.getItem(ENV.STORAGE_TOKEN_KEY) || null;
  }

  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem(ENV.STORAGE_TOKEN_KEY, token);
    } else {
      localStorage.removeItem(ENV.STORAGE_TOKEN_KEY);
    }
  }

  async request(endpoint, options = {}) {
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers,
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || `HTTP Error ${response.status}`);
      }

      return data;
    } catch (err) {
      console.warn(`[API] Call to ${endpoint} failed:`, err.message);
      throw err;
    }
  }

  // Auth Endpoints
  async loginTeam(teamName, accessCode) {
    const data = await this.request('/auth/team/login', {
      method: 'POST',
      body: JSON.stringify({ teamName, accessCode }),
    });
    if (data.accessToken) {
      this.setToken(data.accessToken);
    }
    return data;
  }

  // Contest Status Endpoint
  async getContestStatus() {
    return this.request('/contest/status');
  }

  // Team Progress Endpoints
  async getTeamProgress() {
    return this.request('/team/progress');
  }

  async completeStage(stageId, answer) {
    return this.request(`/team/stages/${stageId}/complete`, {
      method: 'POST',
      body: JSON.stringify({ answer }),
    });
  }

  async getHint(stageId) {
    return this.request(`/team/stages/${stageId}/hint`, {
      method: 'POST',
    });
  }
}

export const api = new ApiService();
