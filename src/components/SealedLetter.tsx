import { useCallback, useEffect, useRef, useState } from "react";
import type { PointerEvent as RPointerEvent } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import SectionHeading from "./SectionHeading";
import WaxSeal from "./WaxSeal";
import { LETTER } from "../data/letter";
import { svgUrl, vibrate } from "../lib/device";

const HOLD_MS = 1500;
const RING_R = 46;
const CIRC = 2 * Math.PI * RING_R;
const EASE = [0.22, 1, 0.36, 1] as const;

type Phase = "closed" | "opening" | "peek" | "open";

const PAPER_BG = "#f7f1e3";
const FIBER = svgUrl(
  `<svg xmlns='http://www.w3.org/2000/svg' width='300' height='300'><filter id='f'><feTurbulence type='fractalNoise' baseFrequency='0.9 0.035' numOctaves='3' seed='4'/><feColorMatrix values='0 0 0 0 .45  0 0 0 0 .34  0 0 0 0 .18  0 0 0 .2 0'/></filter><rect width='100%' height='100%' filter='url(#f)'/></svg>`,
);
const BLOTCH = svgUrl(
  `<svg xmlns='http://www.w3.org/2000/svg' width='400' height='400'><filter id='b'><feTurbulence type='fractalNoise' baseFrequency='0.012' numOctaves='2' seed='9'/><feColorMatrix values='0 0 0 0 .6  0 0 0 0 .45  0 0 0 0 .2  0 0 0 .3 0'/></filter><rect width='100%' height='100%' filter='url(#b)'/></svg>`,
);

