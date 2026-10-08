import { session } from '../services/session.js';

/**
 * Challenge terminal.
 *
 * The browser does NOT know any answers or hint texts. Answers are checked by the backend
 * (POST /team/stages/:id/submit) and a hint text only arrives after the team has paid for it. Only the
 * dev bypass (`npm run dev` with VITE_SKIP_LOGIN=true) works offline: there any non-empty input passes
 * and hints show a placeholder. That branch is dead code in production builds.
 */
const URL_RE = /(https?:\/\/[^\s]+)/g;
const SUCCESS_DELAY_MS = 600;

export class ChallengeUI {
  constructor(game) {
    this.game = game;
    this.isOpen = false;
    this.challengeType = null;
    this.onSuccessCallback = null;

    // Backend sync state
    this.challengeNo = null;
    this.stageId = null;
    this.syncing = false;       // answer submitted / success being shown; blocks double submits
    this.hintBusy = false;
    this.hints = [];            // hint texts already unlocked for this challenge
    this.openToken = 0;         // bumps on every open/close so late async results are ignored
    /** Set by GameScene: called when the server's progress disagrees with the local quest state */
    this.onDesync = null;

    // DOM Elements
    this.modal = document.getElementById('challenge-modal');
    this.titleElement = document.getElementById('challenge-title');
    this.instructionsElement = document.getElementById('challenge-instructions');
    this.closeBtn = document.getElementById('close-challenge-btn');
    this.submitBtn = document.getElementById('submit-challenge-btn');

    // Waveform Elements
    this.waveformContainer = document.getElementById('waveform-game-container');
    this.waveformControls = document.getElementById('challenge-controls');
    this.canvas = document.getElementById('waveform-canvas');

    // Passcode Elements
    this.passcodeContainer = document.getElementById('passcode-container');

    // Text Terminal Elements
    this.textContainer = document.getElementById('text-input-container');
    this.terminalContent = document.getElementById('terminal-content-area');
    this.textHint = document.getElementById('text-input-hint');
    this.hintBtn = document.getElementById('challenge-hint-btn');
    this.textInput = document.getElementById('challenge-text-input');
    this.textSubmitBtn = document.getElementById('challenge-text-submit');
    this.textFeedback = document.getElementById('challenge-feedback');

    this.initEvents();
  }

