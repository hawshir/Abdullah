import { useEffect, useLayoutEffect, useRef } from "react";
import { gsap, ScrollTrigger } from "../lib/gsap";
import { createFireworks } from "../lib/fireworks";
import Chars from "./Chars";

export default function Finale() {
  const root = useRef<HTMLElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const fw = useRef<ReturnType<typeof createFireworks> | null>(null);
  const inView = useRef(false);

  // fireworks only run while the section is on screen and the tab is visible
  useEffect(() => {
    const c = canvas.current;
    if (!c) return;
    const engine = createFireworks(c);
    fw.current = engine;
    const sync = () => {
      if (inView.current && !document.hidden) engine.start();
      else engine.stop();
    };
    const st = ScrollTrigger.create({
      trigger: root.current,
      start: "top 85%",
      end: "bottom top",
      onToggle: (self) => {
        inView.current = self.isActive;
        sync();
      },
    });
    document.addEventListener("visibilitychange", sync);
    return () => {
      st.kill();
      document.removeEventListener("visibilitychange", sync);
      engine.destroy();
    };
  }, []);

  useLayoutEffect(() => {
    const el = root.current;
    if (!el) return;
    const ctx = gsap.context(() => {
      const base = { opacity: 0, y: "0.55em", filter: "blur(10px)" };
      const to = { opacity: 1, y: 0, filter: "blur(0px)", duration: 1.4, ease: "lux", stagger: 0.035, clearProps: "filter,transform" };
      const tl = gsap.timeline({ scrollTrigger: { trigger: el, start: "top 55%", once: true } });
      tl.fromTo(".f-1 .ch", base, to)
        .fromTo(".f-2 .ch", base, to, "+=0.15")
        .fromTo(".f-3", { opacity: 0, scale: 0.9, filter: "blur(14px)" }, { opacity: 1, scale: 1, filter: "blur(0px)", duration: 2, ease: "lux", clearProps: "filter,transform" }, "+=0.2")
        .fromTo(".f-4, .f-btn", { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 1.4, ease: "lux", stagger: 0.25 }, "-=1");
    }, el);
    return () => ctx.revert();
  }, []);

  const again = () => {
    const hero = document.getElementById("hero");
    if (!hero) return;
    gsap.to(window, { scrollTo: { y: hero, autoKill: true }, duration: 2.4, ease: "power3.inOut" });
  };

  return (
    <section id="finale" ref={root} className="relative flex min-h-[100svh] flex-col items-center justify-center overflow-hidden px-5 py-24 text-center">
      <div className="finale-glow" aria-hidden="true" />
      <canvas ref={canvas} aria-hidden="true" className="pointer-events-none absolute inset-0 h-full w-full" />

      <div className="relative z-[2] flex flex-col items-center">
        <p className="f-1 font-display text-[1.25rem] font-bold italic text-ivory/85" aria-label="This whole page is just code and stardust.">
          <Chars text="This whole page is just code and stardust." />
        </p>
        <p className="f-2 mt-3 font-display font-black text-ivory" style={{ fontSize: "clamp(1.4rem,7vw,2.1rem)", letterSpacing: "0.1em" }} aria-label="YOU are the actual miracle.">
          <Chars text="YOU are the actual miracle." />
        </p>

        <h2 className="f-3 big-glow mt-12 font-display font-black leading-[1.2] text-ivory" style={{ fontSize: "clamp(2rem,10.5vw,3.8rem)", opacity: 0 }}>
          Happy 17th Birthday,{" "}
          <span className="word" style={{ letterSpacing: "0.05em" }}>
            <Chars text="AREEBA" gold hidden={false} />
          </span>{" "}
          <span style={{ filter: "drop-shadow(0 0 12px rgba(255,255,255,.5))" }}>🤍</span>
        </h2>

        <p className="f-4 mt-10 max-w-[18rem] text-[0.88rem] font-semibold text-ivory/70" style={{ letterSpacing: "0.06em", opacity: 0 }}>
          made with love, duas &amp; a little code — ABDULLAH
        </p>

        <button type="button" className="btn-glass f-btn mt-10" onClick={again} style={{ opacity: 0 }}>
          ↺ experience it all again
        </button>
      </div>
    </section>
  );
}
