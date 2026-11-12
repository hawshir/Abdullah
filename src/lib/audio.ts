/**
 * Synthesized music-box "Happy Birthday". No audio files — pure Web Audio.
 * start() must be called inside the unlock tap (user gesture).
 */
const F = {
  G4: 392.0,
  A4: 440.0,
  B4: 493.88,
  C5: 523.25,
  D5: 587.33,
  E5: 659.25,
  F5: 698.46,
  G5: 783.99,
} as const;
type NoteName = keyof typeof F;

const MELODY: Array<[NoteName, number]> = [
  ["G4", 0.75], ["G4", 0.25], ["A4", 1], ["G4", 1], ["C5", 1], ["B4", 2],
  ["G4", 0.75], ["G4", 0.25], ["A4", 1], ["G4", 1], ["D5", 1], ["C5", 2],
  ["G4", 0.75], ["G4", 0.25], ["G5", 1], ["E5", 1], ["C5", 1], ["B4", 1], ["A4", 2],
  ["F5", 0.75], ["F5", 0.25], ["E5", 1], ["C5", 1], ["D5", 1], ["C5", 2],
];

const BEAT = 60 / 90; // quarter note @ 90 BPM
const LOOP_PAUSE = 3;
const MASTER_GAIN = 0.15;

class MusicBox {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private idx = 0;
  private next = 0;
  private started = false;
  private userMuted = false;
  private hidden = false;

  get muted() {
    return this.userMuted;
  }

  start() {
    if (this.started) return;
    this.started = true;
    try {
      const AC: typeof AudioContext | undefined =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AC) return;
      const ctx = new AC();
      this.ctx = ctx;
      if (ctx.state === "suspended") ctx.resume().catch(() => {});

      const master = ctx.createGain();
      master.gain.setValueAtTime(0.0001, ctx.currentTime);
      master.gain.linearRampToValueAtTime(MASTER_GAIN, ctx.currentTime + 1);
      master.connect(ctx.destination);
      this.master = master;

      this.next = ctx.currentTime + 0.3;
      window.setInterval(this.tick, 80);
    } catch {
      /* silent */
    }
  }

  private tick = () => {
    const ctx = this.ctx;
    if (!ctx || ctx.state !== "running") return;
    while (this.next < ctx.currentTime + 0.45) {
      const [name, beats] = MELODY[this.idx];
      const dur = beats * BEAT * (0.95 + Math.random() * 0.1); // ±5% lilt
      this.note(F[name], this.next, dur);
      this.next += dur;
      this.idx++;
      if (this.idx >= MELODY.length) {
        this.idx = 0;
        this.next += LOOP_PAUSE;
      }
    }
  };

  private note(freq: number, t: number, _dur: number) {
    const ctx = this.ctx;
    const master = this.master;
    if (!ctx || !master) return;
    try {
      const env = ctx.createGain();
      env.gain.setValueAtTime(0.0001, t);
      env.gain.linearRampToValueAtTime(0.55, t + 0.012);
      env.gain.exponentialRampToValueAtTime(0.0001, t + 1.2);

      const sine = ctx.createOscillator();
      sine.type = "sine";
      sine.frequency.setValueAtTime(freq, t);

      const tri = ctx.createOscillator();
      tri.type = "triangle";
      tri.frequency.setValueAtTime(freq, t);
      tri.detune.setValueAtTime(7, t);

      const triGain = ctx.createGain();
      triGain.gain.value = 0.32;

      const spread = 0.12 + Math.random() * 0.3;
      if (typeof ctx.createStereoPanner === "function") {
        const panA = ctx.createStereoPanner();
        const panB = ctx.createStereoPanner();
        panA.pan.value = -spread;
        panB.pan.value = spread;
        sine.connect(panA).connect(env);
        tri.connect(triGain).connect(panB).connect(env);
      } else {
        sine.connect(env);
        tri.connect(triGain).connect(env);
      }
      env.connect(master);

      sine.start(t);
      tri.start(t);
      sine.stop(t + 1.3);
      tri.stop(t + 1.3);
      sine.onended = () => {
        try {
          env.disconnect();
        } catch {
          /* ignore */
        }
      };
    } catch {
      /* silent */
    }
  }

  private sync() {
    const ctx = this.ctx;
    if (!ctx) return;
    try {
      if (!this.userMuted && !this.hidden) ctx.resume().catch(() => {});
      else ctx.suspend().catch(() => {});
    } catch {
      /* silent */
    }
  }

  setMuted(m: boolean) {
    this.userMuted = m;
    this.sync();
  }

  setHidden(h: boolean) {
    this.hidden = h;
    this.sync();
  }
}

export const music = new MusicBox();