export default function SealedLetter() {
  const [phase, setPhase] = useState<Phase>("closed");
  const [closing, setClosing] = useState(false);
  const ringRef = useRef<SVGCircleElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const hold = useRef({ raf: 0, start: 0, x: 0, y: 0, active: false });
  const timers = useRef<number[]>([]);

  const setProgress = (p: number, smooth = false) => {
    const r = ringRef.current;
    if (!r) return;
    r.style.transition = smooth ? "stroke-dashoffset .35s ease" : "none";
    r.style.strokeDashoffset = String(CIRC * (1 - p));
  };

  const complete = useCallback(() => {
    hold.current.active = false;
    cancelAnimationFrame(hold.current.raf);
    setProgress(1);
    vibrate(30);
    setPhase("opening");
    timers.current.push(window.setTimeout(() => setPhase("open"), 1900));
  }, []);

  const cancel = useCallback(() => {
    const h = hold.current;
    if (!h.active) return;
    h.active = false;
    cancelAnimationFrame(h.raf);
    setProgress(0, true);
  }, []);

  const begin = useCallback(
    (x: number, y: number) => {
      if (phase !== "closed") return;
      const h = hold.current;
      h.active = true;
      h.start = performance.now();
      h.x = x;
      h.y = y;
      const loop = (now: number) => {
        if (!h.active) return;
        const p = Math.min(1, (now - h.start) / HOLD_MS);
        setProgress(p);
        if (p >= 1) complete();
        else h.raf = requestAnimationFrame(loop);
      };
      h.raf = requestAnimationFrame(loop);
    },
    [phase, complete],
  );

  const onDown = (e: RPointerEvent<HTMLButtonElement>) => {
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
    begin(e.clientX, e.clientY);
  };
  const onMove = (e: RPointerEvent<HTMLButtonElement>) => {
    const h = hold.current;
    if (h.active && Math.hypot(e.clientX - h.x, e.clientY - h.y) > 10) cancel();
  };

  useEffect(
    () => () => {
      cancelAnimationFrame(hold.current.raf);
      timers.current.forEach((t) => window.clearTimeout(t));
    },
    [],
  );

  // lock page scroll while the letter is open
  useEffect(() => {
    if (phase !== "open") return;
    const root = document.documentElement;
    const prev = root.style.overflow;
    root.style.overflow = "hidden";
    return () => {
      root.style.overflow = prev;
    };
  }, [phase]);

  const closeLetter = () => {
    setClosing(true);
    timers.current.push(
      window.setTimeout(() => {
        setPhase("peek");
        setClosing(false);
      }, 320),
    );
  };

  const opened = phase !== "closed";

  const overlay =
    phase === "open"
      ? createPortal(
          <>
            <motion.div
              layoutId="letter-paper"
              ref={overlayRef}
              transition={{ duration: 1.05, ease: EASE }}
              className="fixed inset-0 z-[200] overflow-y-auto overscroll-contain"
              style={{
                backgroundColor: PAPER_BG,
                backgroundImage: `${FIBER}, ${BLOTCH}`,
                backgroundSize: "300px 300px, 400px 400px",
                borderRadius: 4,
                WebkitOverflowScrolling: "touch",
              }}
              role="dialog"
              aria-modal="true"
              aria-label="A letter for Areeba"
            >

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: closing ? 0 : 1 }}
                transition={{ duration: closing ? 0.25 : 0.8, delay: closing ? 0 : 0.75 }}
                className="relative mx-auto max-w-[34rem] px-7 pb-32 pt-24 text-[#2b2417]"
              >
                <div aria-hidden="true" className="mx-auto mb-10 flex items-center justify-center gap-3 text-[#b8902a]">
                  <span className="h-px w-12 bg-[#b8902a]/60" />
                  <span className="text-sm">✦</span>
                  <span className="h-px w-12 bg-[#b8902a]/60" />
                </div>

                {LETTER.map((b, i) => {
                  const common = {
                    initial: { opacity: 0, y: 26 },
                    whileInView: { opacity: 1, y: 0 },
                    viewport: { root: overlayRef, once: true, amount: 0.25 },
                    transition: { duration: 1.1, ease: EASE },
                  } as const;
                  if (b.kind === "greeting") {
                    return (
                      <motion.h2
                        key={i}
                        {...common}
                        className="mb-8 font-display text-[2rem] font-bold leading-tight text-[#2b2417]"
                      >
                        {b.text}
                      </motion.h2>
                    );
                  }
                  if (b.kind === "dua") {
                    return (
                      <motion.p
                        key={i}
                        {...common}
                        className={`my-9 border-l-2 border-[#b8902a] pl-5 font-display text-[1.2rem] leading-[1.8] text-[#2b2417] ${b.italic ? "italic" : ""}`}
                      >
                        {b.text}
                      </motion.p>
                    );
                  }
                  if (b.kind === "signoff") {
                    const [line1, name] = b.text.split("\n");
                    return (
                      <motion.div key={i} {...common} className="mt-14">
                        <p className="text-[16px] italic leading-relaxed text-[#4a3f2a]">{line1}</p>
                        <p className="mt-3 font-display text-[1.9rem] font-bold tracking-[0.14em] text-[#2b2417]">{name}</p>
                      </motion.div>
                    );
                  }
                  return (
                    <motion.p key={i} {...common} className="mb-7 text-[17px] font-medium leading-[1.85] text-[#2b2417]">
                      {b.text}
                    </motion.p>
                  );
                })}
              </motion.div>
            </motion.div>

            <AnimatePresence>
              {!closing && (
                <motion.button
                  type="button"
                  aria-label="Close letter"
                  onClick={closeLetter}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.6, delay: 0.9, ease: EASE }}
                  className="no-select fixed right-[72px] top-3 z-[210] flex h-12 w-12 items-center justify-center rounded-full border border-[#b8902a]/50 bg-[#f7f1e3]/90 text-[1.6rem] leading-none text-[#2b2417] shadow-md backdrop-blur-sm active:scale-90"
                >
                  <span aria-hidden="true">×</span>
                </motion.button>
              )}
            </AnimatePresence>
          </>,
          document.body,
        )
      : null;

  return (
    <section id="letter" className="flex flex-col items-center justify-center gap-14 px-5 py-[12svh]">
      <SectionHeading
        title="One last thing. It's sealed."
        sub="Press & hold the golden seal until the ring fills. Some things are worth the wait."
      />

      <div className="relative">
        <div className="relative h-[200px] w-[300px] max-[340px]:scale-90" style={{ perspective: 900 }}>
          {/* envelope back */}
          <svg viewBox="0 0 300 200" className="absolute inset-0 h-full w-full" aria-hidden="true">
            <defs>
              <linearGradient id="env-back" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#1b1b4a" />
                <stop offset="1" stopColor="#101033" />
              </linearGradient>
              <linearGradient id="env-front" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#25255e" />
                <stop offset="1" stopColor="#14143a" />
              </linearGradient>
              <linearGradient id="env-flap" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#2c2c6c" />
                <stop offset="1" stopColor="#1a1a48" />
              </linearGradient>
            </defs>
            <rect x="0.5" y="0.5" width="299" height="199" rx="6" fill="url(#env-back)" stroke="rgba(212,175,55,.55)" />
          </svg>

          {/* the letter inside */}
          {phase !== "open" && (
            <motion.div
              layoutId="letter-paper"
              initial={false}
              animate={{ top: phase === "closed" ? 18 : -78 }}
              transition={{ top: { duration: 1, delay: phase === "opening" ? 0.55 : 0, ease: EASE }, layout: { duration: 1.05, ease: EASE } }}
              onClick={() => phase === "peek" && setPhase("open")}
              className="absolute left-[7%] z-[2] h-[176px] w-[86%] overflow-hidden"
              style={{
                background: PAPER_BG,
                borderRadius: 4,
                cursor: phase === "peek" ? "pointer" : "default",
                boxShadow: "0 -2px 14px rgba(0,0,0,.25)",
              }}
              role={phase === "peek" ? "button" : undefined}
              aria-label={phase === "peek" ? "Read the letter again" : undefined}
              tabIndex={phase === "peek" ? 0 : -1}
              onKeyDown={(e) => {
                if (phase === "peek" && (e.key === "Enter" || e.key === " ")) setPhase("open");
              }}
            >
              <div className="pointer-events-none absolute inset-0" style={{ backgroundImage: FIBER, backgroundSize: "300px" }} />
              <div className="relative px-5 pt-5">
                  <p className="font-display text-[15px] font-bold text-[#2b2417]">My dearest Areeba,</p>
                  <div className="mt-3 space-y-2" aria-hidden="true">
                    <div className="h-[3px] w-full rounded bg-[#2b2417]/15" />
                    <div className="h-[3px] w-[88%] rounded bg-[#2b2417]/15" />
                    <div className="h-[3px] w-[94%] rounded bg-[#2b2417]/15" />
                    <div className="h-[3px] w-[60%] rounded bg-[#2b2417]/15" />
                </div>
              </div>
            </motion.div>
          )}

          {/* front pocket */}
          <svg viewBox="0 0 300 200" className="pointer-events-none absolute inset-0 z-[3] h-full w-full" aria-hidden="true">
            <path d="M0.5 0.5 L150 106 L299.5 0.5 L299.5 193 Q299.5 199.5 293 199.5 L7 199.5 Q0.5 199.5 0.5 193 Z" fill="url(#env-front)" stroke="rgba(212,175,55,.55)" strokeLinejoin="round" />
            <path d="M0.5 199.5 L120 112 M299.5 199.5 L180 112" stroke="rgba(212,175,55,.25)" fill="none" />
          </svg>

          {/* flap */}
          <motion.div
            className="pointer-events-none absolute left-0 top-0 h-[120px] w-full"
            style={{ transformOrigin: "50% 0%", transformStyle: "preserve-3d" }}
            initial={false}
            animate={{ rotateX: opened ? -180 : 0, zIndex: opened ? 1 : 5 }}
            transition={{ rotateX: { duration: 1.05, ease: EASE }, zIndex: { duration: 0, delay: opened ? 0.45 : 0 } }}
            aria-hidden="true"
          >
            <svg viewBox="0 0 300 120" className="h-full w-full">
              <path d="M0.5 0.5 L299.5 0.5 L150 112 Z" fill="url(#env-flap)" stroke="rgba(212,175,55,.65)" strokeLinejoin="round" />
            </svg>
          </motion.div>

          {/* seal + ring */}
          <motion.div
            className="absolute left-1/2 top-[106px] z-[10] -translate-x-1/2 -translate-y-1/2"
            animate={opened ? { opacity: 0, scale: 1.35 } : { opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: EASE }}
            style={{ pointerEvents: opened ? "none" : "auto" }}
          >
            <button
              type="button"
              aria-label="Press and hold to break the seal"
              onPointerDown={onDown}
              onPointerMove={onMove}
              onPointerUp={cancel}
              onPointerCancel={cancel}
              onLostPointerCapture={cancel}
              onContextMenu={(e) => e.preventDefault()}
              onKeyDown={(e) => {
                if ((e.key === " " || e.key === "Enter") && !e.repeat) {
                  e.preventDefault();
                  const r = e.currentTarget.getBoundingClientRect();
                  begin(r.left, r.top);
                }
              }}
              onKeyUp={cancel}
              className="no-select relative flex h-[96px] w-[96px] items-center justify-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-gold"
              style={{ touchAction: "pan-y", WebkitTouchCallout: "none", animation: "seal-glow 3s ease-in-out infinite" }}
            >
              <svg viewBox="0 0 100 100" className="pointer-events-none absolute inset-0 h-full w-full -rotate-90" aria-hidden="true">
                <circle cx="50" cy="50" r={RING_R} fill="none" stroke="rgba(247,243,232,.18)" strokeWidth="3" />
                <circle
                  ref={ringRef}
                  cx="50"
                  cy="50"
                  r={RING_R}
                  fill="none"
                  stroke="#fff3b8"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeDasharray={CIRC}
                  strokeDashoffset={CIRC}
                  style={{ filter: "drop-shadow(0 0 5px rgba(245,215,110,.9))" }}
                />
              </svg>
              <WaxSeal size={74} className="pointer-events-none relative drop-shadow-[0_4px_10px_rgba(0,0,0,.5)]" />
            </button>
          </motion.div>
        </div>
      </div>

      <p className="-mt-6 min-h-6 text-[13px] tracking-wide text-ivory/55">
        {phase === "peek" ? "tap the letter to read it again" : phase === "closed" ? "hold…" : ""}
      </p>

      {overlay}
    </section>
  );
}
