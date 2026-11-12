import { useCallback, useEffect, useRef, useState } from "react";
import WaxSeal from "./WaxSeal";
import { GOLD_CONFETTI } from "../lib/device";

const CODE = "2007";
const MESSAGES = [
  "Nice try 🙃",
  "Not even close. When does the world's favorite person celebrate?",
  "One year changed everything. Think. 😉",
];
const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "⌫"];

type Props = {
  /** Called synchronously inside the final correct tap (music + vibrate). */
  onUnlockTap: () => void;
  /** Called at the flash peak — mount the experience underneath. */
  onReveal: () => void;
  /** Called once the gate has fully faded. */
  onDone: () => void;
};

const warm = () => {
  void import("../lib/gsap");
  void import("canvas-confetti");
};

export default function Gate({ onUnlockTap, onReveal, onDone }: Props) {
  const [code, setCode] = useState("");
  const [err, setErr] = useState(false);
  const [msg, setMsg] = useState("");
  const codeRef = useRef("");
  const lock = useRef(false);
  const wrongCount = useRef(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const sealRef = useRef<HTMLDivElement>(null);
  const crackRef = useRef<SVGPathElement>(null);
  const flashRef = useRef<HTMLDivElement>(null);
  const shakeRef = useRef<HTMLDivElement>(null);

  const fail = useCallback(() => {
    const m = MESSAGES[wrongCount.current % MESSAGES.length];
    wrongCount.current += 1;
    setMsg(m);
    setErr(true);
    import("../lib/gsap")
      .then(({ gsap }) => {
        const el = shakeRef.current;
        if (!el) return;
        gsap
          .timeline({ onComplete: () => gsap.set(el, { clearProps: "transform" }) })
          .to(el, { x: -10, duration: 0.05 })
          .to(el, { x: 10, duration: 0.08 })
          .to(el, { x: -10, duration: 0.08 })
          .to(el, { x: 10, duration: 0.08 })
          .to(el, { x: -5, duration: 0.06 })
          .to(el, { x: 0, duration: 0.05 });
      })
      .catch(() => {});
    window.setTimeout(() => {
      codeRef.current = "";
      setCode("");
      setErr(false);
      lock.current = false;
    }, 700);
  }, []);

  const success = useCallback(async () => {
    onUnlockTap(); // music + vibrate fire on this exact tap
    setMsg("");
    try {
      const [{ gsap }, confMod] = await Promise.all([import("../lib/gsap"), import("canvas-confetti")]);
      const confetti = confMod.default;
      const seal = sealRef.current;
      const r = seal?.getBoundingClientRect();
      const origin = r
        ? { x: (r.left + r.width / 2) / window.innerWidth, y: (r.top + r.height / 2) / window.innerHeight }
        : { x: 0.5, y: 0.4 };
      const fire = (ratio: number, opts: Record<string, unknown>) =>
        confetti({
          origin,
          colors: GOLD_CONFETTI,
          zIndex: 200,
          disableForReducedMotion: true,
          particleCount: Math.floor(160 * ratio),
          ...opts,
        });
      fire(0.25, { spread: 26, startVelocity: 55 });
      fire(0.2, { spread: 60 });
      fire(0.35, { spread: 100, decay: 0.91, scalar: 0.9 });
      fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
      fire(0.1, { spread: 120, startVelocity: 45 });

      gsap
        .timeline()
        .to(seal, { scale: 1.15, duration: 0.45, ease: "power2.out" }, 0)
        .to(crackRef.current, { opacity: 1, strokeDashoffset: 0, duration: 0.4, ease: "power1.out" }, 0.05)
        .fromTo(flashRef.current, { opacity: 0 }, { opacity: 1, duration: 0.3, ease: "power2.in" }, 0.4)
        .add(() => onReveal(), 0.75)
        .to(flashRef.current, { opacity: 0, duration: 1.1, ease: "power2.out" }, 0.8)
        .to(rootRef.current, { opacity: 0, duration: 1.2, ease: "power1.inOut" }, 1.0)
        .add(() => onDone(), 2.3);
    } catch {
      onReveal();
      window.setTimeout(onDone, 600);
    }
  }, [onUnlockTap, onReveal, onDone]);

  const press = useCallback(
    (k: string) => {
      if (lock.current || k === "") return;
      if (k === "⌫") {
        codeRef.current = codeRef.current.slice(0, -1);
        setCode(codeRef.current);
        return;
      }
      if (codeRef.current.length >= 4) return;
      codeRef.current += k;
      setCode(codeRef.current);
      if (codeRef.current.length >= 2) warm();
      if (codeRef.current.length === 4) {
        lock.current = true;
        if (codeRef.current === CODE) void success();
        else fail();
      }
    },
    [fail, success],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (/^\d$/.test(e.key)) press(e.key);
      else if (e.key === "Backspace") press("⌫");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [press]);

  return (
    <div ref={rootRef} className="fixed inset-0 z-[100] overflow-y-auto overscroll-contain">
      <div className="mx-auto flex min-h-[100svh] w-full max-w-sm flex-col items-center justify-center px-6 py-6 text-center">
        {/* seal */}
        <div ref={sealRef} className="relative mb-5 h-[92px] w-[92px] max-[700px]:mb-3 max-[700px]:h-[80px] max-[700px]:w-[80px]">
          <div
            aria-hidden="true"
            className="absolute -inset-7 rounded-full"
            style={{
              background: "radial-gradient(closest-side, rgba(245,215,110,.45), transparent 72%)",
              animation: "seal-pulse 3.4s ease-in-out infinite",
            }}
          />
          <WaxSeal size={92} crackRef={crackRef} className="relative h-full w-full drop-shadow-[0_0_18px_rgba(245,215,110,.5)]" />
        </div>

        <h1 className="font-display text-[clamp(1.3rem,6.2vw,1.8rem)] font-bold uppercase leading-snug tracking-[0.14em] text-ivory">
          FOR AREEBA'S EYES ONLY
        </h1>
        <p className="mt-3 max-w-[19rem] text-[14.5px] leading-relaxed text-ivory/70">
          This page is sealed. It only opens for one person in the whole world.
        </p>

        {/* slots */}
        <div ref={shakeRef} className="mt-6 w-full max-[700px]:mt-4">
          <div className="flex justify-center gap-3" role="group" aria-label="4 digit code">
            {[0, 1, 2, 3].map((i) => {
              const filled = i < code.length;
              const active = i === code.length && !lock.current;
              return (
                <div
                  key={i}
                  className="flex h-[62px] w-[52px] items-center justify-center rounded-2xl border text-2xl text-gold transition-colors duration-300 max-[700px]:h-[54px]"
                  style={{
                    borderColor: err ? "rgba(255,110,110,.6)" : active ? "rgba(245,215,110,.8)" : "rgba(212,175,55,.35)",
                    background: err ? "rgba(255,80,80,.25)" : "rgba(255,255,255,.04)",
                  }}
                >
                  {filled ? (
                    <span className="h-3 w-3 rounded-full bg-gold shadow-[0_0_12px_rgba(245,215,110,.9)]" />
                  ) : active ? (
                    <span className="h-5 w-px bg-gold" style={{ animation: "caret 1.1s ease-in-out infinite" }} />
                  ) : null}
                </div>
              );
            })}
          </div>
          <p
            aria-live="polite"
            className="mx-auto mt-3 flex min-h-[3rem] max-w-[18.5rem] items-center justify-center text-[14px] italic leading-snug text-gold"
          >
            {msg}
          </p>
        </div>

        {/* keypad */}
        <div className="grid w-full max-w-[290px] grid-cols-3 gap-3 max-[700px]:gap-2">
          {KEYS.map((k, i) =>
            k === "" ? (
              <span key={i} aria-hidden="true" />
            ) : (
              <button
                key={i}
                type="button"
                aria-label={k === "⌫" ? "Backspace" : k}
                onClick={() => press(k)}
                className="no-select h-[58px] rounded-2xl border border-[rgba(212,175,55,.35)] bg-white/[.04] text-[1.55rem] font-medium text-ivory backdrop-blur-[12px] transition-[transform,background-color] duration-200 active:scale-95 active:bg-[rgba(245,215,110,.22)] max-[700px]:h-[52px]"
              >
                {k}
              </button>
            ),
          )}
        </div>

        <p className="mt-5 text-[13.5px] tracking-wide text-ivory/60 max-[700px]:mt-3">Hint: the year it all began ✨</p>
      </div>

      <div
        ref={flashRef}
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 opacity-0"
        style={{
          background:
            "radial-gradient(circle at 50% 30%, #fffdf0 0%, #fff3c4 38%, rgba(245,215,110,.85) 100%)",
        }}
      />
    </div>
  );
}
