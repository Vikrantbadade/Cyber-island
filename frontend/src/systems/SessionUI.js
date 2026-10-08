import { session } from '../services/session.js';
import { ENV } from '../config/env.js';

const $ = (id) => document.getElementById(id);

function formatClock(totalSeconds) {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return [h, m, sec].map((n) => String(n).padStart(2, '0')).join(':');
}

/**
 * All DOM for the backend-session features: login form, full-screen gate
 * (waiting / ended / connection problem), top HUD (team, timer, score) and toasts.
 * Handlers are assigned with onclick/onsubmit so scene restarts never stack listeners.
 */
class SessionUI {
  constructor() {
    this.bound = false;
    this.gateOwner = null;
    this.hudTimer = null;
    this.hudUnsubs = [];
    this.contestUnsub = null;
    this.toastTimer = null;
    this.lastExpiryRefresh = 0;

    // Set by the active scene
    this.onLoginSubmit = null;
    this.onLogout = null;
  }

  bind() {
    if (this.bound) return;
    const form = $('login-form');
    if (!form) return;
    this.bound = true;

    form.onsubmit = (e) => {
      e.preventDefault();
      const loginName = $('login-name').value.trim();
      const password = $('login-password').value;
      if (!loginName || !password) {
        this.setLoginError('ENTER BOTH TEAM ID AND ACCESS CODE');
        return;
      }
      this.setLoginError('');
      if (this.onLoginSubmit) this.onLoginSubmit(loginName, password);
    };

    // Keep Phaser from seeing keystrokes typed into the form (it captures WASD/Space with preventDefault)
    ['login-name', 'login-password'].forEach((id) => {
      const el = $(id);
      el.addEventListener('keydown', (e) => e.stopPropagation());
      el.addEventListener('keyup', (e) => e.stopPropagation());
    });

    $('gate-logout-btn').onclick = () => (this.onLogout ? this.onLogout() : this.defaultLogout());
  }

  /** Used when no scene overrides onLogout (i.e. while in-game): clear tokens and restart from the login screen. */
  defaultLogout() {
    session.logout();
    window.location.reload();
  }

  // ---------------------------------------------------------------------------
  // LOGIN FORM
  // ---------------------------------------------------------------------------
  showLogin({ message = '', kind = 'error' } = {}) {
    this.bind();
    const server = $('login-server');
    if (server) server.textContent = new URL(ENV.API_BASE_URL, window.location.href).href;
    $('login-overlay').classList.remove('hidden');
    $('login-password').value = '';
    this.setLoginBusy(false);
    this.setLoginError(message, kind);
    setTimeout(() => {
      const target = $('login-name').value ? $('login-password') : $('login-name');
      target.focus();
    }, 60);
  }

  hideLogin() {
    const overlay = $('login-overlay');
    if (overlay) overlay.classList.add('hidden');
    const pw = $('login-password');
    if (pw) pw.value = '';
  }

  setLoginError(message, kind = 'error') {
    const el = $('login-error');
    if (!el) return;
    el.textContent = message || '';
    el.classList.toggle('info', kind === 'info');
  }

  setLoginBusy(busy) {
    ['login-name', 'login-password', 'login-submit-btn'].forEach((id) => {
      const el = $(id);
      if (el) el.disabled = busy;
    });
    const label = $('login-submit-label');
    if (label) label.textContent = busy ? 'CONNECTING...' : 'CONNECT';
  }

  // ---------------------------------------------------------------------------
  // GATE (full-screen blocker: waiting for start / contest ended / connection problem)
  // ---------------------------------------------------------------------------
  showGate({ owner = 'generic', icon = '📡', title = '', message = '', detail = '', allowLogout = true } = {}) {
    this.bind();
    this.gateOwner = owner;
    $('gate-icon').textContent = icon;
    $('gate-title').textContent = title;
    $('gate-message').textContent = message;
    $('gate-detail').textContent = detail;
    $('gate-logout-btn').classList.toggle('hidden', !allowLogout);
    $('gate-overlay').classList.remove('hidden');
  }

