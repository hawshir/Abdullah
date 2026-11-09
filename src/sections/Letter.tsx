import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { gsap, setupSection } from "../lib/motion";
import { SplitText } from "../components/SplitText";
import { Seal } from "../components/Seal";
import { vibrate } from "../lib/device";

const HOLD_MS = 1500;
const RING_R = 44;
const RING_C = 2 * Math.PI * RING_R;
const LUX = [0.22, 1, 0.36, 1] as const;

function P({
  children,
  className = "letter-p",
  root,
}: {
  children: ReactNode;
  className?: string;
  root: RefObject<HTMLDivElement | null>;
}) {
  return (
    <motion.p
      className={className}
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ root, once: true, amount: 0.2, margin: "0px 0px -6% 0px" }}
      transition={{ duration: 1.15, ease: LUX }}
    >
      {children}
    </motion.p>
  );
}

function LetterBody({ scrollRef }: { scrollRef: RefObject<HTMLDivElement | null> }) {
  return (
    <div className="mx-auto w-full max-w-[560px] px-[26px] pb-[22vh] pt-[84px]">
      <P root={scrollRef} className="mb-8 font-display text-[1.75rem] font-bold leading-snug text-[#2b2417]">
        My dearest <span className="gold-shimmer-dark">Areeba</span>,
      </P>

      <P root={scrollRef}>
        Some people wait all year for their birthday to feel special. You make every ordinary day around you feel
        special — the birthday is just the world's excuse to celebrate you out loud.
      </P>
      <P root={scrollRef}>
        Seventeen. SubhanAllah. Happy birthday! May this year be the softest, kindest, most beautiful chapter of your
        life so far.
      </P>
      <P root={scrollRef}>
        And can we please talk about your HSSC-I result? Brilliant — of course it was. You didn't get lucky; you earned
        every single mark, late night by late night, page by page. I'm so proud of you I'd put it on a billboard if I
        could. Mubarak ho! 🎉 But knowing you, this is just the opening scene. HSSC-II, then MDCAT, then a white coat
        with ABDULLAH stitched on it. "Dr. Areeba" has a beautiful ring to it, doesn't it?
      </P>
      <P root={scrollRef}>
        And now — my dua for you. Read it slowly; it's from the deepest part of my heart:
      </P>

      <P root={scrollRef} className="letter-dua italic">
        Allah Pak aapko sehat o tandrusti ata farmaye, aapke ghar mein khushiyon ke din baraste rahein, aur aapki har
        jaiz dua qubool farmaye. Aameen.
      </P>
      <P root={scrollRef} className="letter-dua">
        Ya Allah, make her a source of healing for everyone she meets. Let her hands carry shifa, her heart carry
        mercy. Make the road to MDCAT smooth for her, put barakah in every hour she studies, and when her result comes,
        let her score speak so loudly that her family's prayers turn into happy tears. Make her Dr. Areeba — the kind
        of doctor whose kindness starts healing patients before the medicine even does.
      </P>
      <P root={scrollRef} className="letter-dua">
        May Allah grant you an even higher score in HSSC-II, success in MDCAT beyond everything you've prayed for, and
        a life full of noor, peace, and ajr. Aameen, summa Aameen. 🤲
      </P>

      <P root={scrollRef}>Never dim your light for anyone. The world is waiting for Dr. Areeba.</P>
      <P root={scrollRef}>Happy birthday, superstar. See you at the top.</P>

      <P root={scrollRef} className="mt-10 font-display text-[1.05rem] italic leading-relaxed text-[#2b2417]">
        — From your friend who believes in you more than you know,
        <br />
        <span className="mt-2 inline-block text-[1.6rem] font-bold not-italic tracking-[0.14em]">ABDULLAH</span>
      </P>
    </div>
  );
}

