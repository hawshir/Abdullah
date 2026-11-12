import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import SplitText from "./SplitText";
import { gsap } from "../lib/gsap";

function getCountdown(now: Date) {
  if (now.getMonth() === 10 && now.getDate() === 30) return null; // the day itself
  const year = now.getMonth() > 10 ? now.getFullYear() + 1 : now.getFullYear();
  const target = new Date(year, 10, 30, 0, 0, 0, 0);
  let diff = Math.max(0, target.getTime() - now.getTime());
  const s = Math.floor(diff / 1000);
  diff = s;
  return {
    d: Math.floor(diff / 86400),
    h: Math.floor((diff % 86400) / 3600),
    m: Math.floor((diff % 3600) / 60),
    s: diff % 60,
  };
}

const pad = (n: number) => String(n).padStart(2, "0");

function Countdown() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(t);
  }, []);
  const c = getCountdown(now);

  if (!c) {
    return (
      <p className="font-display text-[clamp(1.15rem,5.4vw,1.7rem)] font-bold leading-snug tracking-[0.1em] text-gold">
        IT'S OFFICIALLY YOUR DAY, AREEBA 👑
      </p>
    );
  }
  const num = "mx-0.5 inline-block min-w-[1.4ch] font-bold tabular-nums text-gold";
  return (
    <p className="text-[15px] leading-loose tracking-wide text-ivory/80">
      your day arrives in <span className={num}>{c.d}</span> d <span className={num}>{pad(c.h)}</span> h{" "}
      <span className={num}>{pad(c.m)}</span> m <span className={num}>{pad(c.s)}</span> s
    </p>
  );
}

function Orbit() {
  const rings = useMemo(
    () => [
      { inset: "0%", dur: 34, rev: false, count: 5, size: 9 },
      { inset: "12%", dur: 26, rev: true, count: 4, size: 7 },
      { inset: "24%", dur: 19, rev: false, count: 3, size: 6 },
    ],
    [],
  );
  return (
    <>
      {rings.map((r, ri) => (
        <div
          key={ri}
          aria-hidden="true"
          className="absolute"
          style={{
            inset: r.inset,
            animation: `orbit ${r.dur}s linear infinite${r.rev ? " reverse" : ""}`,
            willChange: "transform",
          }}
        >
          {Array.from({ length: r.count }).map((_, i) => (
            <span key={i} className="absolute inset-0" style={{ transform: `rotate(${(360 / r.count) * i + ri * 23}deg)` }}>
              <i
                className="absolute left-1/2 top-0 block bg-gold"
                style={
                  {
                    width: r.size,
                    height: r.size,
                    marginLeft: -r.size / 2,
                    marginTop: -r.size / 2,
                    clipPath: "polygon(50% 0,62% 38%,100% 50%,62% 62%,50% 100%,38% 62%,0 50%,38% 38%)",
                    filter: "drop-shadow(0 0 4px rgba(245,215,110,.9))",
                    animation: `twinkle ${2.2 + i * 0.6}s ease-in-out infinite`,
                    animationDelay: `${-(i * 0.7 + ri * 0.4)}s`,
                  } as CSSProperties
                }
              />
            </span>
          ))}
        </div>
      ))}
    </>
  );
}

export default function Hero() {
  const root = useRef<HTMLElement>(null);
  const inner = useRef<HTMLDivElement>(null);
  const nineteen = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const ctx = gsap.context(() => {
      // intro choreography (letters are driven by SplitText)
      gsap.fromTo(
        ".hero-fade",
        { opacity: 0, y: 24 },
        { opacity: 1, y: 0, duration: 1.8, ease: "lux", stagger: 0.25, delay: 2.5 },
      );
      gsap.fromTo(
        nineteen.current,
        { opacity: 0, scale: 0.86 },
        { opacity: 1, scale: 1, duration: 2.2, ease: "lux", delay: 2.0 },
      );
      // parallax on scroll
      gsap.to(inner.current, {
        yPercent: -9,
        opacity: 0.15,
        ease: "none",
        scrollTrigger: { trigger: el, start: "top top", end: "bottom top", scrub: true },
      });
      gsap.to(nineteen.current, {
        y: -50,
        ease: "none",
        scrollTrigger: { trigger: el, start: "top top", end: "bottom top", scrub: true },
      });
    }, el);
    return () => ctx.revert();
  }, []);

  return (
    <section id="hero" ref={root} className="flex flex-col items-center justify-center px-5 pb-24 pt-20 text-center">
      <div ref={inner} className="flex w-full max-w-xl flex-col items-center">
        <SplitText
          as="p"
          reveal="mount"
          delay={0.9}
          stagger={0.04}
          text="30 · 11 · 2007 — the day the world got lucky"
          className="max-w-[20rem] text-[13px] leading-relaxed tracking-[0.16em] text-ivory/75"
        />

        <SplitText
          as="h1"
          reveal="mount"
          delay={1.4}
          text="HAPPY BIRTHDAY"
          className="mt-6 font-display text-[clamp(2.2rem,11.6vw,5rem)] font-black leading-[1.05] tracking-[0.1em] text-ivory"
        />
        <div className="gold-glow mt-1">
          <SplitText
            as="p"
            gold
            reveal="mount"
            delay={1.9}
            text="AREEBA"
            className="font-display text-[clamp(3rem,16vw,8rem)] font-black leading-[1.05] tracking-[0.08em]"
          />
        </div>

        <div ref={nineteen} className="relative mt-8 flex aspect-square w-[min(78vw,330px)] items-center justify-center opacity-0">
          <Orbit />
          <span
            aria-hidden="true"
            className="absolute h-[55%] w-[55%] rounded-full"
            style={{ background: "radial-gradient(closest-side, rgba(245,215,110,.22), transparent 72%)" }}
          />
          <div className="gold-glow relative font-display text-[clamp(6.5rem,36vw,13rem)] font-black italic leading-none">
            <span className="gold-text" aria-label="19" style={{ "--i": 3 } as CSSProperties}>
              19
            </span>
          </div>
        </div>

        <div className="hero-fade mt-4 min-h-[3.5rem] opacity-0">
          <Countdown />
        </div>

        <p
          className="hero-fade mt-10 text-[13.5px] tracking-[0.18em] text-gold/90 opacity-0"
        >
          <span className="inline-block" style={{ animation: "float-y 2.8s ease-in-out infinite" }}>
            ↓ scroll for your surprises
          </span>
        </p>
      </div>
    </section>
  );
}
