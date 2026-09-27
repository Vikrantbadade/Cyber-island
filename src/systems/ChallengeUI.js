export class ChallengeUI {
  constructor(game) {
    this.game = game;
    this.isOpen = false;
    this.challengeType = null; // 'WAVEFORM' | 'PASSCODE'
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
    this.syncRateText = document.getElementById('sync-rate-text');
    this.syncProgressBar = document.getElementById('sync-progress-fill');

    this.freqSlider = document.getElementById('freq-slider');
    this.ampSlider = document.getElementById('amp-slider');
    this.phaseSlider = document.getElementById('phase-slider');
    this.freqVal = document.getElementById('freq-val');
    this.ampVal = document.getElementById('amp-val');
    this.phaseVal = document.getElementById('phase-val');

    // Passcode Elements
    this.passcodeContainer = document.getElementById('passcode-container');
    this.passcodeDisplay = document.getElementById('passcode-display');
    this.keypadButtons = document.querySelectorAll('.keypad-btn[data-key]');
    this.keypadClear = document.getElementById('keypad-clear');
    this.keypadSubmit = document.getElementById('keypad-submit');

    // Minigame State
    this.targetFreq = 54;
    this.targetAmp = 55;
    this.targetPhase = 180;
    this.currentPasscode = "";
    this.targetPasscode = "7492";

    this.animFrameId = null;
    this.syncPercent = 0;

    this.initEvents();
  }

  initEvents() {
    if (this.closeBtn) {
      this.closeBtn.addEventListener('click', () => this.close());
    }

    // Slider updates
    const updateSliders = () => {
      if (this.freqVal) this.freqVal.textContent = this.freqSlider.value;
      if (this.ampVal) this.ampVal.textContent = this.ampSlider.value;
      if (this.phaseVal) this.phaseVal.textContent = `${this.phaseSlider.value}°`;
    };

    if (this.freqSlider) this.freqSlider.addEventListener('input', updateSliders);
    if (this.ampSlider) this.ampSlider.addEventListener('input', updateSliders);
    if (this.phaseSlider) this.phaseSlider.addEventListener('input', updateSliders);

    // Keypad events
    this.keypadButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const val = e.target.getAttribute('data-key');
        if (this.currentPasscode.length < 4) {
          this.currentPasscode += val;
          this.updatePasscodeDisplay();
        }
      });
    });

    if (this.keypadClear) {
      this.keypadClear.addEventListener('click', () => {
        this.currentPasscode = "";
        this.updatePasscodeDisplay();
      });
    }

    if (this.keypadSubmit) {
      this.keypadSubmit.addEventListener('click', () => {
        this.verifyPasscode();
      });
    }

    if (this.submitBtn) {
      this.submitBtn.addEventListener('click', () => {
        if (this.challengeType === 'WAVEFORM') {
          if (this.syncPercent >= 88) {
            this.handleSuccess();
          } else {
            this.syncRateText.textContent = `${Math.floor(this.syncPercent)}% (TOO LOW)`;
            this.syncRateText.style.color = '#ff007f';
            setTimeout(() => {
              this.syncRateText.style.color = '#00f3ff';
            }, 1000);
          }
        } else if (this.challengeType === 'PASSCODE') {
          this.verifyPasscode();
        }
      });
    }
  }

  updatePasscodeDisplay() {
    if (!this.passcodeDisplay) return;
    const filled = this.currentPasscode.padEnd(4, '_');
    this.passcodeDisplay.textContent = filled;
  }

  verifyPasscode() {
    if (this.currentPasscode === this.targetPasscode) {
      this.handleSuccess();
    } else {
      this.passcodeDisplay.style.borderColor = '#ff007f';
      this.passcodeDisplay.style.color = '#ff007f';
      setTimeout(() => {
        this.currentPasscode = "";
        this.updatePasscodeDisplay();
        this.passcodeDisplay.style.borderColor = '#00f3ff';
        this.passcodeDisplay.style.color = '#00f3ff';
      }, 800);
    }
  }

  openWaveformChallenge(onSuccess) {
    this.challengeType = 'WAVEFORM';
    this.onSuccessCallback = onSuccess;
    this.isOpen = true;

    this.titleElement.textContent = "SIGNAL ALIGNMENT TERMINAL";
    this.instructionsElement.textContent = "Adjust frequency, amplitude, and phase to match the target cyan carrier wave (SYNC > 88%).";

    this.waveformContainer.classList.remove('hidden');
    this.waveformControls.classList.remove('hidden');
    this.passcodeContainer.classList.add('hidden');
    this.submitBtn.classList.remove('hidden');
    this.submitBtn.textContent = "CALIBRATE SIGNAL";

    // Randomize initial slider positions slightly off target
    this.freqSlider.value = 20;
    this.ampSlider.value = 30;
    this.phaseSlider.value = 45;
    this.freqVal.textContent = "20";
    this.ampVal.textContent = "30";
    this.phaseVal.textContent = "45°";

    this.modal.classList.remove('hidden');
    this.startWaveformRender();
  }

  openPasscodeChallenge(onSuccess) {
    this.challengeType = 'PASSCODE';
    this.onSuccessCallback = onSuccess;
    this.isOpen = true;

    this.titleElement.textContent = "CYBER TOWER SECURITY OVERRIDE";
    this.instructionsElement.textContent = "Input the 4-digit security code received from Specialist Nix to initialize broadcast sequence.";

    this.waveformContainer.classList.add('hidden');
    this.waveformControls.classList.add('hidden');
    this.passcodeContainer.classList.remove('hidden');
    this.submitBtn.classList.remove('hidden');
    this.submitBtn.textContent = "EXECUTE OVERRIDE";

    this.currentPasscode = "";
    this.updatePasscodeDisplay();

    this.modal.classList.remove('hidden');
  }

  startWaveformRender() {
    if (this.animFrameId) cancelAnimationFrame(this.animFrameId);

    let phaseOffset = 0;
    const ctx = this.canvas.getContext('2d');
    const w = this.canvas.width;
    const h = this.canvas.height;
    const centerY = h / 2;

    const render = () => {
      if (!this.isOpen || this.challengeType !== 'WAVEFORM') return;

      phaseOffset += 0.05;
      ctx.clearRect(0, 0, w, h);

      // Draw Grid
      ctx.strokeStyle = 'rgba(0, 243, 255, 0.1)';
      ctx.lineWidth = 1;
      for (let x = 0; x < w; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let y = 0; y < h; y += 40) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      const curFreq = parseFloat(this.freqSlider.value);
      const curAmp = parseFloat(this.ampSlider.value);
      const curPhase = parseFloat(this.phaseSlider.value) * (Math.PI / 180);

      const targetPhaseRad = this.targetPhase * (Math.PI / 180);

      // Target Wave (Cyan Glowing)
      ctx.beginPath();
      ctx.strokeStyle = '#00f3ff';
      ctx.lineWidth = 3;
      ctx.shadowColor = '#00f3ff';
      ctx.shadowBlur = 12;

      for (let x = 0; x < w; x++) {
        const y = centerY + Math.sin((x / w) * Math.PI * (this.targetFreq / 10) + phaseOffset + targetPhaseRad) * this.targetAmp;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Player Wave (Magenta / Yellow Glowing)
      ctx.beginPath();
      ctx.strokeStyle = '#ff007f';
      ctx.lineWidth = 2.5;
      ctx.shadowColor = '#ff007f';
      ctx.shadowBlur = 10;

      for (let x = 0; x < w; x++) {
        const y = centerY + Math.sin((x / w) * Math.PI * (curFreq / 10) + phaseOffset + curPhase) * curAmp;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Calculate Sync Percentage
      const freqDiff = Math.abs(curFreq - this.targetFreq) / 100;
      const ampDiff = Math.abs(curAmp - this.targetAmp) / 80;
      const phaseDiff = Math.abs(parseFloat(this.phaseSlider.value) - this.targetPhase) / 360;

      const totalError = (freqDiff * 0.5) + (ampDiff * 0.3) + (phaseDiff * 0.2);
      this.syncPercent = Math.max(0, Math.min(100, (1 - totalError) * 100));

      if (this.syncRateText) {
        this.syncRateText.textContent = `${Math.floor(this.syncPercent)}%`;
      }
      if (this.syncProgressBar) {
        this.syncProgressBar.style.width = `${this.syncPercent}%`;
      }

      this.animFrameId = requestAnimationFrame(render);
    };

    this.animFrameId = requestAnimationFrame(render);
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
    if (this.animFrameId) cancelAnimationFrame(this.animFrameId);
    this.modal.classList.add('hidden');
  }
}
