import confetti from "canvas-confetti";

export const GOLDS = ["#f5d76e", "#d4af37", "#f7f3e8", "#f1e0b0", "#e8d5a3", "#fff1bf"];

/** Gold / ivory / champagne burst for the unlock tap. */
export function unlockBurst(ox = 0.5, oy = 0.35) {
  try {
    const base = { colors: GOLDS, zIndex: 9999, ticks: 240, disableForReducedMotion: false };
    confetti({ ...base, particleCount: 120, spread: 110, startVelocity: 52, origin: { x: ox, y: oy } });
    confetti({ ...base, particleCount: 60, angle: 60, spread: 70, startVelocity: 55, origin: { x: 0, y: 0.85 } });
    confetti({ ...base, particleCount: 60, angle: 120, spread: 70, startVelocity: 55, origin: { x: 1, y: 0.85 } });
    window.setTimeout(() => {
      confetti({
        ...base,
        particleCount: 70,
        spread: 160,
        startVelocity: 30,
        gravity: 0.7,
        scalar: 1.1,
        shapes: ["star", "circle"],
        origin: { x: ox, y: oy },
      });
    }, 260);
  } catch {
    /* ignore */
  }
}

/** Tiny sparkle burst at a screen point (px). */
export function sparkleBurst(px: number, py: number) {
  try {
    const x = px / window.innerWidth;
    const y = py / window.innerHeight;
    confetti({
      particleCount: 26,
      spread: 360,
      startVelocity: 16,
      gravity: 0.5,
      decay: 0.92,
      ticks: 70,
      scalar: 0.85,
      shapes: ["star"],
      colors: GOLDS,
      zIndex: 90,
      origin: { x, y },
      disableForReducedMotion: false,
    });
    confetti({
      particleCount: 12,
      spread: 360,
      startVelocity: 9,
      gravity: 0.3,
      ticks: 60,
      scalar: 0.5,
      shapes: ["circle"],
      colors: ["#fff6cf", "#f5d76e"],
      zIndex: 90,
      origin: { x, y },
      disableForReducedMotion: false,
    });
  } catch {
    /* ignore */
  }
}