  /** hideGate('x') only hides a gate opened by owner 'x'; hideGate() hides whatever is showing. */
  hideGate(owner) {
    if (owner && this.gateOwner !== owner) return;
    this.gateOwner = null;
    const overlay = $('gate-overlay');
    if (overlay) overlay.classList.add('hidden');
    // If a connection-problem gate was covering a contest gate, bring the contest gate back
    if (owner === 'conn' && this.contestUnsub) this.applyContestGate(session.contest);
  }

  showContestGate(status) {
    if (status.status === 'ENDED') {
      const p = session.progress;
      this.showGate({
        owner: 'contest',
        icon: '🏁',
        title: "TIME'S UP",
        message: 'The contest has ended. Your progress is now locked.',
        detail: p ? `FINAL SCORE: ${p.netScore}` : '',
        allowLogout: true,
      });
    } else {
      this.showGate({
        owner: 'contest',
        icon: '📡',
        title: 'STANDING BY',
        message: 'Waiting for the organisers to start the contest...',
        detail: 'THIS SCREEN UNLOCKS AUTOMATICALLY',
        allowLogout: true,
      });
    }
  }

  applyContestGate(status) {
    if (!status) return;
    if (status.status === 'RUNNING') this.hideGate('contest');
    else this.showContestGate(status);
  }

  /** While watching, every contest status update opens/closes the gate (e.g. admin ends or extends the contest). */
  startContestWatch() {
    this.stopContestWatch();
    if (!session.enabled) return;
    this.contestUnsub = session.on('status', (status) => this.applyContestGate(status));
  }

  stopContestWatch() {
    if (this.contestUnsub) this.contestUnsub();
    this.contestUnsub = null;
  }

  // ---------------------------------------------------------------------------
  // HUD (team name, countdown, score)
  // ---------------------------------------------------------------------------
  showHud() {
    if (!session.enabled) return;
    this.hideHud();
    this.bind();
    $('session-hud').classList.remove('hidden');
    this.hudUnsubs = [
      session.on('progress', () => this.renderHud()),
      session.on('status', () => this.tickHud()),
      session.on('connection', (ok) => this.renderConnection(ok)),
    ];
    this.renderHud();
    this.renderConnection(session.connectionOk);
    this.hudTimer = setInterval(() => this.tickHud(), 1000);
  }

  hideHud() {
    if (this.hudTimer) clearInterval(this.hudTimer);
    this.hudTimer = null;
    this.hudUnsubs.forEach((off) => off());
    this.hudUnsubs = [];
    const hud = $('session-hud');
    if (hud) hud.classList.add('hidden');
  }

  renderHud() {
    const p = session.progress;
    const team = session.team;
    $('session-team-name').textContent = (team?.name || '-').toUpperCase();
    const net = p ? p.netScore : team ? team.score - team.penalty : 0;
    $('session-score').textContent = String(net);
    $('session-penalty').textContent = p && p.penalty > 0 ? `HINTS -${p.penalty}` : '';
    this.tickHud();
  }

  tickHud() {
    const el = $('session-timer');
    if (!el) return;
    const c = session.contest;
    el.classList.remove('low');

    if (!c || c.status === 'NOT_STARTED') {
      el.textContent = '--:--:--';
      return;
    }
    if (c.status === 'ENDED') {
      el.textContent = '00:00:00';
      return;
    }

    const remaining = session.remainingSeconds();
    el.textContent = formatClock(remaining);
    el.classList.toggle('low', remaining <= 300);

    // Local clock hit zero: confirm with the server right away instead of waiting for the next poll
    const now = Date.now();
    if (remaining === 0 && now - this.lastExpiryRefresh > 2000) {
      this.lastExpiryRefresh = now;
      session.refreshStatus().catch(() => {});
    }
  }

  renderConnection(ok) {
    const el = $('session-conn');
    if (el) el.classList.toggle('hidden', ok !== false);
  }

  // ---------------------------------------------------------------------------
  // TOAST
  // ---------------------------------------------------------------------------
  toast(message, kind = 'info', durationMs = 3500) {
    const el = $('session-toast');
    if (!el) return;
    el.textContent = message;
    el.className = `session-toast ${kind}`;
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => el.classList.add('hidden'), durationMs);
  }
}

export const sessionUI = new SessionUI();
