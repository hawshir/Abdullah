import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { gsap } from "../lib/motion";
import { SplitText } from "../components/SplitText";
import { useInView, useRaf } from "../lib/hooks";

/* ───────── countdown ───────── */
function getCountdown() {
  const now = new Date();
  const y = now.getFullYear();
  if (now.getMonth() === 10 && now.getDate() === 30) return { day: true, d: 0, h: 0, m: 0, s: 0 };
  let target = new Date(y, 10, 30, 0, 0, 0);
  if (now.getTime() > target.getTime()) target = new Date(y + 1, 10, 30, 0, 0, 0);
  let diff = Math.max(0, Math.floor((target.getTime() - now.getTime()) / 1000));
  const d = Math.floor(diff / 86400);
  diff -= d * 86400;
  const h = Math.floor(diff / 3600);
  diff -= h * 3600;
  const m = Math.floor(diff / 60);
  const s = diff - m * 60;
  return { day: false, d, h, m, s };
}
const pad = (n: number) => String(n).padStart(2, "0");

function Countdown() {
  const [c, setC] = useState(getCountdown);
  useEffect(() => {
    const id = window.setInterval(() => setC(getCountdown()), 1000);
    return () => window.clearInterval(id);
  }, []);
  if (c.day) {
    return (
      <p className="text-center font-display text-[1.05rem] font-bold leading-snug tracking-[0.08em]">
        IT'S OFFICIALLY YOUR DAY, <span className="gold-shimmer">AREEBA</span> 👑
      </p>
    );
  }
  return (
    <p className="text-center text-[0.98rem] font-medium leading-loose text-[rgba(247,243,232,0.78)]">
      your day arrives in <span className="count-num">{c.d}</span> d <span className="count-num">{pad(c.h)}</span> h{" "}
      <span className="count-num">{pad(c.m)}</span> m <span className="count-num">{pad(c.s)}</span> s
    </p>
  );
}

/* ───────── orbiting sparkles around the 17 ───────── */
interface O {
  a: number;
  sp: number;
  k: number; // radius factor
  r: number;
  tw: number;
  ph: number;
  ivory: boolean;
}

function Orbit() {
  const cvs = useRef<HTMLCanvasElement>(null);
  const [wrap, inView] = useInView<HTMLDivElement>("100px");
  const dims = useRef({ w: 0, h: 0, dpr: 1 });
  const ps = useRef<O[]>([]);

  useEffect(() => {
    ps.current = Array.from({ length: 26 }, (_, i) => ({
      a: Math.random() * 6.28,
      sp: (0.12 + Math.random() * 0.25) * (i % 3 === 0 ? -1 : 1),
      k: 0.78 + Math.random() * 0.3,
      r: 0.7 + Math.random() * 1.4,
      tw: 1 + Math.random() * 2,
      ph: Math.random() * 6.28,
      ivory: i % 4 === 0,
    }));
    const size = () => {
      const c = cvs.current;
      const p = wrap.current;
      if (!c || !p) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = p.clientWidth;
      const h = p.clientHeight;
      dims.current = { w, h, dpr };
      c.width = Math.round(w * dpr);
      c.height = Math.round(h * dpr);
    };
    size();
    window.addEventListener("resize", size);
    return () => window.removeEventListener("resize", size);
  }, [wrap]);

  useRaf((dt, t) => {
    const c = cvs.current;
    const ctx = c?.getContext("2d");
    if (!c || !ctx) return;
    const { w, h, dpr } = dims.current;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    const cx = w / 2;
    const cy = h / 2;
    const rx = w * 0.46;
    const ry = h * 0.4;
    const tilt = -0.28;
    const ct = Math.cos(tilt);
    const st = Math.sin(tilt);
    for (const p of ps.current) {
      p.a += p.sp * dt;
      const ex = Math.cos(p.a) * rx * p.k;
      const ey = Math.sin(p.a) * ry * p.k;
      const x = cx + ex * ct - ey * st;
      const y = cy + ex * st + ey * ct;
      const al = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(t * p.tw + p.ph));
      ctx.globalAlpha = al;
      ctx.fillStyle = p.ivory ? "#f7f3e8" : "#f5d76e";
      ctx.beginPath();
      ctx.arc(x, y, p.r, 0, 6.2832);
      ctx.fill();
      if (p.r > 1.3) {
        const l = p.r * 3.4;
        ctx.fillRect(x - l, y - 0.35, l * 2, 0.7);
        ctx.fillRect(x - 0.35, y - l, 0.7, l * 2);
      }
    }
    ctx.globalAlpha = 1;
  }, inView);

  return (
    <div ref={wrap} className="pointer-events-none absolute left-1/2 top-1/2 h-[135%] w-[min(100vw,380px)] -translate-x-1/2 -translate-y-1/2">
      <canvas ref={cvs} className="h-full w-full" aria-hidden="true" />
    </div>
  );
}

