// Procedural Web Audio API atmospheric horror synthesizer (zero external audio files)

class HorrorAudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private ambientGain: GainNode | null = null;
  private noiseBuffer: AudioBuffer | null = null;
  private droneOsc1: OscillatorNode | null = null;
  private droneOsc2: OscillatorNode | null = null;
  private windFilter: BiquadFilterNode | null = null;
  private ambientTimer: number | null = null;
  private muted = false;
  private dreadLevel = 0.25;
  private initialized = false;

  public init(): void {
    if (this.initialized) {
      if (this.ctx?.state === 'suspended') {
        void this.ctx.resume();
      }
      return;
    }

    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;

    const ctx = new AudioCtx();
    this.ctx = ctx;

    const master = ctx.createGain();
    master.gain.value = this.muted ? 0 : 0.72;
    master.connect(ctx.destination);
    this.masterGain = master;

    const ambient = ctx.createGain();
    ambient.gain.value = 0.36;
    ambient.connect(master);
    this.ambientGain = ambient;

    // Create 3-second pink-ish noise buffer
    const bufferSize = ctx.sampleRate * 3;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.08;
      b6 = white * 0.115926;
    }
    this.noiseBuffer = buffer;

    this.startAmbientLayers(ctx, ambient, buffer);
    this.initialized = true;
  }

  private startAmbientLayers(ctx: AudioContext, dest: GainNode, noiseBuffer: AudioBuffer): void {
    // Deep manor sub-bass drone
    const droneFilter = ctx.createBiquadFilter();
    droneFilter.type = 'lowpass';
    droneFilter.frequency.value = 115;

    const droneGain = ctx.createGain();
    droneGain.gain.value = 0.22;

    const osc1 = ctx.createOscillator();
    osc1.type = 'sawtooth';
    osc1.frequency.value = 46.25; // Low F#1

    const osc2 = ctx.createOscillator();
    osc2.type = 'triangle';
    osc2.frequency.value = 46.65; // Slow beating detune

    osc1.connect(droneFilter);
    osc2.connect(droneFilter);
    droneFilter.connect(droneGain);
    droneGain.connect(dest);
    osc1.start();
    osc2.start();
    this.droneOsc1 = osc1;
    this.droneOsc2 = osc2;

    // Continuous cold draft / howling wind outside gothic windows
    const windSource = ctx.createBufferSource();
    windSource.buffer = noiseBuffer;
    windSource.loop = true;

    const windFilter = ctx.createBiquadFilter();
    windFilter.type = 'bandpass';
    windFilter.frequency.value = 320;
    windFilter.Q.value = 2.6;

    const windLfo = ctx.createOscillator();
    windLfo.type = 'sine';
    windLfo.frequency.value = 0.09;
    const windLfoGain = ctx.createGain();
    windLfoGain.gain.value = 140;
    windLfo.connect(windLfoGain);
    windLfoGain.connect(windFilter.frequency);
    windLfo.start();

    const windGain = ctx.createGain();
    windGain.gain.value = 0.28;

    windSource.connect(windFilter);
    windFilter.connect(windGain);
    windGain.connect(dest);
    windSource.start();
    this.windFilter = windFilter;

    // Periodic psychological dread cues (creaks, distant whispers, floorboards)
    this.ambientTimer = window.setInterval(() => {
      if (!this.ctx || this.ctx.state !== 'running' || this.muted) return;
      const roll = Math.random();
      if (roll < 0.35 + this.dreadLevel * 0.25) {
        this.playRandomTimberCreak();
      } else if (roll < 0.58 + this.dreadLevel * 0.28) {
        this.playSubtleWhisper();
      }
    }, 5200);
  }

  public setMuted(muted: boolean): void {
    this.muted = muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(muted ? 0 : 0.72, this.ctx.currentTime, 0.08);
    }
  }

  public setDreadLevel(level: number): void {
    this.dreadLevel = Math.max(0, Math.min(1, level));
    if (this.windFilter && this.ctx) {
      this.windFilter.frequency.setTargetAtTime(280 + this.dreadLevel * 220, this.ctx.currentTime, 0.6);
    }
    if (this.ambientGain && this.ctx) {
      this.ambientGain.gain.setTargetAtTime(0.32 + this.dreadLevel * 0.22, this.ctx.currentTime, 0.6);
    }
  }

  public playFootstep(surface: 'marble' | 'wood' | 'stone' = 'wood'): void {
    if (!this.ctx || !this.masterGain || !this.noiseBuffer || this.muted) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;

    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = surface === 'marble' ? 920 : surface === 'stone' ? 520 : 340;
    filter.Q.value = surface === 'marble' ? 1.8 : 1.2;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(surface === 'marble' ? 0.14 : 0.19, now + 0.018);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    src.start(now, Math.random() * 1.5, 0.16);

    // Subtle wood floor resonance
    if (surface === 'wood') {
      const thud = ctx.createOscillator();
      const thudGain = ctx.createGain();
      thud.type = 'sine';
      thud.frequency.setValueAtTime(92 + Math.random() * 16, now);
      thud.frequency.exponentialRampToValueAtTime(42, now + 0.09);
      thudGain.gain.setValueAtTime(0.09, now);
      thudGain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
      thud.connect(thudGain);
      thudGain.connect(this.masterGain);
      thud.start(now);
      thud.stop(now + 0.11);
    }
  }

  public playRandomTimberCreak(): void {
    if (!this.ctx || !this.masterGain || this.muted) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    const startFreq = 120 + Math.random() * 90;
    osc.frequency.setValueAtTime(startFreq, now);
    osc.frequency.linearRampToValueAtTime(startFreq * 0.76, now + 0.35);
    osc.frequency.linearRampToValueAtTime(startFreq * 0.92, now + 0.65);

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 340;
    filter.Q.value = 5.5;

    const panner = ctx.createStereoPanner();
    panner.pan.value = (Math.random() - 0.5) * 1.6;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.05 + this.dreadLevel * 0.04, now + 0.12);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.72);

    osc.connect(filter);
    filter.connect(panner);
    panner.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.75);
  }

  public playSubtleWhisper(): void {
    if (!this.ctx || !this.masterGain || !this.noiseBuffer || this.muted) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;

    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuffer;

    const formant = ctx.createBiquadFilter();
    formant.type = 'bandpass';
    formant.frequency.setValueAtTime(1100 + Math.random() * 450, now);
    formant.frequency.linearRampToValueAtTime(750 + Math.random() * 350, now + 1.1);
    formant.Q.value = 4.5;

    const panner = ctx.createStereoPanner();
    panner.pan.setValueAtTime((Math.random() > 0.5 ? 1 : -1) * (0.45 + Math.random() * 0.45), now);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.09 + this.dreadLevel * 0.08, now + 0.25);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 1.35);

    src.connect(formant);
    formant.connect(panner);
    panner.connect(gain);
    gain.connect(this.masterGain);
    src.start(now, Math.random(), 1.4);
  }

  public playChime(pitch: number): void {
    if (!this.ctx || !this.masterGain || this.muted) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;

    const partials = [1, 2.756, 5.4];
    partials.forEach((mult, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = pitch * mult;
      const amp = idx === 0 ? 0.24 : idx === 1 ? 0.08 : 0.03;
      gain.gain.setValueAtTime(amp, now);
      gain.gain.exponentialRampToValueAtTime(0.0008, now + (idx === 0 ? 2.1 : 1.1));
      osc.connect(gain);
      gain.connect(this.masterGain!);
      osc.start(now);
      osc.stop(now + 2.2);
    });
  }

  public playPickup(): void {
    if (!this.ctx || !this.masterGain || this.muted) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;
    [523.25, 659.25].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.001, now + i * 0.055);
      gain.gain.linearRampToValueAtTime(0.11, now + i * 0.055 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.055 + 0.45);
      osc.connect(gain);
      gain.connect(this.masterGain!);
      osc.start(now + i * 0.055);
      osc.stop(now + i * 0.055 + 0.48);
    });
  }

  public playPaper(): void {
    if (!this.ctx || !this.masterGain || !this.noiseBuffer || this.muted) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuffer;

    const hp = ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 1800;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.16, now + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

    src.connect(hp);
    hp.connect(gain);
    gain.connect(this.masterGain);
    src.start(now, 0.2, 0.3);
  }

  public playUnlock(): void {
    if (!this.ctx || !this.masterGain || this.muted) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;
    [220, 310, 440].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.value = freq;
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 1200;
      gain.gain.setValueAtTime(0.1, now + i * 0.06);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.06 + 0.14);
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain!);
      osc.start(now + i * 0.06);
      osc.stop(now + i * 0.06 + 0.16);
    });
  }

  public playLocked(): void {
    if (!this.ctx || !this.masterGain || this.muted) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(115, now);
    osc.frequency.exponentialRampToValueAtTime(55, now + 0.12);
    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.16);
  }

  public playCombine(): void {
    if (!this.ctx || !this.masterGain || this.muted) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;
    [330, 495, 660].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.12, now + i * 0.045);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.045 + 0.35);
      osc.connect(gain);
      gain.connect(this.masterGain!);
      osc.start(now + i * 0.045);
      osc.stop(now + i * 0.045 + 0.38);
    });
  }

  public playWallGrind(): void {
    if (!this.ctx || !this.masterGain || !this.noiseBuffer || this.muted) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;

    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuffer;

    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(220, now);
    lp.frequency.linearRampToValueAtTime(140, now + 1.9);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.45, now + 0.25);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 2.1);

    src.connect(lp);
    lp.connect(gain);
    gain.connect(this.masterGain);
    src.start(now, 0, 2.2);

    // Low mechanical groan
    const osc = ctx.createOscillator();
    const oscGain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(64, now);
    osc.frequency.linearRampToValueAtTime(48, now + 1.8);
    oscGain.gain.setValueAtTime(0.001, now);
    oscGain.gain.linearRampToValueAtTime(0.12, now + 0.3);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + 1.95);
    osc.connect(oscGain);
    oscGain.connect(lp);
    osc.start(now);
    osc.stop(now + 2.0);
  }

  public playWhisperStinger(): void {
    this.playSubtleWhisper();
    if (!this.ctx || !this.masterGain || this.muted) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;
    // Eerie dissonant string swell
    [146.83, 155.56].forEach((freq) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.08, now + 0.35);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 2.2);
      osc.connect(gain);
      gain.connect(this.masterGain!);
      osc.start(now);
      osc.stop(now + 2.3);
    });
  }

  public playClockTick(): void {
    if (!this.ctx || !this.masterGain || this.muted) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(840, now);
    osc.frequency.exponentialRampToValueAtTime(220, now + 0.025);
    gain.gain.setValueAtTime(0.055, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.035);
  }

  public playSanctumResolve(): void {
    if (!this.ctx || !this.masterGain || this.muted) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;
    // Warm dawn harmonic resolution
    [220, 277.18, 329.63, 415.3, 493.88].forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.001, now + idx * 0.14);
      gain.gain.linearRampToValueAtTime(0.11, now + idx * 0.14 + 0.2);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.14 + 3.4);
      osc.connect(gain);
      gain.connect(this.masterGain!);
      osc.start(now + idx * 0.14);
      osc.stop(now + idx * 0.14 + 3.5);
    });
  }

  public dispose(): void {
    if (this.ambientTimer !== null) {
      window.clearInterval(this.ambientTimer);
      this.ambientTimer = null;
    }
    try {
      this.droneOsc1?.stop();
      this.droneOsc2?.stop();
    } catch {
      // ignore already stopped
    }
    if (this.ctx) {
      void this.ctx.close();
      this.ctx = null;
    }
    this.initialized = false;
  }
}

export const horrorAudio = new HorrorAudioEngine();
