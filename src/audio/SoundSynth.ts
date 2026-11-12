/**
 * ECHO – THE WORLD REMEMBERS
 * Procedural Web Audio Synthesizer
 * Generates ambient music chords, footsteps, jump whoosh, crystal resonance bells,
 * portal hum, and UI interactions with zero external audio file dependencies.
 */

export class SoundSynth {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private masterGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private ambientOscillators: OscillatorNode[] = [];
  private ambientFilter: BiquadFilterNode | null = null;
  private ambientInterval: number | null = null;
  private lastFootstepTime: number = 0;

  constructor() {
    // AudioContext will be initialized on first user gesture
  }

  public init(): void {
    if (this.ctx) return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.65, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.setValueAtTime(0.35, this.ctx.currentTime);
      this.musicGain.connect(this.masterGain);

      this.startAmbientMusic();
    } catch (e) {
      console.warn('AudioContext not supported or blocked:', e);
    }
  }

  public resume(): void {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.masterGain && this.ctx) {
      const targetGain = this.isMuted ? 0 : 0.65;
      this.masterGain.gain.setTargetAtTime(targetGain, this.ctx.currentTime, 0.05);
    }
    return this.isMuted;
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  public setMasterVolume(val: number): void {
    if (this.masterGain && this.ctx) {
      const clamped = Math.max(0, Math.min(1, val));
      this.masterGain.gain.setTargetAtTime(this.isMuted ? 0 : clamped, this.ctx.currentTime, 0.05);
    }
  }

  public setMusicVolume(val: number): void {
    if (this.musicGain && this.ctx) {
      const clamped = Math.max(0, Math.min(1, val));
      this.musicGain.gain.setTargetAtTime(clamped, this.ctx.currentTime, 0.05);
    }
  }

  /**
   * Generates a mystical shifting chord drone for The Forgotten Island
   */
  private startAmbientMusic(): void {
    if (!this.ctx || !this.musicGain) return;

    // Chord progressions in D minor / Dorian mystic scale: D, F, A, C, E, G
    const baseFrequencies = [
      [73.42, 110.0, 146.83, 220.0, 261.63], // D minor add9
      [65.41, 98.0, 130.81, 196.0, 246.94],  // C major 9
      [55.0, 82.41, 110.0, 164.81, 220.0],   // A minor 7
      [58.27, 87.31, 116.54, 174.61, 233.08] // Bb major 7
    ];

    let chordIndex = 0;

    const playChord = () => {
      if (!this.ctx || !this.musicGain || this.isMuted) return;

      const chord = baseFrequencies[chordIndex];
      chordIndex = (chordIndex + 1) % baseFrequencies.length;

      chord.forEach((freq, i) => {
        if (!this.ctx || !this.musicGain) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();

        osc.type = i === 0 ? 'triangle' : 'sine';
        // Add subtle detune for celestial shimmer
        osc.frequency.setValueAtTime(freq + (Math.random() - 0.5) * 1.2, this.ctx.currentTime);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(350 + i * 120, this.ctx.currentTime);
        filter.Q.setValueAtTime(1.5, this.ctx.currentTime);

        const now = this.ctx.currentTime;
        const duration = 12.0;
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.08 / (i + 1), now + 3.5);
        gain.gain.linearRampToValueAtTime(0.0001, now + duration);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.musicGain);

        osc.start(now);
        osc.stop(now + duration + 0.5);
      });
    };

    playChord();
    this.ambientInterval = window.setInterval(playChord, 10000);
  }

  /**
   * Sound effect: Soft footsteps on grass, dirt, or stone
   */
  public playFootstep(isSprinting: boolean = false): void {
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    const now = performance.now();
    const minInterval = isSprinting ? 280 : 420;
    if (now - this.lastFootstepTime < minInterval) return;
    this.lastFootstepTime = now;

    const t = this.ctx.currentTime;
    const bufferSize = this.ctx.sampleRate * 0.06;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3));
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(450 + Math.random() * 100, t);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.12, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    noise.start(t);
  }

  /**
   * Sound effect: Jump whoosh
   */
  public playJump(): void {
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(140, t);
    osc.frequency.exponentialRampToValueAtTime(320, t + 0.18);

    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.26);
  }

  /**
   * Sound effect: Magic Crystal Resonance
   * A rich celestial bell chord with harmonic overtones and long decay
   */
  public playCrystalResonance(): void {
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    const t = this.ctx.currentTime;

    // Harmonic bell frequencies (E, G#, B, D#, F#)
    const bellFrequencies = [523.25, 659.25, 783.99, 1046.5, 1318.51, 1567.98];

    bellFrequencies.forEach((freq, idx) => {
      if (!this.ctx || !this.masterGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = idx % 2 === 0 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(freq, t);

      const duration = 2.5 + idx * 0.4;
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.18 / (idx + 1), t + 0.02 + idx * 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(t + idx * 0.04);
      osc.stop(t + duration + 0.1);
    });
  }

  /**
   * Sound effect: Great Portal Activation Drone
   */
  public playPortalActivation(): void {
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    const t = this.ctx.currentTime;

    // Sub-bass sweep and ethereal rising resonance
    const osc = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(55, t);
    osc.frequency.exponentialRampToValueAtTime(110, t + 2.5);

    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(220, t);
    osc2.frequency.exponentialRampToValueAtTime(440, t + 3.0);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(180, t);
    filter.frequency.exponentialRampToValueAtTime(1200, t + 2.5);

    gain.gain.setValueAtTime(0.01, t);
    gain.gain.linearRampToValueAtTime(0.35, t + 1.2);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 4.5);

    osc.connect(filter);
    osc2.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc2.start(t);
    osc.stop(t + 4.6);
    osc2.stop(t + 4.6);
  }

  /**
   * Sound effect: Memory Shard collection (crystalline bell arpeggio)
   */
  public playShardCollect(): void {
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    const t = this.ctx.currentTime;
    const notes = [659.25, 880.0, 1046.5, 1318.51, 1760.0]; // E5, A5, C6, E6, A6

    notes.forEach((freq, idx) => {
      if (!this.ctx || !this.masterGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t + idx * 0.05);

      const noteDuration = 1.6;
      gain.gain.setValueAtTime(0, t + idx * 0.05);
      gain.gain.linearRampToValueAtTime(0.14, t + idx * 0.05 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + idx * 0.05 + noteDuration);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(t + idx * 0.05);
      osc.stop(t + idx * 0.05 + noteDuration + 0.05);
    });
  }

  /**
   * Sound effect: Reading ancient stone inscription (mystic low drone & chime)
   */
  public playInscriptionRead(): void {
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    const t = this.ctx.currentTime;

    // Resonant low stone hum
    const humOsc = this.ctx.createOscillator();
    const humGain = this.ctx.createGain();
    const humFilter = this.ctx.createBiquadFilter();

    humOsc.type = 'triangle';
    humOsc.frequency.setValueAtTime(110, t);
    humOsc.frequency.exponentialRampToValueAtTime(82.4, t + 1.8);

    humFilter.type = 'lowpass';
    humFilter.frequency.setValueAtTime(220, t);

    humGain.gain.setValueAtTime(0, t);
    humGain.gain.linearRampToValueAtTime(0.2, t + 0.1);
    humGain.gain.exponentialRampToValueAtTime(0.001, t + 2.0);

    humOsc.connect(humFilter);
    humFilter.connect(humGain);
    humGain.connect(this.masterGain);

    humOsc.start(t);
    humOsc.stop(t + 2.1);

    // Ethereal harmonics
    const bellOsc = this.ctx.createOscillator();
    const bellGain = this.ctx.createGain();
    bellOsc.type = 'sine';
    bellOsc.frequency.setValueAtTime(587.33, t + 0.08); // D5

    bellGain.gain.setValueAtTime(0, t + 0.08);
    bellGain.gain.linearRampToValueAtTime(0.12, t + 0.12);
    bellGain.gain.exponentialRampToValueAtTime(0.001, t + 1.8);

    bellOsc.connect(bellGain);
    bellGain.connect(this.masterGain);

    bellOsc.start(t + 0.08);
    bellOsc.stop(t + 1.9);
  }

  /**
   * Sound effect: Ancient Stone Door Sliding / Unsealing (rumbling grinding)
   */
  public playStoneDoorSound(): void {
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    const t = this.ctx.currentTime;

    // Low frequency rumbler
    const rumble = this.ctx.createOscillator();
    const rumbleGain = this.ctx.createGain();
    const rumbleFilter = this.ctx.createBiquadFilter();

    rumble.type = 'sawtooth';
    rumble.frequency.setValueAtTime(48, t);
    rumble.frequency.linearRampToValueAtTime(42, t + 1.8);

    rumbleFilter.type = 'lowpass';
    rumbleFilter.frequency.setValueAtTime(140, t);

    rumbleGain.gain.setValueAtTime(0, t);
    rumbleGain.gain.linearRampToValueAtTime(0.28, t + 0.3);
    rumbleGain.gain.setValueAtTime(0.25, t + 1.4);
    rumbleGain.gain.exponentialRampToValueAtTime(0.001, t + 2.2);

    rumble.connect(rumbleFilter);
    rumbleFilter.connect(rumbleGain);
    rumbleGain.connect(this.masterGain);

    rumble.start(t);
    rumble.stop(t + 2.3);

    // High friction scrape
    const scrape = this.ctx.createOscillator();
    const scrapeGain = this.ctx.createGain();
    scrape.type = 'triangle';
    scrape.frequency.setValueAtTime(190, t);
    scrape.frequency.exponentialRampToValueAtTime(120, t + 1.6);

    scrapeGain.gain.setValueAtTime(0, t);
    scrapeGain.gain.linearRampToValueAtTime(0.08, t + 0.4);
    scrapeGain.gain.exponentialRampToValueAtTime(0.001, t + 1.9);

    scrape.connect(scrapeGain);
    scrapeGain.connect(this.masterGain);

    scrape.start(t);
    scrape.stop(t + 2.0);
  }

  /**
   * Sound effect: UI Interaction click
   */
  public playUIClick(): void {
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, t);
    osc.frequency.exponentialRampToValueAtTime(400, t + 0.05);

    gain.gain.setValueAtTime(0.1, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.06);
  }

  /**
   * Sound effect: Quest progression chime (e.g. shard progress, distance covered)
   */
  public playQuestUpdate(): void {
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    const t = this.ctx.currentTime;
    const notes = [587.33, 739.99]; // D5, F#5
    notes.forEach((freq, i) => {
      if (!this.ctx || !this.masterGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t + i * 0.08);
      gain.gain.setValueAtTime(0, t + i * 0.08);
      gain.gain.linearRampToValueAtTime(0.12, t + i * 0.08 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.08 + 0.6);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(t + i * 0.08);
      osc.stop(t + i * 0.08 + 0.65);
    });
  }

  /**
   * Sound effect: Quest objective complete (harmonious celestial chime)
   */
  public playQuestObjectiveComplete(): void {
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    const t = this.ctx.currentTime;
    // Ascending arpeggio: D5, F#5, A5, D6
    const freqs = [587.33, 739.99, 880.0, 1174.66];
    freqs.forEach((freq, i) => {
      if (!this.ctx || !this.masterGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = i === 3 ? 'triangle' : 'sine';
      osc.frequency.setValueAtTime(freq, t + i * 0.1);
      gain.gain.setValueAtTime(0, t + i * 0.1);
      gain.gain.linearRampToValueAtTime(0.16, t + i * 0.1 + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + i * 0.1 + 1.4);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(t + i * 0.1);
      osc.stop(t + i * 0.1 + 1.45);
    });
  }

  /**
   * Sound effect: Story narrative modal/banner appeared (deep mystic bell & shimmer)
   */
  public playStoryNarrative(): void {
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    const t = this.ctx.currentTime;

    // Resonant deep drone
    const drone = this.ctx.createOscillator();
    const droneGain = this.ctx.createGain();
    drone.type = 'triangle';
    drone.frequency.setValueAtTime(146.83, t); // D3
    droneGain.gain.setValueAtTime(0, t);
    droneGain.gain.linearRampToValueAtTime(0.2, t + 0.2);
    droneGain.gain.exponentialRampToValueAtTime(0.001, t + 2.8);
    drone.connect(droneGain);
    droneGain.connect(this.masterGain);
    drone.start(t);
    drone.stop(t + 2.9);

    // High mystic glockenspiel tone
    const chime = this.ctx.createOscillator();
    const chimeGain = this.ctx.createGain();
    chime.type = 'sine';
    chime.frequency.setValueAtTime(880.0, t + 0.15); // A5
    chime.frequency.linearRampToValueAtTime(1174.66, t + 0.4); // D6
    chimeGain.gain.setValueAtTime(0, t + 0.15);
    chimeGain.gain.linearRampToValueAtTime(0.15, t + 0.2);
    chimeGain.gain.exponentialRampToValueAtTime(0.001, t + 2.2);
    chime.connect(chimeGain);
    chimeGain.connect(this.masterGain);
    chime.start(t + 0.15);
    chime.stop(t + 2.3);
  }

  /**
   * Sound effect: Full Quest Completed Fanfare (triumphant celestial chords)
   */
  public playQuestCompletedFanfare(): void {
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    const t = this.ctx.currentTime;
    const chords = [
      [293.66, 369.99, 440.0],  // D major
      [369.99, 440.0, 587.33],  // F# minor / D inv
      [440.0, 554.37, 659.25],  // A major
      [587.33, 739.99, 880.0, 1174.66], // D triumphant octave
    ];

    chords.forEach((chord, step) => {
      const stepTime = t + step * 0.28;
      chord.forEach((freq) => {
        if (!this.ctx || !this.masterGain) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, stepTime);
        gain.gain.setValueAtTime(0, stepTime);
        gain.gain.linearRampToValueAtTime(0.12, stepTime + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.0001, stepTime + (step === 3 ? 3.0 : 0.8));
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(stepTime);
        osc.stop(stepTime + (step === 3 ? 3.2 : 0.9));
      });
    });
  }

  /**
   * Sound effect: Procedural NPC Voice resonance for dialogue interactions
   */
  public playNPCVoice(type: 'wanderer' | 'guardian' | 'creature'): void {
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    const t = this.ctx.currentTime;

    if (type === 'wanderer') {
      // Ethereal mystical whisper & resonant flute tone
      const freqs = [329.63, 440.0, 523.25]; // E4, A4, C5
      freqs.forEach((freq, idx) => {
        if (!this.ctx || !this.masterGain) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, t + idx * 0.08);
        osc.frequency.exponentialRampToValueAtTime(freq * 1.05, t + idx * 0.08 + 0.35);

        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(600 + idx * 200, t);
        filter.Q.setValueAtTime(4.0, t);

        gain.gain.setValueAtTime(0, t + idx * 0.08);
        gain.gain.linearRampToValueAtTime(0.08, t + idx * 0.08 + 0.06);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + idx * 0.08 + 0.6);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);

        osc.start(t + idx * 0.08);
        osc.stop(t + idx * 0.08 + 0.65);
      });
    } else if (type === 'guardian') {
      // Deep resonant subterranean stone hum
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc1.type = 'sawtooth';
      osc1.frequency.setValueAtTime(65.41, t); // C2
      osc1.frequency.exponentialRampToValueAtTime(55.0, t + 0.8);

      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(130.81, t); // C3
      osc2.frequency.exponentialRampToValueAtTime(110.0, t + 0.8);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(180, t);
      filter.frequency.exponentialRampToValueAtTime(90, t + 0.8);
      filter.Q.setValueAtTime(3.5, t);

      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.18, t + 0.08);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.95);

      osc1.connect(filter);
      osc2.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);

      osc1.start(t);
      osc2.start(t);
      osc1.stop(t + 1.0);
      osc2.stop(t + 1.0);
    } else if (type === 'creature') {
      // Delicate crystalline wisp / ethereal stag chirp
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880.0, t);
      osc.frequency.exponentialRampToValueAtTime(1318.51, t + 0.12);
      osc.frequency.exponentialRampToValueAtTime(1046.5, t + 0.35);

      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.09, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.45);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(t);
      osc.stop(t + 0.5);
    }
  }

  /**
   * Sound effect: Staff melee swing with magic crystalline overtone
   */
  public playAttackSwing(comboStep: number = 0): void {
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    const t = this.ctx.currentTime;

    // Fast white-noise whoosh
    const bufferSize = this.ctx.sampleRate * 0.16;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const noiseFilter = this.ctx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    const baseFreq = 800 + comboStep * 300;
    noiseFilter.frequency.setValueAtTime(baseFreq, t);
    noiseFilter.frequency.exponentialRampToValueAtTime(baseFreq * 2.2, t + 0.12);
    noiseFilter.Q.setValueAtTime(3.0, t);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0, t);
    noiseGain.gain.linearRampToValueAtTime(0.18, t + 0.02);
    noiseGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.16);

    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.masterGain);
    noise.start(t);
    noise.stop(t + 0.17);

    // Crystal slash resonance
    const tone = this.ctx.createOscillator();
    const toneGain = this.ctx.createGain();
    tone.type = 'triangle';
    const pitch = 440 * Math.pow(1.25, comboStep);
    tone.frequency.setValueAtTime(pitch, t);
    tone.frequency.exponentialRampToValueAtTime(pitch * 1.5, t + 0.14);

    toneGain.gain.setValueAtTime(0, t);
    toneGain.gain.linearRampToValueAtTime(0.12, t + 0.03);
    toneGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);

    tone.connect(toneGain);
    toneGain.connect(this.masterGain);
    tone.start(t);
    tone.stop(t + 0.24);
  }

  /**
   * Sound effect: Heavy impact hit on enemy
   */
  public playEnemyHit(): void {
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    const t = this.ctx.currentTime;

    // Sub thud
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(140, t);
    osc.frequency.exponentialRampToValueAtTime(45, t + 0.14);

    gain.gain.setValueAtTime(0.28, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.2);

    // Metal/Stone crack
    const oscCrack = this.ctx.createOscillator();
    const gainCrack = this.ctx.createGain();
    oscCrack.type = 'triangle';
    oscCrack.frequency.setValueAtTime(520, t);
    oscCrack.frequency.exponentialRampToValueAtTime(110, t + 0.08);

    gainCrack.gain.setValueAtTime(0.2, t);
    gainCrack.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);

    oscCrack.connect(gainCrack);
    gainCrack.connect(this.masterGain);
    oscCrack.start(t);
    oscCrack.stop(t + 0.13);
  }

  /**
   * Sound effect: Swift dodge roll / directional shadow dash
   */
  public playDodgeRoll(): void {
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(260, t);
    osc.frequency.exponentialRampToValueAtTime(620, t + 0.08);
    osc.frequency.exponentialRampToValueAtTime(180, t + 0.25);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, t);

    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.18, t + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.28);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.3);
  }

  /**
   * Sound effect: Massive ECHO PULSE magical shockwave
   */
  public playEchoPulse(): void {
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    const t = this.ctx.currentTime;

    // Sub-bass rumble boom
    const sub = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    sub.type = 'sine';
    sub.frequency.setValueAtTime(95, t);
    sub.frequency.exponentialRampToValueAtTime(28, t + 0.85);

    subGain.gain.setValueAtTime(0.4, t);
    subGain.gain.exponentialRampToValueAtTime(0.0001, t + 1.2);

    sub.connect(subGain);
    subGain.connect(this.masterGain);
    sub.start(t);
    sub.stop(t + 1.25);

    // Radiant celestial ringing chord
    const chord = [329.63, 440.0, 659.25, 880.0, 1318.51];
    chord.forEach((freq, idx) => {
      if (!this.ctx || !this.masterGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.02, t + 1.5);

      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.14 - idx * 0.02, t + 0.05 + idx * 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 1.8 + idx * 0.15);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(t);
      osc.stop(t + 2.0);
    });
  }

  /**
   * Sound effect: Player took damage
   */
  public playPlayerHurt(): void {
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(110, t);
    osc.frequency.exponentialRampToValueAtTime(55, t + 0.22);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(320, t);

    gain.gain.setValueAtTime(0.28, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.25);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.28);
  }

  /**
   * Sound effect: Player death dissolution
   */
  public playPlayerDeath(): void {
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    const t = this.ctx.currentTime;

    const chords = [130.81, 155.56, 196.0]; // C minor
    chords.forEach((freq) => {
      if (!this.ctx || !this.masterGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.65, t + 2.2);

      gain.gain.setValueAtTime(0.22, t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 2.5);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(t);
      osc.stop(t + 2.6);
    });
  }

  /**
   * Sound effect: Player revival & respawn
   */
  public playPlayerRespawn(): void {
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    const t = this.ctx.currentTime;

    const ascending = [261.63, 329.63, 392.0, 523.25, 659.25, 783.99];
    ascending.forEach((freq, idx) => {
      if (!this.ctx || !this.masterGain) return;
      const step = t + idx * 0.08;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, step);

      gain.gain.setValueAtTime(0, step);
      gain.gain.linearRampToValueAtTime(0.15, step + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, step + 0.8);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(step);
      osc.stop(step + 0.85);
    });
  }

  /**
   * Sound effect: Enemy death dissolution
   */
  public playEnemyDeath(): void {
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(180, t);
    osc.frequency.exponentialRampToValueAtTime(40, t + 0.45);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(280, t);

    gain.gain.setValueAtTime(0.25, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.5);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.55);
  }

  /**
   * Sound effect: Restorative warm hearth rest chime & ember crackle
   */
  public playHearthRest(): void {
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    const t = this.ctx.currentTime;

    // Gentle warm restorative chord: F#4, A#4, C#5, F5
    const freqs = [369.99, 466.16, 554.37, 698.46];
    freqs.forEach((freq, idx) => {
      const step = t + idx * 0.12;
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, step);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.01, step + 1.2);

      gain.gain.setValueAtTime(0, step);
      gain.gain.linearRampToValueAtTime(0.18, step + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.0001, step + 1.4);

      osc.connect(gain);
      gain.connect(this.masterGain!);
      osc.start(step);
      osc.stop(step + 1.45);
    });
  }

  /**
   * Sound effect: Drinking fresh spring water from the village well
   */
  public playWellWater(): void {
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    const t = this.ctx.currentTime;

    // Water droplet notes
    const drops = [523.25, 659.25, 783.99, 1046.5];
    drops.forEach((freq, i) => {
      const dropTime = t + i * 0.09;
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq * 1.2, dropTime);
      osc.frequency.exponentialRampToValueAtTime(freq, dropTime + 0.08);

      gain.gain.setValueAtTime(0.2, dropTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, dropTime + 0.22);

      osc.connect(gain);
      gain.connect(this.masterGain!);
      osc.start(dropTime);
      osc.stop(dropTime + 0.25);
    });
  }

  public dispose(): void {
    if (this.ambientInterval) {
      clearInterval(this.ambientInterval);
    }
    if (this.ctx) {
      this.ctx.close();
    }
  }
}
