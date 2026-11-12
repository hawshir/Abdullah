import { Fragment, useEffect, useMemo, useRef } from "react";
import type { CSSProperties, ElementType } from "react";
import { gsap } from "../lib/gsap";

type Props = {
  text: string;
  as?: ElementType;
  className?: string;
  gold?: boolean;
  reveal?: "mount" | "scroll";
  delay?: number;
  stagger?: number;
  start?: string;
};

/** Letter-by-letter blur-to-sharp + rise reveal. */
export default function SplitText({
  text,
  as: Tag = "span",
  className = "",
  gold = false,
  reveal = "scroll",
  delay = 0,
  stagger = 0.04,
  start = "top 88%",
}: Props) {
  const ref = useRef<HTMLElement>(null);
  const words = useMemo(() => text.split(" "), [text]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ctx = gsap.context(() => {
      const chars = el.querySelectorAll(".ch");
      gsap.set(chars, { opacity: 0, y: 26, filter: "blur(12px)" });
      const vars: gsap.TweenVars = {
        opacity: 1,
        y: 0,
        filter: "blur(0px)",
        duration: 1.3,
        stagger,
        ease: "lux",
        delay,
        clearProps: "filter",
      };
      if (reveal === "scroll") {
        gsap.to(chars, { ...vars, scrollTrigger: { trigger: el, start, once: true } });
      } else {
        gsap.to(chars, vars);
      }
    }, el);
    return () => ctx.revert();
  }, [text, reveal, delay, stagger, start]);

  let idx = 0;
  return (
    <Tag ref={ref} aria-label={text} className={className}>
      {words.map((word, wi) => (
        <Fragment key={wi}>
          <span aria-hidden="true" className="inline-block whitespace-nowrap">
            {Array.from(word).map((c, ci) => {
              const i = idx++;
              return (
                <span key={ci} className="ch">
                  <span className={gold ? "gold-text" : undefined} style={{ "--i": i } as CSSProperties}>
                    {c}
                  </span>
                </span>
              );
            })}
          </span>
          {wi < words.length - 1 ? " " : null}
        </Fragment>
      ))}
    </Tag>
  );
}
