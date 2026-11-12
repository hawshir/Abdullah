import { useEffect, useRef } from "react";
import { clamp } from "../lib/device";

type Star = { x: number; y: number; layer: 0 | 1; size: number; speed: number; ph: number; tw: number; base: number };

export default function Starfield() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let w = window.innerWidth;
    let h = window.innerHeight;
    let dpr = 1;
    let raf = 0;
    let last = 0;
    let t = 0;
    let running = false;

    const setSize = () => {
      w = window.innerWidth;
      h = window.innerHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    setSize();

    // glow sprite
    const sp = document.createElement("canvas");
    sp.width = sp.height = 64;
    const sc = sp.getContext("2d");
    if (sc) {
      const g = sc.createRadialGradient(32, 32, 0, 32, 32, 32);
      g.addColorStop(0, "rgba(255,246,207,1)");
      g.addColorStop(0.18, "rgba(245,215,110,.85)");
      g.addColorStop(0.5, "rgba(212,175,55,.22)");
      g.addColorStop(1, "rgba(212,175,55,0)");
      sc.fillStyle = g;
      sc.fillRect(0, 0, 64, 64);
    }

    const stars: Star[] = Array.from({ length: 60 }, (_, i) => {
      const layer: 0 | 1 = i < 36 ? 0 : 1;
      return {
        x: Math.random(),
        y: Math.random(),
        layer,
        size: layer ? 9 + Math.random() * 9 : 5 + Math.random() * 6,
        speed: layer ? 16 + Math.random() * 14 : 5 + Math.random() * 7,
        ph: Math.random() * Math.PI * 2,
        tw: 0.7 + Math.random() * 1.4,
        base: layer ? 0.8 : 0.5,
      };
    });

    // tilt parallax only when it needs no permission prompt
    let tx = 0, ty = 0, cx = 0, cy = 0;
    let orient = false;
    const onOrient = (e: DeviceOrientationEvent) => {
      if (e.gamma == null || e.beta == null) return;
      tx = clamp(e.gamma / 30, -1, 1) * 6;
      ty = clamp((e.beta - 45) / 30, -1, 1) * 6;
    };
    try {
      const DOE = (window as unknown as { DeviceOrientationEvent?: { requestPermission?: unknown } }).DeviceOrientationEvent;
      if (DOE && typeof DOE.requestPermission !== "function") {
        window.addEventListener("deviceorientation", onOrient, { passive: true });
        orient = true;
      }
    } catch {
      /* skip silently */
    }

    const frame = (now: number) => {
      if (!running) return;
      const dt = Math.min(0.05, (now - last) / 1000 || 0.016);
      last = now;
      t += dt;
      cx += (tx - cx) * 0.06;
      cy += (ty - cy) * 0.06;
      ctx.clearRect(0, 0, w, h);
      for (const s of stars) {
        s.y -= (s.speed * dt) / h;
        if (s.y < -0.03) {
          s.y = 1.03;
          s.x = Math.random();
        }
        const a = s.base * (0.45 + 0.55 * Math.sin(t * s.tw + s.ph));
        if (a < 0.03) continue;
        const k = s.layer ? 1 : 0.5;
        ctx.globalAlpha = a;
        ctx.drawImage(sp, s.x * w - s.size / 2 + cx * k, s.y * h - s.size / 2 + cy * k, s.size, s.size);
      }
      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(frame);
    };
    const start = () => {
      if (running) return;
      running = true;
      last = performance.now();
      raf = requestAnimationFrame(frame);
    };
    const stop = () => {
      running = false;
      cancelAnimationFrame(raf);
    };
    const onVis = () => (document.hidden ? stop() : start());
    let lastW = w;
    const onResize = () => {
      if (Math.abs(window.innerWidth - lastW) > 2 || Math.abs(window.innerHeight - h) > 160) {
        lastW = window.innerWidth;
        setSize();
      }
    };
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("resize", onResize);
    start();
    return () => {
      stop();
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("resize", onResize);
      if (orient) window.removeEventListener("deviceorientation", onOrient);
    };
  }, []);

  return <canvas ref={ref} aria-hidden="true" className="fixed inset-0 z-[1] pointer-events-none" style={{ width: "100%", height: "100%" }} />;
}