export default function Letter() {
  const root = useRef<HTMLElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<SVGCircleElement>(null);
  const prog = useRef({ p: 0 });
  const hold = useRef({ active: false, start: 0, x: 0, y: 0, raf: 0 });
  const [holding, setHolding] = useState(false);
  const [opened, setOpened] = useState(false);
  const [overlay, setOverlay] = useState(false);
  const [closing, setClosing] = useState(false);
  const openTimer = useRef(0);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => setupSection(root.current!), root);
    return () => ctx.revert();
  }, []);

  const paintRing = useCallback(() => {
    if (ringRef.current) ringRef.current.style.strokeDashoffset = String(RING_C * (1 - prog.current.p));
  }, []);

  const cancelHold = useCallback(() => {
    const h = hold.current;
    if (!h.active) return;
    h.active = false;
    cancelAnimationFrame(h.raf);
    setHolding(false);
    gsap.to(prog.current, { p: 0, duration: 0.45, ease: "power2.out", onUpdate: paintRing });
  }, [paintRing]);

  const complete = useCallback(() => {
    const h = hold.current;
    h.active = false;
    cancelAnimationFrame(h.raf);
    setHolding(false);
    gsap.killTweensOf(prog.current);
    prog.current.p = 1;
    paintRing();
    vibrate(30);
    setOpened(true);
    window.clearTimeout(openTimer.current);
    openTimer.current = window.setTimeout(() => setOverlay(true), 1500);
  }, [paintRing]);

  const tick = useCallback(() => {
    const h = hold.current;
    if (!h.active) return;
    const p = Math.min(1, (performance.now() - h.start) / HOLD_MS);
    prog.current.p = p;
    paintRing();
    if (p >= 1) complete();
    else h.raf = requestAnimationFrame(tick);
  }, [complete, paintRing]);

  const onDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (opened) return;
    e.preventDefault();
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
    const h = hold.current;
    gsap.killTweensOf(prog.current);
    h.active = true;
    h.start = performance.now();
    h.x = e.clientX;
    h.y = e.clientY;
    setHolding(true);
    h.raf = requestAnimationFrame(tick);
  };
  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const h = hold.current;
    if (h.active && Math.hypot(e.clientX - h.x, e.clientY - h.y) > 10) cancelHold();
  };

  const close = useCallback(() => {
    setClosing(true);
    window.setTimeout(() => {
      setOverlay(false);
      setClosing(false);
    }, 320);
  }, []);

  // lock page scroll while the letter is open; Escape closes
  useEffect(() => {
    if (!overlay) return;
    const html = document.documentElement;
    const prev = html.style.overflow;
    html.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      html.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [overlay, close]);

  useEffect(
    () => () => {
      window.clearTimeout(openTimer.current);
      cancelAnimationFrame(hold.current.raf);
    },
    []
  );

  return (
    <section ref={root} id="letter" className="section">
      <SplitText as="h2" scroll text="One last thing. It's sealed." className="heading max-w-[20rem]" />
      <p className="subtext mt-4" data-reveal="">
        Press &amp; hold the golden seal until the ring fills. Some things are worth the wait.
      </p>

      <div className="mt-[clamp(150px,26vh,200px)] pb-10" data-reveal="">
        <div className={`env ${opened ? "open" : ""}`}>
          <div className="env-layer env-back" />

          {/* the letter inside the envelope */}
          <div
            className="env-paper-wrap"
            onClick={() => opened && !overlay && setOverlay(true)}
            role={opened ? "button" : undefined}
            tabIndex={opened ? 0 : -1}
            aria-label={opened ? "Read the letter" : undefined}
            onKeyDown={(e) => {
              if (opened && (e.key === "Enter" || e.key === " ")) setOverlay(true);
            }}
            style={{ cursor: opened ? "pointer" : "default", pointerEvents: opened ? "auto" : "none" }}
          >
            {!overlay && <motion.div layoutId="letter-paper" className="paper-mini" style={{ borderRadius: 6 }} transition={{ duration: 0.95, ease: LUX }} />}
          </div>

          <div className="env-pocket-l" />
          <div className="env-pocket-r" />
          <div className="env-pocket-b" />
          <svg className="env-edge" viewBox="0 0 300 200" preserveAspectRatio="none" aria-hidden="true">
            <path d="M0 0 L150 112 L300 0 M0 200 L150 88 L300 200" fill="none" stroke="rgba(212,175,55,.35)" strokeWidth="1" vectorEffect="non-scaling-stroke" />
          </svg>

          <div className="env-flap">
            <div className="env-flap-face env-flap-front" />
            <div className="env-flap-face env-flap-back" />
            <svg className="absolute inset-0 h-full w-full" viewBox="0 0 300 112" preserveAspectRatio="none" aria-hidden="true" style={{ backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden" }}>
              <path d="M0 0 L150 112 L300 0" fill="none" stroke="rgba(212,175,55,.55)" strokeWidth="1.2" vectorEffect="non-scaling-stroke" />
            </svg>
          </div>

          <div className="env-seal-wrap">
            <svg viewBox="0 0 100 100" className="pointer-events-none absolute inset-0 h-full w-full -rotate-90" aria-hidden="true">
              <circle cx="50" cy="50" r={RING_R} fill="none" stroke="rgba(247,243,232,.14)" strokeWidth="2.5" />
              <circle
                ref={ringRef}
                cx="50"
                cy="50"
                r={RING_R}
                fill="none"
                stroke="#fff1b0"
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray={RING_C}
                strokeDashoffset={RING_C}
                style={{ filter: "drop-shadow(0 0 5px rgba(245,215,110,.9))" }}
              />
            </svg>
            <div
              className="absolute inset-[13px] transition-transform duration-500"
              style={{
                transform: holding ? "scale(0.93)" : "scale(1)",
                filter: holding ? "drop-shadow(0 0 16px rgba(245,215,110,.8))" : "drop-shadow(0 4px 10px rgba(0,0,0,.5))",
                transitionTimingFunction: "cubic-bezier(.22,1,.36,1)",
              }}
            >
              <Seal id="env" size="100%" />
            </div>
            <div
              className="hold-target"
              role="button"
              tabIndex={0}
              aria-label="Press and hold the golden seal"
              onPointerDown={onDown}
              onPointerMove={onMove}
              onPointerUp={cancelHold}
              onPointerCancel={cancelHold}
              onLostPointerCapture={cancelHold}
              onContextMenu={(e) => e.preventDefault()}
              onKeyDown={(e) => {
                if (!opened && (e.key === "Enter" || e.key === " ")) {
                  e.preventDefault();
                  complete();
                }
              }}
            />
          </div>
        </div>
      </div>

      {overlay &&
        createPortal(
          <>
            <motion.div
              className="fixed inset-0 z-[79]"
              style={{ background: "rgba(5,5,16,.9)" }}
              initial={{ opacity: 0 }}
              animate={{ opacity: closing ? 0 : 1 }}
              transition={{ duration: 0.6 }}
            />
            <motion.div
              layoutId="letter-paper"
              className="paper fixed inset-0 z-[80]"
              style={{ borderRadius: 0 }}
              transition={{ duration: 0.95, ease: LUX }}
            >
              <motion.div
                ref={scrollRef}
                className="letter-scroll h-full w-full"
                initial={{ opacity: 0 }}
                animate={{ opacity: closing ? 0 : 1 }}
                transition={{ duration: closing ? 0.25 : 0.9, delay: closing ? 0 : 0.75 }}
              >
                <LetterBody scrollRef={scrollRef} />
              </motion.div>
              <motion.button
                type="button"
                onClick={close}
                aria-label="Close letter"
                className="absolute z-10 flex h-12 w-12 items-center justify-center rounded-full text-[1.7rem] leading-none"
                style={{
                  top: "max(12px, env(safe-area-inset-top))",
                  right: "max(12px, env(safe-area-inset-right))",
                  background: "rgba(43,36,23,.08)",
                  border: "1px solid rgba(43,36,23,.25)",
                  color: "#2b2417",
                }}
                initial={{ opacity: 0 }}
                animate={{ opacity: closing ? 0 : 1 }}
                transition={{ duration: closing ? 0.2 : 0.7, delay: closing ? 0 : 0.9 }}
              >
                <span aria-hidden="true">×</span>
              </motion.button>
            </motion.div>
          </>,
          document.body
        )}
    </section>
  );
}
