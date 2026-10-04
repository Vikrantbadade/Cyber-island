import { session } from '../services/session.js';

export class ChallengeUI {
  constructor(game) {
    this.game = game;
    this.isOpen = false;
    this.challengeType = null;
    this.onSuccessCallback = null;

    // Backend sync state
    this.challengeNo = null;
    this.stageId = null;
    this.syncing = false;       // correct answer submitted, waiting for the server to record it
    this.hintBusy = false;
    this.hintRevealed = false;
    this.hintHtml = '';
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
        if (this.syncing) return; // don't abandon a completion that is being recorded
        this.close();
      });
    }

    if (this.textSubmitBtn) {
      this.textSubmitBtn.addEventListener('click', () => this.verifyTextInput());
    }

    if (this.textInput) {
      this.textInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          this.verifyTextInput();
        }
      });
    }

    if (this.submitBtn) {
      this.submitBtn.addEventListener('click', () => this.verifyTextInput());
    }

    if (this.hintBtn) {
      this.hintBtn.addEventListener('click', () => this.requestHint());
    }
  }

  showTextModal(title, instructions, hintText, initialContent, targetAnswer, onSuccess, challengeNo = null) {
    this.isOpen = true;
    this.openToken++;
    this.syncing = false;
    this.hintBusy = false;
    this.onSuccessCallback = onSuccess;
    this.targetAnswer = targetAnswer;
    this.challengeNo = challengeNo;
    this.stageId = challengeNo != null ? session.stageForChallenge(challengeNo) : null;

    // The hint stays hidden until requested (requesting spends a backend hint = score penalty).
    // If this stage's hint was already bought earlier (e.g. before a page refresh) it is shown right away.
    this.hintHtml = hintText;
    this.hintRevealed = session.enabled && this.stageId != null && session.hintsUsedFor(this.stageId) >= 1;
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

  setFeedback(text, color) {
    if (!this.textFeedback) return;
    this.textFeedback.textContent = text;
    if (color) this.textFeedback.style.color = color;
  }

  // ---------------------------------------------------------------------------
  // Hints (backend applies the penalty; hint text itself lives in this file)
  // ---------------------------------------------------------------------------
  updateHintUI() {
    if (this.textHint) {
      this.textHint.innerHTML = this.hintRevealed
        ? this.hintHtml
        : '<em>Hint locked. Requesting it costs points.</em>';
    }
    if (this.hintBtn) {
      this.hintBtn.disabled = this.hintRevealed || this.hintBusy;
      this.hintBtn.textContent = this.hintRevealed ? '💡 HINT UNLOCKED' : '💡 REQUEST HINT';
    }
  }

  async requestHint() {
    if (this.hintBusy || this.hintRevealed || this.syncing) return;

    // Dev bypass: no backend, hints are free
    if (!session.enabled || this.stageId == null) {
      this.hintRevealed = true;
      this.updateHintUI();
      return;
    }

    const token = this.openToken;
    this.hintBusy = true;
    this.updateHintUI();
    if (this.hintBtn) this.hintBtn.textContent = 'REQUESTING...';

    try {
      const result = await session.useHint(this.stageId);
      if (token !== this.openToken) return;
      this.hintRevealed = true;
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

  // Challenge 1: Decode the Message
  openChallenge1_DecodeMessage(onSuccess) {
    this.showTextModal(
      "CHALLENGE 1 — DECODE THE MESSAGE",
      "Decode the strange message intercepted from Sector 4.",
      "<strong>Hint:</strong> Use this site to decode the message:<br><a href='https://www.dcode.fr/hymnos-alphabet' target='_blank' style='color:#00f3ff; text-decoration:underline;'>https://www.dcode.fr/hymnos-alphabet</a>",
      "[INTERCEPTED SIGNAL SYMBOLS]:\n⟡  ⟢  ⟟  ⟢  ⟡    ⟠  ⟣  ⟡  ⟞  ⟡  ⟟\n\nDecode each symbol using the Hymnos alphabet to reveal the system status.",
      ["AEGIS ONLINE", "AEGISONLINE"],
      onSuccess,
      1
    );
  }

  // Challenge 2: OSINT Investigation
  openChallenge2_OSINT(onSuccess) {
    this.showTextModal(
      "CHALLENGE 2 — OSINT INVESTIGATION",
      "Check the image.",
      "<strong>Hint:</strong> Inspect the photograph details left behind prior to Aegis's disappearance.",
      "[PHOTOGRAPH METADATA]:\nFile: aegis_staff_photo_2019.jpg\nSubject: Dr. Mira Sen (Chief Aegis Cryptographer)\nNote: Taken before Aegis disappeared 7 years ago.",
      ["MIRA SEN", "MIRA"],
      onSuccess,
      2
    );
  }

  // Challenge 3: Dead Network
  openChallenge3_DeadNetwork(onSuccess) {
    this.showTextModal(
      "CHALLENGE 3 — DEAD NETWORK",
      "That machine shouldn't be communicating with anything, but the status screen might be lying. Investigate whether the host has any reachable network services.",
      "<strong>Hint:</strong> Type 'scan' or 'nmap' to perform network service discovery on host 192.168.4.21.",
      "[HOST]: 192.168.4.21 (AEGIS NODE)\nStatus: Supposedly Offline\n\nEnter command to scan active network services:",
      ["SCAN", "NMAP", "21", "PORT 21", "FTP"],
      onSuccess,
      3
    );
  }

  // Challenge 4: Abnormal Server
  openChallenge4_AbnormalServer(onSuccess) {
    this.showTextModal(
      "CHALLENGE 4 — ABNORMAL SERVER",
      "You discovered an unexpected active server on port 21. Try to access/hack the server (allows anonymous login).",
      "<strong>Hint:</strong> Attempt authentication using the standard anonymous user account.",
      "[SERVER]: FTP (Port 21)\nBanner: Aegis Legacy Archives\nAuthentication Mode: Anonymous Allowed\n\nEnter username to access server:",
      ["ANONYMOUS", "FTP ANONYMOUS", "USER ANONYMOUS"],
      onSuccess,
      4
    );
  }

  // Challenge 5: Keylogger Incident
  openChallenge5_KeyloggerIncident(onSuccess) {
    this.showTextModal(
      "CHALLENGE 5 — THE KEYLOGGER INCIDENT",
      "Search the keyboard activity log and determine where Mira successfully logged in.",
      "<strong>Hint:</strong> Use CLI search commands (e.g. 'grep success' or search for 'aegis-vault-07').",
      "[KEYCAPTURE LOG SAMPLE]:\n[04:12:01] keypress: m-i-r-a -> [FAIL] system: legacy-gate\n[04:15:33] keypress: m-i-r-a -> [SUCCESS] system: aegis-vault-07\n[04:18:20] keypress: admin -> [FAIL] system: sector-4",
      ["AEGIS-VAULT-07", "AEGIS-VAULT", "GREP SUCCESS"],
      onSuccess,
      5
    );
  }

  // Challenge 6: The Suspicious File & Cyber Cipher
  openChallenge6_SuspiciousFile(onSuccess) {
    this.showTextModal(
      "CHALLENGE 6 — THE SUSPICIOUS FILE",
      "Check the suspicious file.",
      "<strong>Hint:</strong> Aegis used ROT13 substitution to encode the payload header.",
      "[FILE]: /sys/vault/echo_payload.bin\n[CIPHERTEXT]: RPUB UVQQRA VA TRARFVF\n\nDecode the ROT13 ciphertext to reveal the hidden payload:",
      ["ECHO HIDDEN IN GENESIS", "ECHO"],
      onSuccess,
      6
    );
  }

  verifyTextInput() {
    if (!this.textInput || this.syncing) return;
    const inputVal = this.textInput.value.trim().toUpperCase();

    const isCorrect = Array.isArray(this.targetAnswer)
      ? this.targetAnswer.includes(inputVal)
      : inputVal === String(this.targetAnswer).toUpperCase();

    if (isCorrect || inputVal === 'SCAN' || inputVal === 'NMAP') {
      this.syncing = true; // blocks double-submits until the server has recorded the completion
      this.setFeedback('✓ ACCESS GRANTED / CHALLENGE COMPLETE', '#00ff9d');
      setTimeout(() => {
        this.handleSuccess();
      }, 600);
    } else {
      this.setFeedback('✖ INCORRECT RESPONSE. TRY AGAIN.', '#ff007f');
    }
  }

  // ---------------------------------------------------------------------------
  // Completion: record on the backend first, only then advance the story
  // ---------------------------------------------------------------------------
  async handleSuccess() {
    const token = this.openToken;

    if (session.enabled && this.stageId != null) {
      this.setFeedback('✓ ANSWER VERIFIED — SYNCING WITH ISLAND CONTROL...', '#00f3ff');
      try {
        await session.completeStage(this.stageId);
      } catch (err) {
        if (token !== this.openToken) return;
        const recovered = await this.recoverFromSyncError(err, token);
        if (!recovered) {
          if (token === this.openToken) this.syncing = false; // modal stays open so the answer can be re-submitted
          return;
        }
      }
    }

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
