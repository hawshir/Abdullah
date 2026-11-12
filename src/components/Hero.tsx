import { useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { gsap } from "../lib/gsap";
import Chars from "./Chars";

function useCountdown() {
  const calc = () => {
    const now = new Date();
    if (now.getMonth() === 10 && now.getDate() === 30) return null;
    let target = new Date(now.getFullYear(), 10, 30, 0, 0, 0, 0);
    if (target.getTime() <= now.getTime()) target = new Date(now.getFullYear() + 1, 10, 30, 0, 0, 0, 0);
    const s = Math.max(0, Math.floor((target.getTime() - now.getTime()) / 1000));
    return { d: Math.floor(s / 86400), h: Math.floor((s % 86400) / 3600), m: Math.floor((s % 3600) / 60), s: s % 60 };
  };
  const [v, setV] = useState(calc);
  useEffect(() => {
    const id = window.setInterval(() => setV(calc()), 1000);
    return () => window.clearInterval(id);
  }, []);
  return v;
}

const pad = (n: number) => String(n).padStart(2, "0");

function Orbit() {
  const dots = useMemo(() => {
    const mk = (n: number, r: number, size: number) =>
      Array.from({ length: n }, (_, i) => ({
        a: (i / n) * 360 + Math.random() * 14,
        r: r + (Math.random() - 0.5) * 14,
        s: size + Math.random() * 1.6,
        d: -Math.random() * 3,
      }));
    return { a: mk(9, 132, 2.6), b: mk(7, 168, 2) };
  }, []);
  const style = { transform: "rotate(-14deg) scaleY(0.52)" };
  return (
    <div aria-hidden="true" className="absolute inset-0 pointer-events-none" style={style}>
      <div className="orbit">
        {dots.a.map((d, i) => (
          <i key={i} className="orbit-dot" style={{ "--a": `${d.a}deg`, "--r": `${d.r}px`, "--s": `${d.s}px`, "--d": `${d.d}s` } as CSSProperties} />
        ))}
      </div>
      <div className="orbit rev">
        {dots.b.map((d, i) => (
          <i key={i} className="orbit-dot" style={{ "--a": `${d.a}deg`, "--r": `${d.r}px`, "--s": `${d.s}px`, "--d": `${d.d}s` } as CSSProperties} />
        ))}
      </div>
    </div>
  );
}

export default function Hero() {
  const root = useRef<HTMLElement>(null);
  const cd = useCountdown();

  useLayoutEffect(() => {
    const el = root.current;
    if (!el) return;
    const ctx = gsap.context(() => {
      const q = gsap.utils.selector(el);
      const from = { opacity: 0, y: "0.55em", filter: "blur(12px)" };
      const to = { opacity: 1, y: 0, filter: "blur(0px)", duration: 1.3, ease: "lux", stagger: 0.04, clearProps: "filter,transform" };
      gsap
        .timeline({ delay: 1.0 })
        .fromTo(q(".h-small .ch"), from, to)
        .fromTo(q(".h-big .ch"), from, to, "-=1.1")
        .fromTo(q(".h-name .ch"), from, to, "-=1.0")
        .fromTo(q(".h-19"), { opacity: 0, scale: 0.86, filter: "blur(14px)" }, { opacity: 1, scale: 1, filter: "blur(0px)", duration: 2, ease: "lux", clearProps: "filter,transform" }, "-=0.9")
        .fromTo(q(".h-count, .h-cue"), { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 1.3, ease: "lux", stagger: 0.25 }, "-=1.2");

      // gentle scroll parallax
      gsap.to(q(".h-content"), {
        y: -70,
        opacity: 0.05,
        ease: "none",
        scrollTrigger: { trigger: el, start: "top top", end: "bottom 15%", scrub: true },
      });
      gsap.to(q(".h-19w"), {
        y: -50,
        ease: "none",
        scrollTrigger: { trigger: el, start: "top top", end: "bottom top", scrub: true },
      });
    }, el);
    return () => ctx.revert();
  }, []);

  return (
    <section id="hero" ref={root} className="relative flex min-h-[100svh] flex-col items-center justify-center overflow-hidden px-5 pb-24 pt-16 text-center">
      <div className="h-content flex w-full flex-col items-center">
        <p
          className="h-small mb-6 max-w-[23rem] font-body text-[0.74rem] font-semibold leading-relaxed text-gold/85"
          style={{ letterSpacing: "0.1em" }}
          aria-label="30 · 11 · 2007 — the day the world got lucky"
        >
          <Chars text="30 · 11 · 2007 — the day the world got lucky" />
        </p>

        <h1 aria-label="HAPPY BIRTHDAY AREEBA" className="flex flex-col items-center">
          <span
            className="h-big block font-display font-black text-ivory"
            style={{ fontSize: "clamp(1.5rem,7.5vw,3.4rem)", letterSpacing: "0.1em", textShadow: "0 0 30px rgba(245,215,110,.25)" }}
          >
            <Chars text="HAPPY BIRTHDAY" />
          </span>
          <span className="h-name mt-1 block font-display font-black leading-[1.1]" style={{ fontSize: "clamp(3rem,16vw,6.6rem)", letterSpacing: "0.07em" }}>
            <Chars text="AREEBA" gold />
          </span>
        </h1>

        <div className="h-19w relative my-5 grid w-full place-items-center" style={{ height: "clamp(9rem,44vw,16rem)" }}>
          <Orbit />
          <div className="h-19 relative" style={{ opacity: 0 }}>
            <span className="gold-num block font-display font-bold leading-none" style={{ fontSize: "clamp(7.5rem,40vw,13rem)", letterSpacing: "-0.02em" }}>
              19
            </span>
          </div>
        </div>

        <div className="h-count mt-5 font-body font-semibold text-ivory/85" style={{ opacity: 0 }}>
          {cd ? (
            <p className="text-[0.98rem] leading-loose">
              your day arrives in{" "}
              <b className="font-bold tabular-nums text-gold">{cd.d}</b> d{" "}
              <b className="font-bold tabular-nums text-gold">{pad(cd.h)}</b> h{" "}
              <b className="font-bold tabular-nums text-gold">{pad(cd.m)}</b> m{" "}
              <b className="font-bold tabular-nums text-gold">{pad(cd.s)}</b> s
            </p>
          ) : (
            <p className="font-display text-[1.1rem] font-bold leading-snug text-gold" style={{ letterSpacing: "0.1em" }}>
              IT'S OFFICIALLY YOUR DAY, AREEBA 👑
            </p>
          )}
        </div>
      </div>

      <div className="h-cue absolute bottom-7 left-0 right-0 flex justify-center" style={{ opacity: 0 }}>
        <p className="cue text-[0.85rem] font-semibold text-ivory/70" style={{ letterSpacing: "0.12em" }}>
          ↓ scroll for your surprises
        </p>
      </div>
    </section>
  );
}
