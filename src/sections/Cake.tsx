import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { gsap, setupSection } from "../lib/motion";
import { SplitText } from "../components/SplitText";
import { vibrate } from "../lib/device";
import { useRaf } from "../lib/hooks";

/* ───────── geometry ───────── */
const COLORS = ["#f5d76e", "#f7f3e8", "#e8b4b8", "#f3e5c3"];
interface Candle {
  id: number;
  x: number;
  y: number;
  color: string;
}
const CANDLES: Candle[] = (() => {
  const raw: { x: number; y: number }[] = [];
  for (let i = 0; i < 8; i++) raw.push({ x: 170 - 87.5 + i * 25, y: 146 }); // back row
  for (let i = 0; i < 9; i++) raw.push({ x: 170 - 100 + i * 25, y: 158 }); // front row
  raw.sort((a, b) => a.x - b.x); // left → right
  return raw.map((c, id) => ({ ...c, id, color: COLORS[id % COLORS.length] }));
})();
const RENDER_ORDER = [...CANDLES].sort((a, b) => a.y - b.y);

function Drips({ cx, cy, rx, ry, lens, step }: { cx: number; cy: number; rx: number; ry: number; lens: number[]; step: number }) {
  const items = [];
  let k = 0;
  for (let x = cx - rx + 12; x < cx + rx - 8; x += step) {
    const dx = (x - cx) / rx;
    const edge = cy + ry * Math.sqrt(Math.max(0, 1 - dx * dx));
    const len = lens[k % lens.length];
    items.push(<rect key={x} x={x - 5.5} y={edge - 3} width={11} height={len + 3} rx={5.5} />);
    k++;
  }
  return <g fill="url(#gold)">{items}</g>;
}

function Pearls({ cx, cy, rx, ry, n }: { cx: number; cy: number; rx: number; ry: number; n: number }) {
  const out = [];
  for (let i = 1; i < n; i++) {
    const a = (i / n) * Math.PI;
    out.push(<circle key={i} cx={cx - Math.cos(a) * rx} cy={cy + Math.sin(a) * ry} r={2.6} fill="url(#gold)" />);
  }
  return <g opacity="0.9">{out}</g>;
}

