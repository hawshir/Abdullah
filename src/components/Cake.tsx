import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { gsap, ScrollTrigger } from "../lib/gsap";
import { duckMusic } from "../lib/music";
import { vib } from "../lib/device";
import SectionHeading, { Rise } from "./SectionHeading";

const TOTAL = 19;

/** gold frosting band with drips along its bottom edge */
function frosting(x0: number, x1: number, y: number, band: number, drips: [number, number, number][]) {
  let d = `M${x0} ${y + 4} Q${x0} ${y} ${x0 + 4} ${y} H${x1 - 4} Q${x1} ${y} ${x1} ${y + 4} V${y + band}`;
  [...drips].sort((a, b) => b[0] - a[0]).forEach(([x, w, l]) => {
    d += ` H${x + w} v${l} a${w / 2} ${w / 2} 0 0 1 ${-w} 0 v${-l}`;
  });
  return d + ` H${x0} Z`;
}

const DRIP_TOP = frosting(50, 310, 170, 12, [
  [62, 11, 14], [88, 9, 24], [116, 12, 12], [146, 10, 28], [176, 12, 16], [208, 9, 26], [236, 12, 12], [262, 10, 22], [288, 11, 15],
]);
const DRIP_BOTTOM = frosting(25, 335, 248, 13, [
  [38, 12, 16], [70, 10, 28], [104, 13, 14], [138, 10, 24], [170, 12, 32], [204, 10, 18], [238, 13, 26], [272, 10, 14], [300, 12, 24],
]);

