import Phaser from 'phaser';
import { WORLD_DATA } from '../data/world.js';
import { ENV } from '../config/env.js';
import { session } from '../services/session.js';
import { sessionUI } from '../systems/SessionUI.js';

// In-game overlays that must be hidden when we land here (e.g. after the session was lost mid-game)
const GAMEPLAY_UI_IDS = [
  'main-menu-overlay',
  'quest-hud',
  'controls-hud',
  'dialogue-box',
  'interaction-prompt',
  'challenge-modal',
  'victory-modal',
  'how-to-play-modal',
  'story-modal',
];

/**
 * Boot -> LOGIN -> Menu -> Game.
 * Handles: team login, restoring a stored session, and holding the player on a
 * waiting / ended screen until the contest is RUNNING.
 */
export class LoginScene extends Phaser.Scene {
  constructor() {
    super('LoginScene');
    this.panDirection = 1;
    this.panSpeed = 12;
  }

  init(data) {
    this.notice = (data && data.notice) || '';
  }

  create() {
    this.alive = true;
    this.loopToken = 0;

    // Same scenic island backdrop as the main menu
    const worldW = WORLD_DATA.worldDimensions.width;
    const worldH = WORLD_DATA.worldDimensions.height;
    this.add.image(0, 0, 'base-world').setOrigin(0, 0);
    this.cameras.main.setBounds(0, 0, worldW, worldH);
    this.cameras.main.scrollX = 350;
    this.cameras.main.scrollY = 450;
    this.cameras.main.setZoom(1.1);

    // A previous GameScene leaves WASD/Space captured, which would swallow typing in the form
    if (this.input.keyboard && this.input.keyboard.clearCaptures) {
      this.input.keyboard.clearCaptures();
    }

    // Clean slate (matters when arriving here from a running game)
    GAMEPLAY_UI_IDS.forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.classList.add('hidden');
    });
    sessionUI.hideHud();
    sessionUI.stopContestWatch();
    sessionUI.hideGate();
    session.stopPolling();

    sessionUI.onLoginSubmit = (loginName, password) => this.handleLogin(loginName, password);
    sessionUI.onLogout = () => this.handleLogout();
    this.offAuthLost = session.on('auth-lost', (message) => this.showLoginAgain(message));

    this.events.once('shutdown', () => {
      this.alive = false;
      this.loopToken++;
      sessionUI.onLoginSubmit = null;
      sessionUI.onLogout = null;
      if (this.offAuthLost) this.offAuthLost();
      sessionUI.hideLogin();
    });

    this.begin();
  }

  update(time, delta) {
    // Gentle camera drift, like the menu
    const dt = delta / 1000;
    this.cameras.main.scrollX += this.panSpeed * dt * this.panDirection;
    if (this.cameras.main.scrollX > 600) this.panDirection = -1;
    else if (this.cameras.main.scrollX < 200) this.panDirection = 1;
  }

  // ---------------------------------------------------------------------------
  // Flow
  // ---------------------------------------------------------------------------
  async begin() {
    // Dev bypass (VITE_SKIP_LOGIN=true in `npm run dev`): offline play, nothing recorded
    if (!session.enabled) {
      this.goToMenu();
      return;
    }

    if (session.hasStoredSession()) {
      const token = ++this.loopToken;
      sessionUI.showGate({
        owner: 'login',
        icon: '📡',
        title: 'CONNECTING',
        message: 'Restoring your session...',
        allowLogout: false,
      });
      const result = await session.restore();
      if (!this.alive || token !== this.loopToken) return;
      sessionUI.hideGate();

      if (result.ok) {
        await this.enterContest();
        return;
      }
      if (result.message) this.notice = result.message;
    }

    sessionUI.showLogin({ message: this.notice, kind: 'error' });
  }

  async handleLogin(loginName, password) {
    sessionUI.setLoginBusy(true);
    sessionUI.setLoginError('');
    try {
      await session.login(loginName, password);
    } catch (err) {
      if (!this.alive) return;
      sessionUI.setLoginBusy(false);
      sessionUI.setLoginError(this.describeLoginError(err));
      return;
    }
    if (!this.alive) return;
    sessionUI.hideLogin();
    sessionUI.setLoginBusy(false);
    await this.enterContest();
  }

  describeLoginError(err) {
    if (err.status === 401) return 'INVALID TEAM ID OR ACCESS CODE';
    if (err.status === 400) return 'ENTER BOTH TEAM ID AND ACCESS CODE';
    return String(err.message || 'LOGIN FAILED').toUpperCase();
  }

  /** Hold here until the contest is RUNNING (waiting / ended screens), then continue to the menu. */
  async enterContest() {
    const token = ++this.loopToken;

    while (this.alive && token === this.loopToken) {
      let status;
      try {
        status = await session.refreshStatus();
      } catch (err) {
        if (!this.alive || token !== this.loopToken) return;
        if (err.status === 401) return; // 'auth-lost' handler shows the login form again
        sessionUI.showGate({
          owner: 'login',
          icon: '⚠️',
          title: 'SERVER UNREACHABLE',
          message: err.message,
          detail: 'RETRYING...',
        });
        await this.sleep(ENV.WAITING_POLL_MS);
        continue;
      }
      if (!this.alive || token !== this.loopToken) return;

      if (status.status === 'RUNNING') {
        sessionUI.hideGate();
        this.goToMenu();
        return;
      }

      // NOT_STARTED or ENDED: keep polling (an admin can start or extend the contest at any time)
      sessionUI.showContestGate(status);
      await this.sleep(ENV.WAITING_POLL_MS);
    }
  }

  goToMenu() {
    if (session.enabled) {
      session.startPolling();
      sessionUI.startContestWatch();
    }
    this.scene.start('MenuScene');
  }

  showLoginAgain(message) {
    this.loopToken++;
    sessionUI.hideGate();
    sessionUI.showLogin({ message, kind: 'error' });
  }

  handleLogout() {
    this.loopToken++;
    session.logout();
    sessionUI.hideGate();
    sessionUI.showLogin({ message: 'LOGGED OUT', kind: 'info' });
  }

  sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
