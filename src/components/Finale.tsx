import { useEffect, useRef } from "react";
import SplitText from "./SplitText";
import Reveal from "./Reveal";
import { gsap } from "../lib/gsap";
import { createFireworks } from "../lib/fireworks";

export default function Finale() {
  const sectionRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // fireworks run only while the finale is on screen and the tab is visible
  useEffect(() => {
    const canvas = canvasRef.current;
    const section = sectionRef.current;
    if (!canvas || !section) return;
    const fw = createFireworks(canvas);
    if (!fw) return;
    let inView = false;
    const sync = () => {
      if (inView && !document.hidden) fw.start();
      else fw.stop();
    };
    const io = new IntersectionObserver(
      ([entry]) => {
        inView = entry.isIntersecting;
        sync();
      },
      { threshold: 0.05 },
    );
    io.observe(section);
    const ro = new ResizeObserver(() => fw.resize());
    ro.observe(canvas);
    document.addEventListener("visibilitychange", sync);
    return () => {
      io.disconnect();
      ro.disconnect();
      document.removeEventListener("visibilitychange", sync);
      fw.destroy();
    };
  }, []);

  const again = () => {
    gsap.to(window, { scrollTo: { y: "#hero" }, duration: 2.6, ease: "lux" });
  };

  return (
    <section
      id="finale"
      ref={sectionRef}
      className="flex flex-col items-center justify-center overflow-hidden px-6 py-[14svh] text-center"
    >
      <canvas ref={canvasRef} aria-hidden="true" className="pointer-events-none absolute inset-0 z-0 h-full w-full" />

      <div className="relative z-10 flex max-w-lg flex-col items-center">
        <SplitText
          as="p"
          text="This whole page is just code and stardust."
          className="text-[clamp(1.05rem,4.8vw,1.35rem)] leading-relaxed tracking-wide text-ivory/85"
        />
        <SplitText
          as="p"
          delay={0.4}
          text="YOU are the actual miracle."
          className="mt-6 font-display text-[clamp(1.6rem,7.6vw,2.4rem)] font-bold leading-tight tracking-[0.08em] text-ivory"
        />

        <h2 aria-label="Happy 17th Birthday, AREEBA 🤍" className="mt-12 font-display font-black leading-[1.1]">
          <SplitText
            as="span"
            delay={0.2}
            stagger={0.05}
            text="Happy 17th Birthday,"
            className="block text-[clamp(1.9rem,9.4vw,3.6rem)] tracking-[0.04em] text-ivory"
          />
          <span className="gold-glow mt-2 block" style={{ filter: "drop-shadow(0 0 22px rgba(245,215,110,.55))" }}>
            <SplitText
              as="span"
              gold
              delay={0.9}
              stagger={0.07}
              text="AREEBA"
              className="text-[clamp(3rem,16vw,6.2rem)] tracking-[0.08em]"
            />
            <Reveal delay={1.8} y={8} className="ml-2 inline-block align-middle text-[clamp(2rem,9vw,3.4rem)]">
              <span aria-hidden="true">🤍</span>
            </Reveal>
          </span>
        </h2>

        <Reveal delay={0.4} className="mt-12">
          <p className="max-w-[17rem] text-[13px] leading-relaxed tracking-[0.14em] text-ivory/60">
            made with love, duas &amp; a little code — ABDULLAH
          </p>
        </Reveal>

        <Reveal delay={0.6} className="mt-8">
          <button
            type="button"
            onClick={again}
            className="glass no-select min-h-[54px] px-8 text-[15px] font-semibold tracking-wide text-ivory shadow-[0_0_30px_rgba(212,175,55,.15)] transition-transform duration-300 active:scale-95"
          >
            ↺ experience it all again
          </button>
        </Reveal>
      </div>
    </section>
  );
}
