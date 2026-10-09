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

    // Click to advance. Assigned via onclick (not addEventListener) so a scene restart replaces the
    // handler of the previous DialogueSystem instead of stacking another one on the persistent element.
    if (this.dialogueBox) {
      this.dialogueBox.onclick = () => {
        this.advance();
      };
    }

    // Audio Context for retro 8-bit chiptune chatter bleeps
    this.audioCtx = null;

    // Sprite image cache for dialogue portraits
    this.imageCache = new Map();
    [
      'assets/world/overseer_echo-removebg-preview.png',
      'assets/world/scout_ren-removebg-preview.png',
      'assets/world/villager_2_-removebg-preview.png',
      'assets/world/Villager_3_-removebg-preview.png',
      'assets/world/workshop_worker_Engineer_-removebg-preview.png',
      'assets/world/Shopkeeper_Trader_-removebg-preview.png',
      'assets/world/broken_boat-removebg-preview.png',
      'assets/world/main_character.png'
    ].forEach(src => this.preloadImage(src));
  }

  preloadImage(src) {
    if (!this.imageCache.has(src)) {
      const img = new Image();
      img.src = src;
      this.imageCache.set(src, img);
    }
    return this.imageCache.get(src);
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

  getAvatarConfig(name = '', dialogueData = null) {
    if (dialogueData && dialogueData.avatar) {
      return {
        src: dialogueData.avatar,
        color: dialogueData.portraitColor || '#00f3ff',
        isCharacter: dialogueData.isCharacter !== undefined ? dialogueData.isCharacter : true
      };
    }

    const upperName = (name || '').toUpperCase().trim();

    if (upperName.includes('ECHO')) {
      return {
        src: 'assets/world/overseer_echo-removebg-preview.png',
        color: '#00f3ff',
        isCharacter: true
      };
    }
    if (upperName.includes('REN') || upperName.includes('SCOUT') || upperName.includes('RANGER')) {
      return {
        src: 'assets/world/scout_ren-removebg-preview.png',
        color: '#22c55e',
        isCharacter: true
      };
    }
    if (upperName.includes('MIRA')) {
      return {
        src: 'assets/world/villager_2_-removebg-preview.png',
        color: '#14b8a6',
        isCharacter: true
      };
    }
    if (upperName.includes('NIX')) {
      return {
        src: 'assets/world/Villager_3_-removebg-preview.png',
        color: '#ec4899',
        isCharacter: true
      };
    }
    if (upperName.includes('WORKER') || upperName.includes('ENGINEER')) {
      return {
        src: 'assets/world/workshop_worker_Engineer_-removebg-preview.png',
        color: '#ffa500',
        isCharacter: true
      };
    }
    if (upperName.includes('MASTER')) {
      return {
        src: 'assets/world/Shopkeeper_Trader_-removebg-preview.png',
        color: '#a855f7',
        isCharacter: true
      };
    }
    if (upperName.includes('BOAT') || upperName.includes('SKIFF') || upperName.includes('STATUS')) {
      return {
        src: 'assets/world/broken_boat-removebg-preview.png',
        color: '#d97706',
        isCharacter: false
      };
    }
    if (upperName.includes('TRAVELER') || upperName.includes('PLAYER')) {
      return {
        src: 'assets/world/main_character.png',
        color: '#38bdf8',
        isCharacter: false
      };
    }
    if (upperName.includes('OLD TERMINAL') || upperName.includes('UNIX') || upperName.includes('LEGACY')) {
      return {
        src: 'assets/world/Oldterminal-removebg-preview.png',
        color: '#22c55e',
        isCharacter: false
      };
    }
    if (upperName.includes('HUB') || upperName.includes('ROUTING')) {
      return {
        src: 'assets/world/NetworkHub-removebg-preview.png',
        color: '#3b82f6',
        isCharacter: false
      };
    }
    if (upperName.includes('FACILITY') || upperName.includes('VAULT') || upperName.includes('BUNKER')) {
      return {
        src: 'assets/world/Aegi_Facility-removebg-preview.png',
        color: '#ef4444',
        isCharacter: false
      };
    }
    if (upperName.includes('LIGHTHOUSE') || upperName.includes('BEACON')) {
      return {
        src: 'assets/world/Lighthouse-removebg-preview.png',
        color: '#facc15',
        isCharacter: false
      };
    }
    if (upperName.includes('RADIO') || upperName.includes('TOWER')) {
      return {
        src: 'assets/world/RadioTower-removebg-preview.png',
        color: '#38bdf8',
        isCharacter: false
      };
    }
    if (upperName.includes('CYBER TERMINAL') || upperName.includes('TERMINAL')) {
      return {
        src: 'assets/world/Cyber_Terminal-removebg-preview.png',
        color: '#00f3ff',
        isCharacter: false
      };
    }

    // Default fallback
    return {
      src: 'assets/world/overseer_echo-removebg-preview.png',
      color: '#00f3ff',
      isCharacter: true
    };
  }

  drawPortrait(color = '#00f3ff', name = '', dialogueData = null) {
    if (!this.portraitCanvas) return;
    const ctx = this.portraitCanvas.getContext('2d');

    // Ensure 160x160 canvas resolution for razor-sharp rendering on all displays
    if (this.portraitCanvas.width !== 160 || this.portraitCanvas.height !== 160) {
      this.portraitCanvas.width = 160;
      this.portraitCanvas.height = 160;
    }
    const w = 160;
    const h = 160;

    const config = this.getAvatarConfig(name, dialogueData);
    const accentColor = dialogueData?.portraitColor || config.color || color || '#00f3ff';

    // 1. Clear & Dark Retro Cyber Backdrop
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#080d1a';
    ctx.fillRect(0, 0, w, h);

    // 2. Ambient Radial Glow matching character accent color
    const hexToRgba = (hex, alpha) => {
      let c = hex.replace('#', '');
      if (c.length === 3) c = c.split('').map(x => x + x).join('');
      const num = parseInt(c, 16);
      return `rgba(${(num >> 16) & 255}, ${(num >> 8) & 255}, ${num & 255}, ${alpha})`;
    };

    const radGrad = ctx.createRadialGradient(w / 2, h / 2, 5, w / 2, h / 2, 75);
    radGrad.addColorStop(0, hexToRgba(accentColor, 0.45));
    radGrad.addColorStop(0.65, hexToRgba(accentColor, 0.15));
    radGrad.addColorStop(1, 'rgba(8, 13, 26, 0.95)');
    ctx.fillStyle = radGrad;
    ctx.fillRect(0, 0, w, h);

    // 3. Subtle Cyber Grid Pattern
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
    ctx.lineWidth = 1;
    for (let x = 0; x < w; x += 16) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y < h; y += 16) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    // 4. Draw Character / Object Sprite
    const img = this.preloadImage(config.src);
    if (img && img.complete && img.naturalWidth > 0) {
      this.renderSpriteOnCanvas(ctx, img, config.isCharacter, w, h);
    } else if (img) {
      // If image is loading, attach callback and render holographic indicator
      img.onload = () => {
        if (this.isOpen && this.speakerElement?.textContent === (dialogueData?.speaker || name)) {
          this.drawPortrait(color, name, dialogueData);
        }
      };
      ctx.fillStyle = hexToRgba(accentColor, 0.25);
      ctx.fillRect(24, 24, 112, 112);
    }

    // 5. Retro Gold RPG Frame & Cyber Corner Accents
    ctx.strokeStyle = '#fef08a';
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, w - 2, h - 2);

    // Neon Cyber Corner Brackets in accent color
    ctx.strokeStyle = accentColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    // Top-left
    ctx.moveTo(1, 12); ctx.lineTo(1, 1); ctx.lineTo(12, 1);
    // Top-right
    ctx.moveTo(w - 12, 1); ctx.lineTo(w - 1, 1); ctx.lineTo(w - 1, 12);
    // Bottom-left
    ctx.moveTo(1, h - 12); ctx.lineTo(1, h - 1); ctx.lineTo(12, h - 1);
    // Bottom-right
    ctx.moveTo(w - 12, h - 1); ctx.lineTo(w - 1, h - 1); ctx.lineTo(w - 1, h - 12);
    ctx.stroke();
  }

  renderSpriteOnCanvas(ctx, img, isCharacter, w, h) {
    ctx.imageSmoothingEnabled = false;
    if (isCharacter) {
      // Bust crop: top ~62% of the character sprite (focusing on head, face, shoulders & chest)
      const cropH = img.naturalHeight * 0.62;
      const targetH = 142;
      const scale = targetH / cropH;
      const dw = img.naturalWidth * scale;
      const dh = targetH;
      const dx = (w - dw) / 2;
      const dy = h - dh; // Grounded at the bottom
      ctx.drawImage(img, 0, 0, img.naturalWidth, cropH, dx, dy, dw, dh);
    } else {
      // Full object / prop fit (broken boat, terminal, etc.)
      const maxDim = 142;
      const scale = Math.min(maxDim / img.naturalWidth, maxDim / img.naturalHeight);
      const dw = img.naturalWidth * scale;
      const dh = img.naturalHeight * scale;
      const dx = (w - dw) / 2;
      const dy = (h - dh) / 2;
      ctx.drawImage(img, 0, 0, img.naturalWidth, img.naturalHeight, dx, dy, dw, dh);
    }
  }

  startDialogue(dialogueData, onComplete = null) {
    if (!dialogueData) return;
    if (this.typewriterTimer) {
      clearInterval(this.typewriterTimer);
      this.typewriterTimer = null;
    }
    this.currentDialogue = dialogueData;
    this.lineIndex = 0;
    this.onCompleteCallback = onComplete;
    this.isOpen = true;

    if (this.speakerElement) {
      this.speakerElement.textContent = dialogueData.speaker || 'UNKNOWN';
    }
    this.drawPortrait(dialogueData.portraitColor || '#00f3ff', dialogueData.speaker, dialogueData);
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

    if (this.typewriterTimer) {
      clearInterval(this.typewriterTimer);
      this.typewriterTimer = null;
    }

    const rawLine = this.currentDialogue.lines[this.lineIndex] || "";
    const isPlayerLine = rawLine.startsWith("Player: ") || rawLine.startsWith("PLAYER: ");

    if (isPlayerLine) {
      if (this.speakerElement) {
        this.speakerElement.textContent = "STRANDED TRAVELER";
      }
      this.drawPortrait('#38bdf8', 'STRANDED TRAVELER', {
        speaker: 'STRANDED TRAVELER',
        portraitColor: '#38bdf8',
        avatar: 'assets/world/main_character.png',
        isCharacter: false
      });
      this.fullCurrentLine = rawLine.substring(rawLine.indexOf(':') + 2);
    } else {
      if (this.speakerElement) {
        this.speakerElement.textContent = this.currentDialogue.speaker || "UNKNOWN";
      }
      this.drawPortrait(this.currentDialogue.portraitColor || '#00f3ff', this.currentDialogue.speaker, this.currentDialogue);
      this.fullCurrentLine = rawLine;
    }

    if (this.textElement) {
      this.textElement.textContent = "";
    }
    this.isTyping = true;
    let charIndex = 0;

    this.typewriterTimer = setInterval(() => {
      if (charIndex < this.fullCurrentLine.length) {
        const nextChar = this.fullCurrentLine[charIndex];
        if (this.textElement) {
          this.textElement.textContent += nextChar;
        }
        charIndex++;

        if (charIndex % 3 === 0) {
          try {
            this.playRetroBlip();
          } catch (e) {
            // Audio silent fallback
          }
        }
      } else {
        if (this.typewriterTimer) {
          clearInterval(this.typewriterTimer);
          this.typewriterTimer = null;
        }
        this.isTyping = false;
      }
    }, 22);
  }

  advance() {
    if (!this.isOpen) return;

    if (this.isTyping) {
      // Complete current line immediately
      if (this.typewriterTimer) {
        clearInterval(this.typewriterTimer);
        this.typewriterTimer = null;
      }
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
    if (this.typewriterTimer) {
      clearInterval(this.typewriterTimer);
      this.typewriterTimer = null;
    }
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
