import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { vib } from "../lib/device";
import SectionHeading, { Rise } from "./SectionHeading";
import WaxSeal from "./WaxSeal";
import LetterContent from "./LetterContent";

const HOLD_MS = 1500;
const R = 44;
const CIRC = 2 * Math.PI * R;
const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

export default function LetterSection() {
  const [phase, setPhase] = useState<"closed" | "opening" | "open">("closed");
  const [flapBack, setFlapBack] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [holding, setHolding] = useState(false);
  const ring = useRef<SVGCircleElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const timers = useRef<number[]>([]);
  const h = useRef({ active: false, start: 0, x: 0, y: 0, p: 0, raf: 0, drain: 0 });

  const setRing = (p: number) => {
    if (ring.current) ring.current.style.strokeDashoffset = String(CIRC * (1 - p));
  };

  const complete = useCallback(() => {
    vib(30);
    setPhase("opening");
    const t = timers.current;
    t.push(window.setTimeout(() => setFlapBack(true), 450));
    t.push(window.setTimeout(() => setPhase("open"), 950));
    t.push(window.setTimeout(() => setExpanded(true), 1950));
  }, []);

  const tick = useCallback(() => {
    const s = h.current;
    if (!s.active) return;
    const p = Math.min(1, (performance.now() - s.start) / HOLD_MS);
    s.p = p;
    setRing(p);
    if (p >= 1) {
      s.active = false;
      setHolding(false);
      complete();
      return;
    }
    s.raf = requestAnimationFrame(tick);
  }, [complete]);

  const cancel = useCallback(() => {
    const s = h.current;
    if (!s.active) return;
    s.active = false;
    cancelAnimationFrame(s.raf);
    setHolding(false);
    const from = s.p;
    const t0 = performance.now();
    const drain = () => {
      if (s.active) return;
      const k = 1 - (performance.now() - t0) / 380;
      if (k <= 0) {
        s.p = 0;
        setRing(0);
        return;
      }
      s.p = from * k;
      setRing(s.p);
      s.drain = requestAnimationFrame(drain);
    };
    drain();
  }, []);

  const begin = (e: React.PointerEvent<HTMLDivElement>) => {
    if (phase !== "closed") return;
    const s = h.current;
    cancelAnimationFrame(s.drain);
    s.active = true;
    s.start = performance.now();
    s.x = e.clientX;
    s.y = e.clientY;
    s.p = 0;
    setRing(0);
    setHolding(true);
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
    s.raf = requestAnimationFrame(tick);
  };
  const move = (e: React.PointerEvent) => {
    const s = h.current;
    if (s.active && Math.hypot(e.clientX - s.x, e.clientY - s.y) > 10) cancel();
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if ((e.key === "Enter" || e.key === " ") && !e.repeat && phase === "closed") {
      e.preventDefault();
      const s = h.current;
      s.active = true;
      s.start = performance.now();
      s.p = 0;
      setHolding(true);
      s.raf = requestAnimationFrame(tick);
    }
  };

  // lock page scroll while the letter is open
  useEffect(() => {
    if (!expanded) return;
    document.documentElement.classList.add("lock");
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setExpanded(false);
    window.addEventListener("keydown", onKey);
    return () => {
      document.documentElement.classList.remove("lock");
      window.removeEventListener("keydown", onKey);
    };
  }, [expanded]);

  useEffect(() => {
    const t = timers.current;
    const s = h.current;
    return () => {
      t.forEach((x) => window.clearTimeout(x));
      cancelAnimationFrame(s.raf);
      cancelAnimationFrame(s.drain);
    };
  }, []);

  const opened = phase !== "closed";

  return (
    <section id="letter" className="relative flex min-h-[100svh] flex-col items-center px-5 pb-24 pt-24 text-center">
      <div className="flex flex-col items-center gap-3">
        <SectionHeading text="One last thing. It's sealed." />
        <Rise as="p" className="sec-sub">
          Press &amp; hold the golden seal until the ring fills. Some things are worth the wait.
        </Rise>
      </div>

      <Rise className="mt-44 w-full">
        <div className={`mx-auto ${opened ? "" : "env-bob"}`} style={{ width: "min(86vw,340px)", perspective: 900 }}>
          <div className="relative w-full" style={{ aspectRatio: "340 / 230" }}>
            {/* envelope back */}
            <div className="absolute inset-0 rounded-[10px]" style={{ background: "linear-gradient(160deg,#caa85c,#a8832f)", boxShadow: "0 30px 60px rgba(0,0,0,.5), 0 0 60px rgba(212,175,55,.12)", zIndex: 0 }} />

            {/* flap (3D) */}
            <div
              className="absolute left-0 right-0 top-0"
              style={{
                height: "56%",
                transformOrigin: "50% 0%",
                transform: `rotateX(${opened ? 180 : 0}deg)`,
                transition: "transform 1s cubic-bezier(.22,1,.36,1)",
                transformStyle: "preserve-3d",
                zIndex: flapBack ? 1 : 4,
              }}
            >
              <div className="absolute inset-0" style={{ clipPath: "polygon(0 0,100% 0,50% 100%)", background: "linear-gradient(180deg,#f1dfae,#dcc07c)", backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden" }} />
              <div className="absolute inset-0" style={{ clipPath: "polygon(0 0,100% 0,50% 100%)", background: "linear-gradient(0deg,#8f6d27,#b08a3c)", transform: "rotateX(180deg)", backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden" }} />
            </div>

            {/* the letter inside */}
            {!expanded && (
              <motion.div
                layoutId="letter-paper"
                className="paper absolute"
                onClick={() => phase === "open" && setExpanded(true)}
                animate={{ y: phase === "open" ? "-52%" : "0%" }}
                transition={{ duration: 0.9, ease: EASE, layout: { duration: 0.9, ease: EASE } }}
                style={{ left: "6%", right: "6%", top: "9%", height: "86%", zIndex: 2, borderRadius: 6, cursor: phase === "open" ? "pointer" : "default" }}
                role={phase === "open" ? "button" : undefined}
                aria-label={phase === "open" ? "Read the letter" : undefined}
              >
                <div className="px-5 pt-4 text-left">
                  <p className="ink font-display text-[0.95rem] font-bold">My dearest Areeba,</p>
                  <div className="mt-3 space-y-2">
                    {[88, 96, 70, 92, 54].map((w, i) => (
                      <div key={i} className="h-[3px] rounded-full" style={{ width: `${w}%`, background: "rgba(43,36,23,.18)" }} />
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* envelope front pocket */}
            <svg viewBox="0 0 340 230" className="pointer-events-none absolute inset-0 h-full w-full" style={{ zIndex: 3 }} aria-hidden="true">
              <defs>
                <linearGradient id="evL" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0" stopColor="#ecd8a0" />
                  <stop offset="1" stopColor="#cfae62" />
                </linearGradient>
                <linearGradient id="evR" x1="1" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor="#e9d398" />
                  <stop offset="1" stopColor="#c8a558" />
                </linearGradient>
                <linearGradient id="evB" x1="0" y1="1" x2="0" y2="0">
                  <stop offset="0" stopColor="#d9bb73" />
                  <stop offset="1" stopColor="#f0dfae" />
                </linearGradient>
              </defs>
              <path d="M0 6 Q0 0 6 0 L172 128 L0 230Z" fill="url(#evL)" />
              <path d="M340 6 Q340 0 334 0 L168 128 L340 230Z" fill="url(#evR)" />
              <path d="M0 230 L170 112 L340 230Z" fill="url(#evB)" />
              <path d="M0 230 L170 112 L340 230" fill="none" stroke="rgba(120,86,20,.3)" strokeWidth="1" />
              <path d="M0 2 L172 128 M340 2 L168 128" fill="none" stroke="rgba(120,86,20,.22)" strokeWidth="1" />
            </svg>

            {/* seal + hold ring */}
            <AnimatePresence>
              {phase === "closed" && (
                <motion.div
                  key="seal"
                  exit={{ opacity: 0, scale: 1.5, transition: { duration: 0.6, ease: EASE } }}
                  className="absolute no-select"
                  style={{ left: "50%", top: "52%", width: 104, height: 104, marginLeft: -52, marginTop: -52, zIndex: 6 }}
                >
                  <div
                    role="button"
                    tabIndex={0}
                    aria-label="Press and hold the golden seal"
                    className="relative grid h-full w-full place-items-center no-select"
                    style={{ touchAction: "pan-y", cursor: "pointer", outline: "none", transform: holding ? "scale(.94)" : "scale(1)", transition: "transform .5s cubic-bezier(.22,1,.36,1)" }}
                    onPointerDown={begin}
                    onPointerMove={move}
                    onPointerUp={cancel}
                    onPointerCancel={cancel}
                    onLostPointerCapture={cancel}
                    onContextMenu={(e) => e.preventDefault()}
                    onKeyDown={onKeyDown}
                    onKeyUp={cancel}
                    onBlur={cancel}
                  >
                    <div className="seal-glow" style={{ inset: "-30%", opacity: holding ? 1 : 0.7 }} />
                    <div className="relative" style={{ filter: "drop-shadow(0 6px 10px rgba(0,0,0,.45))" }}>
                      <WaxSeal size={74} />
                    </div>
                    <svg viewBox="0 0 104 104" width="104" height="104" className="pointer-events-none absolute inset-0" aria-hidden="true">
                      <circle cx="52" cy="52" r={R} fill="none" stroke="rgba(255,246,207,.35)" strokeWidth="2" />
                      <circle
                        ref={ring}
                        cx="52"
                        cy="52"
                        r={R}
                        fill="none"
                        stroke="#fff6cf"
                        strokeWidth="3.4"
                        strokeLinecap="round"
                        strokeDasharray={CIRC}
                        strokeDashoffset={CIRC}
                        transform="rotate(-90 52 52)"
                        style={{ filter: "drop-shadow(0 0 5px rgba(255,241,191,.9))" }}
                      />
                    </svg>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </Rise>

      <div className="mt-24 min-h-[48px]">
        {phase === "open" && !expanded && (
          <button type="button" className="btn-ghost" onClick={() => setExpanded(true)}>
            read the letter again
          </button>
        )}
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div key="overlay" className="fixed inset-0 z-[100]" initial={{ opacity: 1 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.8, delay: 0.15 } }}>
            <motion.div
              layoutId="letter-paper"
              className="paper absolute inset-0"
              style={{ borderRadius: 0 }}
              transition={{ layout: { duration: 0.95, ease: EASE }, duration: 0.95, ease: EASE }}
            />
            <motion.div
              ref={scrollRef}
              className="absolute inset-0 overflow-y-auto"
              style={{ overscrollBehavior: "contain", WebkitOverflowScrolling: "touch" }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, transition: { duration: 0.7, delay: 0.7 } }}
              exit={{ opacity: 0, transition: { duration: 0.25 } }}
            >
              <LetterContent scrollRef={scrollRef} />
            </motion.div>
            <motion.button
              type="button"
              aria-label="Close letter"
              onClick={() => setExpanded(false)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, transition: { delay: 0.9, duration: 0.6 } }}
              exit={{ opacity: 0, transition: { duration: 0.2 } }}
              className="absolute grid place-items-center rounded-full text-[1.7rem] leading-none"
              style={{
                right: 12,
                top: "max(12px, env(safe-area-inset-top))",
                width: 48,
                height: 48,
                background: "rgba(43,36,23,.08)",
                border: "1px solid rgba(43,36,23,.25)",
                color: "#2b2417",
                cursor: "pointer",
              }}
            >
              ×
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