/* ───────── component ───────── */
export default function Cake() {
  const root = useRef<HTMLElement>(null);
  const tilt = useRef<HTMLDivElement>(null);
  const flameEls = useRef<(SVGGElement | null)[]>([]);
  const [lit, setLit] = useState<boolean[]>(() => CANDLES.map(() => true));
  const litRef = useRef<boolean[]>(CANDLES.map(() => true));
  const timers = useRef<number[]>([]);
  const [listening, setListening] = useState(false);
  const mic = useRef<{
    stream: MediaStream;
    ctx: AudioContext;
    an: AnalyserNode;
    buf: Uint8Array<ArrayBuffer>;
    above: number;
    base: number;
    t: number;
  } | null>(null);
  const pointerDown = useRef(false);

  const out = useMemo(() => lit.filter((l) => !l).length, [lit]);
  const finished = out === CANDLES.length;

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      setupSection(root.current!);
      gsap.fromTo(
        tilt.current,
        { rotateX: 24, rotateY: -14, y: 70, opacity: 0.15, transformPerspective: 900 },
        {
          rotateX: 0,
          rotateY: 0,
          y: 0,
          opacity: 1,
          transformPerspective: 900,
          ease: "none",
          scrollTrigger: { trigger: tilt.current, start: "top 98%", end: "top 48%", scrub: true },
        }
      );
    }, root);
    return () => ctx.revert();
  }, []);

  /* ── extinguishing ── */
  const extinguish = useCallback((i: number) => {
    if (!litRef.current[i]) return;
    litRef.current = litRef.current.map((v, k) => (k === i ? false : v));
    setLit(litRef.current);
    vibrate(30);
  }, []);

  const clearTimers = () => {
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
  };

  const blowAll = useCallback(() => {
    clearTimers();
    const remaining = CANDLES.filter((c) => litRef.current[c.id]).map((c) => c.id); // already left→right
    remaining.forEach((id, n) => {
      timers.current.push(window.setTimeout(() => extinguish(id), n * 190));
    });
  }, [extinguish]);

  /* tap / swipe fallback — nearest lit flame under the finger */
  const blowAt = useCallback(
    (x: number, y: number) => {
      let best = -1;
      let bd = 34;
      for (const c of CANDLES) {
        if (!litRef.current[c.id]) continue;
        const el = flameEls.current[c.id];
        if (!el) continue;
        const r = el.getBoundingClientRect();
        const d = Math.hypot(x - (r.left + r.width / 2), y - (r.top + r.height / 2));
        if (d < bd) {
          bd = d;
          best = c.id;
        }
      }
      if (best >= 0) extinguish(best);
    },
    [extinguish]
  );

  /* ── microphone (every failure is silent) ── */
  const stopMic = useCallback(() => {
    const m = mic.current;
    mic.current = null;
    setListening(false);
    if (!m) return;
    try {
      m.stream.getTracks().forEach((t) => t.stop());
    } catch {
      /* ignore */
    }
    try {
      void m.ctx.close();
    } catch {
      /* ignore */
    }
  }, []);

  const startMic = useCallback(async () => {
    if (mic.current) return;
    try {
      const md = navigator.mediaDevices;
      if (!md || typeof md.getUserMedia !== "function") return;
      const stream = await md.getUserMedia({
        audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
      });
      const AC =
        window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AC) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }
      const ctx = new AC();
      const resume = ctx.resume();
      if (resume && typeof resume.catch === "function") resume.catch(() => {});
      const src = ctx.createMediaStreamSource(stream);
      const an = ctx.createAnalyser();
      an.fftSize = 1024;
      src.connect(an);
      mic.current = { stream, ctx, an, buf: new Uint8Array(an.fftSize), above: 0, base: 0, t: 0 };
      setListening(true);
    } catch {
      /* denied / unavailable / in-app browser → tap fallback is already live */
    }
  }, []);

  useRaf((dt) => {
    const m = mic.current;
    if (!m) return;
    m.an.getByteTimeDomainData(m.buf);
    let sum = 0;
    for (let i = 0; i < m.buf.length; i++) {
      const v = (m.buf[i] - 128) / 128;
      sum += v * v;
    }
    const rms = Math.sqrt(sum / m.buf.length);
    m.t += dt;
    if (m.t < 0.6) {
      m.base = Math.max(m.base, rms); // calibrate to the room
      return;
    }
    const thr = Math.max(0.16, m.base * 2.6);
    if (rms > thr) m.above += dt;
    else m.above = Math.max(0, m.above - dt * 2);
    if (m.above >= 0.6) {
      stopMic();
      blowAll();
    }
  }, listening);

  useEffect(() => {
    const onVis = () => {
      if (document.hidden) stopMic();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      document.removeEventListener("visibilitychange", onVis);
      clearTimers();
      stopMic();
    };
  }, [stopMic]);

  const relight = () => {
    clearTimers();
    stopMic();
    litRef.current = CANDLES.map(() => true);
    setLit(litRef.current);
  };

  return (
    <section ref={root} id="cake" className="section">
      <SplitText as="h2" scroll text="First, the ritual." className="heading" />
      <p className="subtext mt-4" data-reveal="">
        A birthday cake isn't official until the candles die.
      </p>

      <div className="relative mt-8 w-full max-w-[380px]" style={{ perspective: 900 }}>
        <div ref={tilt} className="relative will-change-transform" style={{ transformStyle: "preserve-3d" }}>
          <svg
            viewBox="0 0 340 320"
            className="block h-auto w-full select-none overflow-visible"
            style={{ touchAction: "pan-y", WebkitUserSelect: "none", userSelect: "none" }}
            onPointerDown={(e) => {
              pointerDown.current = true;
              blowAt(e.clientX, e.clientY);
            }}
            onPointerMove={(e) => {
              if (pointerDown.current) blowAt(e.clientX, e.clientY);
            }}
            onPointerUp={() => (pointerDown.current = false)}
            onPointerCancel={() => (pointerDown.current = false)}
            onPointerLeave={() => (pointerDown.current = false)}
            role="img"
            aria-label="Birthday cake with 17 candles"
          >
            <defs>
              <linearGradient id="gold" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#fff1b0" />
                <stop offset="0.5" stopColor="#f5d76e" />
                <stop offset="1" stopColor="#c39a26" />
              </linearGradient>
              <linearGradient id="tierA" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0" stopColor="#b9996a" />
                <stop offset="0.28" stopColor="#ecdcb6" />
                <stop offset="0.6" stopColor="#f6efdc" />
                <stop offset="1" stopColor="#b9996a" />
              </linearGradient>
              <linearGradient id="tierB" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0" stopColor="#a98456" />
                <stop offset="0.3" stopColor="#e3cf9f" />
                <stop offset="0.62" stopColor="#eedfb8" />
                <stop offset="1" stopColor="#a98456" />
              </linearGradient>
              <linearGradient id="plate" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0" stopColor="#6d561b" />
                <stop offset="0.35" stopColor="#f5d76e" />
                <stop offset="0.7" stopColor="#c39a26" />
                <stop offset="1" stopColor="#6d561b" />
              </linearGradient>
              <radialGradient id="glow">
                <stop offset="0" stopColor="#ffd98a" stopOpacity="0.55" />
                <stop offset="1" stopColor="#ffd98a" stopOpacity="0" />
              </radialGradient>
              <radialGradient id="flameG" cx="50%" cy="75%" r="65%">
                <stop offset="0" stopColor="#fffbe6" />
                <stop offset="0.45" stopColor="#ffd45a" />
                <stop offset="1" stopColor="#ff8a1e" />
              </radialGradient>
              <radialGradient id="topG" cx="35%" cy="30%" r="80%">
                <stop offset="0" stopColor="#fff6c8" />
                <stop offset="0.5" stopColor="#f5d76e" />
                <stop offset="1" stopColor="#a47c14" />
              </radialGradient>
            </defs>

            {/* plate */}
            <ellipse cx="170" cy="303" rx="166" ry="15" fill="rgba(0,0,0,.35)" />
            <ellipse cx="170" cy="298" rx="166" ry="15" fill="url(#plate)" />
            <ellipse cx="170" cy="295" rx="152" ry="11" fill="#1a1740" opacity="0.55" />

            {/* bottom tier */}
            <path d="M20,224 L20,290 A150,18 0 0 0 320,290 L320,224 Z" fill="url(#tierB)" />
            <ellipse cx="170" cy="224" rx="150" ry="18" fill="#f3e6c4" />
            <path d="M20,224 A150,18 0 0 0 320,224" fill="none" stroke="url(#gold)" strokeWidth="9" strokeLinecap="round" />
            <Drips cx={170} cy={224} rx={150} ry={18} lens={[14, 26, 18, 34, 12, 24, 30, 16]} step={29} />
            <Pearls cx={170} cy={284} rx={150} ry={18} n={15} />

            {/* top tier */}
            <path d="M55,152 L55,220 A115,14 0 0 0 285,220 L285,152 Z" fill="url(#tierA)" />
            <ellipse cx="170" cy="152" rx="115" ry="14" fill="#fcf7e8" />
            <ellipse cx="170" cy="152" rx="115" ry="14" fill="none" stroke="rgba(212,175,55,.55)" strokeWidth="1" />
            <path d="M55,152 A115,14 0 0 0 285,152" fill="none" stroke="url(#gold)" strokeWidth="8" strokeLinecap="round" />
            <Drips cx={170} cy={152} rx={115} ry={14} lens={[12, 22, 30, 15, 26, 11, 20]} step={26} />
            <Pearls cx={170} cy={212} rx={115} ry={14} n={11} />

            {/* topper */}
            <g className="topper-sway">
              <rect x="168.6" y="62" width="2.8" height="86" rx="1.4" fill="url(#gold)" />
              <circle cx="170" cy="44" r="26" fill="url(#topG)" />
              <circle cx="170" cy="44" r="22" fill="none" stroke="rgba(110,76,6,.45)" strokeWidth="1" />
              <text
                x="170"
                y="45"
                textAnchor="middle"
                dominantBaseline="central"
                fontFamily="'Playfair Display', Georgia, serif"
                fontWeight="900"
                fontSize="24"
                fill="#5a3f06"
              >
                17
              </text>
            </g>

            {/* candles */}
            {RENDER_ORDER.map((c) => {
              const isLit = lit[c.id];
              const topY = c.y - 36;
              return (
                <g key={c.id} transform={`translate(${c.x} ${c.y})`}>
                  <rect x="-3" y="-36" width="6" height="36" rx="1.6" fill={c.color} />
                  <rect x="-3" y="-36" width="2" height="36" rx="1" fill="#fff" opacity="0.35" />
                  <rect x="-3" y="-27" width="6" height="2.4" fill="#000" opacity="0.1" />
                  <rect x="-3" y="-15" width="6" height="2.4" fill="#000" opacity="0.1" />
                  <line x1="0" y1="-36" x2="0" y2="-39" stroke="#3a2a14" strokeWidth="1.2" />
                  <g transform={`translate(0 ${topY - c.y - 3})`}>
                    <circle className={`flame-glow ${isLit ? "" : "off"}`} cy="-12" r="19" fill="url(#glow)" style={{ animationDelay: `${(c.id % 5) * 0.2}s` }} />
                    <g ref={(el) => { flameEls.current[c.id] = el; }} className={`flame-wrap ${isLit ? "" : "off"}`}>
                      <g className="flame" style={{ animationDelay: `${-(c.id % 7) * 0.13}s`, animationDuration: `${0.8 + (c.id % 4) * 0.08}s` }}>
                        <path d="M0,-25 C6.5,-16 7.5,-8 0,-1.5 C-7.5,-8 -6.5,-16 0,-25Z" fill="url(#flameG)" />
                        <ellipse cx="0" cy="-8" rx="2.3" ry="4.6" fill="#fffef4" opacity="0.9" />
                      </g>
                    </g>
                    {!isLit && (
                      <g>
                        <path className="wisp" d="M0,-4 C5,-12 -5,-18 0,-27 S5,-38 0,-46" fill="none" stroke="rgba(247,243,232,.6)" strokeWidth="2.2" strokeLinecap="round" />
                        <path className="wisp" style={{ animationDelay: ".35s" }} d="M1,-4 C-4,-11 5,-17 0,-25 S-4,-34 1,-42" fill="none" stroke="rgba(247,243,232,.4)" strokeWidth="1.8" strokeLinecap="round" />
                      </g>
                    )}
                  </g>
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      <p className="mt-4 font-display text-[1.35rem] font-bold tracking-[0.12em] text-[#f5d76e]" aria-live="polite">
        <span className="font-body tabular-nums">{out}</span> / 17
      </p>

      <div className="relative z-20 mt-4 grid w-full max-w-[26rem] place-items-center" style={{ minHeight: 124 }} data-reveal="">
        <motion.div
          className="col-start-1 row-start-1 flex flex-col items-center"
          animate={{ opacity: finished ? 0 : 1, y: finished ? 10 : 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          style={{ pointerEvents: finished ? "none" : "auto" }}
        >
          <button type="button" className={`pill-btn ${listening ? "listening-ring" : ""}`} onClick={startMic}>
            💨 blow for real
          </button>
        </motion.div>

        <AnimatePresence>
          {finished && (
            <motion.p
              key="wish"
              className="glow-text relative z-20 col-start-1 row-start-1 px-2 text-center font-display text-[1.25rem] font-bold leading-relaxed text-[#f7f3e8]"
              initial={{ opacity: 0, y: 18, filter: "blur(10px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.8, ease: [0.22, 1, 0.36, 1], delay: 0.9 }}
            >
              Close your eyes. Make a wish. 🌠{" "}
              <br />
              <span className="text-[1.05rem] italic text-[#f5d76e]">It's already on its way to coming true.</span>
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      <button
        type="button"
        className="text-btn relative z-20 mt-2 transition-opacity duration-700"
        style={{ opacity: out > 0 ? 1 : 0, pointerEvents: out > 0 ? "auto" : "none" }}
        onClick={relight}
        tabIndex={out > 0 ? 0 : -1}
      >
        relight candles
      </button>

      {/* scene dims once every flame is out */}
      <div
        className="pointer-events-none absolute inset-0 z-10"
        style={{
          background: "radial-gradient(ellipse at 50% 55%, rgba(2,2,12,.55), rgba(2,2,12,.82))",
          opacity: finished ? 1 : 0,
          transition: "opacity 1.8s cubic-bezier(.22,1,.36,1)",
        }}
      />
    </section>
  );
}
