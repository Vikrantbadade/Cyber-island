/* CyberIsland admin page. Plain JS, no build step, no external resources.
 * Served by the backend at /admin; talks to /api/admin/* on the same origin with an admin JWT.
 * Everything from the API is rendered with textContent (never innerHTML). */
(() => {
  'use strict';

  const API_BASE = '/api';
  const TOKEN_KEY = 'cyberisland_admin_token';
  const POLL_KEY = 'cyberisland_admin_poll_seconds';
  const POLL_CHOICES = [0, 3, 5, 10, 30];
  const DEFAULT_POLL_SECONDS = 5;
  const TOTAL_STAGES = 6;
  const SESSION_LOST_MESSAGE = 'Session expired or not authorised. Please sign in again.';
  const SIGNED_OUT_ELSEWHERE_MESSAGE =
    'You were signed out: the admin account was signed in somewhere else (only one admin session is allowed), or the session expired.';

  const $ = (id) => document.getElementById(id);
  const make = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined && text !== null) node.textContent = String(text);
    return node;
  };
  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const safe = (fn, fallback) => {
    try { return fn(); } catch (_) { return fallback; }
  };

  // Token lives in sessionStorage: survives a page refresh, gone when the tab is closed
  const tokenStore = {
    get: () => safe(() => sessionStorage.getItem(TOKEN_KEY), null),
    set: (v) => safe(() => sessionStorage.setItem(TOKEN_KEY, v)),
    clear: () => safe(() => sessionStorage.removeItem(TOKEN_KEY)),
  };
  const prefStore = {
    get: () => safe(() => localStorage.getItem(POLL_KEY), null),
    set: (v) => safe(() => localStorage.setItem(POLL_KEY, String(v))),
  };

  class ApiError extends Error {
    constructor(message, status, code) {
      super(message);
      this.name = 'ApiError';
      this.status = status;
      this.code = code;
    }
  }

  const state = {
    token: null,
    epoch: 0,               // bumps on logout so late responses are ignored
    contest: null,           // null while the game data has not been initialized yet
    setup: null,             // GET /admin/setup/status
    contestFetchedAt: 0,
    board: [],
    prevKeys: new Map(),    // team id -> "net|completed", used to flash changed rows
    lastUpdated: null,
    connectionError: '',
    pollSeconds: DEFAULT_POLL_SECONDS,
    pollTimer: null,
    tickTimer: null,
    inFlight: false,
    filter: '',
    openTeamId: null,
    detail: null,
    lastExpiryRefresh: 0,
    deadlinePrefilled: false,
    bound: false,
  };

  // ---------------------------------------------------------------------------
  // Formatting
  // ---------------------------------------------------------------------------
  const pad = (n) => String(n).padStart(2, '0');

  function fmtClock(totalSeconds) {
    if (totalSeconds === null || totalSeconds === undefined) return '-';
    const s = Math.max(0, Math.floor(totalSeconds));
    return `${Math.floor(s / 3600)}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)}`;
  }

  function fmtDateTime(iso, timeZone) {
    if (!iso) return '-';
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return '-';
    try {
      return new Intl.DateTimeFormat('en-IN', { timeZone, dateStyle: 'medium', timeStyle: 'medium' }).format(date);
    } catch (_) {
      return date.toLocaleString();
    }
  }

  function toLocalInputValue(date) {
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  }

  function toast(message, kind = 'info', ms = 4500) {
    const node = make('div', `toast ${kind}`, message);
    $('toasts').appendChild(node);
    setTimeout(() => node.remove(), ms);
  }

  // ---------------------------------------------------------------------------
  // API
  // ---------------------------------------------------------------------------
  async function api(path, { method = 'GET', body, auth = true, raw = false } = {}) {
    const headers = {};
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    if (auth && state.token) headers.Authorization = `Bearer ${state.token}`;

    let res;
    try {
      res = await fetch(API_BASE + path, {
        method,
        headers,
        body: body !== undefined ? JSON.stringify(body) : undefined,
        cache: 'no-store',
      });
    } catch (_) {
      throw new ApiError('Cannot reach the server.', 0, 'NETWORK');
    }

    if (res.ok) return raw ? res : res.json().catch(() => ({}));

    const data = await res.json().catch(() => ({}));
    const err = new ApiError(
      (data && data.error && data.error.message) || `Request failed (HTTP ${res.status})`,
      res.status,
      data && data.error && data.error.code
    );
    if (auth && (res.status === 401 || res.status === 403)) {
      handleAuthLost(res.status === 401 ? SIGNED_OUT_ELSEWHERE_MESSAGE : undefined);
    }
    throw err;
  }

  async function fetchLeaderboard() {
    const entries = [];
    const pageSize = 500;
    for (let page = 1; ; page++) {
      const r = await api(`/admin/leaderboard?page=${page}&pageSize=${pageSize}`);
      entries.push(...r.entries);
      if (entries.length >= r.total || r.entries.length === 0) break;
    }
    return entries;
  }

  // ---------------------------------------------------------------------------
  // Views / session
  // ---------------------------------------------------------------------------
  function showView(name) {
    $('boot').hidden = name !== 'boot';
    $('login-view').hidden = name !== 'login';
    $('dashboard-view').hidden = name !== 'dashboard';
  }

  function clearSession() {
    state.epoch++;
    state.token = null;
    tokenStore.clear();
    clearTimeout(state.pollTimer);
    clearInterval(state.tickTimer);
    state.pollTimer = null;
    state.tickTimer = null;
    state.inFlight = false;
    state.contest = null;
    state.setup = null;
    state.board = [];
    state.prevKeys = new Map();
    state.lastUpdated = null;
    state.deadlinePrefilled = false;
    closeModal();
    closeAddModal();
    // Remove rendered data from the DOM so nothing stays visible after logout / expiry
    $('board-body').replaceChildren();
    $('deadline-input').value = '';
    $('filter-input').value = '';
    state.filter = '';
    $('conn-banner').hidden = true;
    $('setup-banner').hidden = true;
    $('import-file').value = '';
  }

  function toLogin(message) {
    clearSession();
    showView('login');
    setLoginError(message || '');
    setLoginBusy(false);
    setTimeout(() => $('login-name').focus(), 30);
  }

  function handleAuthLost(message) {
    if (!state.token) return;
    toLogin(message || SESSION_LOST_MESSAGE);
  }

  function setLoginError(message) {
    $('login-error').textContent = message || '';
  }

  function setLoginBusy(busy) {
    $('login-submit').disabled = busy;
    $('login-name').disabled = busy;
    $('login-password').disabled = busy;
    $('login-submit').textContent = busy ? 'Signing in...' : 'Sign in';
  }

  async function submitLogin(event) {
    event.preventDefault();
    const loginName = $('login-name').value.trim();
    const password = $('login-password').value;
    if (!loginName || !password) {
      setLoginError('Enter both the login name and the password.');
      return;
    }
    setLoginError('');
    setLoginBusy(true);
    try {
      const data = await api('/admin/auth/login', { method: 'POST', body: { loginName, password }, auth: false });
      if (!data.accessToken) throw new ApiError('Unexpected response from the server.', 0, 'BAD_RESPONSE');
      state.token = data.accessToken;
      tokenStore.set(data.accessToken);
      $('login-password').value = '';

      const ok = await refresh(true);
      if (ok) {
        showView('dashboard');
        startLive();
      } else if (state.token) {
        toLogin(`Signed in, but loading data failed${state.connectionError ? ': ' + state.connectionError : ''}.`);
      }
    } catch (err) {
      setLoginError(err.status === 401 ? 'Invalid admin credentials.' : err.message);
    } finally {
      setLoginBusy(false);
    }
  }

  // ---------------------------------------------------------------------------
  // Live data
  // ---------------------------------------------------------------------------
  function setConnection(ok, message) {
    state.connectionError = ok ? '' : message || 'Connection problem';
    const banner = $('conn-banner');
    banner.hidden = ok;
    if (!ok) {
      const when = state.lastUpdated ? ` Last data received at ${state.lastUpdated.toLocaleTimeString()}.` : '';
      banner.textContent = `Connection problem: ${state.connectionError}${when} Retrying...`;
    }
  }

  /** Fetch contest status + leaderboard and re-render. Never throws; resolves true on success. */
  async function refresh(initial = false) {
    if (!state.token || state.inFlight) return false;
    state.inFlight = true;
    const epoch = state.epoch;
    try {
      const [contest, board, setup] = await Promise.all([
        // A fresh database has no contest row yet: not an error, the Setup card offers to create it
        api('/contest/status').catch((err) => {
          if (err.code === 'CONTEST_MISSING') return null;
          throw err;
        }),
        fetchLeaderboard(),
        api('/admin/setup/status'),
      ]);
      if (epoch !== state.epoch || !state.token) return false;

      state.contest = contest;
      state.setup = setup;
      state.contestFetchedAt = performance.now();
      state.board = board;
      state.lastUpdated = new Date();
      setConnection(true);
      render();
      if (state.openTeamId) refreshOpenTeam();
      return true;
    } catch (err) {
      if (epoch !== state.epoch || !state.token) return false;
      if (err.status === 401 || err.status === 403) return false; // already handled by api()
      setConnection(false, err.message);
      return false;
    } finally {
      if (epoch === state.epoch) state.inFlight = false;
    }
  }

  /** Like refresh(), but waits for a poll that is already running (used right after an action). */
  async function refreshNow() {
    for (let i = 0; i < 25 && state.inFlight; i++) await sleep(120);
    return refresh();
  }

  function scheduleNext() {
    clearTimeout(state.pollTimer);
    state.pollTimer = null;
    if (!state.token || state.pollSeconds <= 0) return;
    state.pollTimer = setTimeout(async () => {
      if (!state.token) return;
      if (!document.hidden) await refresh();
      scheduleNext();
    }, state.pollSeconds * 1000);
  }

  function startLive() {
    scheduleNext();
    clearInterval(state.tickTimer);
    state.tickTimer = setInterval(tick, 1000);
    tick();
  }

  // ---------------------------------------------------------------------------
  // Rendering
  // ---------------------------------------------------------------------------
  function render() {
    renderContest();
    renderStats();
    renderBoard();
    renderSetup();
    tick();
  }

  function renderSetup() {
    const s = state.setup;
    $('setup-banner').hidden = !s || s.initialized;
    if (!s) return;
    const counts = `${s.stages}/${s.expectedStages} stages, ${s.hints}/${s.expectedHints} hints`;
    $('setup-status').textContent = s.initialized
      ? `Initialized (${counts})`
      : `NOT initialized (${counts}, contest record ${s.contestExists ? 'present' : 'missing'})`;
    $('setup-status').classList.toggle('pen', !s.initialized);
    $('setup-teams').textContent = String(s.teams);
  }

  function contestLabel(c) {
    if (c.status === 'NOT_STARTED') return { text: 'NOT STARTED', cls: 'idle' };
    if (c.status === 'RUNNING') return { text: 'RUNNING', cls: 'live' };
    return { text: c.resultsFinalized ? 'ENDED - FINALIZED' : 'ENDED', cls: 'ended' };
  }

  function renderContest() {
    const c = state.contest;
    if (!c) {
      applyButtonStates();
      return;
    }
    const label = contestLabel(c);
    const badge = $('status-badge');
    badge.textContent = label.text;
    badge.className = `badge ${label.cls}`;

    $('c-status').textContent = label.text;
    $('c-start').textContent = fmtDateTime(c.startAt, c.timezone);
    $('c-end').textContent = fmtDateTime(c.endAt, c.timezone);
    let duration = `${c.durationMinutes} min configured`;
    if (c.startAt && c.endAt) {
      const windowSeconds = (new Date(c.endAt).getTime() - new Date(c.startAt).getTime()) / 1000;
      duration += ` (current window ${fmtClock(windowSeconds)})`;
    }
    $('c-duration').textContent = duration;
    $('c-tz').textContent = c.timezone;
    $('c-results').textContent = c.resultsFinalized ? 'Finalized (frozen)' : 'Not finalized';

    const browserTz = safe(() => Intl.DateTimeFormat().resolvedOptions().timeZone, 'local');
    $('deadline-hint').textContent = `Interpreted in your browser's timezone (${browserTz}). Contest timezone: ${c.timezone}.`;

    // Pre-fill the deadline field once with the current end time so it is easy to nudge
    if (!state.deadlinePrefilled && c.endAt) {
      const d = new Date(c.endAt);
      if (!Number.isNaN(d.getTime())) $('deadline-input').value = toLocalInputValue(d);
      state.deadlinePrefilled = true;
    }
    applyButtonStates();
  }

  function renderStats() {
    const board = state.board;
    const teams = board.length;
    const online = board.filter((t) => t.sessionActive).length;
    const finished = board.filter((t) => t.completedStages >= TOTAL_STAGES).length;
    const avg = teams ? board.reduce((sum, t) => sum + t.completedStages, 0) / teams : 0;
    $('s-teams').textContent = String(teams);
    $('s-online').textContent = String(online);
    $('s-finished').textContent = String(finished);
    $('s-avg').textContent = avg.toFixed(1);
  }

  function renderBoard() {
    const q = state.filter.trim().toLowerCase();
    const rows = q
      ? state.board.filter((t) => t.name.toLowerCase().includes(q) || t.loginName.toLowerCase().includes(q))
      : state.board;

    $('board-count').textContent = q
      ? `Showing ${rows.length} of ${state.board.length} teams`
      : `${state.board.length} teams`;
    $('board-empty').hidden = rows.length > 0;

    const nextKeys = new Map();
    state.board.forEach((t) => nextKeys.set(t.id, `${t.netScore}|${t.completedStages}`));

    const frag = document.createDocumentFragment();
    rows.forEach((t) => {
      const tr = make('tr', 'row');
      tr.dataset.id = t.id;
      tr.tabIndex = 0;
      if (state.prevKeys.size > 0 && state.prevKeys.get(t.id) !== nextKeys.get(t.id)) tr.classList.add('flash');

      const teamCell = make('td');
      teamCell.append(make('div', 'team-name', t.name), make('div', 'muted small', t.loginName));

      const progressCell = make('td');
      const segs = make('span', 'segs');
      for (let i = 0; i < TOTAL_STAGES; i++) segs.append(make('span', i < t.completedStages ? 'seg done' : 'seg'));
      progressCell.append(segs, make('span', 'progress-text', `${t.completedStages}/${TOTAL_STAGES}`));

      const onlineCell = make('td', 'center');
      const dot = make('span', t.sessionActive ? 'dot on' : 'dot');
      dot.title = t.sessionActive ? 'Has a valid login session' : 'No active session';
      onlineCell.append(dot);

      tr.append(
        make('td', 'num rank', t.rank),
        teamCell,
        progressCell,
        make('td', 'num', t.score),
        make('td', t.penalty > 0 ? 'num pen' : 'num', t.penalty),
        make('td', 'num net', t.netScore),
        make('td', 'num', t.finalStageElapsed === null ? '-' : fmtClock(t.finalStageElapsed)),
        onlineCell
      );
      frag.append(tr);
    });
    $('board-body').replaceChildren(frag);
    state.prevKeys = nextKeys;
  }

  /** Runs every second: countdown + "updated Xs ago". */
  function tick() {
    const c = state.contest;
    const timer = $('timer');
    if (c) {
      if (c.status === 'RUNNING') {
        const elapsed = Math.floor((performance.now() - state.contestFetchedAt) / 1000);
        const remaining = Math.max(0, c.remainingSeconds - elapsed);
        timer.textContent = fmtClock(remaining);
        timer.classList.toggle('low', remaining <= 300);
        // Local clock reached zero: confirm with the server instead of waiting for the next poll
        if (remaining === 0 && Date.now() - state.lastExpiryRefresh > 2000) {
          state.lastExpiryRefresh = Date.now();
          refresh();
        }
      } else {
        timer.textContent = c.status === 'ENDED' ? '0:00:00' : '-:--:--';
        timer.classList.remove('low');
      }
    }
    if (state.lastUpdated) {
      const ago = Math.max(0, Math.round((Date.now() - state.lastUpdated.getTime()) / 1000));
      $('updated').textContent = `Updated ${ago}s ago`;
    }
  }

  // ---------------------------------------------------------------------------
  // Buttons: one place decides what is enabled
  // ---------------------------------------------------------------------------
  function setBtn(btn, disabled) {
    btn.disabled = Boolean(disabled) || btn.dataset.busy === '1';
  }

  function applyButtonStates() {
    const c = state.contest;
    const finalized = Boolean(c && c.resultsFinalized);
    const adjustable = Boolean(c) && c.status !== 'NOT_STARTED' && !finalized;

    setBtn($('btn-start'), !c || c.status !== 'NOT_STARTED');
    setBtn($('btn-end'), !c || c.status !== 'RUNNING');
    setBtn($('btn-extend'), !adjustable);
    setBtn($('btn-deadline'), !adjustable);
    $('extend-minutes').disabled = !adjustable;
    $('deadline-input').disabled = !adjustable;
    setBtn($('btn-finalize'), !c || !(c.status === 'ENDED' && !finalized));
    setBtn($('btn-csv'), !finalized);
    setBtn($('btn-reset'), !c || !(c.status === 'ENDED' && finalized));
    setBtn($('btn-live-csv'), state.board.length === 0);
    setBtn($('btn-seed-base'), Boolean(c && c.status === 'RUNNING')); // refused by the server while running
    setBtn($('btn-import-teams'), false);

    const d = state.detail;
    setBtn($('tm-complete'), !d || d.nextStage === null);
    setBtn($('tm-score-set'), !d);
    setBtn($('tm-penalty-set'), !d);
    setBtn($('tm-delete'), !d);
    setBtn($('add-submit'), false); // only locks while a create request is in flight
  }

  /** Runs an async action with the button locked; errors become toasts. */
  async function runAction(btn, task) {
    if (btn.dataset.busy === '1') return;
    btn.dataset.busy = '1';
    applyButtonStates();
    try {
      await task();
    } catch (err) {
      if (err.status !== 401 && err.status !== 403) toast(err.message || 'Action failed', 'error');
    } finally {
      delete btn.dataset.busy;
      applyButtonStates();
    }
  }

  // ---------------------------------------------------------------------------
  // Contest actions
  // ---------------------------------------------------------------------------
  function bindContestActions() {
    $('btn-start').addEventListener('click', () => {
      if (!window.confirm('Start the contest now?\n\nThe clock starts immediately and teams can begin playing.')) return;
      runAction($('btn-start'), async () => {
        await api('/admin/contest/start', { method: 'POST' });
        toast('Contest started.', 'success');
        await refreshNow();
      });
    });

    $('btn-end').addEventListener('click', () => {
      if (!window.confirm('End the contest now?\n\nTeams are locked out immediately. You can reopen it later with Extend / Set deadline until results are finalized.')) return;
      runAction($('btn-end'), async () => {
        await api('/admin/contest/end', { method: 'POST' });
        toast('Contest ended.', 'success');
        await refreshNow();
      });
    });

    $('btn-extend').addEventListener('click', () => {
      const minutes = Number($('extend-minutes').value);
      if ($('extend-minutes').value.trim() === '' || !Number.isInteger(minutes) || minutes < 1) {
        toast('Enter a whole number of minutes (1 or more).', 'error');
        return;
      }
      runAction($('btn-extend'), async () => {
        await api('/admin/contest/extend-duration', { method: 'POST', body: { additionalMinutes: minutes } });
        toast(`Extended by ${minutes} min.`, 'success');
        state.deadlinePrefilled = false; // re-fill the deadline field with the new end time
        await refreshNow();
      });
    });

    $('btn-deadline').addEventListener('click', () => {
      const value = $('deadline-input').value;
      const date = value ? new Date(value) : null;
      if (!date || Number.isNaN(date.getTime())) {
        toast('Pick a date and time for the new deadline.', 'error');
        return;
      }
      if (date.getTime() <= Date.now()) {
        toast('The new deadline must be in the future.', 'error');
        return;
      }
      runAction($('btn-deadline'), async () => {
        await api('/admin/contest/set-deadline', { method: 'POST', body: { endAt: date.toISOString() } });
        toast('Deadline updated.', 'success');
        state.deadlinePrefilled = false;
        await refreshNow();
      });
    });

    $('btn-finalize').addEventListener('click', () => {
      if (!window.confirm('Finalize the official results?\n\nThis freezes the current leaderboard as the official result. It can only be done once, and the contest can no longer be extended or reopened afterwards.')) return;
      runAction($('btn-finalize'), async () => {
        const r = await api('/admin/results/finalize', { method: 'POST' });
        toast(`Results finalized (${r.teams} teams).`, 'success');
        await refreshNow();
      });
    });

    $('btn-reset').addEventListener('click', () => {
      const typed = window.prompt(
        'Reset the contest and host it again?\n\nThis clears ALL team scores, penalties, stage progress and hints, and logs every team out. Teams and the already-finalized results are kept.\n\nType RESET to confirm:'
      );
      if (typed === null) return;
      if (typed.trim() !== 'RESET') {
        toast('Not reset: type RESET exactly.', 'error');
        return;
      }
      runAction($('btn-reset'), async () => {
        await api('/admin/contest/reset', { method: 'POST', body: { confirm: 'RESET' } });
        $('deadline-input').value = ''; // stale deadline from the previous run
        state.deadlinePrefilled = false;
        toast('Contest reset. Press "Start contest" when ready.', 'success', 7000);
        await refreshNow();
      });
    });

    $('btn-csv').addEventListener('click', () => {
      runAction($('btn-csv'), async () => {
        const res = await api('/admin/results/csv', { raw: true });
        saveBlob(await res.blob(), 'cyberisland-official-results.csv');
        toast('Official CSV downloaded.', 'success');
      });
    });

    $('btn-live-csv').addEventListener('click', exportLiveCsv);
  }

  // ---------------------------------------------------------------------------
  // Setup: manual seeding (nothing is seeded automatically when the server starts)
  // ---------------------------------------------------------------------------
  function bindSetupActions() {
    $('btn-seed-base').addEventListener('click', () => {
      if (!window.confirm('Initialize game data?\n\nCreates the contest record and the stages, scores and hints defined in the server configuration. Safe to repeat. It never touches teams, progress or scores.')) return;
      runAction($('btn-seed-base'), async () => {
        const r = await api('/admin/setup/initialize', { method: 'POST' });
        toast(`Game data ready (${r.stages} stages, ${r.hints} hints).`, 'success');
        state.deadlinePrefilled = false;
        await refreshNow();
      });
    });

    $('btn-import-teams').addEventListener('click', () => {
      const file = $('import-file').files[0];
      if (!file) {
        toast('Choose a teams JSON file first.', 'error');
        return;
      }
      runAction($('btn-import-teams'), async () => {
        let parsed;
        try {
          parsed = JSON.parse(await file.text());
        } catch (_) {
          toast('That file is not valid JSON.', 'error');
          return;
        }
        const teams = Array.isArray(parsed) ? parsed : parsed && parsed.teams;
        if (!Array.isArray(teams) || teams.length === 0) {
          toast('Expected a JSON array like [{ "name": "...", "loginName": "...", "password": "..." }].', 'error');
          return;
        }
        if (!window.confirm(`Import ${teams.length} teams?\n\nNew login IDs are created. Existing login IDs get their name and password updated; their progress and score are kept. Teams missing from the file are not deleted.`)) return;
        const r = await api('/admin/setup/teams', { method: 'POST', body: { teams } });
        toast(`Teams imported: ${r.created} new, ${r.updated} updated.`, 'success', 7000);
        $('import-file').value = '';
        await refreshNow();
      });
    });
  }

  // ---------------------------------------------------------------------------
  // CSV helpers
  // ---------------------------------------------------------------------------
  function saveBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1500);
  }

  function csvCell(value, isText) {
    if (value === null || value === undefined) return '';
    let s = String(value);
    // Neutralise spreadsheet formulas in free-text cells (team names etc.)
    if (isText && /^[=+\-@\t\r]/.test(s)) s = `'${s}`;
    return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  }

  function exportLiveCsv() {
    const header = [
      'rank', 'team_id', 'team_name', 'login_name', 'completed_stages',
      'score', 'penalty', 'net_score', 'final_stage_elapsed_seconds', 'session_active',
    ];
    const lines = [header.join(',')];
    state.board.forEach((t) => {
      lines.push([
        csvCell(t.rank), csvCell(t.id), csvCell(t.name, true), csvCell(t.loginName, true),
        csvCell(t.completedStages), csvCell(t.score), csvCell(t.penalty), csvCell(t.netScore),
        csvCell(t.finalStageElapsed), csvCell(t.sessionActive),
      ].join(','));
    });
    const d = new Date();
    const stamp = `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
    // BOM so Excel reads UTF-8 team names correctly
    saveBlob(new Blob(['\ufeff' + lines.join('\r\n') + '\r\n'], { type: 'text/csv;charset=utf-8' }), `cyberisland-live-leaderboard-${stamp}.csv`);
    toast('Live leaderboard exported (not the official result).', 'info');
  }

  // ---------------------------------------------------------------------------
  // Team detail modal
  // ---------------------------------------------------------------------------
  function closeModal() {
    state.openTeamId = null;
    state.detail = null;
    $('team-modal').hidden = true;
    applyButtonStates();
  }

  async function openTeam(id) {
    state.openTeamId = id;
    state.detail = null;
    const known = state.board.find((t) => t.id === id);
    $('tm-title').textContent = known ? known.name : 'Team';
    $('tm-sub').textContent = 'Loading...';
    $('tm-stages-body').replaceChildren();
    ['tm-rank', 'tm-net', 'tm-score', 'tm-penalty', 'tm-completed', 'tm-online'].forEach((i) => {
      $(i).textContent = '-';
    });
    $('tm-score-input').value = '';
    $('tm-penalty-input').value = '';
    $('tm-complete').textContent = 'Complete next stage';
    $('team-modal').hidden = false;
    applyButtonStates();

    try {
      const detail = await api(`/admin/teams/${encodeURIComponent(id)}`);
      if (state.openTeamId !== id) return;
      renderDetail(detail, true);
    } catch (err) {
      if (state.openTeamId !== id) return;
      if (err.status !== 401 && err.status !== 403) {
        toast(err.message, 'error');
        closeModal();
      }
    }
  }

  function renderDetail(d, resetInputs) {
    state.detail = d;
    const onBoard = state.board.find((t) => t.id === d.id);

    $('tm-title').textContent = d.name;
    $('tm-sub').textContent = `Login ID: ${d.loginName}`;
    $('tm-rank').textContent = onBoard ? `#${onBoard.rank}` : '-';
    $('tm-net').textContent = String(d.netScore);
    $('tm-score').textContent = String(d.score);
    $('tm-penalty').textContent = String(d.penalty);
    $('tm-completed').textContent = `${d.completedStages}/${TOTAL_STAGES}`;
    $('tm-online').textContent = d.sessionActive ? 'Yes' : 'No';

    const body = $('tm-stages-body');
    const frag = document.createDocumentFragment();
    d.stages.forEach((s) => {
      const done = s.completedElapsedSeconds !== null;
      const isNext = !done && s.stageId === d.nextStage;
      const tr = make('tr');
      tr.append(
        make('td', 'num', s.stageId),
        make('td', done ? 'state-done' : isNext ? 'state-next' : 'state-locked', done ? 'Completed' : isNext ? 'Next' : 'Locked'),
        make('td', 'num', done ? fmtClock(s.completedElapsedSeconds) : '-'),
        make('td', 'num', s.hintsUsed)
      );
      frag.append(tr);
    });
    body.replaceChildren(frag);

    $('tm-complete').textContent = d.nextStage === null ? 'All stages complete' : `Complete stage ${d.nextStage}`;
    if (resetInputs) {
      $('tm-score-input').value = String(d.score);
      $('tm-penalty-input').value = String(d.penalty);
    }
    applyButtonStates();
  }

  /** Keep an open detail view fresh on every poll without touching the input fields. */
  async function refreshOpenTeam() {
    const id = state.openTeamId;
    if (!id) return;
    try {
      const d = await api(`/admin/teams/${encodeURIComponent(id)}`);
      if (state.openTeamId === id) renderDetail(d, false);
    } catch (err) {
      // Deleted from somewhere else (another admin tab, SQL): do not leave a dead dialog open
      if (err.status === 404 && state.openTeamId === id) {
        closeModal();
        toast('That team no longer exists.', 'info');
      }
      /* any other error: the next poll will try again */
    }
  }

  function readWholeNumber(inputId, label) {
    const raw = $(inputId).value.trim();
    const n = Number(raw);
    if (raw === '' || !Number.isInteger(n) || n < 0) {
      toast(`${label} must be a whole number, 0 or more.`, 'error');
      return null;
    }
    return n;
  }

  function bindTeamActions() {
    $('tm-close').addEventListener('click', closeModal);
    $('team-modal').addEventListener('click', (e) => {
      if (e.target === $('team-modal')) closeModal();
    });

    $('tm-complete').addEventListener('click', () => {
      const d = state.detail;
      if (!d || d.nextStage === null) return;
      if (!window.confirm(`Mark stage ${d.nextStage} as completed for "${d.name}"?\n\nThis awards the stage score and records the current time. It cannot be undone from this page.`)) return;
      runAction($('tm-complete'), async () => {
        const updated = await api(`/admin/teams/${encodeURIComponent(d.id)}/stages/${d.nextStage}/complete`, { method: 'POST' });
        if (state.openTeamId === d.id) renderDetail(updated, true);
        toast(`Stage ${d.nextStage} completed for ${d.name}.`, 'success');
        await refreshNow();
      });
    });

    $('tm-delete').addEventListener('click', () => {
      const d = state.detail;
      if (!d) return;
      const live = state.contest && state.contest.status === 'RUNNING';
      const typed = window.prompt(
        `Delete team "${d.name}" permanently?\n\nThis erases its progress (${d.completedStages}/${TOTAL_STAGES} stages), score and hints, and logs it out immediately.` +
          (live ? '\n\nThe contest is RUNNING right now.' : '') +
          `\n\nType the team's login ID (${d.loginName}) to confirm:`
      );
      if (typed === null) return;
      if (typed.trim() !== d.loginName) {
        toast('Login ID did not match. Team not deleted.', 'error');
        return;
      }
      runAction($('tm-delete'), async () => {
        await api(`/admin/teams/${encodeURIComponent(d.id)}`, { method: 'DELETE' });
        closeModal();
        toast(`Team "${d.name}" deleted.`, 'success');
        await refreshNow();
      });
    });

    $('tm-score-set').addEventListener('click', () => {
      const d = state.detail;
      const value = readWholeNumber('tm-score-input', 'Score');
      if (!d || value === null) return;
      if (!window.confirm(`Set the score of "${d.name}" to ${value} (currently ${d.score})?`)) return;
      runAction($('tm-score-set'), async () => {
        const updated = await api(`/admin/teams/${encodeURIComponent(d.id)}/score`, { method: 'PATCH', body: { score: value } });
        if (state.openTeamId === d.id) renderDetail(updated, true);
        toast(`Score set to ${value}.`, 'success');
        await refreshNow();
      });
    });

    $('tm-penalty-set').addEventListener('click', () => {
      const d = state.detail;
      const value = readWholeNumber('tm-penalty-input', 'Penalty');
      if (!d || value === null) return;
      if (!window.confirm(`Set the penalty of "${d.name}" to ${value} (currently ${d.penalty})?`)) return;
      runAction($('tm-penalty-set'), async () => {
        const updated = await api(`/admin/teams/${encodeURIComponent(d.id)}/penalty`, { method: 'PATCH', body: { penalty: value } });
        if (state.openTeamId === d.id) renderDetail(updated, true);
        toast(`Penalty set to ${value}.`, 'success');
        await refreshNow();
      });
    });
  }

  // ---------------------------------------------------------------------------
  // Add / delete team
  // ---------------------------------------------------------------------------
  const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no look-alikes (0/O, 1/I/L)

  function generateCode(length = 8) {
    const bytes = new Uint8Array(length);
    crypto.getRandomValues(bytes);
    return Array.from(bytes, (b) => CODE_ALPHABET[b % CODE_ALPHABET.length]).join('');
  }

  function openAddModal() {
    $('add-form').reset();
    $('add-error').textContent = '';
    $('add-modal').hidden = false;
    setTimeout(() => $('add-name').focus(), 30);
  }

  function closeAddModal() {
    $('add-modal').hidden = true;
    $('add-error').textContent = '';
  }

  function bindAddTeam() {
    $('btn-add-team').addEventListener('click', openAddModal);
    $('add-close').addEventListener('click', closeAddModal);
    $('add-cancel').addEventListener('click', closeAddModal);
    $('add-modal').addEventListener('click', (e) => {
      if (e.target === $('add-modal')) closeAddModal();
    });
    $('add-generate').addEventListener('click', () => {
      $('add-password').value = generateCode();
    });

    $('add-form').addEventListener('submit', (event) => {
      event.preventDefault();
      const name = $('add-name').value.trim();
      const loginName = $('add-login').value.trim();
      const password = $('add-password').value;
      const fail = (m) => { $('add-error').textContent = m; };

      if (!name) return fail('Enter a team name.');
      if (!loginName) return fail('Enter a login ID.');
      if (/\s/.test(loginName)) return fail('The login ID must not contain spaces.');
      if (!password) return fail('Enter a password (or press Generate).');
      if (state.board.some((t) => t.loginName === loginName)) return fail(`Login ID "${loginName}" is already in use.`);
      $('add-error').textContent = '';

      runAction($('add-submit'), async () => {
        try {
          await api('/admin/teams', { method: 'POST', body: { name, loginName, password } });
        } catch (err) {
          // Shown inside the dialog (409 duplicate login ID, validation errors). 401/403 already sent us to login.
          if (err.status !== 401 && err.status !== 403) fail(err.message || 'Could not create the team.');
          return;
        }
        closeAddModal();
        toast(`Team "${name}" created. Login ID: ${loginName}`, 'success', 7000);
        await refreshNow();
      });
    });
  }

  // ---------------------------------------------------------------------------
  // Wiring + boot
  // ---------------------------------------------------------------------------
  function bindEvents() {
    if (state.bound) return;
    state.bound = true;

    $('login-form').addEventListener('submit', submitLogin);

    $('btn-logout').addEventListener('click', () => toLogin(''));
    $('btn-refresh').addEventListener('click', () => {
      refreshNow().then((ok) => {
        if (ok) toast('Refreshed.', 'info', 1500);
      });
    });

    $('poll-select').addEventListener('change', (e) => {
      state.pollSeconds = Number(e.target.value);
      prefStore.set(state.pollSeconds);
      scheduleNext();
    });

    $('filter-input').addEventListener('input', (e) => {
      state.filter = e.target.value;
      renderBoard();
    });

    $('board-body').addEventListener('click', (e) => {
      const tr = e.target.closest('tr[data-id]');
      if (tr) openTeam(tr.dataset.id);
    });
    $('board-body').addEventListener('keydown', (e) => {
      if (e.key !== 'Enter') return;
      const tr = e.target.closest('tr[data-id]');
      if (tr) openTeam(tr.dataset.id);
    });

    document.addEventListener('keydown', (e) => {
      if (e.key !== 'Escape') return;
      if (!$('add-modal').hidden) closeAddModal();
      else if (state.openTeamId) closeModal();
    });
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && state.token) refresh();
    });

    bindContestActions();
    bindSetupActions();
    bindTeamActions();
    bindAddTeam();
  }

  async function boot() {
    const saved = prefStore.get();
    const savedNumber = saved === null ? DEFAULT_POLL_SECONDS : Number(saved);
    state.pollSeconds = POLL_CHOICES.includes(savedNumber) ? savedNumber : DEFAULT_POLL_SECONDS;
    $('poll-select').value = String(state.pollSeconds);

    bindEvents();

    state.token = tokenStore.get();
    if (!state.token) {
      showView('login');
      $('login-name').focus();
      return;
    }

    // A stored token is only trusted after the API accepts it
    showView('boot');
    const ok = await refresh(true);
    if (ok) {
      showView('dashboard');
      startLive();
    } else if (state.token) {
      toLogin(state.connectionError ? `Cannot load data: ${state.connectionError}` : '');
    }
  }

  boot();
})();
