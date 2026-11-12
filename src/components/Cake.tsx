import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { PointerEvent as RPointerEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";
import SectionHeading from "./SectionHeading";
import { gsap } from "../lib/gsap";
import { vibrate } from "../lib/device";

const TOTAL = 19;
const VB_W = 400;
const VB_H = 392;

type Candle = { id: number; x: number; base: number; h: number; row: "b" | "f"; color: string };

const COLORS = ["#f7f3e8", "#f3dfa6", "#f5cfd0"];

const CANDLES: Candle[] = (() => {
  const back: Omit<Candle, "id" | "color">[] = Array.from({ length: 10 }, (_, i) => ({
    x: 101 + 22 * i,
    base: 174,
    h: 32,
    row: "b" as const,
  }));
  const front: Omit<Candle, "id" | "color">[] = Array.from({ length: 9 }, (_, i) => ({
    x: 112 + 22 * i,
    base: 184,
    h: 34,
    row: "f" as const,
  }));
  return [...back, ...front]
    .sort((a, b) => a.x - b.x || (a.row === "b" ? -1 : 1))
    .map((c, i) => ({ ...c, id: i, color: COLORS[i % 3] }));
})();

/** Frosting band with alternating drips and scallops. */
function frostingPath(x0: number, x1: number, y: number, n: number, lens: number[]) {
  const w = (x1 - x0) / n;
  let d = `M${x0} ${y} L${x1} ${y}`;
  for (let i = n - 1; i >= 0; i--) {
    const xr = x0 + (i + 1) * w;
    const xl = x0 + i * w;
    const xm = (xl + xr) / 2;
    const len = lens[i % lens.length];
    if (i % 2 === 0) {
      const dw = w * 0.5;
      d += ` L${xr} ${y + 12} Q${xr} ${y + 14} ${xm + dw / 2} ${y + 14} L${xm + dw / 2} ${y + len} A${dw / 2} ${dw / 2} 0 0 1 ${xm - dw / 2} ${y + len} L${xm - dw / 2} ${y + 14} Q${xl} ${y + 14} ${xl} ${y + 12}`;
    } else {
      d += ` L${xr} ${y + 12} Q${xm} ${y + 26} ${xl} ${y + 12}`;
    }
  }
  return d + " Z";
}

function tierPath(x0: number, x1: number, yTop: number, yBot: number, ry: number) {
  const rx = (x1 - x0) / 2;
  return `M${x0} ${yTop} L${x0} ${yBot} A${rx} ${ry} 0 0 0 ${x1} ${yBot} L${x1} ${yTop} Z`;
}

const FLAME = "M0 -18 C4.5 -11 5.5 -4 0 1 C-5.5 -4 -4.5 -11 0 -18 Z";
const CORE = "M0 -10 C2 -6 2.2 -3 0 -0.5 C-2.2 -3 -2 -6 0 -10 Z";
const SMOKE_A = "M0 0 C5 -8 -5 -14 0 -22 S5 -34 0 -42";
const SMOKE_B = "M0 0 C-4 -9 5 -15 0 -24 S-5 -36 1 -44";

type Mic = "idle" | "listening" | "off";

export default function Cake() {
  const sectionRef = useRef<HTMLElement>(null);
  const tiltRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const outRef = useRef<boolean[]>(Array(TOTAL).fill(false));
  const [out, setOut] = useState<boolean[]>(() => Array(TOTAL).fill(false));
  const [mic, setMic] = useState<Mic>("idle");
  const [blowing, setBlowing] = useState(false);
  const stopMicRef = useRef<() => void>(() => {});

  const count = out.filter(Boolean).length;
  const done = count === TOTAL;

  const frosting = useMemo(
    () => ({
      top: frostingPath(70, 330, 178, 8, [26, 18, 31, 17, 24, 19, 29, 18]),
      bottom: frostingPath(30, 370, 262, 11, [28, 18, 33, 19, 25, 20, 31, 18, 27, 19, 30]),
    }),
    [],
  );

  // subtle 3D parallax tilt as the section scrolls in
  useEffect(() => {
    const el = tiltRef.current;
    const sec = sectionRef.current;
    if (!el || !sec) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        el,
        { rotateX: 30, y: 70, scale: 0.9, opacity: 0.2 },
        {
          rotateX: 0,
          y: 0,
          scale: 1,
          opacity: 1,
          ease: "none",
          scrollTrigger: { trigger: el, start: "top 98%", end: "top 40%", scrub: 1 },
        },
      );
    }, sec);
    return () => ctx.revert();
  }, []);

  const extinguish = useCallback((i: number) => {
    if (i < 0 || i >= TOTAL || outRef.current[i]) return false;
    outRef.current[i] = true;
    setOut([...outRef.current]);
    vibrate(30);
    return true;
  }, []);

  const extinguishNext = useCallback(() => {
    const i = outRef.current.findIndex((v) => !v);
    if (i >= 0) extinguish(i);
  }, [extinguish]);

  // tap / swipe fallback — nearest lit flame within a generous radius
  const hitAt = useCallback(
    (e: RPointerEvent<SVGRectElement>) => {
      const svg = svgRef.current;
      if (!svg) return;
      const r = svg.getBoundingClientRect();
      const px = ((e.clientX - r.left) * VB_W) / r.width;
      const py = ((e.clientY - r.top) * VB_H) / r.height;
      let best = -1;
      let bestD = 34;
      for (const c of CANDLES) {
        if (outRef.current[c.id]) continue;
        const d = Math.hypot(px - c.x, py - (c.base - c.h - 8));
        if (d < bestD) {
          bestD = d;
          best = c.id;
        }
      }
      if (best >= 0) extinguish(best);
    },
    [extinguish],
  );

  const stopMic = useCallback(() => stopMicRef.current(), []);

  const startMic = useCallback(async () => {
    if (mic === "listening") {
      stopMic();
      setMic("idle");
      return;
    }
    try {
      const md = navigator.mediaDevices;
      const AC: typeof AudioContext | undefined =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!md?.getUserMedia || !AC) {
        setMic("off");
        return;
      }
      const stream = await md.getUserMedia({
        audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
      });
      const ctx = new AC();
      await ctx.resume().catch(() => {});
      const src = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 1024;
      src.connect(analyser);
      const buf = new Uint8Array(analyser.fftSize);

      let raf = 0;
      let frames = 0;
      let base = 0;
      let since = 0;
      let lastAbove = 0;
      let lastOut = 0;
      let isBlowing = false;
      let stopped = false;

      const cleanup = () => {
        if (stopped) return;
        stopped = true;
        cancelAnimationFrame(raf);
        stream.getTracks().forEach((t) => t.stop());
        ctx.close().catch(() => {});
        setBlowing(false);
      };
      stopMicRef.current = cleanup;

      const tick = (now: number) => {
        if (stopped) return;
        raf = requestAnimationFrame(tick);
        if (document.hidden) return;
        analyser.getByteTimeDomainData(buf);
        let sum = 0;
        for (let i = 0; i < buf.length; i++) {
          const v = (buf[i] - 128) / 128;
          sum += v * v;
        }
        const rms = Math.sqrt(sum / buf.length);
        if (frames < 20) {
          base += rms / 20;
          frames++;
          return;
        }
        const threshold = Math.max(0.06, base * 2.2 + 0.035);
        let nowBlowing = false;
        if (rms > threshold) {
          lastAbove = now;
          if (!since) since = now;
          if (now - since >= 600) {
            nowBlowing = true;
            if (now - lastOut > 170) {
              lastOut = now;
              extinguishNext();
              if (outRef.current.every(Boolean)) {
                cleanup();
                setMic("idle");
                return;
              }
            }
          }
        } else if (since && now - lastAbove > 250) {
          since = 0;
        }
        if (nowBlowing !== isBlowing) {
          isBlowing = nowBlowing;
          setBlowing(nowBlowing);
        }
      };
      raf = requestAnimationFrame(tick);
      setMic("listening");
    } catch {
      // denied / unavailable / in-app browser → silent fallback to tapping
      setMic("off");
    }
  }, [mic, stopMic, extinguishNext]);

  // stop the mic when finished, hidden, or unmounted
  useEffect(() => {
    if (done) {
      stopMic();
      setMic((m) => (m === "listening" ? "idle" : m));
    }
  }, [done, stopMic]);

  useEffect(() => {
    const onVis = () => {
      if (document.hidden) {
        stopMic();
        setMic((m) => (m === "listening" ? "idle" : m));
      }
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      document.removeEventListener("visibilitychange", onVis);
      stopMic();
    };
  }, [stopMic]);

  const relight = () => {
    outRef.current = Array(TOTAL).fill(false);
    setOut([...outRef.current]);
  };

  return (
    <section
      id="cake"
      ref={sectionRef}
      className="flex flex-col items-center justify-center gap-8 px-4 py-[12svh]"
    >
      {/* scene dimmer for the wish moment */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0 transition-opacity duration-[1800ms] ease-out"
        style={{
          opacity: done ? 1 : 0,
          background:
            "linear-gradient(180deg, transparent 0%, rgba(2,2,10,.78) 18%, rgba(2,2,10,.78) 82%, transparent 100%)",
        }}
      />

      <div className="relative z-10">
        <SectionHeading title="First, the ritual." sub="A birthday cake isn't official until the candles die." />
      </div>

      <div className="relative z-10 flex w-full flex-col items-center" style={{ perspective: 900 }}>
        <div
          aria-hidden="true"
          className="absolute left-1/2 top-[40%] h-[80%] w-[110%] -translate-x-1/2 -translate-y-1/2 rounded-full transition-opacity duration-[1800ms]"
          style={{
            background: "radial-gradient(closest-side, rgba(245,215,110,.16), transparent 70%)",
            opacity: done ? 0.2 : 1,
          }}
        />
        <div ref={tiltRef} className="relative" style={{ transformStyle: "preserve-3d", willChange: "transform" }}>
          <svg
            ref={svgRef}
            viewBox={`0 0 ${VB_W} ${VB_H}`}
            className={`no-select h-auto w-[min(92vw,420px)] ${blowing ? "blowing" : ""}`}
            role="img"
            aria-label={`Birthday cake with ${TOTAL - count} lit candles`}
          >
            <defs>
              <linearGradient id="ck-gold" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#fff1b0" />
                <stop offset="0.45" stopColor="#f5d76e" />
                <stop offset="1" stopColor="#b8902a" />
              </linearGradient>
              <linearGradient id="ck-goldH" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0" stopColor="#b8902a" />
                <stop offset="0.5" stopColor="#fff1b0" />
                <stop offset="1" stopColor="#b8902a" />
              </linearGradient>
              <linearGradient id="ck-top" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0" stopColor="#e6cf9c" />
                <stop offset="0.35" stopColor="#fbefd2" />
                <stop offset="1" stopColor="#d9bd80" />
              </linearGradient>
              <linearGradient id="ck-bot" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0" stopColor="#cdb078" />
                <stop offset="0.35" stopColor="#f1dfb8" />
                <stop offset="1" stopColor="#bd9f62" />
              </linearGradient>
              <linearGradient id="ck-plate" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="rgba(255,255,255,.55)" />
                <stop offset="1" stopColor="rgba(212,175,55,.35)" />
              </linearGradient>
              <radialGradient id="ck-glow">
                <stop offset="0" stopColor="rgba(255,214,120,.7)" />
                <stop offset="1" stopColor="rgba(255,214,120,0)" />
              </radialGradient>
              <linearGradient id="ck-flame" x1="0" y1="1" x2="0" y2="0">
                <stop offset="0" stopColor="#ff9d2e" />
                <stop offset="0.55" stopColor="#ffd25a" />
                <stop offset="1" stopColor="#fff6cc" />
              </linearGradient>
              <pattern id="ck-stripe" width="5" height="9" patternUnits="userSpaceOnUse" patternTransform="rotate(35)">
                <rect width="5" height="3.2" fill="rgba(212,175,55,.6)" />
              </pattern>
            </defs>

            {/* plate */}
            <ellipse cx="200" cy="362" rx="192" ry="20" fill="rgba(0,0,0,.35)" />
            <ellipse cx="200" cy="356" rx="192" ry="20" fill="#9c7a22" />
            <ellipse cx="200" cy="351" rx="192" ry="20" fill="url(#ck-plate)" stroke="rgba(245,215,110,.8)" strokeWidth="1.2" />
            <ellipse cx="200" cy="351" rx="170" ry="15" fill="none" stroke="rgba(255,255,255,.25)" strokeWidth="0.8" />

            {/* bottom tier */}
            <path d={tierPath(30, 370, 262, 346, 14)} fill="url(#ck-bot)" />
            <path d={frosting.bottom} fill="url(#ck-gold)" />
            <ellipse cx="200" cy="262" rx="170" ry="13" fill="#fbefd2" opacity="0.9" />
            {Array.from({ length: 19 }).map((_, i) => (
              <circle
                key={i}
                cx={47 + i * 17.6}
                cy={330 + Math.sin((i / 18) * Math.PI) * 12.5}
                r="3"
                fill="#fff8e1"
                stroke="rgba(184,144,42,.7)"
                strokeWidth="0.8"
              />
            ))}

            {/* top tier */}
            <path d={tierPath(70, 330, 178, 262, 12)} fill="url(#ck-top)" />
            <path d={frosting.top} fill="url(#ck-gold)" />
            <ellipse cx="200" cy="178" rx="130" ry="12" fill="url(#ck-top)" stroke="rgba(212,175,55,.55)" strokeWidth="0.8" />
            <path d="M70 236 Q200 254 330 236" fill="none" stroke="url(#ck-goldH)" strokeWidth="2" opacity="0.7" />

            {/* topper */}
            <rect x="198.5" y="96" width="3" height="84" fill="url(#ck-goldH)" />
            <circle cx="200" cy="68" r="31" fill="url(#ck-gold)" stroke="#8a6416" strokeWidth="1" />
            <circle cx="200" cy="68" r="26" fill="none" stroke="rgba(90,60,5,.45)" strokeWidth="1" />
            <text
              x="200"
              y="79"
              textAnchor="middle"
              fontFamily="'Playfair Display', Georgia, serif"
              fontWeight={900}
              fontSize="32"
              fill="#4a3408"
            >
              19
            </text>

            {/* candles */}
            {CANDLES.map((c) => {
              const top = c.base - c.h;
              const isOut = out[c.id];
              return (
                <g key={c.id}>
                  <rect x={c.x - 2.6} y={top} width="5.2" height={c.h} rx="1.6" fill={c.color} />
                  <rect x={c.x - 2.6} y={top} width="5.2" height={c.h} rx="1.6" fill="url(#ck-stripe)" />
                  <rect x={c.x - 0.5} y={top - 3} width="1" height="3.4" fill="#2b1c0a" />
                  <g transform={`translate(${c.x} ${top - 2})`}>
                    <g className={`flame ${isOut ? "out" : ""}`} style={{ animationDelay: `${-((c.id * 0.37) % 1.4)}s` }}>
                      <circle r="16" cy="-9" fill="url(#ck-glow)" />
                      <path d={FLAME} fill="url(#ck-flame)" />
                      <path d={CORE} fill="#fffdf0" opacity="0.9" />
                    </g>
                    {isOut && (
                      <>
                        <path className="smoke" d={SMOKE_A} fill="none" stroke="rgba(247,243,232,.6)" strokeWidth="2" strokeLinecap="round" />
                        <path
                          className="smoke"
                          d={SMOKE_B}
                          fill="none"
                          stroke="rgba(247,243,232,.4)"
                          strokeWidth="1.6"
                          strokeLinecap="round"
                          style={{ animationDelay: "0.25s" }}
                        />
                      </>
                    )}
                  </g>
                </g>
              );
            })}

            {/* generous hit area for tap / swipe */}
            <rect
              x="40"
              y="80"
              width="320"
              height="130"
              fill="transparent"
              style={{ touchAction: "pan-y", cursor: "pointer" }}
              onPointerDown={hitAt}
              onPointerMove={(e) => {
                if (e.buttons || e.pointerType === "touch") hitAt(e);
              }}
            />
          </svg>
        </div>
      </div>

      {/* counter + controls */}
      <div className="relative z-10 flex flex-col items-center gap-4 text-center">
        <p className="font-display text-3xl font-bold tracking-[0.12em] text-gold" aria-live="polite">
          {count} / {TOTAL}
        </p>

        {!done && mic !== "off" && (
          <button
            type="button"
            onClick={startMic}
            className="glass no-select min-h-[52px] px-7 text-[15.5px] font-semibold tracking-wide text-ivory transition-transform duration-300 active:scale-95"
            style={mic === "listening" ? { borderColor: "rgba(245,215,110,.9)", boxShadow: "0 0 24px rgba(245,215,110,.3)" } : undefined}
          >
            {mic === "listening" ? "🎤 listening… blow now" : "💨 blow for real"}
          </button>
        )}
        {!done && (
          <p className="max-w-[17rem] text-[13px] leading-relaxed text-ivory/55">
            {mic === "off" ? "Tap each flame to blow it out." : "…or just tap each flame."}
          </p>
        )}

        <div className="min-h-[8.5rem] max-w-[22rem]">
          <AnimatePresence>
            {done && (
              <motion.div
                key="wish"
                initial={{ opacity: 0, y: 18, filter: "blur(8px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.8, delay: 0.9, ease: [0.22, 1, 0.36, 1] }}
                className="px-2"
              >
                <p className="font-display text-[clamp(1.5rem,7vw,2.1rem)] font-bold leading-snug text-gold" style={{ textShadow: "0 0 24px rgba(245,215,110,.45)" }}>
                  Close your eyes. Make a wish. 🌠
                </p>
                <p className="mt-3 text-[16px] italic leading-relaxed text-ivory/85">
                  It's already on its way to coming true.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <button
          type="button"
          onClick={relight}
          className="no-select min-h-12 px-4 text-[13.5px] tracking-wide text-ivory/60 underline decoration-[rgba(212,175,55,.4)] underline-offset-4 transition-opacity duration-500"
          style={{ opacity: count > 0 ? 1 : 0, pointerEvents: count > 0 ? "auto" : "none" }}
          tabIndex={count > 0 ? 0 : -1}
        >
          relight candles
        </button>
      </div>
    </section>
  );
}
