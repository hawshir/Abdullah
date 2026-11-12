import { useEffect, useRef } from "react";
import type { ReactNode } from "react";
import { gsap } from "../lib/gsap";

type Props = {
  children: ReactNode;
  className?: string;
  delay?: number;
  y?: number;
  start?: string;
};

/** Slow fade + rise when scrolled into view (once). */
export default function Reveal({ children, className, delay = 0, y = 26, start = "top 90%" }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        el,
        { opacity: 0, y },
        { opacity: 1, y: 0, duration: 1.4, ease: "lux", delay, scrollTrigger: { trigger: el, start, once: true } },
      );
    }, el);
    return () => ctx.revert();
  }, [delay, y, start]);
  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
