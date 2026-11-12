import { useEffect, useRef } from "react";
import { clamp, svgUrl } from "../lib/device";

type Star = {
  x: number;
  y: number;
  r: number;
  speed: number;
  phase: number;
  tw: number;
  layer: 0 | 1;
};

function StarCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    let w = 0;
    let h = 0;
    let raf = 0;
    let last = performance.now();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let tx = 0;
    let ty = 0;
    let cx = 0;
    let cy = 0;

    const stars: Star[] = [];
    const resize = () => {
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();

    for (let i = 0; i < 60; i++) {
      const layer: 0 | 1 = i < 28 ? 0 : 1;
      stars.push({
        x: Math.random() * w,
        y: Math.random() * h,
        r: layer === 0 ? 0.5 + Math.random() * 0.6 : 1 + Math.random() * 1.1,
        speed: layer === 0 ? 4 + Math.random() * 5 : 10 + Math.random() * 12,
        phase: Math.random() * Math.PI * 2,
        tw: 0.6 + Math.random() * 1.6,
        layer,
      });
    }

    // Tilt parallax only where no permission prompt is needed
    const onOrient = (e: DeviceOrientationEvent) => {
      if (e.gamma == null || e.beta == null) return;
      tx = clamp(e.gamma / 28, -1, 1) * 6;
      ty = clamp((e.beta - 45) / 28, -1, 1) * 6;
    };
    let orientOn = false;
    try {
      const DOE = (window as unknown as { DeviceOrientationEvent?: { requestPermission?: unknown } })
        .DeviceOrientationEvent;
      if (DOE && typeof DOE.requestPermission !== "function") {
        window.addEventListener("deviceorientation", onOrient);
        orientOn = true;
      }
    } catch {
      /* skip silently */
    }

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      cx += (tx - cx) * 0.06;
      cy += (ty - cy) * 0.06;
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = "#f5d76e";
      const t = now / 1000;
      for (const s of stars) {
        s.y -= s.speed * dt;
        if (s.y < -8) {
          s.y = h + 8;
          s.x = Math.random() * w;
        }
        const k = s.layer === 0 ? 0.4 : 1;
        const a = 0.3 + 0.7 * (0.5 + 0.5 * Math.sin(t * s.tw + s.phase));
        const x = s.x + cx * k;
        const y = s.y + cy * k;
        ctx.globalAlpha = a * (s.layer === 0 ? 0.55 : 0.9);
        ctx.beginPath();
        ctx.arc(x, y, s.r, 0, 6.2832);
        ctx.fill();
        if (s.layer === 1) {
          ctx.globalAlpha = a * 0.16;
          ctx.beginPath();
          ctx.arc(x, y, s.r * 3, 0, 6.2832);
          ctx.fill();
        }
      }
      ctx.globalAlpha = 1;
    };
    raf = requestAnimationFrame(frame);

    let rt = 0;
    const onResize = () => {
      window.clearTimeout(rt);
      rt = window.setTimeout(resize, 150);
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      if (orientOn) window.removeEventListener("deviceorientation", onOrient);
    };
  }, []);

  return <canvas ref={ref} aria-hidden="true" className="pointer-events-none fixed inset-0 z-[1] h-full w-full" />;
}

export function Background() {
  return (
    <>
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
        style={{ background: "linear-gradient(180deg,#050510,#0b0b22 50%,#050510)" }}
      >
        <div
          className="absolute -left-[40%] -top-[20%] h-[120vmax] w-[120vmax] rounded-full"
          style={{
            background: "radial-gradient(closest-side, rgba(212,175,55,.12), transparent 70%)",
            animation: "drift-a 20s ease-in-out infinite alternate",
            willChange: "transform",
          }}
        />
        <div
          className="absolute -bottom-[30%] -right-[50%] h-[130vmax] w-[130vmax] rounded-full"
          style={{
            background: "radial-gradient(closest-side, rgba(90,80,220,.12), transparent 70%)",
            animation: "drift-b 24s ease-in-out infinite alternate",
            willChange: "transform",
          }}
        />
        <div
          className="absolute left-[10%] top-[35%] h-[90vmax] w-[90vmax] rounded-full"
          style={{
            background: "radial-gradient(closest-side, rgba(245,215,110,.08), transparent 70%)",
            animation: "drift-a 28s ease-in-out infinite alternate-reverse",
            willChange: "transform",
          }}
        />
      </div>
      <StarCanvas />
    </>
  );
}

const GRAIN = svgUrl(
  `<svg xmlns='http://www.w3.org/2000/svg' width='220' height='220'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 1 0'/></filter><rect width='100%' height='100%' filter='url(#n)'/></svg>`,
);

export function Grain() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[300]"
      style={{ backgroundImage: GRAIN, backgroundSize: "220px 220px", opacity: 0.04 }}
    />
  );
}
