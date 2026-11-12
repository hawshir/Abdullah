import { useCallback, useEffect, useRef, useState } from "react";
import type { PointerEvent as RPointerEvent, RefObject } from "react";
import confetti from "canvas-confetti";
import { AnimatePresence, motion } from "framer-motion";
import SectionHeading from "./SectionHeading";
import { gsap, ScrollTrigger } from "../lib/gsap";
import { GOLD_CONFETTI, rand } from "../lib/device";

const TOASTS = [
  "Wish received by the universe 🌟",
  "Logged in the stars ✅",
  "The sky says: coming right up ✨",
  "Consider it done 🌠",
];

type Spec = { id: number; dir: 1 | -1; y: number; angle: number };

function Comet({
  spec,
  skyRef,
  onDone,
  onCatch,
}: {
  spec: Spec;
  skyRef: RefObject<HTMLDivElement | null>;
  onDone: (id: number) => void;
  onCatch: (id: number, x: number, y: number) => void;
}) {
  const outer = useRef<HTMLDivElement>(null);
  const tl = useRef<gsap.core.Timeline | null>(null);

  useEffect(() => {
    const sky = skyRef.current;
    const el = outer.current;
    if (!sky || !el) return;
    const W = sky.clientWidth;
    const H = sky.clientHeight;
    const startX = spec.dir > 0 ? -120 : W + 120;
    const endX = spec.dir > 0 ? W + 70 : -70;
    const y0 = spec.y * H;
    const dy = Math.abs(endX - startX) * Math.tan((spec.angle * Math.PI) / 180);
    const t = gsap.timeline({ onComplete: () => onDone(spec.id) });
    t.fromTo(el, { x: startX, y: y0, opacity: 1 }, { x: endX, y: y0 + dy, duration: 2.5, ease: "power2.out" }, 0);
    t.to(el, { opacity: 0, duration: 0.7, ease: "power1.in" }, 1.8);
    tl.current = t;
    return () => {
      t.kill();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const caught = (e: RPointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const el = outer.current;
    if (!tl.current || !el) return;
    tl.current.kill();
    tl.current = null;
    onCatch(spec.id, e.clientX, e.clientY);
    gsap.to(el, { scale: 1.5, opacity: 0, duration: 0.35, ease: "power2.out", onComplete: () => onDone(spec.id) });
  };

  const rot = spec.dir > 0 ? spec.angle : 180 - spec.angle;

  return (
    <div ref={outer} className="pointer-events-none absolute left-0 top-0 will-change-transform" style={{ opacity: 0 }}>
      <div className="absolute left-0 top-0 h-0 w-0" style={{ transform: `rotate(${rot}deg)` }}>
        {/* tail */}
        <span
          className="absolute rounded-full"
          style={{
            right: 0,
            top: -1.5,
            width: 140,
            height: 3,
            background: "linear-gradient(to left, rgba(255,246,204,.95), rgba(245,215,110,.45) 40%, rgba(212,175,55,0))",
          }}
        />
        {/* head */}
        <span
          className="absolute rounded-full"
          style={{
            left: -5,
            top: -5,
            width: 10,
            height: 10,
            background: "#fff8dc",
            boxShadow: "0 0 12px 4px rgba(245,215,110,.9), 0 0 30px 10px rgba(212,175,55,.4)",
          }}
        />
        {/* generous invisible tap zone */}
        <div
          role="button"
          aria-label="Catch the shooting star"
          className="pointer-events-auto absolute"
          style={{ left: -170, top: -42, width: 214, height: 84, borderRadius: 42, touchAction: "manipulation" }}
          onPointerDown={caught}
        />
      </div>
    </div>
  );
}

export default function ShootingStars() {
  const sectionRef = useRef<HTMLElement>(null);
  const skyRef = useRef<HTMLDivElement>(null);
  const idRef = useRef(0);
  const lastToast = useRef(-1);
  const [active, setActive] = useState(false);
  const [comets, setComets] = useState<Spec[]>([]);
  const [toast, setToast] = useState<{ id: number; text: string } | null>(null);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const st = ScrollTrigger.create({
      trigger: el,
      start: "top 65%",
      end: "bottom 35%",
      onToggle: (self) => setActive(self.isActive),
    });
    return () => st.kill();
  }, []);

  // spawn every 4–7s, only while in view
  useEffect(() => {
    if (!active) {
      setComets([]);
      return;
    }
    let t = 0;
    const spawn = () => {
      if (!document.hidden) {
        setComets((c) =>
          c.length >= 2
            ? c
            : [
                ...c,
                {
                  id: ++idRef.current,
                  dir: Math.random() < 0.5 ? 1 : -1,
                  y: rand(0.08, 0.5),
                  angle: rand(12, 22),
                },
              ],
        );
      }
      t = window.setTimeout(spawn, rand(4000, 7000));
    };
    t = window.setTimeout(spawn, 1400);
    return () => window.clearTimeout(t);
  }, [active]);

  const onDone = useCallback((id: number) => setComets((c) => c.filter((x) => x.id !== id)), []);

  const onCatch = useCallback((_id: number, x: number, y: number) => {
    try {
      confetti({
        particleCount: 26,
        spread: 360,
        startVelocity: 16,
        ticks: 70,
        gravity: 0.45,
        scalar: 0.75,
        shapes: ["star", "circle"],
        colors: GOLD_CONFETTI,
        origin: { x: x / window.innerWidth, y: y / window.innerHeight },
        zIndex: 150,
        disableForReducedMotion: true,
      });
    } catch {
      /* ignore */
    }
    let i = Math.floor(Math.random() * TOASTS.length);
    if (i === lastToast.current) i = (i + 1) % TOASTS.length;
    lastToast.current = i;
    const id = Date.now();
    setToast({ id, text: TOASTS[i] });
    window.setTimeout(() => setToast((t) => (t && t.id === id ? null : t)), 2600);
  }, []);

  return (
    <section id="stars" ref={sectionRef} className="flex flex-col items-center justify-center gap-6 py-[12svh]">
      <SectionHeading
        title="Now, look up."
        sub="A shooting star crosses this sky every few seconds. Catch it and tap it before it's gone."
      />

      <div ref={skyRef} className="relative h-[52svh] min-h-[320px] w-full overflow-hidden">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2"
          style={{ background: "linear-gradient(to top, rgba(245,215,110,.07), transparent)" }}
        />
        {comets.map((c) => (
          <Comet key={c.id} spec={c} skyRef={skyRef} onDone={onDone} onCatch={onCatch} />
        ))}
      </div>

      <div className="pointer-events-none fixed inset-x-0 bottom-[max(2rem,env(safe-area-inset-bottom))] z-[140] flex justify-center px-6">
        <AnimatePresence>
          {toast && (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 16, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className="glass !rounded-full px-6 py-3.5 text-[15px] font-semibold tracking-wide text-ivory shadow-[0_0_30px_rgba(212,175,55,.25)]"
              role="status"
            >
              {toast.text}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
