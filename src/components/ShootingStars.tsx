import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { gsap, ScrollTrigger } from "../lib/gsap";
import { sparkleBurst } from "../lib/fx";
import SectionHeading, { Rise } from "./SectionHeading";

const TOASTS = [
  "Wish received by the universe 🌟",
  "Logged in the stars ✅",
  "The sky says: coming right up ✨",
  "Consider it done 🌠",
];

type CometData = { id: number; y: number; dir: 1 | -1 };

function Comet({ data, width, onGone, onTap }: { data: CometData; width: number; onGone: (id: number) => void; onTap: (x: number, y: number) => void }) {
  const el = useRef<HTMLDivElement>(null);
  const rot = useRef<HTMLDivElement>(null);
  const tl = useRef<gsap.core.Timeline | null>(null);
  const tapped = useRef(false);

  useLayoutEffect(() => {
    const node = el.current;
    if (!node) return;
    const startX = data.dir > 0 ? -190 : width + 190;
    const endX = data.dir > 0 ? width * 1.28 : width * -0.28;
    const drop = 70 + Math.random() * 90;
    const angle = (Math.atan2(drop, endX - startX) * 180) / Math.PI;
    gsap.set(rot.current, { rotation: angle });
    gsap.set(node, { x: startX, y: 0, opacity: 0 });
    const t = gsap.timeline({ onComplete: () => onGone(data.id) });
    t.to(node, { x: endX, y: drop, duration: 2.5, ease: "power2.out" }, 0)
      .to(node, { opacity: 1, duration: 0.25, ease: "none" }, 0)
      .to(node, { opacity: 0, duration: 0.7, ease: "power1.in" }, 1.8);
    tl.current = t;
    return () => {
      t.kill();
    };
  }, [data, width, onGone]);

  const hit = (e: React.PointerEvent) => {
    if (tapped.current) return;
    tapped.current = true;
    e.preventDefault();
    onTap(e.clientX, e.clientY);
    tl.current?.kill();
    gsap.to(el.current, { opacity: 0, scale: 0.4, duration: 0.35, ease: "power2.out", onComplete: () => onGone(data.id) });
  };

  return (
    <div ref={el} className="comet" style={{ top: data.y }}>
      <div ref={rot} className="comet-rot">
        <div className="comet-tail" />
        <div className="comet-head" />
      </div>
      <button type="button" className="comet-zone" aria-label="Shooting star" onPointerDown={hit} />
    </div>
  );
}

export default function ShootingStars() {
  const root = useRef<HTMLElement>(null);
  const hills = useRef<SVGSVGElement>(null);
  const [active, setActive] = useState(false);
  const [comets, setComets] = useState<CometData[]>([]);
  const [toast, setToast] = useState<{ id: number; text: string } | null>(null);
  const [width, setWidth] = useState(390);
  const idRef = useRef(0);
  const lastToast = useRef(-1);
  const toastTimer = useRef<number | undefined>(undefined);

  useLayoutEffect(() => {
    const el = root.current;
    if (!el) return;
    setWidth(el.clientWidth);
    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: el,
        start: "top 75%",
        end: "bottom 25%",
        onToggle: (self) => setActive(self.isActive),
      });
      gsap.fromTo(
        hills.current,
        { y: 40 },
        { y: -10, ease: "none", scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: true } }
      );
    }, el);
    const onResize = () => setWidth(el.clientWidth);
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      ctx.revert();
    };
  }, []);

  const spawn = useCallback(() => {
    const el = root.current;
    if (!el) return;
    const h = el.clientHeight;
    const id = ++idRef.current;
    const y = h * (0.1 + Math.random() * 0.5);
    setComets((c) => [...c.slice(-2), { id, y, dir: Math.random() < 0.5 ? 1 : -1 }]);
  }, []);

  useEffect(() => {
    if (!active) return;
    let t: number;
    const loop = (first: boolean) => {
      t = window.setTimeout(
        () => {
          if (!document.hidden) spawn();
          loop(false);
        },
        first ? 1400 : 4000 + Math.random() * 3000
      );
    };
    loop(true);
    return () => window.clearTimeout(t);
  }, [active, spawn]);

  const gone = useCallback((id: number) => setComets((c) => c.filter((x) => x.id !== id)), []);

  const tap = useCallback((x: number, y: number) => {
    sparkleBurst(x, y);
    let i = Math.floor(Math.random() * TOASTS.length);
    if (i === lastToast.current) i = (i + 1) % TOASTS.length;
    lastToast.current = i;
    setToast({ id: Date.now(), text: TOASTS[i] });
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 2600);
  }, []);

  useEffect(() => () => window.clearTimeout(toastTimer.current), []);

  return (
    <section id="stars" ref={root} className="relative flex min-h-[100svh] flex-col items-center overflow-hidden px-5 pt-28 text-center">
      <div className="relative z-[2] flex flex-col items-center gap-3">
        <SectionHeading text="Now, look up." />
        <Rise as="p" className="sec-sub">
          A shooting star crosses this sky every few seconds. Catch it and tap it before it's gone.
        </Rise>
      </div>

      {comets.map((c) => (
        <Comet key={c.id} data={c} width={width} onGone={gone} onTap={tap} />
      ))}

      {/* horizon */}
      <svg ref={hills} aria-hidden="true" viewBox="0 0 390 160" preserveAspectRatio="none" className="pointer-events-none absolute bottom-0 left-0 z-[1] w-full" style={{ height: "24svh", minHeight: 120 }}>
        <defs>
          <linearGradient id="hillA" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#14142e" />
            <stop offset="1" stopColor="#07071a" />
          </linearGradient>
          <linearGradient id="hillB" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#0d0d24" />
            <stop offset="1" stopColor="#050510" />
          </linearGradient>
        </defs>
        <path d="M0 90 C60 50 110 70 170 62 C240 52 300 20 390 70 V160 H0Z" fill="url(#hillA)" />
        <path d="M0 120 C70 90 130 118 200 104 C270 90 330 96 390 112 V160 H0Z" fill="url(#hillB)" />
        <path d="M0 90 C60 50 110 70 170 62 C240 52 300 20 390 70" fill="none" stroke="rgba(212,175,55,.18)" strokeWidth="1" />
      </svg>

      <div className="pointer-events-none absolute inset-x-0 bottom-[17%] z-[8] flex justify-center px-5">
        <AnimatePresence>
          {toast && (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } }}
              exit={{ opacity: 0, y: -8, transition: { duration: 0.6 } }}
              className="glass px-6 py-3.5 text-[1rem] font-semibold text-ivory"
              style={{ borderRadius: 9999, boxShadow: "0 10px 40px rgba(0,0,0,.4), 0 0 30px rgba(245,215,110,.15)" }}
            >
              {toast.text}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
