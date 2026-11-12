/** Every optional device feature fails silently. */
export function vibrate(ms = 30) {
  try {
    if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
      navigator.vibrate(ms);
    }
  } catch {
    /* ignore */
  }
}

export const rand = (min: number, max: number) => min + Math.random() * (max - min);
export const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

export const GOLD_CONFETTI = ["#f5d76e", "#d4af37", "#f7f3e8", "#f3e5ab", "#e8d3a2", "#fff6cc"];

/** Encode an inline SVG string as a CSS url() data URI (Safari-safe). */
export const svgUrl = (svg: string) => `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
