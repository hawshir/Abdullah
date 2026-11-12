import { useEffect, useRef } from "react";
import type { PointerEvent as RPointerEvent } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";
import SectionHeading from "./SectionHeading";
import WaxSeal from "./WaxSeal";
import { gsap } from "../lib/gsap";
import { clamp } from "../lib/device";

function Flourish({ className }: { className: string }) {
  return (
    <svg viewBox="0 0 64 64" className={`pointer-events-none absolute h-14 w-14 ${className}`} aria-hidden="true">
      <g fill="none" stroke="#d4af37" strokeLinecap="round">
        <path d="M2 62 V20 C2 9 9 2 20 2 H62" strokeWidth="1.6" />
        <path d="M9 62 V26 C9 17 17 9 26 9 H62" strokeWidth="0.8" opacity="0.6" />
        <path d="M24 24 C34 24 40 19 40 9 M24 24 C24 34 19 40 9 40" strokeWidth="1.2" />
        <path d="M30 30 C38 30 42 34 42 42" strokeWidth="0.9" opacity="0.7" />
      </g>
      <circle cx="20" cy="20" r="3" fill="#f5d76e" />
      <circle cx="46" cy="46" r="1.4" fill="#f5d76e" opacity="0.7" />
    </svg>
  );
}

export default function Certificate() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const rx = useMotionValue(0);
  const ry = useMotionValue(0);
  const srx = useSpring(rx, { stiffness: 130, damping: 13, mass: 0.7 });
  const sry = useSpring(ry, { stiffness: 130, damping: 13, mass: 0.7 });

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        wrap,
        { y: 80, opacity: 0.1, rotateX: 14, scale: 0.95, transformPerspective: 1100 },
        {
          y: 0,
          opacity: 1,
          rotateX: 0,
          scale: 1,
          ease: "none",
          scrollTrigger: { trigger: wrap, start: "top 98%", end: "top 45%", scrub: 1 },
        },
      );
      gsap.fromTo(
        ".cert-line",
        { opacity: 0, y: 16 },
        {
          opacity: 1,
          y: 0,
          duration: 1.3,
          stagger: 0.14,
          ease: "lux",
          scrollTrigger: { trigger: wrap, start: "top 70%", once: true },
        },
      );
    }, wrap);
    return () => ctx.revert();
  }, []);

  const move = (e: RPointerEvent<HTMLDivElement>) => {
    if (!dragging.current || !cardRef.current) return;
    const r = cardRef.current.getBoundingClientRect();
    const nx = clamp((e.clientX - (r.left + r.width / 2)) / (r.width / 2), -1, 1);
    const ny = clamp((e.clientY - (r.top + r.height / 2)) / (r.height / 2), -1, 1);
    ry.set(nx * 6);
    rx.set(-ny * 6);
  };
  const release = () => {
    dragging.current = false;
    rx.set(0);
    ry.set(0);
  };

  return (
    <section id="certificate" className="flex flex-col items-center justify-center gap-10 px-5 py-[12svh]">
      <SectionHeading title="Now, some official business." />

      <div ref={wrapRef} className="w-full max-w-[420px]" style={{ perspective: 1100 }}>
        <motion.div
          ref={cardRef}
          style={{ rotateX: srx, rotateY: sry, transformStyle: "preserve-3d", touchAction: "pan-y" }}
          onPointerDown={(e) => {
            dragging.current = true;
            try {
              (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
            } catch {
              /* ignore */
            }
            move(e);
          }}
          onPointerMove={move}
          onPointerUp={release}
          onPointerCancel={release}
          onLostPointerCapture={release}
          className="no-select relative overflow-hidden rounded-[22px] border border-[rgba(212,175,55,.6)] p-[7px] shadow-[0_20px_60px_rgba(0,0,0,.5),0_0_50px_rgba(212,175,55,.08)]"
        >
          <div
            aria-hidden="true"
            className="absolute inset-0 -z-0 rounded-[22px]"
            style={{
              background:
                "linear-gradient(155deg, rgba(255,255,255,.09), rgba(255,255,255,.03) 45%, rgba(212,175,55,.07))",
              WebkitBackdropFilter: "blur(12px)",
              backdropFilter: "blur(12px)",
            }}
          />
          <div className="relative rounded-[16px] border border-[rgba(212,175,55,.4)] px-6 pb-28 pt-12 text-center">
            <Flourish className="left-1.5 top-1.5" />
            <Flourish className="right-1.5 top-1.5 rotate-90" />
            <Flourish className="bottom-1.5 left-1.5 -rotate-90" />
            <Flourish className="bottom-1.5 right-1.5 rotate-180" />

            <p className="cert-line font-display text-[13.5px] font-bold tracking-[0.2em] text-gold">
              ✦ CERTIFICATE OF BRILLIANCE ✦
            </p>
            <p className="cert-line mt-6 font-display text-[15px] italic text-ivory/70">Proudly awarded to</p>
            <p className="cert-line gold-glow mt-2">
              <span className="gold-text font-display text-[clamp(2.8rem,15vw,4rem)] font-black leading-none tracking-[0.1em]">
                AREEBA
              </span>
            </p>

            <div className="cert-line mx-auto my-6 flex items-center justify-center gap-3" aria-hidden="true">
              <span className="h-px w-14 bg-gradient-to-r from-transparent to-[rgba(212,175,55,.7)]" />
              <span className="text-xs text-gold">✦</span>
              <span className="h-px w-14 bg-gradient-to-l from-transparent to-[rgba(212,175,55,.7)]" />
            </div>

            <p className="cert-line mx-auto max-w-[19rem] text-[14.5px] leading-[1.75] text-ivory/85 [text-wrap:balance]">
              for an outstanding result in HSSC-I (Pre-Medical) — earned through sleepless nights, relentless effort,
              and a mind that refuses to settle for average.
            </p>

            <div className="cert-line mt-6 space-y-1.5">
              <p className="text-[15px] font-semibold tracking-wide text-ivory">Next mission: HSSC-II. Then MDCAT.</p>
              <p className="font-display text-[1.1rem] font-bold text-gold">Final destination: Dr. Areeba. 🩺</p>
            </div>

            <p className="cert-line mx-auto mt-8 max-w-[17rem] text-[12.5px] leading-relaxed tracking-wide text-ivory/60">
              Awarded on the occasion of her 19th birthday · 30 November
            </p>
            <p className="cert-line mx-auto mt-3 max-w-[15rem] font-display text-[14px] italic leading-snug text-ivory/85">
              Signed, ABDULLAH — who always knew you'd do this.
            </p>

            <WaxSeal size={78} className="absolute -bottom-1 right-2 rotate-[-12deg] drop-shadow-[0_6px_14px_rgba(0,0,0,.5)]" />
          </div>

          {/* slow diagonal shine sweep */}
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden rounded-[22px]">
            <div
              className="absolute -top-1/4 left-0 h-[150%] w-1/4"
              style={{
                background: "linear-gradient(90deg, transparent, rgba(255,246,204,.2), transparent)",
                animation: "sweep 6s ease-in-out infinite",
              }}
            />
          </div>
        </motion.div>
      </div>
    </section>
  );
}
