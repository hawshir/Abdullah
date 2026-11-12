import { useLayoutEffect, useRef, type ReactNode } from "react";
import { gsap } from "../lib/gsap";
import Chars from "./Chars";

export default function SectionHeading({ text, className = "" }: { text: string; className?: string }) {
  const ref = useRef<HTMLHeadingElement>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        el.querySelectorAll(".ch"),
        { opacity: 0, y: "0.6em", filter: "blur(9px)" },
        {
          opacity: 1,
          y: 0,
          filter: "blur(0px)",
          duration: 1.3,
          stagger: 0.035,
          ease: "lux",
          clearProps: "filter,transform",
          scrollTrigger: { trigger: el, start: "top 88%", once: true },
        }
      );
    }, el);
    return () => ctx.revert();
  }, []);
  return (
    <h2 ref={ref} aria-label={text} className={`sec-heading ${className}`}>
      <Chars text={text} />
    </h2>
  );
}

/** Fade + rise on scroll-in. */
export function Rise({
  children,
  className = "",
  delay = 0,
  as: Tag = "div",
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  as?: "div" | "p" | "span";
}) {
  const ref = useRef<HTMLElement>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ctx = gsap.context(() => {
      gsap.from(el, {
        opacity: 0,
        y: 36,
        duration: 1.5,
        delay,
        ease: "lux",
        scrollTrigger: { trigger: el, start: "top 92%", once: true },
      });
    }, el);
    return () => ctx.revert();
  }, [delay]);
  const T = Tag as "div";
  return (
    <T ref={ref as React.RefObject<HTMLDivElement>} className={className}>
      {children}
    </T>
  );
}
