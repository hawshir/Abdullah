import { useCallback, useEffect, useRef, useState } from "react";
import { Seal } from "./Seal";
import { SplitText } from "./SplitText";

const CODE = "2007";
const MSGS = [
  "Nice try 🙃",
  "Not even close. When does the world's favorite person celebrate?",
  "One year changed everything. Think. 😉",
];

interface Props {
  /** called synchronously inside the 4th-digit tap (music + vibrate + confetti live here) */
  onUnlock: () => void;
  onReveal: () => void;
  onDone: () => void;
  onWarm: () => void;
}

export default function Gate({ onUnlock, onReveal, onDone, onWarm }: Props) {
  const [code, setCode] = useState("");
  const [msg, setMsg] = useState("");
  const [bad, setBad] = useState(false);

  const codeRef = useRef("");
  const busy = useRef(false);
  const done = useRef(false);
  const fails = useRef(0);

  const rootRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const slotsRef = useRef<HTMLDivElement>(null);
  const sealRef = useRef<HTMLDivElement>(null);
  const flashRef = useRef<HTMLDivElement>(null);
  const crackRef = useRef<SVGPathElement>(null);

  const cb = useRef({ onUnlock, onReveal, onDone, onWarm });
  useEffect(() => {
    cb.current = { onUnlock, onReveal, onDone, onWarm };
  });

  const runOpen = useCallback(() => {
    import("gsap")
      .then(({ gsap }) => {
        const tl = gsap.timeline({ onComplete: () => cb.current.onDone() });
        tl.to(crackRef.current, { strokeDashoffset: 0, duration: 0.35, ease: "power2.out" }, 0)
          .to(sealRef.current, { scale: 1.15, duration: 0.5, ease: "power2.out" }, 0)
          .fromTo(flashRef.current, { opacity: 0 }, { opacity: 1, duration: 0.25, ease: "power1.out" }, 0.12)
          .add(() => cb.current.onReveal(), 0.5)
          .to(flashRef.current, { opacity: 0, duration: 0.9, ease: "power1.in" }, 0.5)
          .to(contentRef.current, { opacity: 0, scale: 1.05, duration: 0.9, ease: "power2.inOut" }, 0.45)
          .to(rootRef.current, { opacity: 0, duration: 1, ease: "power1.inOut" }, 0.7);
      })
      .catch(() => {
        cb.current.onReveal();
        cb.current.onDone();
      });
  }, []);

  const shake = useCallback(() => {
    import("gsap")
      .then(({ gsap }) => {
        gsap.to(slotsRef.current, {
          keyframes: { x: [0, -10, 10, -8, 8, -4, 4, 0], easeEach: "none" },
          duration: 0.4,
        });
      })
      .catch(() => {});
  }, []);

  const check = useCallback(
    (value: string) => {
      if (value === CODE) {
        if (done.current) return;
        done.current = true;
        cb.current.onUnlock(); // same tap: music + confetti + vibrate
        runOpen();
        return;
      }
      busy.current = true;
      fails.current += 1;
      setMsg(MSGS[(fails.current - 1) % MSGS.length]);
      setBad(true);
      shake();
      window.setTimeout(() => {
        setBad(false);
        codeRef.current = "";
        setCode("");
        busy.current = false;
      }, 520);
    },
    [runOpen, shake]
  );

  const press = useCallback(
    (d: string) => {
      if (done.current || busy.current) return;
      cb.current.onWarm();
      if (codeRef.current.length >= 4) return;
      const next = codeRef.current + d;
      codeRef.current = next;
      setCode(next);
      if (next.length === 4) check(next);
    },
    [check]
  );

  const back = useCallback(() => {
    if (done.current || busy.current) return;
    codeRef.current = codeRef.current.slice(0, -1);
    setCode(codeRef.current);
  }, []);

  // desktop keyboard support
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (/^[0-9]$/.test(e.key)) press(e.key);
      else if (e.key === "Backspace") back();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [press, back]);

  const keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9"];

  return (
    <div
      ref={rootRef}
      className="fixed inset-0 z-[70] overflow-y-auto overflow-x-hidden"
      style={{ overscrollBehavior: "contain" }}
    >
      <div
        ref={flashRef}
        className="pointer-events-none fixed inset-0 z-10 opacity-0"
        style={{
          background:
            "radial-gradient(circle at 50% 30%, rgba(255,251,230,.97), rgba(245,215,110,.6) 38%, rgba(245,215,110,0) 72%)",
        }}
      />
      <div
        ref={contentRef}
        className="mx-auto flex min-h-full w-full max-w-[420px] flex-col items-center justify-center px-6"
        style={{ paddingTop: "max(20px, env(safe-area-inset-top))", paddingBottom: "max(20px, env(safe-area-inset-bottom))" }}
      >
        <div ref={sealRef} className="relative" style={{ width: "clamp(84px, 13svh, 120px)", height: "clamp(84px, 13svh, 120px)" }}>
          <div className="gate-seal-glow" />
          <Seal id="gate" size="100%" className="seal-breathe relative">
            <path
              ref={crackRef}
              d="M52 8 L46 24 L56 34 L44 48 L55 60 L47 74 L53 92"
              fill="none"
              stroke="#fffbe6"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              pathLength={1}
              strokeDasharray={1}
              strokeDashoffset={1}
            />
          </Seal>
        </div>

        <h1
          className="mt-[clamp(14px,2.6svh,26px)] text-center font-display font-bold uppercase leading-[1.45]"
          style={{ fontSize: "clamp(1.1rem, 5.4vw, 1.5rem)", letterSpacing: "0.16em", paddingLeft: "0.16em" }}
        >
          FOR <SplitText text="AREEBA'S" shimmer charClass="gold-shimmer" /> EYES ONLY
        </h1>
        <p className="mt-3 max-w-[22rem] text-center text-[0.95rem] font-medium leading-relaxed text-[rgba(247,243,232,0.72)]">
          This page is sealed. It only opens for one person in the whole world.
        </p>

        <div ref={slotsRef} className="mt-[clamp(16px,3.2svh,30px)] flex gap-3" aria-label="Enter the 4 digit code">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className={`slot ${bad ? "bad" : ""} ${!bad && i === code.length ? "active" : ""}`}>
              {code[i] ? <span className="slot-dot" /> : null}
            </div>
          ))}
        </div>

        <p
          aria-live="polite"
          className="mt-3 flex min-h-[3.1rem] max-w-[20rem] items-center justify-center text-center text-[0.95rem] font-semibold leading-snug text-[#f5d76e]"
        >
          {msg}
        </p>

        <div className="mt-1 grid grid-cols-3 gap-x-[clamp(12px,3vw,18px)] gap-y-[clamp(8px,1.6svh,14px)]">
          {keys.map((k) => (
            <button key={k} type="button" className="key justify-self-center" onClick={() => press(k)} aria-label={k}>
              {k}
            </button>
          ))}
          <span />
          <button type="button" className="key justify-self-center" onClick={() => press("0")} aria-label="0">
            0
          </button>
          <button
            type="button"
            className="key justify-self-center !text-[1.2rem]"
            onClick={back}
            aria-label="Backspace"
          >
            ⌫
          </button>
        </div>

        <p className="mt-[clamp(14px,2.6svh,24px)] text-center text-[0.9rem] font-medium text-[rgba(247,243,232,0.6)]">
          Hint: the year it all began ✨
        </p>
      </div>
    </div>
  );
}
