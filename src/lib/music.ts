/**
 * Synthesized music-box "Happy Birthday". No audio files.
 * startMusic() MUST be called synchronously inside a user gesture.
 */
const N: Record<string, number> = {
  G4: 392.0,
  A4: 440.0,
  B4: 493.88,
  C5: 523.25,
  D5: 587.33,
  E5: 659.25,
  F5: 698.46,
  G5: 783.99,
};

const MELODY: [string, number][] = [
  ["G4", 0.75], ["G4", 0.25], ["A4", 1], ["G4", 1], ["C5", 1], ["B4", 2],
  ["G4", 0.75], ["G4", 0.25], ["A4", 1], ["G4", 1], ["D5", 1], ["C5", 2],
  ["G4", 0.75], ["G4", 0.25], ["G5", 1], ["E5", 1], ["C5", 1], ["B4", 1], ["A4", 2],
  ["F5", 0.75], ["F5", 0.25], ["E5", 1], ["C5", 1], ["D5", 1], ["C5", 2],
];

const BEAT = 60 / 90;
const MASTER = 0.15;
const LOOP_PAUSE = 3;

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let bus: GainNode | null = null;
let timer: number | undefined;
let nextTime = 0;
let idx = 0;
let started = false;
let muted = false;
let ducked = false;
const subs = new Set<() => void>();

const emit = () => subs.forEach((f) => f());
export const subscribeMusic = (f: () => void) => {
  subs.add(f);
  return () => {
    subs.delete(f);
  };
};
export const isMuted = () => muted;
export const isStarted = () => started;

function voice(freq: number, t: number) {
  if (!ctx || !bus) return;
  const env = ctx.createGain();
  env.gain.setValueAtTime(0.0001, t);
  env.gain.linearRampToValueAtTime(0.5, t + 0.012);
  env.gain.exponentialRampToValueAtTime(0.0001, t + 1.2);
  env.connect(bus);

  const mk = (type: OscillatorType, detune: number, gain: number, pan: number) => {
    if (!ctx) return;
    const o = ctx.createOscillator();
    o.type = type;
    o.frequency.value = freq;
    o.detune.value = detune;
    const g = ctx.createGain();
    g.gain.value = gain;
    o.connect(g);
    let out: AudioNode = g;
    try {
      if (typeof ctx.createStereoPanner === "function") {
        const p = ctx.createStereoPanner();
        p.pan.value = pan;
        g.connect(p);
        out = p;
      }
    } catch {
      /* ignore */
    }
    out.connect(env);
    o.start(t);
    o.stop(t + 1.3);
  };
  mk("sine", 0, 1, -0.22);
  mk("triangle", 6, 0.38, 0.22);
}

function tick() {
  if (!ctx || ctx.state !== "running") return;
  while (nextTime < ctx.currentTime + 0.6) {
    const [name, beats] = MELODY[idx];
    // soft lilt: +-5% humanized timing
    const dur = beats * BEAT * (1 + (Math.random() - 0.5) * 0.1);
    voice(N[name], nextTime);
    nextTime += dur;
    idx++;
    if (idx >= MELODY.length) {
      idx = 0;
      nextTime += LOOP_PAUSE;
    }
  }
}

function onVis() {
  if (!ctx) return;
  try {
    if (document.hidden) {
      ctx.suspend().catch(() => {});
    } else if (!muted) {
      ctx.resume().catch(() => {});
    }
  } catch {
    /* ignore */
  }
}

export function startMusic() {
  if (started) return;
  try {
    const AC: typeof AudioContext | undefined =
      window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    started = true;
    ctx.resume().catch(() => {});

    master = ctx.createGain();
    master.gain.setValueAtTime(0, ctx.currentTime);
    master.gain.linearRampToValueAtTime(MASTER, ctx.currentTime + 1);
    master.connect(ctx.destination);

    bus = ctx.createGain();
    bus.connect(master);
    // soft echo for a music-box shimmer
    const delay = ctx.createDelay(1);
    delay.delayTime.value = 0.34;
    const fb = ctx.createGain();
    fb.gain.value = 0.3;
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 3000;
    const wet = ctx.createGain();
    wet.gain.value = 0.32;
    bus.connect(delay);
    delay.connect(lp);
    lp.connect(fb);
    fb.connect(delay);
    lp.connect(wet);
    wet.connect(master);

    nextTime = ctx.currentTime + 0.3;
    idx = 0;
    timer = window.setInterval(tick, 120);
    document.addEventListener("visibilitychange", onVis);
    emit();
  } catch {
    started = false;
  }
}

export function toggleMute(): boolean {
  muted = !muted;
  if (ctx) {
    try {
      if (muted) ctx.suspend().catch(() => {});
      else if (!document.hidden) ctx.resume().catch(() => {});
    } catch {
      /* ignore */
    }
  }
  emit();
  return muted;
}

/** Lower the music while the microphone is listening, so it doesn't count as a breath. */
export function duckMusic(on: boolean) {
  ducked = on;
  if (ctx && master) {
    try {
      master.gain.cancelScheduledValues(ctx.currentTime);
      master.gain.setTargetAtTime(ducked ? 0.04 : MASTER, ctx.currentTime, 0.25);
    } catch {
      /* ignore */
    }
  }
}

export function stopMusic() {
  if (timer) window.clearInterval(timer);
  document.removeEventListener("visibilitychange", onVis);
}
