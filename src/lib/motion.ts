import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { CustomEase } from "gsap/CustomEase";
import { ScrollToPlugin } from "gsap/ScrollToPlugin";

gsap.registerPlugin(ScrollTrigger, CustomEase, ScrollToPlugin);
CustomEase.create("lux", ".22,1,.36,1");
ScrollTrigger.config({ ignoreMobileResize: true });

export { gsap, ScrollTrigger };

/**
 * Wire up declarative scroll choreography inside a section.
 *  [data-reveal]            fade + rise (value "blur" adds blur-to-sharp)
 *  [data-split]             letter-stagger reveal of its .ch children
 *  [data-parallax="0.3"]    gentle scrubbed vertical drift
 * Call inside gsap.context().
 */
export function setupSection(scope: HTMLElement) {
  scope.querySelectorAll<HTMLElement>("[data-reveal]").forEach((el) => {
    const vars: gsap.TweenVars = {
      opacity: 0,
      y: 38,
      duration: 1.5,
      ease: "lux",
      scrollTrigger: { trigger: el, start: "top 90%", once: true },
    };
    if (el.dataset.reveal === "blur") {
      vars.filter = "blur(10px)";
      vars.clearProps = "filter";
    }
    gsap.from(el, vars);
  });

  scope.querySelectorAll<HTMLElement>("[data-split]").forEach((el) => {
    const chars = el.querySelectorAll(".ch");
    if (!chars.length) return;
    gsap.from(chars, {
      opacity: 0,
      y: 28,
      filter: "blur(10px)",
      duration: 1.3,
      ease: "lux",
      stagger: 0.035,
      clearProps: "filter",
      scrollTrigger: { trigger: el, start: "top 88%", once: true },
    });
  });

  scope.querySelectorAll<HTMLElement>("[data-parallax]").forEach((el) => {
    const k = parseFloat(el.dataset.parallax || "0.2");
    gsap.fromTo(
      el,
      { y: k * 70 },
      {
        y: -k * 70,
        ease: "none",
        scrollTrigger: { trigger: scope, start: "top bottom", end: "bottom top", scrub: true },
      }
    );
  });
}

/** tiny gold sparkle burst, appended to `host` (position: relative/absolute) */
export function sparkleBurst(host: HTMLElement, x: number, y: number, count = 16) {
  for (let i = 0; i < count; i++) {
    const el = document.createElement("div");
    el.className = "spark";
    const s = 4 + Math.random() * 7;
    el.style.width = el.style.height = `${s}px`;
    el.style.left = `${x - s / 2}px`;
    el.style.top = `${y - s / 2}px`;
    host.appendChild(el);
    const a = (Math.PI * 2 * i) / count + Math.random() * 0.5;
    const d = 40 + Math.random() * 70;
    gsap.to(el, {
      x: Math.cos(a) * d,
      y: Math.sin(a) * d + 14,
      opacity: 0,
      scale: 0.2,
      duration: 0.9 + Math.random() * 0.6,
      ease: "power3.out",
      onComplete: () => el.remove(),
    });
  }
}
