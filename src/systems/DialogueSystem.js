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

    // Audio Context for retro 8-bit chiptune chatter bleeps
    this.audioCtx = null;
  }

  playRetroBlip() {
    if (window.SOUND_ENABLED === false) return;

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

      // Triangle wave delivers warm, charming 8-bit text sound
      osc.type = 'triangle';
      const baseFreq = 520 + (Math.floor(Math.random() * 4) * 45);
      osc.frequency.setValueAtTime(baseFreq, this.audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(baseFreq + 80, this.audioCtx.currentTime + 0.025);

      gain.gain.setValueAtTime(0.025, this.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.03);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      osc.start();
      osc.stop(this.audioCtx.currentTime + 0.03);
    } catch (e) {
      // Audio fallback silent
    }
  }

  drawPortrait(color = '#00f3ff', name = '') {
    if (!this.portraitCanvas) return;
    const ctx = this.portraitCanvas.getContext('2d');
    const w = this.portraitCanvas.width;
    const h = this.portraitCanvas.height;

    // Reset canvas and enable crisp pixel scaling
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, w, h);

    // Deep dark background
    ctx.fillStyle = '#080d1a';
    ctx.fillRect(0, 0, w, h);

    // Retro pixel grid background pattern (subtle 8x8 tiles)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
    for (let x = 0; x < w; x += 10) {
      for (let y = 0; y < h; y += 10) {
        if ((x + y) % 20 === 0) {
          ctx.fillRect(x, y, 10, 10);
        }
      }
    }

    const upperName = name.toUpperCase();
    const pixelSize = 5; // 16x16 grid for 80x80 canvas

    // Helper to draw a pixel block
    const p = (px, py, col) => {
      ctx.fillStyle = col;
      ctx.fillRect(px * pixelSize, py * pixelSize, pixelSize, pixelSize);
    };

    // Helper to fill rectangle in grid units
    const rect = (px, py, pw, ph, col) => {
      ctx.fillStyle = col;
      ctx.fillRect(px * pixelSize, py * pixelSize, pw * pixelSize, ph * pixelSize);
    };

    if (upperName.includes('MASTER')) {
      // MARTIAL ARTS MASTER TAI: White beard, red headband, kimono collar
      // Skin
      rect(5, 5, 6, 7, '#fcd34d');
      // Hair / Topknot
      rect(6, 2, 4, 3, '#e2e8f0');
      rect(5, 3, 6, 2, '#cbd5e1');
      // Red martial arts headband
      rect(4, 5, 8, 2, '#dc2626');
      p(3, 6, '#b91c1c');
      p(12, 6, '#b91c1c');
      // Eyebrows & Eyes
      p(6, 8, '#334155');
      p(9, 8, '#334155');
      // Long White Beard
      rect(5, 10, 6, 4, '#f8fafc');
      rect(6, 14, 4, 2, '#e2e8f0');
      p(7, 12, '#cbd5e1');
      p(8, 12, '#cbd5e1');
      // Martial Arts Gi / Kimono
      rect(3, 13, 10, 3, '#7c3aed');
      rect(6, 13, 4, 3, '#f8fafc');
    } else if (upperName.includes('NIX')) {
      // SPECIALIST NIX: Magenta tech hair, green hacker visor/goggles
      // Spiky Magenta Hair
      rect(4, 2, 8, 5, '#ec4899');
      p(3, 4, '#db2777');
      p(12, 4, '#db2777');
      p(5, 1, '#f472b6');
      p(9, 1, '#f472b6');
      // Face
      rect(5, 6, 6, 6, '#fed7aa');
      // Cyber Goggles / Visor
      rect(4, 7, 8, 2, '#10b981');
      p(6, 7, '#6ee7b7');
      p(9, 7, '#6ee7b7');
      // Mouth
      p(7, 10, '#f43f5e');
      p(8, 10, '#f43f5e');
      // Tech Jacket Collar
      rect(4, 13, 8, 3, '#312e81');
      rect(6, 13, 4, 3, '#ec4899');
    } else if (upperName.includes('ECHO')) {
      // OVERSEER ECHO: Cyan cyber suit, glowing cyan ocular visor
      // Helmet shell
      rect(4, 3, 8, 9, '#1e293b');
      rect(5, 2, 6, 2, '#334155');
      // Communicator antenna
      p(11, 1, '#06b6d4');
      p(11, 2, '#0891b2');
      // Cyan Visor Slit
      rect(4, 6, 8, 3, '#06b6d4');
      rect(5, 7, 6, 1, '#cffafe');
      // Core Faceplate
      rect(6, 10, 4, 2, '#0f172a');
      // Cyber Armor Shoulders
      rect(3, 13, 10, 3, '#0f172a');
      rect(6, 13, 4, 2, '#06b6d4');
    } else if (upperName.includes('WORKER')) {
      // ISLAND WORKER: Brown work cap, mustache, sturdy overalls
      // Work Cap
      rect(4, 3, 8, 3, '#b45309');
      rect(3, 5, 10, 1, '#78350f');
      // Face
      rect(5, 6, 6, 5, '#fed7aa');
      // Eyes
      p(6, 7, '#1e293b');
      p(9, 7, '#1e293b');
      // Worker Mustache
      rect(5, 9, 6, 2, '#78350f');
      // Overalls
      rect(3, 12, 10, 4, '#1d4ed8');
      rect(6, 12, 4, 4, '#f59e0b');
    } else if (upperName.includes('MIRA')) {
      // DR. MIRA: Lab coat, teal glasses, intelligent look
      // Hair
      rect(4, 3, 8, 4, '#0d9488');
      p(3, 5, '#0f766e');
      p(12, 5, '#0f766e');
      // Face
      rect(5, 6, 6, 6, '#fde68a');
      // Glasses
      rect(4, 7, 3, 2, '#38bdf8');
      rect(9, 7, 3, 2, '#38bdf8');
      p(7, 7, '#0284c7');
      p(8, 7, '#0284c7');
      // Lab coat
      rect(3, 12, 10, 4, '#f8fafc');
      rect(7, 12, 2, 4, '#0d9488');
    } else if (upperName.includes('BOAT') || upperName.includes('SKIFF')) {
      // DAMAGED BOAT: Wooden skiff hull with cracked mast
      // Broken Mast
      p(8, 3, '#78350f');
      p(8, 4, '#78350f');
      p(7, 5, '#78350f');
      p(9, 5, '#92400e');
      // Damaged sail remnant
      p(9, 3, '#e2e8f0');
      p(10, 4, '#cbd5e1');
      // Wooden Hull
      rect(3, 8, 10, 4, '#92400e');
      rect(4, 12, 8, 2, '#78350f');
      // Water ripples
      rect(2, 14, 12, 1, '#38bdf8');
      rect(4, 15, 8, 1, '#0284c7');
    } else {
      // DEFAULT / TRAVELER / TERMINAL: Retro computer screen or adventurer
      if (upperName.includes('TRAVELER') || upperName.includes('PLAYER')) {
        // Stranded Explorer
        rect(5, 3, 6, 3, '#78350f');
        // Blue Headband
        rect(4, 5, 8, 2, '#2563eb');
        // Face
        rect(5, 7, 6, 5, '#fed7aa');
        p(6, 8, '#0f172a');
        p(9, 8, '#0f172a');
        // Clothes
        rect(3, 12, 10, 4, '#b45309');
      } else {
        // Retro CRT terminal
        rect(3, 3, 10, 10, '#1e293b');
        rect(4, 4, 8, 7, '#0f172a');
        // Green prompt >_
        p(5, 6, '#22c55e');
        p(6, 7, '#22c55e');
        p(5, 8, '#22c55e');
        rect(8, 8, 2, 1, '#22c55e');
        // Base
        rect(6, 13, 4, 2, '#334155');
      }
    }

    // Outer decorative pixel border
    ctx.strokeStyle = '#fde68a';
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, w - 2, h - 2);
  }

  startDialogue(dialogueData, onComplete = null) {
    if (!dialogueData) return;
    this.currentDialogue = dialogueData;
    this.lineIndex = 0;
    this.onCompleteCallback = onComplete;
    this.isOpen = true;

    if (this.speakerElement) {
      this.speakerElement.textContent = dialogueData.speaker || 'UNKNOWN';
    }
    this.drawPortrait(dialogueData.portraitColor || '#00f3ff', dialogueData.speaker);
    if (this.dialogueBox) {
      this.dialogueBox.classList.remove('hidden');
    }

    this.showLine();
  }

  showLine() {
    if (!this.currentDialogue || this.lineIndex >= this.currentDialogue.lines.length) {
      this.closeDialogue();
      return;
    }

    this.fullCurrentLine = this.currentDialogue.lines[this.lineIndex];
    if (this.textElement) {
      this.textElement.textContent = "";
    }
    this.isTyping = true;
    let charIndex = 0;

    if (this.typewriterTimer) clearInterval(this.typewriterTimer);

    this.typewriterTimer = setInterval(() => {
      if (charIndex < this.fullCurrentLine.length) {
        if (this.textElement) {
          this.textElement.textContent += this.fullCurrentLine[charIndex];
        }
        if (charIndex % 3 === 0) {
          this.playRetroBlip();
        }
        charIndex++;
      } else {
        clearInterval(this.typewriterTimer);
        this.isTyping = false;
      }
    }, 22);
  }

  advance() {
    if (!this.isOpen) return;

    if (this.isTyping) {
      // Complete current line immediately
      clearInterval(this.typewriterTimer);
      if (this.textElement) {
        this.textElement.textContent = this.fullCurrentLine;
      }
      this.isTyping = false;
    } else {
      // Advance to next line
      this.lineIndex++;
      this.showLine();
    }
  }

  closeDialogue() {
    if (this.typewriterTimer) clearInterval(this.typewriterTimer);
    this.isOpen = false;
    this.isTyping = false;
    if (this.dialogueBox) {
      this.dialogueBox.classList.add('hidden');
    }

    if (this.onCompleteCallback) {
      const cb = this.onCompleteCallback;
      this.onCompleteCallback = null;
      cb();
    }
  }
}
