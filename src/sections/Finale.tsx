import { useCallback, useEffect, useLayoutEffect, useRef } from "react";
import { gsap, setupSection } from "../lib/motion";
import { SplitText } from "../components/SplitText";
import { useInView, useRaf } from "../lib/hooks";

interface Rocket {
  x: number;
  y: number;
  vx: number;
  vy: number;
  ty: number;
  color: string;
}
interface Spark {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
  size: number;
  color: string;
}

const PALETTES = [
  ["#f5d76e", "#fff1b0", "#d4af37"],
  ["#f7f3e8", "#ffffff", "#e9e2cf"],
  ["#f3e5c3", "#f7e7ce", "#e8cf94"],
  ["#f5d76e", "#f7f3e8", "#f3e5c3"],
];
const rand = (a: number, b: number) => a + Math.random() * (b - a);

export default function Finale() {
  const root = useRef<HTMLElement>(null);
  const cvs = useRef<HTMLCanvasElement>(null);
  const [wrap, inView] = useInView<HTMLDivElement>("0px");
  const dims = useRef({ w: 0, h: 0, dpr: 1 });
  const rockets = useRef<Rocket[]>([]);
  const sparks = useRef<Spark[]>([]);
  const acc = useRef(0.6);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => setupSection(root.current!), root);
    return () => ctx.revert();
  }, []);

  useEffect(() => {
    const size = () => {
      const c = cvs.current;
      const p = wrap.current;
      if (!c || !p) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      const w = p.clientWidth;
      const h = p.clientHeight;
      dims.current = { w, h, dpr };
      c.width = Math.round(w * dpr);
      c.height = Math.round(h * dpr);
    };
    size();
    window.addEventListener("resize", size);
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(size) : null;
    if (ro && wrap.current) ro.observe(wrap.current);
    return () => {
      window.removeEventListener("resize", size);
      ro?.disconnect();
    };
  }, [wrap]);

  const burst = useCallback((x: number, y: number) => {
    const pal = PALETTES[Math.floor(Math.random() * PALETTES.length)];
    const room = 420 - sparks.current.length;
    const n = Math.max(0, Math.min(room, Math.floor(rand(46, 72))));
    const ring = Math.random() < 0.3;
    const power = rand(110, 210);
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + (ring ? 0 : Math.random() * 0.4);
      const sp = ring ? power : power * (0.25 + Math.random() * 0.75);
      sparks.current.push({
        x,
        y,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp,
        life: 0,
        max: rand(1.1, 2),
        size: rand(1, 2.2),
        color: pal[Math.floor(Math.random() * pal.length)],
      });
    }
  }, []);

  const launch = useCallback(() => {
    const { w, h } = dims.current;
    if (!w) return;
    const x = rand(w * 0.15, w * 0.85);
    rockets.current.push({
      x,
      y: h + 10,
      vx: rand(-18, 18),
      vy: -rand(h * 0.75, h * 1.0),
      ty: rand(h * 0.14, h * 0.45),
      color: "#fff1b0",
    });
  }, []);

  useRaf((dt) => {
    const c = cvs.current;
    const ctx = c?.getContext("2d");
    if (!c || !ctx) return;
    const { w, h, dpr } = dims.current;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // fade the previous frame → glowing trails
    ctx.globalCompositeOperation = "destination-out";
    ctx.fillStyle = `rgba(0,0,0,${1 - Math.pow(0.0001, dt)})`;
    ctx.fillRect(0, 0, w, h);
    ctx.globalCompositeOperation = "lighter";

    acc.current += dt;
    if (acc.current >= 1.2) {
      acc.current = 0;
      launch();
    }

    const rk = rockets.current;
    for (let i = rk.length - 1; i >= 0; i--) {
      const r = rk[i];
      r.x += r.vx * dt;
      r.y += r.vy * dt;
      r.vy *= 1 - 0.35 * dt;
      ctx.fillStyle = r.color;
      ctx.globalAlpha = 0.95;
      ctx.beginPath();
      ctx.arc(r.x, r.y, 2, 0, 6.2832);
      ctx.fill();
      // tiny ember tail
      sparks.current.push({ x: r.x, y: r.y, vx: rand(-12, 12), vy: rand(10, 40), life: 0, max: 0.45, size: 1, color: "#f5d76e" });
      if (r.y <= r.ty || r.vy > -60) {
        burst(r.x, r.y);
        rk.splice(i, 1);
      }
    }

    const sp = sparks.current;
    const drag = Math.pow(0.45, dt);
    for (let i = sp.length - 1; i >= 0; i--) {
      const s = sp[i];
      s.life += dt;
      if (s.life >= s.max) {
        sp.splice(i, 1);
        continue;
      }
      s.vx *= drag;
      s.vy = s.vy * drag + 95 * dt;
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      const k = 1 - s.life / s.max;
      ctx.globalAlpha = k * k;
      ctx.fillStyle = s.color;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.size * (0.5 + k * 0.6), 0, 6.2832);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
  }, inView);

  const again = () => {
    gsap.to(window, { scrollTo: { y: "#hero", autoKill: true }, duration: 2.4, ease: "power3.inOut" });
  };

  return (
    <section ref={root} id="finale" className="section !justify-center !overflow-hidden !py-[12vh] text-center">
      <div ref={wrap} className="absolute inset-0">
        <canvas
          ref={cvs}
          className="h-full w-full"
          onClick={(e) => {
            const r = e.currentTarget.getBoundingClientRect();
            burst(e.clientX - r.left, e.clientY - r.top);
          }}
          aria-hidden="true"
        />
      </div>

      <div className="pointer-events-none relative z-[2] flex flex-col items-center">
        <p className="font-display text-[clamp(1.1rem,5vw,1.5rem)] italic leading-relaxed text-[rgba(247,243,232,0.82)]" data-reveal="">
          This whole page is just code and stardust.
        </p>

        <SplitText
          as="p"
          scroll
          text="YOU are the actual miracle."
          className="mt-6 font-display font-black leading-tight text-[#f7f3e8] glow-text"
          style={{ fontSize: "clamp(1.7rem, 8vw, 3rem)", letterSpacing: "0.05em" }}
        />

        <div className="mt-12" data-reveal="blur">
          <div className="glow-pulse flex flex-col items-center">
            <p className="glow-text font-display font-black leading-[1.15] text-[#f7f3e8]" style={{ fontSize: "clamp(2rem, 10vw, 3.8rem)" }}>
              Happy 17th Birthday,
            </p>
            <p className="font-display font-black leading-[1.15]" style={{ fontSize: "clamp(2.4rem, 12.5vw, 5rem)", letterSpacing: "0.05em" }}>
              <span className="gold-shimmer">AREEBA</span> <span aria-hidden="true">🤍</span>
            </p>
          </div>
        </div>

        <p className="mt-12 max-w-[19rem] text-[0.85rem] font-semibold leading-relaxed tracking-[0.1em] text-[rgba(247,243,232,0.7)]" data-reveal="">
          made with love, duas &amp; a little code — ABDULLAH
        </p>

        <div className="mt-8" data-reveal="">
          <button type="button" className="pill-btn pointer-events-auto" onClick={again}>
            ↺ experience it all again
          </button>
        </div>
      </div>
    </section>
  );
}
