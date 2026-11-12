/** Hand-rolled 2D canvas fireworks — gold / ivory / champagne. */
const PALETTE = ["#f5d76e", "#d4af37", "#f7f3e8", "#f3e5ab", "#ffe9a8", "#e8d3a2"];

type Rocket = { x: number; y: number; vx: number; vy: number; ty: number; color: string };
type Spark = { x: number; y: number; vx: number; vy: number; life: number; max: number; color: string; size: number };

const rnd = (a: number, b: number) => a + Math.random() * (b - a);

export function createFireworks(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  let W = 0;
  let H = 0;
  let raf = 0;
  let running = false;
  let last = 0;
  let nextBurst = 0.35;
  const rockets: Rocket[] = [];
  const sparks: Spark[] = [];

  const resize = () => {
    const r = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    W = r.width;
    H = r.height;
    canvas.width = Math.max(1, Math.round(W * dpr));
    canvas.height = Math.max(1, Math.round(H * dpr));
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  resize();

  const launch = () => {
    rockets.push({
      x: W * rnd(0.14, 0.86),
      y: H + 8,
      vx: rnd(-26, 26),
      vy: -rnd(430, 560),
      ty: H * rnd(0.14, 0.46),
      color: PALETTE[(Math.random() * PALETTE.length) | 0],
    });
  };

  const explode = (x: number, y: number) => {
    const n = W < 500 ? 62 : 90;
    const ring = Math.random() < 0.4;
    const c1 = PALETTE[(Math.random() * PALETTE.length) | 0];
    const c2 = PALETTE[(Math.random() * PALETTE.length) | 0];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + rnd(-0.05, 0.05);
      const sp = ring ? rnd(150, 175) : rnd(30, 230);
      sparks.push({
        x,
        y,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp,
        life: 0,
        max: rnd(1.3, 2.2),
        color: Math.random() < 0.7 ? c1 : c2,
        size: rnd(1.6, 2.8),
      });
    }
  };

  const frame = (now: number) => {
    if (!running) return;
    raf = requestAnimationFrame(frame);
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;

    nextBurst -= dt;
    if (nextBurst <= 0) {
      launch();
      nextBurst = rnd(1.1, 1.3);
    }

    // fade previous frame → light trails on a transparent canvas
    ctx.globalCompositeOperation = "destination-out";
    ctx.fillStyle = "rgba(0,0,0,0.22)";
    ctx.fillRect(0, 0, W, H);
    ctx.globalCompositeOperation = "lighter";

    for (let i = rockets.length - 1; i >= 0; i--) {
      const r = rockets[i];
      r.x += r.vx * dt;
      r.y += r.vy * dt;
      ctx.globalAlpha = 1;
      ctx.fillStyle = r.color;
      ctx.fillRect(r.x - 1.5, r.y - 1.5, 3, 3);
      ctx.globalAlpha = 0.35;
      ctx.fillRect(r.x - 3, r.y - 3, 6, 6);
      if (r.y <= r.ty) {
        explode(r.x, r.y);
        rockets.splice(i, 1);
      }
    }

    const fric = Math.pow(0.22, dt);
    for (let i = sparks.length - 1; i >= 0; i--) {
      const s = sparks[i];
      s.life += dt;
      if (s.life >= s.max) {
        sparks.splice(i, 1);
        continue;
      }
      s.vx *= fric;
      s.vy = s.vy * fric + 110 * dt;
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      const k = 1 - s.life / s.max;
      ctx.globalAlpha = k * k * (0.75 + 0.25 * Math.sin(s.life * 40 + s.x));
      ctx.fillStyle = s.color;
      ctx.fillRect(s.x - s.size / 2, s.y - s.size / 2, s.size, s.size);
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
  };

  return {
    start() {
      if (running) return;
      running = true;
      last = performance.now();
      raf = requestAnimationFrame(frame);
    },
    stop() {
      running = false;
      cancelAnimationFrame(raf);
      ctx.globalCompositeOperation = "source-over";
      ctx.clearRect(0, 0, W, H);
      rockets.length = 0;
      sparks.length = 0;
    },
    resize,
    destroy() {
      running = false;
      cancelAnimationFrame(raf);
    },
  };
}
