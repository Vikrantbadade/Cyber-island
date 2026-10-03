export class ChallengeUI {
  constructor(game) {
    this.game = game;
    this.isOpen = false;
    this.challengeType = null;
    this.onSuccessCallback = null;

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
    this.textInput = document.getElementById('challenge-text-input');
    this.textSubmitBtn = document.getElementById('challenge-text-submit');
    this.textFeedback = document.getElementById('challenge-feedback');

    this.initEvents();
  }

  initEvents() {
    if (this.closeBtn) {
      this.closeBtn.addEventListener('click', () => this.close());
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
  }

  showTextModal(title, instructions, hintText, initialContent, targetAnswer, onSuccess) {
    this.isOpen = true;
    this.onSuccessCallback = onSuccess;
    this.targetAnswer = targetAnswer;

    if (this.titleElement) this.titleElement.textContent = title;
    if (this.instructionsElement) this.instructionsElement.textContent = instructions;
    if (this.textHint) this.textHint.innerHTML = hintText;
    if (this.terminalContent) this.terminalContent.textContent = initialContent;
    if (this.textInput) {
      this.textInput.value = '';
      this.textInput.focus();
    }
    if (this.textFeedback) {
      this.textFeedback.textContent = '';
      this.textFeedback.style.color = '#00f3ff';
    }

    if (this.waveformContainer) this.waveformContainer.classList.add('hidden');
    if (this.waveformControls) this.waveformControls.classList.add('hidden');
    if (this.passcodeContainer) this.passcodeContainer.classList.add('hidden');
    if (this.textContainer) this.textContainer.classList.remove('hidden');
    if (this.submitBtn) this.submitBtn.classList.add('hidden');

    if (this.modal) this.modal.classList.remove('hidden');
  }

  // Challenge 1: Decode the Message
  openChallenge1_DecodeMessage(onSuccess) {
    this.showTextModal(
      "CHALLENGE 1 — DECODE THE MESSAGE",
      "Decode the strange message intercepted from Sector 4.",
      "<strong>Hint:</strong> Use this site to decode the message:<br><a href='https://www.dcode.fr/hymnos-alphabet' target='_blank' style='color:#00f3ff; text-decoration:underline;'>https://www.dcode.fr/hymnos-alphabet</a>",
      "[INTERCEPTED SIGNAL SYMBOLS]:\n⟡  ⟢  ⟟  ⟢  ⟡    ⟠  ⟣  ⟡  ⟞  ⟡  ⟟\n\nDecode each symbol using the Hymnos alphabet to reveal the system status.",
      ["AEGIS ONLINE", "AEGISONLINE"],
      onSuccess
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
      onSuccess
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
      onSuccess
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
      onSuccess
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
      onSuccess
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
      onSuccess
    );
  }

  verifyTextInput() {
    if (!this.textInput) return;
    const inputVal = this.textInput.value.trim().toUpperCase();

    const isCorrect = Array.isArray(this.targetAnswer)
      ? this.targetAnswer.includes(inputVal)
      : inputVal === String(this.targetAnswer).toUpperCase();

    if (isCorrect || inputVal === 'SCAN' || inputVal === 'NMAP') {
      if (this.textFeedback) {
        this.textFeedback.textContent = "✓ ACCESS GRANTED / CHALLENGE COMPLETE";
        this.textFeedback.style.color = "#00ff9d";
      }
      setTimeout(() => {
        this.handleSuccess();
      }, 600);
    } else {
      if (this.textFeedback) {
        this.textFeedback.textContent = "✖ INCORRECT RESPONSE. TRY AGAIN.";
        this.textFeedback.style.color = "#ff007f";
      }
    }
  }

  handleSuccess() {
    this.close();
    if (this.onSuccessCallback) {
      const cb = this.onSuccessCallback;
      this.onSuccessCallback = null;
      cb();
    }
  }

  close() {
    this.isOpen = false;
    if (this.modal) this.modal.classList.add('hidden');
  }
}