export default function Cake() {
  const root = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const candles = useMemo(() => {
    const arr: { x: number; row: number }[] = [];
    for (let i = 0; i < 10; i++) arr.push({ x: 68 + i * 24.89, row: 0 });
    for (let i = 0; i < 9; i++) arr.push({ x: 80.4 + i * 24.89, row: 1 });
    return arr
      .sort((a, b) => a.x - b.x)
      .map((c, idx) => {
        const h = c.row ? 36 : 31;
        const base = c.row ? 172 : 164;
        return { ...c, idx, h, base, w: c.row ? 6 : 5, fy: base - h - 7 };
      });
  }, []);

  const [lit, setLit] = useState<boolean[]>(() => Array(TOTAL).fill(true));
  const litRef = useRef<boolean[]>(Array(TOTAL).fill(true));
  const [listening, setListening] = useState(false);
  const [micFailed, setMicFailed] = useState(false);
  const timers = useRef<number[]>([]);
  const mic = useRef<{ stop: () => void } | null>(null);

  const out = useCallback((i: number) => {
    if (!litRef.current[i]) return;
    const next = litRef.current.slice();
    next[i] = false;
    litRef.current = next;
    setLit(next);
    vib(30);
  }, []);

  const stopMic = useCallback(() => {
    mic.current?.stop();
    mic.current = null;
    setListening(false);
    duckMusic(false);
  }, []);

  /** extinguish every remaining flame, one by one, left → right */
  const sweep = useCallback(() => {
    let delay = 0;
    litRef.current.forEach((on, i) => {
      if (!on) return;
      timers.current.push(window.setTimeout(() => out(i), delay));
      delay += 115;
    });
  }, [out]);

  const startMic = useCallback(async () => {
    if (mic.current) return;
    try {
      if (!navigator.mediaDevices || typeof navigator.mediaDevices.getUserMedia !== "function") throw new Error("nomic");
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
      });
      const AC: typeof AudioContext | undefined =
        window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AC) {
        stream.getTracks().forEach((t) => t.stop());
        throw new Error("noac");
      }
      const ac = new AC();
      ac.resume().catch(() => {});
      const src = ac.createMediaStreamSource(stream);
      const an = ac.createAnalyser();
      an.fftSize = 1024;
      src.connect(an);
      const buf = new Uint8Array(an.fftSize);
      let raf = 0;
      let alive = true;
      let ambient = 0.02;
      let above = 0;
      let last = performance.now();
      const loop = (now: number) => {
        if (!alive) return;
        const dt = now - last;
        last = now;
        an.getByteTimeDomainData(buf);
        let sum = 0;
        for (let i = 0; i < buf.length; i++) {
          const v = (buf[i] - 128) / 128;
          sum += v * v;
        }
        const rms = Math.sqrt(sum / buf.length);
        const thr = Math.max(0.1, ambient * 3.2);
        if (rms > thr) {
          above += dt;
        } else {
          above = 0;
          ambient = ambient * 0.97 + rms * 0.03;
        }
        if (above > 600) {
          above = 0;
          sweep();
        }
        raf = requestAnimationFrame(loop);
      };
      raf = requestAnimationFrame(loop);
      mic.current = {
        stop: () => {
          alive = false;
          cancelAnimationFrame(raf);
          stream.getTracks().forEach((t) => t.stop());
          ac.close().catch(() => {});
        },
      };
      duckMusic(true);
      setListening(true);
    } catch {
      // silent fallback: tapping flames always works
      setMicFailed(true);
      setListening(false);
      duckMusic(false);
    }
  }, [sweep]);

  const relight = useCallback(() => {
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
    const all = Array(TOTAL).fill(true);
    litRef.current = all;
    setLit(all);
  }, []);

  const outCount = lit.filter((v) => !v).length;
  const done = outCount === TOTAL;

  useEffect(() => {
    if (done) stopMic();
  }, [done, stopMic]);

  // stop listening when the section leaves view or the tab hides (privacy + battery)
  useEffect(() => {
    const onVis = () => {
      if (document.hidden) stopMic();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      document.removeEventListener("visibilitychange", onVis);
      timers.current.forEach((t) => window.clearTimeout(t));
      stopMic();
    };
  }, [stopMic]);

  useLayoutEffect(() => {
    const el = root.current;
    if (!el) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        stage.current!.querySelector(".cake3d"),
        { rotateX: 32, y: 70, scale: 0.9, opacity: 0.2 },
        {
          rotateX: 0,
          y: 0,
          scale: 1,
          opacity: 1,
          ease: "none",
          scrollTrigger: { trigger: stage.current, start: "top 95%", end: "top 45%", scrub: 0.6 },
        }
      );
      ScrollTrigger.create({
        trigger: el,
        start: "top bottom",
        end: "bottom top",
        onLeave: stopMic,
        onLeaveBack: stopMic,
      });
    }, el);
    return () => ctx.revert();
  }, [stopMic]);

  const onTap = (e: React.PointerEvent<SVGRectElement>) => {
    const svg = svgRef.current;
    if (!svg) return;
    const r = svg.getBoundingClientRect();
    const sx = ((e.clientX - r.left) / r.width) * 360;
    const sy = ((e.clientY - r.top) / r.height) * 360;
    let best = -1;
    let bd = 52;
    for (const c of candles) {
      if (!litRef.current[c.idx]) continue;
      const d = Math.hypot(c.x - sx, c.fy - sy);
      if (d < bd) {
        bd = d;
        best = c.idx;
      }
    }
    if (best >= 0) out(best);
  };

  return (
    <section id="cake" ref={root} className="relative flex min-h-[100svh] flex-col items-center px-5 pb-20 pt-24 text-center">
      <div className="relative z-[2] flex flex-col items-center gap-3">
        <SectionHeading text="First, the ritual." />
        <Rise as="p" className="sec-sub">
          A birthday cake isn't official until the candles die.
        </Rise>
      </div>

      <div ref={stage} className="relative z-[2] mt-8 w-full max-w-[420px]" style={{ perspective: 900 }}>
        <div className="cake3d" style={{ transformOrigin: "50% 100%" }}>
          <svg ref={svgRef} viewBox="0 0 360 360" className="block w-full select-none" style={{ touchAction: "manipulation", overflow: "visible" }} role="img" aria-label="A birthday cake with 19 candles">
            <defs>
              <linearGradient id="ckGold" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#fff1bf" />
                <stop offset="0.35" stopColor="#f5d76e" />
                <stop offset="1" stopColor="#b8902a" />
              </linearGradient>
              <linearGradient id="ckTop" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#6a3358" />
                <stop offset="1" stopColor="#3a1b3c" />
              </linearGradient>
              <linearGradient id="ckBot" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#57284a" />
                <stop offset="1" stopColor="#2b1431" />
              </linearGradient>
              <linearGradient id="ckSide" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0" stopColor="#000" stopOpacity=".38" />
                <stop offset=".25" stopColor="#000" stopOpacity="0" />
                <stop offset=".75" stopColor="#000" stopOpacity="0" />
                <stop offset="1" stopColor="#000" stopOpacity=".42" />
              </linearGradient>
              <linearGradient id="ckPlate" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#f5d76e" />
                <stop offset="1" stopColor="#8f6d17" />
              </linearGradient>
              <linearGradient id="ckCandle" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0" stopColor="#e9dcc0" />
                <stop offset=".45" stopColor="#fffaf0" />
                <stop offset="1" stopColor="#d9c9a3" />
              </linearGradient>
              <radialGradient id="flGlow">
                <stop offset="0" stopColor="#ffd45e" stopOpacity=".6" />
                <stop offset="1" stopColor="#ffb02e" stopOpacity="0" />
              </radialGradient>
              <linearGradient id="flBody" x1="0" y1="1" x2="0" y2="0">
                <stop offset="0" stopColor="#ff9d2e" />
                <stop offset=".5" stopColor="#ffc94a" />
                <stop offset="1" stopColor="#fff2a8" />
              </linearGradient>
              <radialGradient id="tpGlow">
                <stop offset="0" stopColor="#f5d76e" stopOpacity=".35" />
                <stop offset="1" stopColor="#f5d76e" stopOpacity="0" />
              </radialGradient>
            </defs>

            {/* plate */}
            <ellipse cx="180" cy="342" rx="172" ry="17" fill="url(#ckPlate)" />
            <ellipse cx="180" cy="338" rx="164" ry="13" fill="#f7f3e8" opacity=".14" />
            <ellipse cx="180" cy="336" rx="164" ry="12" fill="none" stroke="rgba(255,246,207,.5)" strokeWidth="1" />

            {/* bottom tier */}
            <rect x="25" y="248" width="310" height="90" rx="10" fill="url(#ckBot)" />
            <rect x="25" y="248" width="310" height="90" rx="10" fill="url(#ckSide)" />
            <path d="M25 300 H335" stroke="rgba(245,215,110,.45)" strokeWidth="1.4" strokeDasharray="2 5" strokeLinecap="round" />
            <rect x="25" y="248" width="310" height="90" rx="10" fill="none" stroke="rgba(212,175,55,.45)" />
            <path d={DRIP_BOTTOM} fill="url(#ckGold)" />

            {/* top tier */}
            <rect x="50" y="170" width="260" height="80" rx="9" fill="url(#ckTop)" />
            <rect x="50" y="170" width="260" height="80" rx="9" fill="url(#ckSide)" />
            <path d="M50 226 H310" stroke="rgba(245,215,110,.45)" strokeWidth="1.4" strokeDasharray="2 5" strokeLinecap="round" />
            <rect x="50" y="170" width="260" height="80" rx="9" fill="none" stroke="rgba(212,175,55,.45)" />
            <path d={DRIP_TOP} fill="url(#ckGold)" />

            {/* topper */}
            <g className="topper">
              <circle cx="180" cy="46" r="52" fill="url(#tpGlow)" />
              <circle cx="180" cy="46" r="27" fill="#1a1230" stroke="url(#ckGold)" strokeWidth="2.6" />
              <circle cx="180" cy="46" r="22" fill="none" stroke="rgba(245,215,110,.55)" strokeWidth=".8" strokeDasharray="1.5 2.5" />
              <text x="180" y="47" textAnchor="middle" dominantBaseline="central" fontFamily="'Playfair Display',serif" fontWeight="900" fontSize="25" fill="url(#ckGold)">
                19
              </text>
              <path d="M180 74 V92" stroke="url(#ckGold)" strokeWidth="1.6" strokeLinecap="round" opacity=".7" />
            </g>

            {/* candles: back row first, then front row */}
            {[0, 1].map((row) =>
              candles
                .filter((c) => c.row === row)
                .map((c) => (
                  <g key={c.idx} opacity={row === 0 ? 0.88 : 1}>
                    <rect x={c.x - c.w / 2} y={c.base - c.h} width={c.w} height={c.h} rx={c.w / 2.4} fill="url(#ckCandle)" />
                    <path
                      d={`M${c.x - c.w / 2} ${c.base - c.h * 0.3} l${c.w} -4 M${c.x - c.w / 2} ${c.base - c.h * 0.62} l${c.w} -4`}
                      stroke="#d4af37"
                      strokeWidth="1.2"
                      opacity=".8"
                    />
                    <path d={`M${c.x} ${c.base - c.h} v-3`} stroke="#3a2a14" strokeWidth="1" strokeLinecap="round" />
                  </g>
                ))
            )}

            {/* flames + smoke */}
            {candles.map((c) => {
              const on = lit[c.idx];
              return (
                <g key={`f${c.idx}`} transform={`translate(${c.x} ${c.fy + 3})`}>
                  <g
                    className={`flame${on ? "" : " flame-out"}`}
                    style={{ animationDelay: `${-((c.idx * 0.37) % 1.3)}s`, animationDuration: `${1.1 + (c.idx % 5) * 0.14}s` }}
                  >
                    <circle r="12" fill="url(#flGlow)" />
                    <path d="M0 -9.5 C4.2 -4.5 4.6 1 0 4.8 C-4.6 1 -4.2 -4.5 0 -9.5Z" fill="url(#flBody)" />
                    <path d="M0 -3.4 C2 -1 2.1 1.6 0 3.2 C-2.1 1.6 -2 -1 0 -3.4Z" fill="#fffbe8" />
                  </g>
                  {!on && (
                    <path
                      className="wisp"
                      d="M0 2 c-4 -7 4 -12 0 -19 s-4 -10 1.5 -17"
                      fill="none"
                      stroke="rgba(247,243,232,.6)"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                    />
                  )}
                </g>
              );
            })}

            {/* forgiving tap layer: any tap near the flames blows the nearest lit one */}
            <rect x="20" y="62" width="320" height="125" fill="transparent" onPointerDown={onTap} style={{ cursor: "pointer" }} />
          </svg>
        </div>
      </div>

      <div className="relative z-[20] mt-6 flex flex-col items-center gap-3">
        <p className="font-display text-[1.5rem] font-bold text-gold" style={{ letterSpacing: "0.12em" }} aria-live="polite">
          <span className="tabular-nums">{outCount}</span> / {TOTAL}
        </p>

        {!done && (
          <button type="button" className={`btn-gold${listening ? " listening" : ""}`} onClick={startMic}>
            💨 blow for real
          </button>
        )}
        {micFailed && !done && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1 }} className="text-[0.85rem] font-medium text-ivory/55">
            tap a flame to blow it out
          </motion.p>
        )}

        <div className="min-h-[7.5rem] pt-2">
          <AnimatePresence>
            {done && (
              <motion.div
                key="wish"
                initial={{ opacity: 0, y: 24, filter: "blur(10px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 1.8, delay: 0.9, ease: [0.22, 1, 0.36, 1] } }}
                exit={{ opacity: 0, transition: { duration: 0.4 } }}
                className="max-w-[20rem] font-display italic text-ivory"
                style={{ fontSize: "1.3rem", lineHeight: 1.6, textShadow: "0 0 24px rgba(245,215,110,.35)" }}
              >
                Close your eyes. Make a wish. 🌠
                <br />
                <span className="text-gold">It's already on its way to coming true.</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <button type="button" className="btn-ghost" onClick={relight}>
          relight candles
        </button>
      </div>

      {/* scene dims at 19/19 */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-[10]"
        style={{
          background: "rgba(2,2,10,.72)",
          opacity: done ? 1 : 0,
          transition: "opacity 1.8s cubic-bezier(.22,1,.36,1)",
          WebkitMaskImage: "linear-gradient(transparent, #000 18%, #000 82%, transparent)",
          maskImage: "linear-gradient(transparent, #000 18%, #000 82%, transparent)",
        }}
      />
    </section>
  );
}
