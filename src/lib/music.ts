/**
 * Synthesised music-box "Happy Birthday" — pure Web Audio, no files.
 * start() must be called synchronously from a user gesture (the unlock tap).
 */

// [midi, beats]
const MELODY: [number, number][] = [
  [67, 0.75], [67, 0.25], [69, 1], [67, 1], [72, 1], [71, 2],
  [67, 0.75], [67, 0.25], [69, 1], [67, 1], [74, 1], [72, 2],
  [67, 0.75], [67, 0.25], [79, 1], [76, 1], [72, 1], [71, 1], [69, 2],
  [77, 0.75], [77, 0.25], [76, 1], [72, 1], [74, 1], [72, 2],
];

const BEAT = 60 / 90;
const LOOP_PAUSE = 3;
const midiToHz = (m: number) => 440 * Math.pow(2, (m - 69) / 12);

type AnyAC = typeof AudioContext;

class MusicBox {
  private ctx: AudioContext | null = null;
  private bus: GainNode | null = null;
  private started = false;
  private muted = false;
  private nextLoop = 0;

  start() {
    if (this.started) return;
    this.started = true;
    try {
      const AC: AnyAC | undefined =
        window.AudioContext || (window as unknown as { webkitAudioContext?: AnyAC }).webkitAudioContext;
      if (!AC) return;
      const ctx = new AC();
      this.ctx = ctx;

      const master = ctx.createGain();
      master.gain.value = 0;
      master.connect(ctx.destination);

      // dry bus + soft feedback echo for a gentle "room"
      const bus = ctx.createGain();
      bus.gain.value = 1;
      bus.connect(master);
      const delay = ctx.createDelay(1);
      delay.delayTime.value = 0.34;
      const fb = ctx.createGain();
      fb.gain.value = 0.3;
      const lp = ctx.createBiquadFilter();
      lp.type = "lowpass";
      lp.frequency.value = 3200;
      const wet = ctx.createGain();
      wet.gain.value = 0.32;
      bus.connect(delay);
      delay.connect(lp);
      lp.connect(fb);
      fb.connect(delay);
      lp.connect(wet);
      wet.connect(master);
      this.bus = bus;

      const resume = ctx.resume();
      if (resume && typeof resume.catch === "function") resume.catch(() => {});

      const t = ctx.currentTime;
      master.gain.setValueAtTime(0, t);
      master.gain.linearRampToValueAtTime(0.15, t + 1);

      this.nextLoop = t + 0.2;
      this.tick();
      window.setInterval(() => this.tick(), 300);
      document.addEventListener("visibilitychange", this.onVis);
    } catch {
      /* silent */
    }
  }

  private onVis = () => {
    const ctx = this.ctx;
    if (!ctx) return;
    try {
      if (document.hidden) void ctx.suspend();
      else if (!this.muted) void ctx.resume();
    } catch {
      /* ignore */
    }
  };

  private tick() {
    const ctx = this.ctx;
    if (!ctx) return;
    if (ctx.currentTime > this.nextLoop - 2) {
      const end = this.scheduleLoop(this.nextLoop);
      this.nextLoop = end + LOOP_PAUSE;
    }
  }

  private scheduleLoop(t0: number) {
    let beats = 0;
    for (const [midi, len] of MELODY) {
      // soft lilt: ±5% humanised timing
      const jitter = (Math.random() * 2 - 1) * 0.05 * BEAT * len;
      this.note(midiToHz(midi), t0 + beats * BEAT + jitter);
      beats += len;
    }
    return t0 + beats * BEAT;
  }

  private note(freq: number, t: number) {
    const ctx = this.ctx;
    const bus = this.bus;
    if (!ctx || !bus) return;
    try {
      const env = ctx.createGain();
      env.gain.setValueAtTime(0.0001, t);
      env.gain.exponentialRampToValueAtTime(0.6, t + 0.008);
      env.gain.exponentialRampToValueAtTime(0.0001, t + 1.2);

      const o1 = ctx.createOscillator();
      o1.type = "sine";
      o1.frequency.value = freq;
      const o2 = ctx.createOscillator();
      o2.type = "triangle";
      o2.frequency.value = freq;
      o2.detune.value = 7;
      const g2 = ctx.createGain();
      g2.gain.value = 0.32;

      o1.connect(env);
      o2.connect(g2);
      g2.connect(env);

      if (typeof ctx.createStereoPanner === "function") {
        const pan = ctx.createStereoPanner();
        pan.pan.value = (Math.random() * 2 - 1) * 0.4;
        env.connect(pan);
        pan.connect(bus);
      } else {
        env.connect(bus);
      }

      o1.start(t);
      o2.start(t);
      o1.stop(t + 1.3);
      o2.stop(t + 1.3);
    } catch {
      /* ignore */
    }
  }

  /** returns the new muted state */
  toggle() {
    this.muted = !this.muted;
    const ctx = this.ctx;
    if (ctx) {
      try {
        if (this.muted) void ctx.suspend();
        else void ctx.resume();
      } catch {
        /* ignore */
      }
    }
    return this.muted;
  }

  isMuted() {
    return this.muted;
  }
}

export const music = new MusicBox();
