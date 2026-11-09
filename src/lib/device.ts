/** Optional device features. Everything here fails SILENTLY. */

export const vibrate = (ms = 30) => {
  try {
    if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
      navigator.vibrate(ms);
    }
  } catch {
    /* ignore */
  }
};

const loadConfetti = () => import("canvas-confetti");
let confettiPromise: ReturnType<typeof loadConfetti> | null = null;
export const preloadConfetti = () => {
  if (!confettiPromise) confettiPromise = loadConfetti();
  return confettiPromise;
};

const COLORS = ["#f5d76e", "#d4af37", "#f7f3e8", "#f3e5c3", "#fff6d6", "#e8cf94"];

export async function celebrate() {
  try {
    const mod = await preloadConfetti();
    const confetti = mod.default;
    const base = {
      colors: COLORS,
      zIndex: 9999,
      disableForReducedMotion: false,
      ticks: 240,
    };
    confetti({ ...base, particleCount: 100, spread: 85, startVelocity: 50, origin: { x: 0.5, y: 0.38 } });
    confetti({ ...base, particleCount: 45, angle: 60, spread: 60, startVelocity: 58, origin: { x: 0, y: 0.75 } });
    confetti({ ...base, particleCount: 45, angle: 120, spread: 60, startVelocity: 58, origin: { x: 1, y: 0.75 } });
    window.setTimeout(() => {
      try {
        confetti({
          ...base,
          particleCount: 70,
          spread: 130,
          startVelocity: 32,
          gravity: 0.7,
          shapes: ["circle"],
          origin: { x: 0.5, y: 0.3 },
        });
      } catch {
        /* ignore */
      }
    }, 260);
  } catch {
    /* ignore */
  }
}
