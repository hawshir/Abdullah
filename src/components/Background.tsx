import { useEffect, useRef } from "react";
import { useRaf } from "../lib/hooks";

export function Background() {
  return (
    <div className="bg-night" aria-hidden="true">
      <div className="aurora a1" />
      <div className="aurora a2" />
      <div className="aurora a3" />
    </div>
  );
}

export function Grain() {
  return <div className="grain" aria-hidden="true" />;
}

interface P {
  x: number; // 0..1
  y: number; // 0..1
  r: number;
  speed: number; // px / s
  a: number;
  tw: number;
  ph: number;
  near: boolean;
}

const rand = (a: number, b: number) => a + Math.random() * (b - a);

/** ~60 gold motes drifting upward, two depth layers, optional tilt parallax. */
export function Starfield() {
  const ref = useRef<HTMLCanvasElement>(null);
  const st = useRef({
    w: 0,
    h: 0,
    dpr: 1,
    tx: 0,
    ty: 0,
    ox: 0,
    oy: 0,
    ps: [] as P[],
  });

  useEffect(() => {
    const s = st.current;
    const ps: P[] = [];
    for (let i = 0; i < 60; i++) {
      const near = i >= 36;
      ps.push({
        x: Math.random(),
        y: Math.random(),
        r: near ? rand(1.2, 2.3) : rand(0.5, 1.1),
        speed: near ? rand(14, 26) : rand(5, 11),
        a: near ? rand(0.55, 0.95) : rand(0.3, 0.6),
        tw: rand(0.8, 2.2),
        ph: rand(0, 6.28),
        near,
      });
    }
    s.ps = ps;

    const resize = () => {
      const c = ref.current;
      if (!c) return;
      s.dpr = Math.min(window.devicePixelRatio || 1, 2);
      s.w = window.innerWidth;
      s.h = window.innerHeight;
      c.width = Math.round(s.w * s.dpr);
      c.height = Math.round(s.h * s.dpr);
    };
    resize();
    window.addEventListener("resize", resize);

    // Tilt parallax ONLY where no permission prompt is needed
    let orient: ((e: DeviceOrientationEvent) => void) | null = null;
    try {
      const DOE = (window as unknown as { DeviceOrientationEvent?: { requestPermission?: unknown } })
        .DeviceOrientationEvent;
      if (DOE && typeof DOE.requestPermission !== "function") {
        orient = (e: DeviceOrientationEvent) => {
          if (e.gamma == null || e.beta == null) return;
          s.tx = Math.max(-1, Math.min(1, e.gamma / 30));
          s.ty = Math.max(-1, Math.min(1, (e.beta - 45) / 30));
        };
        window.addEventListener("deviceorientation", orient);
      }
    } catch {
      /* skip silently */
    }

    return () => {
      window.removeEventListener("resize", resize);
      if (orient) window.removeEventListener("deviceorientation", orient);
    };
  }, []);

  useRaf((dt, t) => {
    const c = ref.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    const s = st.current;
    const { w, h, dpr } = s;
    s.ox += (s.tx * 6 - s.ox) * Math.min(1, dt * 3);
    s.oy += (s.ty * 6 - s.oy) * Math.min(1, dt * 3);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "#f5d76e";
    for (const p of s.ps) {
      p.y -= (p.speed * dt) / h;
      if (p.y < -0.02) {
        p.y = 1.02;
        p.x = Math.random();
      }
      const k = p.near ? 1 : 0.5;
      const px = p.x * w + s.ox * k;
      const py = p.y * h + s.oy * k;
      const tw = 0.55 + 0.45 * Math.sin(t * p.tw + p.ph);
      ctx.globalAlpha = p.a * tw;
      ctx.beginPath();
      ctx.arc(px, py, p.r, 0, 6.2832);
      ctx.fill();
      if (p.near) {
        ctx.globalAlpha = p.a * tw * 0.14;
        ctx.beginPath();
        ctx.arc(px, py, p.r * 3.4, 0, 6.2832);
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
  });

  return <canvas ref={ref} className="starfield" aria-hidden="true" />;
}