  initEvents() {
    if (this.closeBtn) {
      this.closeBtn.addEventListener('click', () => {
        if (this.syncing) return; // don't abandon a submission that is being verified / recorded
        this.close();
      });
    }

    if (this.textSubmitBtn) {
      this.textSubmitBtn.addEventListener('click', () => this.submitAnswer());
    }

    if (this.textInput) {
      this.textInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          this.submitAnswer();
        }
      });
    }

    if (this.submitBtn) {
      this.submitBtn.addEventListener('click', () => this.submitAnswer());
    }

    if (this.hintBtn) {
      this.hintBtn.addEventListener('click', () => this.requestHint());
    }
  }

  showTextModal(title, instructions, initialContent, onSuccess, challengeNo = null) {
    this.isOpen = true;
    this.openToken++;
    this.syncing = false;
    this.hintBusy = false;
    this.onSuccessCallback = onSuccess;
    this.challengeNo = challengeNo;
    this.stageId = challengeNo != null ? session.stageForChallenge(challengeNo) : null;

    // Hints stay hidden until requested (requesting spends a backend hint = score penalty).
    // Hints bought earlier (e.g. before a page refresh) come back from the server with the progress.
    this.hints = this.backendActive() ? session.unlockedHints(this.stageId) : [];
    this.updateHintUI();

    if (this.titleElement) this.titleElement.textContent = title;
    if (this.instructionsElement) this.instructionsElement.textContent = instructions;
    if (this.terminalContent) this.terminalContent.textContent = initialContent;
    if (this.textInput) {
      this.textInput.value = '';
      this.textInput.focus();
    }
    this.setFeedback('', '#00f3ff');

    if (this.waveformContainer) this.waveformContainer.classList.add('hidden');
    if (this.waveformControls) this.waveformControls.classList.add('hidden');
    if (this.passcodeContainer) this.passcodeContainer.classList.add('hidden');
    if (this.textContainer) this.textContainer.classList.remove('hidden');
    if (this.submitBtn) this.submitBtn.classList.add('hidden');

    if (this.modal) this.modal.classList.remove('hidden');
  }

  /** True when this challenge talks to the backend (false in the offline dev bypass). */
  backendActive() {
    return session.enabled && this.stageId != null;
  }

  setFeedback(text, color) {
    if (!this.textFeedback) return;
    this.textFeedback.textContent = text;
    if (color) this.textFeedback.style.color = color;
  }

  // ---------------------------------------------------------------------------
  // Hints (the backend applies the penalty AND supplies the text)
  // ---------------------------------------------------------------------------
  /** Plain text with clickable http(s) links, built with DOM nodes (no innerHTML). */
  renderHintLine(text) {
    const line = document.createElement('div');
    text.split(URL_RE).forEach((part) => {
      if (!part) return;
      if (/^https?:\/\//.test(part)) {
        const a = document.createElement('a');
        a.href = part;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        a.textContent = part;
        a.style.color = '#00f3ff';
        a.style.textDecoration = 'underline';
        line.appendChild(a);
      } else {
        line.appendChild(document.createTextNode(part));
      }
    });
    return line;
  }

  updateHintUI() {
    const available = !session.enabled ? 1 : this.stageId != null ? session.hintsAvailableFor(this.stageId) : 0;
    const used = this.hints.length;
    const exhausted = used >= available;

    if (this.textHint) {
      this.textHint.replaceChildren();
      if (used === 0) {
        const note = document.createElement('em');
        note.textContent = available === 0 ? 'No hints for this challenge.' : 'Hint locked. Requesting it costs points.';
        this.textHint.appendChild(note);
      } else {
        this.hints.forEach((text) => this.textHint.appendChild(this.renderHintLine(text)));
      }
    }
    if (this.hintBtn) {
      this.hintBtn.disabled = exhausted || this.hintBusy;
      if (exhausted) this.hintBtn.textContent = used > 0 ? '💡 HINT UNLOCKED' : '💡 NO HINTS';
      else this.hintBtn.textContent = used > 0 ? '💡 NEXT HINT' : '💡 REQUEST HINT';
    }
  }

  async requestHint() {
    if (this.hintBusy || this.syncing) return;

    // Dev bypass: no backend, hints are free and there is no real text
    if (!session.enabled) {
      this.hints = ['(Dev bypass: the real hint text is served by the backend.)'];
      this.updateHintUI();
      return;
    }
    if (this.stageId == null || this.hints.length >= session.hintsAvailableFor(this.stageId)) return;

    const token = this.openToken;
    this.hintBusy = true;
    this.updateHintUI();
    if (this.hintBtn) this.hintBtn.textContent = 'REQUESTING...';

    try {
      const result = await session.useHint(this.stageId);
      if (token !== this.openToken) return;
      this.hints = session.unlockedHints(this.stageId);
      this.setFeedback(`💡 HINT UNLOCKED  (-${result.penaltyApplied} PTS)`, '#facc15');
    } catch (err) {
      if (token !== this.openToken) return;
      if (err.status !== 401) this.setFeedback(this.describeError(err, false), '#ff007f');
    } finally {
      if (token === this.openToken) {
        this.hintBusy = false;
        this.updateHintUI();
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Challenges: only the terminal text lives here, never the answers
  // ---------------------------------------------------------------------------

  // Challenge 1: Decode the Message
  openChallenge1_DecodeMessage(onSuccess) {
    this.showTextModal(
      "CHALLENGE 1 — DECODE THE MESSAGE",
      "Decode the strange message intercepted from Sector 4.",
      "[INTERCEPTED SIGNAL SYMBOLS]:\n⟡  ⟢  ⟟  ⟢  ⟡    ⟠  ⟣  ⟡  ⟞  ⟡  ⟟\n\nDecode each symbol using the Hymnos alphabet to reveal the system status.",
      onSuccess,
      1
    );
  }

  // Challenge 2: OSINT Investigation
  openChallenge2_OSINT(onSuccess) {
    this.showTextModal(
      "CHALLENGE 2 — OSINT INVESTIGATION",
      "Check the image.",
      "[PHOTOGRAPH METADATA]:\nFile: aegis_staff_photo_2019.jpg\nSubject: Dr. Mira Sen (Chief Aegis Cryptographer)\nNote: Taken before Aegis disappeared 7 years ago.",
      onSuccess,
      2
    );
  }

  // Challenge 3: Dead Network
  openChallenge3_DeadNetwork(onSuccess) {
    this.showTextModal(
      "CHALLENGE 3 — DEAD NETWORK",
      "That machine shouldn't be communicating with anything, but the status screen might be lying. Investigate whether the host has any reachable network services.",
      "[HOST]: 192.168.4.21 (AEGIS NODE)\nStatus: Supposedly Offline\n\nEnter command to scan active network services:",
      onSuccess,
      3
    );
  }

  // Challenge 4: Abnormal Server
  openChallenge4_AbnormalServer(onSuccess) {
    this.showTextModal(
      "CHALLENGE 4 — ABNORMAL SERVER",
      "You discovered an unexpected active server on port 21. Try to access/hack the server (allows anonymous login).",
      "[SERVER]: FTP (Port 21)\nBanner: Aegis Legacy Archives\nAuthentication Mode: Anonymous Allowed\n\nEnter username to access server:",
      onSuccess,
      4
    );
  }

  // Challenge 5: Keylogger Incident
  openChallenge5_KeyloggerIncident(onSuccess) {
    this.showTextModal(
      "CHALLENGE 5 — THE KEYLOGGER INCIDENT",
      "Search the keyboard activity log and determine where Mira successfully logged in.",
      "[KEYCAPTURE LOG SAMPLE]:\n[04:12:01] keypress: m-i-r-a -> [FAIL] system: legacy-gate\n[04:15:33] keypress: m-i-r-a -> [SUCCESS] system: aegis-vault-07\n[04:18:20] keypress: admin -> [FAIL] system: sector-4",
      onSuccess,
      5
    );
  }

  // Challenge 6: The Suspicious File & Cyber Cipher
  openChallenge6_SuspiciousFile(onSuccess) {
    this.showTextModal(
      "CHALLENGE 6 — THE SUSPICIOUS FILE",
      "Check the suspicious file.",
      "[FILE]: /sys/vault/echo_payload.bin\n[CIPHERTEXT]: RPUB UVQQRA VA TRARFVF\n\nDecode the ROT13 ciphertext to reveal the hidden payload:",
      onSuccess,
      6
    );
  }

  // ---------------------------------------------------------------------------
  // Answer submission: the server decides; the story only advances once it accepts
  // ---------------------------------------------------------------------------
  async submitAnswer() {
    if (!this.textInput || this.syncing) return;
    const answer = this.textInput.value.trim();
    if (!answer) return;

    const token = this.openToken;
    this.syncing = true; // blocks double submits until we have a verdict

    // Dev bypass (VITE_SKIP_LOGIN, dev builds only): nothing to verify against, accept anything
    if (!session.enabled) {
      this.setFeedback('✓ ACCESS GRANTED / CHALLENGE COMPLETE', '#00ff9d');
      setTimeout(() => this.finishSuccess(token), SUCCESS_DELAY_MS);
      return;
    }
    if (this.stageId == null) {
      this.syncing = false;
      this.setFeedback('✖ THIS CHALLENGE IS NOT LINKED TO A STAGE', '#ff007f');
      return;
    }

    this.setFeedback('… VERIFYING WITH ISLAND CONTROL', '#00f3ff');
    try {
      const correct = await session.submitAnswer(this.stageId, answer);
      if (token !== this.openToken) return;
      if (!correct) {
        this.syncing = false;
        this.setFeedback('✖ INCORRECT RESPONSE. TRY AGAIN.', '#ff007f');
        return;
      }
    } catch (err) {
      if (token !== this.openToken) return;
      const recovered = await this.recoverFromSyncError(err, token);
      if (!recovered) {
        if (token === this.openToken) this.syncing = false; // modal stays open so the answer can be re-submitted
        return;
      }
    }

    if (token !== this.openToken) return;
    this.setFeedback('✓ ACCESS GRANTED / CHALLENGE COMPLETE', '#00ff9d');
    setTimeout(() => this.finishSuccess(token), SUCCESS_DELAY_MS);
  }

  finishSuccess(token) {
    if (token !== this.openToken) return;
    this.syncing = false;
    this.close();
    if (this.onSuccessCallback) {
      const cb = this.onSuccessCallback;
      this.onSuccessCallback = null;
      cb();
    }
  }

  /** Returns true if the stage is in fact recorded on the server (so the story may advance). */
  async recoverFromSyncError(err, token) {
    if (err.status === 401) return false; // 'auth-lost' handler returns the player to the login screen

    if (err.status === 409) {
      // Response to an earlier attempt was lost, or the page was refreshed: the server already has it
      if (/already completed/i.test(err.message)) {
        session.refreshProgress().catch(() => {});
        return true;
      }
      // Server says this is not the next stage: local quest state is wrong -> reload it from the server
      if (/not the next stage/i.test(err.message)) {
        this.syncing = false;
        this.close();
        if (this.onDesync) this.onDesync();
        return false;
      }
    }

    if (token === this.openToken) this.setFeedback(this.describeError(err, true), '#ff007f');
    return false;
  }

  describeError(err, canRetry) {
    if (err.status === 0) return '✖ CONNECTION LOST' + (canRetry ? ' — PRESS SUBMIT TO RETRY' : '');
    if (err.status === 410) return '✖ THE CONTEST HAS ENDED';
    if (err.status === 429) return `✖ ${String(err.message || 'SLOW DOWN').toUpperCase()}`;
    const text = `✖ ${String(err.message || 'REQUEST FAILED').toUpperCase()}`;
    return canRetry ? `${text} — PRESS SUBMIT TO RETRY` : text;
  }

  close() {
    this.isOpen = false;
    this.syncing = false;
    this.hintBusy = false;
    this.openToken++;
    if (this.modal) this.modal.classList.add('hidden');
  }
}
