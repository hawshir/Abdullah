import { useEffect, useRef } from "react";
import SplitText from "./SplitText";
import Reveal from "./Reveal";
import { gsap } from "../lib/gsap";

type Props = { title: string; sub?: string };

export default function SectionHeading({ title, sub }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  // gentle scroll parallax
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        el,
        { y: 26 },
        {
          y: -26,
          ease: "none",
          scrollTrigger: { trigger: el.parentElement ?? el, start: "top bottom", end: "bottom top", scrub: true },
        },
      );
    }, el);
    return () => ctx.revert();
  }, []);

  return (
    <div ref={ref} className="mx-auto max-w-md px-6 text-center">
      <SplitText
        as="h2"
        text={title}
        className="font-display text-[clamp(2rem,9vw,3.2rem)] font-bold leading-[1.15] tracking-[0.04em] text-ivory"
      />
      {sub ? (
        <Reveal delay={0.35}>
          <p className="mt-4 text-[15.5px] leading-relaxed text-ivory/70">{sub}</p>
        </Reveal>
      ) : null}
    </div>
  );
}
