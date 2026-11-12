import { useLayoutEffect, useRef } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";
import { gsap } from "../lib/gsap";
import { clamp } from "../lib/device";
import Chars from "./Chars";
import SectionHeading from "./SectionHeading";
import WaxSeal from "./WaxSeal";

function Corner({ className, rotate }: { className: string; rotate: number }) {
  return (
    <svg aria-hidden="true" className={`pointer-events-none absolute ${className}`} width="54" height="54" viewBox="0 0 54 54" style={{ transform: `rotate(${rotate}deg)` }}>
      <g fill="none" stroke="#d4af37" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 50 V18 C4 9 9 4 18 4 H50" strokeWidth="1.6" />
        <path d="M12 50 V24 C12 17 17 12 24 12 H50" strokeWidth="1" opacity=".55" />
        <path d="M20 20 C26 20 30 24 30 30 C30 34 27 36 24 35 C21 34 21 30 24 29" strokeWidth="1.2" />
        <path d="M4 4 L14 14" strokeWidth="1" opacity=".7" />
      </g>
      <circle cx="19" cy="19" r="2" fill="#f5d76e" />
    </svg>
  );
}

export default function Certificate() {
  const root = useRef<HTMLElement>(null);
  const card = useRef<HTMLDivElement>(null);
  const drag = useRef(false);
  const rx = useMotionValue(0);
  const ry = useMotionValue(0);
  const srx = useSpring(rx, { stiffness: 120, damping: 14, mass: 0.6 });
  const sry = useSpring(ry, { stiffness: 120, damping: 14, mass: 0.6 });

  useLayoutEffect(() => {
    const el = root.current;
    if (!el) return;
    const ctx = gsap.context(() => {
      gsap.from(".cert-wrap", {
        opacity: 0,
        y: 70,
        rotateX: 14,
        duration: 1.8,
        ease: "lux",
        scrollTrigger: { trigger: ".cert-wrap", start: "top 88%", once: true },
      });
      gsap.fromTo(
        ".cert-seal",
        { scale: 1.8, opacity: 0, rotate: -25 },
        {
          scale: 1,
          opacity: 1,
          rotate: 0,
          duration: 1.1,
          ease: "power3.out",
          scrollTrigger: { trigger: ".cert-wrap", start: "top 45%", once: true },
        }
      );
    }, el);
    return () => ctx.revert();
  }, []);

  const move = (e: React.PointerEvent) => {
    if (!drag.current || !card.current) return;
    const r = card.current.getBoundingClientRect();
    const nx = clamp(((e.clientX - r.left) / r.width) * 2 - 1, -1, 1);
    const ny = clamp(((e.clientY - r.top) / r.height) * 2 - 1, -1, 1);
    ry.set(nx * 6);
    rx.set(-ny * 6);
  };
  const end = () => {
    drag.current = false;
    rx.set(0);
    ry.set(0);
  };

  return (
    <section id="certificate" ref={root} className="relative flex min-h-[100svh] flex-col items-center px-5 pb-24 pt-24 text-center">
      <SectionHeading text="Now, some official business." className="mb-10 max-w-[22rem]" />

      <div className="cert-wrap w-full max-w-[420px]" style={{ perspective: 900 }}>
        <motion.div
          ref={card}
          className="cert"
          style={{ rotateX: srx, rotateY: sry, transformPerspective: 900 }}
          onPointerDown={(e) => {
            drag.current = true;
            move(e);
          }}
          onPointerMove={move}
          onPointerUp={end}
          onPointerCancel={end}
          onPointerLeave={end}
        >
          <Corner className="left-[14px] top-[14px]" rotate={0} />
          <Corner className="right-[14px] top-[14px]" rotate={90} />
          <Corner className="bottom-[14px] right-[14px]" rotate={180} />
          <Corner className="bottom-[14px] left-[14px]" rotate={270} />
          <div className="cert-shine" aria-hidden="true" />

          <div className="relative px-7 pb-24 pt-14">
            <p className="font-display text-[0.95rem] font-bold text-gold" style={{ letterSpacing: "0.2em" }}>
              ✦ CERTIFICATE OF BRILLIANCE ✦
            </p>
            <p className="mt-6 font-display text-[0.95rem] italic text-ivory/75">Proudly awarded to</p>
            <p className="my-2 font-display font-black leading-tight" style={{ fontSize: "clamp(2.6rem,13.5vw,3.6rem)", letterSpacing: "0.1em" }} aria-label="AREEBA">
              <Chars text="AREEBA" gold hidden={false} />
            </p>
            <div className="mx-auto my-4 h-px w-24" style={{ background: "linear-gradient(90deg,transparent,#d4af37,transparent)" }} />

            <p className="cert-text">
              for an outstanding result in HSSC-I (Pre-Medical) —
              <br />
              earned through sleepless nights, relentless effort,
              <br />
              and a mind that refuses to settle for average.
            </p>

            <p className="cert-text mt-6">
              Next mission: HSSC-II. Then MDCAT.
              <br />
              <span className="font-display text-[1.02rem] font-bold text-gold">Final destination: Dr. Areeba. 🩺</span>
            </p>

            <div className="mx-auto my-6 h-px w-24" style={{ background: "linear-gradient(90deg,transparent,#d4af37,transparent)" }} />

            <p className="cert-text text-[0.85rem] text-ivory/75">Awarded on the occasion of her 17th birthday · 30 November</p>
            <p className="cert-text mt-3 text-[0.85rem] italic text-ivory/75">
              Signed, <span className="font-display font-bold not-italic text-gold">ABDULLAH</span> — who always knew you'd do this.
            </p>
          </div>

          <div className="cert-seal pointer-events-none absolute bottom-4 right-4" style={{ filter: "drop-shadow(0 6px 10px rgba(0,0,0,.5))" }}>
            <WaxSeal size={64} />
          </div>
        </motion.div>
      </div>
    </section>
  );
}