/* ───────── hero ───────── */
export default function Hero({ revealed }: { revealed: boolean }) {
  const root = useRef<HTMLElement>(null);
  const tl = useRef<gsap.core.Timeline | null>(null);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const t = gsap.timeline({ paused: true });
      t.from(".h-small .ch", { opacity: 0, y: 16, filter: "blur(8px)", duration: 1.1, ease: "lux", stagger: 0.04, clearProps: "filter" }, 0)
        .from(".h-happy .ch", { opacity: 0, y: 44, filter: "blur(12px)", duration: 1.3, ease: "lux", stagger: 0.04, clearProps: "filter" }, 0.5)
        .from(".h-name .ch", { opacity: 0, y: 60, filter: "blur(14px)", duration: 1.5, ease: "lux", stagger: 0.07, clearProps: "filter" }, 1.1)
        .from(".h-seventeen", { opacity: 0, scale: 0.86, filter: "blur(16px)", duration: 2, ease: "lux", clearProps: "filter" }, 1.8)
        .from(".h-count", { opacity: 0, y: 22, duration: 1.3, ease: "lux" }, 2.6)
        .from(".h-cue", { opacity: 0, duration: 1.4, ease: "power1.out" }, 3.3);
      tl.current = t;

      gsap.to(".h-parallax", {
        y: -90,
        opacity: 0.15,
        ease: "none",
        scrollTrigger: { trigger: root.current, start: "top top", end: "bottom top", scrub: true },
      });
    }, root);
    return () => ctx.revert();
  }, []);

  useEffect(() => {
    if (revealed) tl.current?.play();
  }, [revealed]);

  return (
    <section ref={root} id="hero" className="section !justify-center !pb-[14vh] !pt-[9vh] text-center">
      <div className="h-parallax flex w-full flex-col items-center">
        <SplitText
          as="p"
          text="30 · 11 · 2007 — the day the world got lucky"
          className="h-small max-w-[20rem] text-[0.82rem] font-semibold uppercase leading-relaxed tracking-[0.2em] text-[rgba(247,243,232,0.7)]"
        />

        <SplitText
          as="h1"
          text="HAPPY BIRTHDAY"
          className="h-happy mt-6 font-display font-black leading-[1.08] text-[#f7f3e8]"
          style={{ fontSize: "clamp(2.4rem, 12vw, 5.2rem)", letterSpacing: "0.07em", paddingLeft: "0.07em" }}
        />
        <SplitText
          as="div"
          text="AREEBA"
          charClass="gold-shimmer"
          shimmer
          className="h-name mt-1 font-display font-black leading-[1.08]"
          style={{ fontSize: "clamp(3.2rem, 17.5vw, 8rem)", letterSpacing: "0.05em", paddingLeft: "0.05em" }}
        />

        <div
          className="relative mt-5 flex h-[clamp(150px,44vw,230px)] w-full items-center justify-center"
          style={{ filter: "drop-shadow(0 0 28px rgba(245,215,110,.28))" }}
        >
          <Orbit />
          <div
            className="h-seventeen gold-shimmer relative select-none font-display font-black leading-none"
            style={{ fontSize: "clamp(8rem, 44vw, 14rem)", letterSpacing: "0.02em" }}
            aria-label="17"
          >
            17
          </div>
        </div>

        <div className="h-count mt-6">
          <Countdown />
        </div>
      </div>

      <div className="h-cue float-cue absolute bottom-[max(28px,5vh)] left-0 right-0 text-center text-[0.85rem] font-semibold tracking-[0.14em] text-[rgba(247,243,232,0.7)]">
        ↓ scroll for your surprises
      </div>
    </section>
  );
}
