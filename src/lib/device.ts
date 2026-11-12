/** Every optional device feature fails silently. */
export function vib(ms = 30) {
  try {
    if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
      navigator.vibrate(ms);
    }
  } catch {
    /* ignore */
  }
}

export const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
