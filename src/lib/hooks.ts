import { useEffect, useRef, useState } from "react";

/** rAF loop that auto-pauses when the tab is hidden. dt is clamped (seconds). */
export function useRaf(cb: (dt: number, t: number) => void, active = true) {
  const ref = useRef(cb);
  useEffect(() => {
    ref.current = cb;
  });
  useEffect(() => {
    if (!active) return;
    let id = 0;
    let last = 0;
    let running = false;
    const loop = (now: number) => {
      const dt = Math.min(0.05, Math.max(0, (now - last) / 1000));
      last = now;
      ref.current(dt, now / 1000);
      id = requestAnimationFrame(loop);
    };
    const start = () => {
      if (running || document.hidden) return;
      running = true;
      last = performance.now();
      id = requestAnimationFrame(loop);
    };
    const stop = () => {
      running = false;
      cancelAnimationFrame(id);
    };
    const onVis = () => (document.hidden ? stop() : start());
    document.addEventListener("visibilitychange", onVis);
    start();
    return () => {
      document.removeEventListener("visibilitychange", onVis);
      stop();
    };
  }, [active]);
}

export function useInView<T extends Element>(rootMargin = "0px") {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { rootMargin });
    io.observe(el);
    return () => io.disconnect();
  }, [rootMargin]);
  return [ref, inView] as const;
}
