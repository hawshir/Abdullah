import { useCallback, useEffect, useRef, useState } from "react";
import WaxSeal from "./WaxSeal";
import { startMusic } from "../lib/music";
import { vib } from "../lib/device";
import { loadExperience, loadFx, loadGsapCore } from "../lib/loaders";

const CODE = "2007";
const MSGS = [
  "Nice try 🙃",
  "Not even close. When does the world's favorite person celebrate?",
  "One year changed everything. Think. 😉",
];

export default function Gate({ onUnlock, onDone }: { onUnlock: () => void; onDone: () => void }) {
  const [code, setCode] = useState("");
  const [msg, setMsg] = useState("");
  const [flash, setFlash] = useState(false);
  const codeRef = useRef("");
  const locked = useRef(false);
  const wrongCount = useRef(0);
  const root = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLDivElement>(null);
  const shakeEl = useRef<HTMLDivElement>(null);
  const sealEl = useRef<HTMLDivElement>(null);
  const flashEl = useRef<HTMLDivElement>(null);

  // warm up heavy code after first paint (idle), so screen 1 paints instantly
  useEffect(() => {
    const warm = () => {
      loadGsapCore().catch(() => {});
      loadFx().catch(() => {});
      loadExperience().catch(() => {});
    };
    const w = window as unknown as { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number };
    const id = w.requestIdleCallback ? w.requestIdleCallback(warm, { timeout: 1500 }) : window.setTimeout(warm, 700);
    return () => {
      if (!w.requestIdleCallback) window.clearTimeout(id);
    };
  }, []);

  const wrong = useCallback(async () => {
    locked.current = true;
    wrongCount.current += 1;
    setMsg(MSGS[(wrongCount.current - 1) % MSGS.length]);
    setFlash(true);
    try {
      const { gsap } = await loadGsapCore();
      const el = shakeEl.current;
      if (el) {
        const tl = gsap.timeline();
        [-10, 10, -8, 8, -4, 4, 0].forEach((x) => tl.to(el, { x, duration: 0.4 / 7, ease: "none" }));
      }
    } catch {
      /* ignore */
    }
    window.setTimeout(() => {
      codeRef.current = "";
      setCode("");
      setFlash(false);
      locked.current = false;
    }, 520);
  }, []);

  const success = useCallback(() => {
    locked.current = true;
    // music + vibration fire on THIS exact tap (synchronously inside the gesture)
    startMusic();
    vib(30);
    const fallback = window.setTimeout(() => {
      onUnlock();
      window.setTimeout(onDone, 1200);
    }, 1500);
    Promise.all([loadGsapCore(), loadFx(), loadExperience()])
      .then(([g, fx]) => {
        window.clearTimeout(fallback);
        const { gsap } = g;
        const r = sealEl.current?.getBoundingClientRect();
        const oy = r ? (r.top + r.height / 2) / window.innerHeight : 0.35;
        fx.unlockBurst(0.5, oy);
        const crack = root.current?.querySelector(".seal-crack");
        const tl = gsap.timeline();
        tl.to(sealEl.current, { scale: 1.15, duration: 0.45, ease: "power2.out" }, 0);
        if (crack) tl.to(crack, { strokeDashoffset: 0, duration: 0.35, ease: "power2.out" }, 0);
        tl.fromTo(flashEl.current, { opacity: 0 }, { opacity: 1, duration: 0.16, ease: "power1.out" }, 0.05)
          .to(flashEl.current, { opacity: 0, duration: 0.95, ease: "power2.out" }, 0.22)
          .to(sealEl.current, { scale: 1.7, opacity: 0, duration: 0.9, ease: "power2.in" }, 0.45)
          .to(inner.current, { opacity: 0, y: -14, duration: 0.8, ease: "power2.in" }, 0.3)
          .call(onUnlock, [], 0.7)
          .to(root.current, { opacity: 0, duration: 1.1, ease: "power1.inOut" }, 0.85)
          .call(onDone, [], 2.0);
      })
      .catch(() => {
        window.clearTimeout(fallback);
        onUnlock();
        window.setTimeout(onDone, 800);
      });
  }, [onUnlock, onDone]);

  const add = useCallback(
    (d: string) => {
      if (locked.current || codeRef.current.length >= 4) return;
      codeRef.current += d;
      setCode(codeRef.current);
      if (codeRef.current.length === 4) {
        if (codeRef.current === CODE) success();
        else wrong();
      }
    },
    [success, wrong]
  );

  const back = useCallback(() => {
    if (locked.current) return;
    codeRef.current = codeRef.current.slice(0, -1);
    setCode(codeRef.current);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (/^[0-9]$/.test(e.key)) add(e.key);
      else if (e.key === "Backspace") back();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [add, back]);

  const keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9"];

  return (
    <div ref={root} className="fixed inset-0 z-[80] overflow-y-auto no-select" style={{ overscrollBehavior: "contain" }}>
      <div ref={inner} className="min-h-full flex flex-col items-center justify-center px-6 py-8 text-center">
        <div ref={sealEl} className="relative mb-6" style={{ width: 96, height: 96 }}>
          <div className="seal-glow" />
          <div className="seal-wrap relative">
            <WaxSeal size={96} crack />
          </div>
        </div>

        <h1
          className="font-display font-black uppercase text-ivory"
          style={{ fontSize: "clamp(1.3rem,5.8vw,1.75rem)", letterSpacing: "0.16em", lineHeight: 1.3, textWrap: "balance", textShadow: "0 0 28px rgba(245,215,110,.25)" }}
        >
          FOR AREEBA'S EYES ONLY
        </h1>
        <p className="mt-3 max-w-[20rem] text-[0.98rem] leading-relaxed text-ivory/70 font-medium" style={{ textWrap: "balance" }}>
          This page is sealed. It only opens for one person in the whole world.
        </p>

        <div ref={shakeEl} className="mt-6 flex flex-col items-center">
          <div className="flex gap-3" aria-label="4 digit code">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className={`slot${code[i] ? " on" : ""}${i === code.length ? " cur" : ""}`}
                style={flash ? { background: "rgba(255,80,80,.25)", borderColor: "rgba(255,110,110,.7)" } : undefined}
              >
                {code[i] ?? ""}
              </div>
            ))}
          </div>
          <p
            key={msg}
            aria-live="polite"
            className="mt-3 flex items-center justify-center text-[0.95rem] font-semibold text-gold max-w-[19rem] leading-snug"
            style={{ minHeight: "2.9em", animation: msg ? "expin .6s var(--lux) both" : undefined }}
          >
            {msg}
          </p>
        </div>

        <div className="grid grid-cols-3 gap-2.5 mt-1" style={{ width: "min(76vw,290px)" }}>
          {keys.map((k) => (
            <button key={k} type="button" className="key" onClick={() => add(k)} aria-label={k}>
              {k}
            </button>
          ))}
          <span aria-hidden="true" />
          <button type="button" className="key" onClick={() => add("0")} aria-label="0">
            0
          </button>
          <button type="button" className="key ghost" onClick={back} aria-label="Backspace">
            ⌫
          </button>
        </div>

        <p className="mt-5 text-[0.88rem] text-ivory/55 font-medium tracking-wide">Hint: the year it all began ✨</p>
      </div>

      {/* white-gold flash for the seal crack */}
      <div
        ref={flashEl}
        aria-hidden="true"
        className="pointer-events-none fixed inset-0"
        style={{
          opacity: 0,
          background: "radial-gradient(circle at 50% 30%, #ffffff 0%, #fff1bf 28%, rgba(245,215,110,.55) 55%, rgba(245,215,110,0) 80%)",
        }}
      />
    </div>
  );
}
