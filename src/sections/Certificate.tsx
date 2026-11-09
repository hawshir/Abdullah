import { useLayoutEffect, useRef } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";
import { gsap, setupSection } from "../lib/motion";
import { SplitText } from "../components/SplitText";
import { Seal } from "../components/Seal";

function Flourish({ className }: { className: string }) {
  return (
    <svg viewBox="0 0 64 64" className={`pointer-events-none absolute h-[52px] w-[52px] ${className}`} aria-hidden="true" fill="none" stroke="#d4af37" strokeLinecap="round">
      <path d="M4 60 V18 Q4 4 18 4 H60" strokeWidth="1.6" />
      <path d="M12 52 V24 Q12 12 24 12 H52" strokeWidth="1" opacity="0.7" />
      <path d="M22 22 q10 0 10 -9 q0 -6 -6 -6 q-4 0 -4 4 q0 3 3 3" strokeWidth="1.2" />
      <circle cx="4" cy="4" r="2.4" fill="#f5d76e" stroke="none" />
      <circle cx="40" cy="4" r="1.3" fill="#f5d76e" stroke="none" />
      <circle cx="4" cy="40" r="1.3" fill="#f5d76e" stroke="none" />
    </svg>
  );
}

export default function Certificate() {
  const root = useRef<HTMLElement>(null);
  const card = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const rx = useMotionValue(0);
  const ry = useMotionValue(0);
  const srx = useSpring(rx, { stiffness: 110, damping: 13, mass: 0.8 });
  const sry = useSpring(ry, { stiffness: 110, damping: 13, mass: 0.8 });

  useLayoutEffect(() => {
    const ctx = gsap.context(() => setupSection(root.current!), root);
    return () => ctx.revert();
  }, []);

  const tiltTo = (e: React.PointerEvent) => {
    const el = card.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const px = Math.max(-1, Math.min(1, ((e.clientX - r.left) / r.width) * 2 - 1));
    const py = Math.max(-1, Math.min(1, ((e.clientY - r.top) / r.height) * 2 - 1));
    ry.set(px * 6);
    rx.set(-py * 6);
  };
  const release = () => {
    dragging.current = false;
    rx.set(0);
    ry.set(0);
  };

  return (
    <section ref={root} id="certificate" className="section">
      <SplitText as="h2" scroll text="Now, some official business." className="heading max-w-[20rem]" />

      <div className="mt-10 w-full max-w-[420px]" data-reveal="">
        <motion.div
          ref={card}
          className="cert-card"
          style={{ rotateX: srx, rotateY: sry, transformPerspective: 900 }}
          onPointerDown={(e) => {
            dragging.current = true;
            try {
              e.currentTarget.setPointerCapture(e.pointerId);
            } catch {
              /* ignore */
            }
            tiltTo(e);
          }}
          onPointerMove={(e) => {
            if (dragging.current) tiltTo(e);
          }}
          onPointerUp={release}
          onPointerCancel={release}
          onLostPointerCapture={release}
        >
          <div className="cert-inner-border" />
          <Flourish className="left-[14px] top-[14px]" />
          <Flourish className="right-[14px] top-[14px] -scale-x-100" />
          <Flourish className="bottom-[14px] left-[14px] -scale-y-100" />
          <Flourish className="bottom-[14px] right-[14px] -scale-100" />
          <div className="cert-shine" />

          <div className="relative px-[34px] pb-[110px] pt-[48px] text-center">
            <p className="font-display text-[0.8rem] font-bold uppercase leading-relaxed tracking-[0.22em] text-[#f5d76e]">
              ✦ CERTIFICATE OF BRILLIANCE ✦
            </p>
            <p className="mt-5 font-display text-[1rem] italic text-[rgba(247,243,232,0.75)]">Proudly awarded to</p>
            <div
              className="gold-shimmer mt-2 font-display font-black leading-[1.1]"
              style={{ fontSize: "clamp(2.2rem, 12vw, 3.6rem)", letterSpacing: "0.08em", paddingLeft: "0.08em" }}
            >
              AREEBA
            </div>
            <p className="mt-5 text-[0.98rem] font-medium leading-[1.75] text-[rgba(247,243,232,0.85)]">
              for an outstanding result in HSSC-I (Pre-Medical) — <br className="hidden sm:block" />
              earned through sleepless nights, relentless effort, <br className="hidden sm:block" />
              and a mind that refuses to settle for average.
            </p>

            <div className="mx-auto my-6 h-px w-24 bg-gradient-to-r from-transparent via-[#d4af37] to-transparent" />

            <p className="text-[0.98rem] font-semibold leading-[1.7] text-[#f7f3e8]">
              Next mission: HSSC-II. Then MDCAT.
              <br />
              <span className="font-display text-[1.1rem] font-bold text-[#f5d76e]">Final destination: Dr. Areeba. 🩺</span>
            </p>

            <p className="mt-6 text-[0.82rem] font-medium leading-relaxed tracking-[0.04em] text-[rgba(247,243,232,0.65)]">
              Awarded on the occasion of her 17th birthday · 30 November
            </p>
            <p className="mt-2 font-display text-[0.95rem] italic leading-relaxed text-[rgba(247,243,232,0.85)]">
              Signed, ABDULLAH — who always knew you'd do this.
            </p>
          </div>

          <Seal id="cert" size={72} className="pointer-events-none absolute bottom-[34px] right-[34px] drop-shadow-[0_6px_14px_rgba(0,0,0,0.5)]" />
        </motion.div>
      </div>
    </section>
  );
}
