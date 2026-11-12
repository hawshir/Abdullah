/** Hand-rolled 2D canvas fireworks. Gold / ivory / champagne. */
const PALETTE = ["#f5d76e", "#d4af37", "#f7f3e8", "#f1e0b0", "#fff1bf", "#e8c872"];

type Rocket = { x: number; y: number; vx: number; vy: number; ty: number; color: string };
type Part = {
  x: number; y: number; px: number; py: number;
  vx: number; vy: number; life: number; max: number;
  color: string; size: number; tw: number;
};

export function createFireworks(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return { start() {}, stop() {}, destroy() {} };

  let w = 0, h = 0, raf = 0, running = false, last = 0, nextLaunch = 0;
  const rockets: Rocket[] = [];
  const parts: Part[] = [];

  function resize() {
    const r = canvas.getBoundingClientRect();
    w = r.width;
    h = r.height;
    const dpr = Math.min(window.devicePixelRatio || 1, 1.75);
    canvas.width = Math.max(1, Math.round(w * dpr));
    canvas.height = Math.max(1, Math.round(h * dpr));
    ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function launch() {
    const x = w * (0.15 + Math.random() * 0.7);
    const ty = h * (0.16 + Math.random() * 0.3);
    const travel = h - ty;
    rockets.push({
      x, y: h + 6,
      vx: (Math.random() - 0.5) * 24,
      vy: -(travel / (1.05 + Math.random() * 0.25)),
      ty,
      color: PALETTE[(Math.random() * PALETTE.length) | 0],
    });
  }

  function explode(x: number, y: number, base: string) {
    const small = w < 600;
    const n = small ? 52 : 88;
    const ring = Math.random() < 0.35;
    const scale = Math.min(1.4, Math.max(0.8, w / 420));
    const second = PALETTE[(Math.random() * PALETTE.length) | 0];
    for (let i = 0; i < n; i++) {
      if (parts.length > 520) break;
      const a = ring ? (i / n) * Math.PI * 2 : Math.random() * Math.PI * 2;
      const sp = (ring ? 190 : 60 + Math.random() * 190) * scale;
      parts.push({
        x, y, px: x, py: y,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp,
        life: 0,
        max: 1 + Math.random() * 0.9,
        color: Math.random() < 0.7 ? base : second,
        size: 1.2 + Math.random() * 1.4,
        tw: Math.random(),
      });
    }
  }

  function loop(t: number) {
    if (!running) return;
    const dt = Math.min(0.033, (t - last) / 1000 || 0.016);
    last = t;
    const c = ctx!;

    // fade previous frame -> glowing trails on a transparent canvas
    c.globalCompositeOperation = "destination-out";
    c.fillStyle = "rgba(0,0,0,0.26)";
    c.fillRect(0, 0, w, h);
    c.globalCompositeOperation = "lighter";
    c.lineCap = "round";

    nextLaunch -= dt;
    if (nextLaunch <= 0) {
      launch();
      nextLaunch = 1.05 + Math.random() * 0.3;
    }

    for (let i = rockets.length - 1; i >= 0; i--) {
      const r = rockets[i];
      const px = r.x, py = r.y;
      r.x += r.vx * dt;
      r.y += r.vy * dt;
      const g = c.createLinearGradient(px, py + 38, r.x, r.y);
      g.addColorStop(0, "rgba(245,215,110,0)");
      g.addColorStop(1, r.color);
      c.strokeStyle = g;
      c.globalAlpha = 1;
      c.lineWidth = 2.2;
      c.beginPath();
      c.moveTo(r.x - r.vx * 0.04, r.y - r.vy * 0.04 + 40);
      c.lineTo(r.x, r.y);
      c.stroke();
      if (Math.random() < 0.5 && parts.length < 520) {
        parts.push({
          x: r.x, y: r.y, px: r.x, py: r.y,
          vx: (Math.random() - 0.5) * 30, vy: 20 + Math.random() * 30,
          life: 0, max: 0.35 + Math.random() * 0.3, color: "#f7f3e8", size: 1, tw: 0,
        });
      }
      if (r.y <= r.ty) {
        explode(r.x, r.y, r.color);
        rockets.splice(i, 1);
      }
    }

    const drag = Math.pow(0.3, dt);
    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i];
      p.life += dt;
      if (p.life >= p.max) {
        parts.splice(i, 1);
        continue;
      }
      p.px = p.x;
      p.py = p.y;
      p.vx *= drag;
      p.vy = p.vy * drag + 95 * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      const k = 1 - p.life / p.max;
      c.globalAlpha = Math.min(1, k * 1.4) * (k < 0.4 ? 0.55 + Math.random() * 0.45 : 1);
      c.strokeStyle = p.color;
      c.lineWidth = p.size * (0.5 + k * 0.7);
      c.beginPath();
      c.moveTo(p.px, p.py);
      c.lineTo(p.x, p.y + 0.01);
      c.stroke();
    }
    c.globalAlpha = 1;
    raf = requestAnimationFrame(loop);
  }

  const onResize = () => resize();
  window.addEventListener("resize", onResize);
  resize();

  return {
    start() {
      if (running) return;
      running = true;
      resize();
      last = performance.now();
      nextLaunch = 0.15;
      raf = requestAnimationFrame(loop);
    },
    stop() {
      running = false;
      cancelAnimationFrame(raf);
      rockets.length = 0;
      parts.length = 0;
      ctx.clearRect(0, 0, w, h);
    },
    destroy() {
      running = false;
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
    },
  };
}
