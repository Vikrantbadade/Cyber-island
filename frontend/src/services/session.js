import { api } from './api.js';
import { ENV } from '../config/env.js';

/**
 * Client-side mirror of the backend game state (team, progress, contest clock).
 * No DOM code here; UI layers subscribe via session.on(event, cb).
 *
 * Events: 'status' (contest status), 'progress', 'connection' (bool), 'auth-lost' (message), 'logout'
 */
class GameSession {
  constructor() {
    /** false only in the dev bypass (VITE_SKIP_LOGIN): everything below becomes a no-op */
    this.enabled = !ENV.SKIP_LOGIN;
    this.team = null;
    this.progress = null;
    this.contest = null;
    this.contestFetchedAt = 0;
    this.connectionOk = true;
    this.pollTimer = null;
    this.listeners = new Map();

    api.onAuthLost = (message) => this.handleAuthLost(message);
  }

  // ---------------------------------------------------------------------------
  // Tiny event emitter
  // ---------------------------------------------------------------------------
  on(event, cb) {
    if (!this.listeners.has(event)) this.listeners.set(event, new Set());
    this.listeners.get(event).add(cb);
    return () => this.listeners.get(event)?.delete(cb);
  }

  emit(event, payload) {
    this.listeners.get(event)?.forEach((cb) => {
      try {
        cb(payload);
      } catch (e) {
        console.error(`[session] listener for "${event}" threw`, e);
      }
    });
  }

  // ---------------------------------------------------------------------------
  // Auth lifecycle
  // ---------------------------------------------------------------------------
  hasStoredSession() {
    return api.hasSession();
  }

  /** Try to resume a stored session. Never throws. */
  async restore() {
    try {
      this.team = await api.getTeamProfile();
      return { ok: true };
    } catch (err) {
      // 401 already cleared the tokens; network errors keep them so a later retry can still work
      return { ok: false, message: err.message };
    }
  }

  async login(loginName, password) {
    await api.login(loginName, password);
    this.team = await api.getTeamProfile();
    return this.team;
  }

  logout() {
    api.clearTokens();
    this.reset();
    this.emit('logout');
  }

  handleAuthLost(message) {
    this.reset();
    this.emit('auth-lost', message);
  }

  reset() {
    this.stopPolling();
    this.team = null;
    this.progress = null;
    this.contest = null;
  }

  // ---------------------------------------------------------------------------
  // Contest clock
  // ---------------------------------------------------------------------------
  async refreshStatus() {
    const status = await api.getContestStatus();
    this.contest = status;
    this.contestFetchedAt = performance.now();
    this.setConnection(true);
    this.emit('status', status);
    return status;
  }

  /** Server-reported remaining seconds, counted down locally between polls. */
  remainingSeconds() {
    if (!this.contest || this.contest.status !== 'RUNNING') return 0;
    const elapsed = Math.floor((performance.now() - this.contestFetchedAt) / 1000);
    return Math.max(0, this.contest.remainingSeconds - elapsed);
  }

  /** True once the server says the contest is not running (not started / ended). */
  get locked() {
    return this.enabled && Boolean(this.contest) && this.contest.status !== 'RUNNING';
  }

  startPolling(intervalMs = ENV.STATUS_POLL_MS) {
    this.stopPolling();
    if (!this.enabled) return;
    this.pollTimer = setInterval(async () => {
      try {
        await this.refreshStatus();
      } catch (err) {
        if (err.isNetwork) this.setConnection(false);
        // 401 is handled by api.onAuthLost
      }
    }, intervalMs);
  }

  stopPolling() {
    if (this.pollTimer) clearInterval(this.pollTimer);
    this.pollTimer = null;
  }

  setConnection(ok) {
    if (this.connectionOk === ok) return;
    this.connectionOk = ok;
    this.emit('connection', ok);
  }

  // ---------------------------------------------------------------------------
  // Progress
  // ---------------------------------------------------------------------------
  async refreshProgress() {
    this.progress = await api.getTeamProgress();
    this.emit('progress', this.progress);
    return this.progress;
  }

  stageForChallenge(challengeNo) {
    return ENV.STAGE_MAP[challengeNo] ?? null;
  }

  /** Challenge numbers (1..6) whose mapped backend stage is completed. */
  completedChallengeNumbers() {
    const done = new Set(this.progress?.completedStages ?? []);
    return Object.entries(ENV.STAGE_MAP)
      .filter(([, stageId]) => done.has(stageId))
      .map(([challengeNo]) => Number(challengeNo))
      .sort((a, b) => a - b);
  }

  hintsUsedFor(stageId) {
    return this.progress?.stages?.[stageId - 1]?.hintsUsed ?? 0;
  }

  /** Report completion of the team's immediate next stage. Resolves with the fresh progress. */
  async completeStage(stageId) {
    try {
      this.progress = await api.completeStage(stageId);
    } catch (err) {
      if (err.status === 410) await this.refreshStatus().catch(() => {});
      throw err;
    }
    this.setConnection(true);
    this.emit('progress', this.progress);
    return this.progress;
  }

  /** Spend the next configured hint for a stage. Resolves with { hintOrder, penaltyApplied, penalty, netScore, ... } */
  async useHint(stageId) {
    let result;
    try {
      result = await api.useHint(stageId);
    } catch (err) {
      if (err.status === 410) await this.refreshStatus().catch(() => {});
      throw err;
    }
    if (this.progress) {
      this.progress.score = result.score;
      this.progress.penalty = result.penalty;
      this.progress.netScore = result.netScore;
      const stage = this.progress.stages?.[stageId - 1];
      if (stage) stage.hintsUsed = result.hintsUsed;
      this.emit('progress', this.progress);
    } else {
      await this.refreshProgress().catch(() => {});
    }
    return result;
  }
}

export const session = new GameSession();
