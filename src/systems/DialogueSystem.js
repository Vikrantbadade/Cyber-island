export class DialogueSystem {
  constructor(game) {
    this.game = game;
    this.isOpen = false;
    this.currentDialogue = null;
    this.lineIndex = 0;
    this.typewriterTimer = null;
    this.isTyping = false;
    this.fullCurrentLine = "";
    this.onCompleteCallback = null;

    // DOM Elements
    this.dialogueBox = document.getElementById('dialogue-box');
    this.speakerElement = document.getElementById('dialogue-speaker');
    this.textElement = document.getElementById('dialogue-text');
    this.portraitCanvas = document.getElementById('portrait-canvas');
    this.promptElement = document.getElementById('dialogue-prompt');

    // Click to advance
    if (this.dialogueBox) {
      this.dialogueBox.addEventListener('click', () => {
        this.advance();
      });
    }

    // Audio Context for synthetic cyber chatter bleeps
    this.audioCtx = null;
  }

  playCyberBeep() {
    try {
      if (!this.audioCtx) {
        const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
        if (AudioCtxClass) this.audioCtx = new AudioCtxClass();
      }
      if (this.audioCtx && this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }
      if (!this.audioCtx) return;

      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440 + Math.random() * 300, this.audioCtx.currentTime);
      gain.gain.setValueAtTime(0.03, this.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.05);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      osc.start();
      osc.stop(this.audioCtx.currentTime + 0.05);
    } catch (e) {
      // Audio fallback silent
    }
  }

  drawPortrait(color = '#00f3ff', name = '') {
    if (!this.portraitCanvas) return;
    const ctx = this.portraitCanvas.getContext('2d');
    const w = this.portraitCanvas.width;
    const h = this.portraitCanvas.height;

    ctx.clearRect(0, 0, w, h);

    // Background glow
    ctx.fillStyle = '#060c1c';
    ctx.fillRect(0, 0, w, h);

    // Hologram grid lines
    ctx.strokeStyle = 'rgba(0, 243, 255, 0.15)';
    ctx.lineWidth = 1;
    for (let i = 0; i < h; i += 8) {
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(w, i);
      ctx.stroke();
    }

    // Avatar silhouette / emblem
    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = 10;

    // Outer ring
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, 28, 0, Math.PI * 2);
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.stroke();

    // Core symbol
    ctx.beginPath();
    if (name.includes('ECHO')) {
      // Diamond
      ctx.moveTo(w / 2, h / 2 - 16);
      ctx.lineTo(w / 2 + 16, h / 2);
      ctx.lineTo(w / 2, h / 2 + 16);
      ctx.lineTo(w / 2 - 16, h / 2);
    } else if (name.includes('NIX')) {
      // Hexagon / Triangle
      ctx.moveTo(w / 2, h / 2 - 16);
      ctx.lineTo(w / 2 + 14, h / 2 + 12);
      ctx.lineTo(w / 2 - 14, h / 2 + 12);
    } else {
      // Circle terminal
      ctx.arc(w / 2, h / 2, 14, 0, Math.PI * 2);
    }
    ctx.closePath();
    ctx.fill();

    ctx.shadowBlur = 0;
  }

  startDialogue(dialogueData, onComplete = null) {
    if (!dialogueData) return;
    this.currentDialogue = dialogueData;
    this.lineIndex = 0;
    this.onCompleteCallback = onComplete;
    this.isOpen = true;

    this.speakerElement.textContent = dialogueData.speaker || 'UNKNOWN';
    this.drawPortrait(dialogueData.portraitColor || '#00f3ff', dialogueData.speaker);
    this.dialogueBox.classList.remove('hidden');

    this.showLine();
  }

  showLine() {
    if (!this.currentDialogue || this.lineIndex >= this.currentDialogue.lines.length) {
      this.closeDialogue();
      return;
    }

    this.fullCurrentLine = this.currentDialogue.lines[this.lineIndex];
    this.textElement.textContent = "";
    this.isTyping = true;
    let charIndex = 0;

    if (this.typewriterTimer) clearInterval(this.typewriterTimer);

    this.typewriterTimer = setInterval(() => {
      if (charIndex < this.fullCurrentLine.length) {
        this.textElement.textContent += this.fullCurrentLine[charIndex];
        if (charIndex % 3 === 0) this.playCyberBeep();
        charIndex++;
      } else {
        clearInterval(this.typewriterTimer);
        this.isTyping = false;
      }
    }, 24);
  }

  advance() {
    if (!this.isOpen) return;

    if (this.isTyping) {
      // Complete current line instantly
      clearInterval(this.typewriterTimer);
      this.textElement.textContent = this.fullCurrentLine;
      this.isTyping = false;
    } else {
      // Next line
      this.lineIndex++;
      this.showLine();
    }
  }

  closeDialogue() {
    if (this.typewriterTimer) clearInterval(this.typewriterTimer);
    this.isOpen = false;
    this.isTyping = false;
    this.dialogueBox.classList.add('hidden');

    if (this.onCompleteCallback) {
      const cb = this.onCompleteCallback;
      this.onCompleteCallback = null;
      cb();
    }
  }
}
