import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { gsap, ScrollTrigger, setupSection, sparkleBurst } from "../lib/motion";
import { SplitText } from "../components/SplitText";

const TOASTS = [
  "Wish received by the universe 🌟",
  "Logged in the stars ✅",
  "The sky says: coming right up ✨",
  "Consider it done 🌠",
];

export default function Stars() {
  const root = useRef<HTMLElement>(null);
  const sky = useRef<HTMLDivElement>(null);
  const [toast, setToast] = useState<{ id: number; text: string } | null>(null);
  const toastTimer = useRef(0);
  const toastId = useRef(0);

  useLayoutEffect(() => {
    const comets = new Set<{ el: HTMLElement; tweens: gsap.core.Tween[] }>();
    let spawnTimer = 0;
    let active = false;

    const killComet = (c: { el: HTMLElement; tweens: gsap.core.Tween[] }) => {
      c.tweens.forEach((t) => t.kill());
      gsap.killTweensOf(c.el);
      c.el.remove();
      comets.delete(c);
    };

    const showToast = () => {
      toastId.current += 1;
      setToast({ id: toastId.current, text: TOASTS[Math.floor(Math.random() * TOASTS.length)] });
      window.clearTimeout(toastTimer.current);
      toastTimer.current = window.setTimeout(() => setToast(null), 2300);
    };

    const spawn = () => {
      const host = sky.current;
      if (!host || !active || document.hidden) return;
      const w = host.clientWidth;
      const h = host.clientHeight;
      const dir = Math.random() < 0.5 ? 1 : -1;
      const startX = dir > 0 ? -80 : w + 80;
      const endX = dir > 0 ? w + 80 : -80;
      const startY = h * (0.1 + Math.random() * 0.5);
      const endY = startY + h * (0.1 + Math.random() * 0.2);
      const angle = (Math.atan2(endY - startY, endX - startX) * 180) / Math.PI;

      const el = document.createElement("div");
      el.className = "comet";
      el.innerHTML = '<span class="comet-tail"></span><span class="comet-head"></span><span class="comet-zone"></span>';
      (el.querySelector(".comet-tail") as HTMLElement).style.transform = `rotate(${angle}deg)`;
      host.appendChild(el);

      const entry = { el, tweens: [] as gsap.core.Tween[] };
      comets.add(entry);
      gsap.set(el, { x: startX, y: startY });
      entry.tweens.push(
        gsap.to(el, { x: endX, y: endY, duration: 2.5, ease: "power1.out", onComplete: () => killComet(entry) }),
        gsap.to(el, { opacity: 0, duration: 0.6, delay: 1.9, ease: "power1.in" })
      );

      let caught = false;
      (el.querySelector(".comet-zone") as HTMLElement).addEventListener("pointerdown", (e: PointerEvent) => {
        if (caught) return;
        caught = true;
        const r = host.getBoundingClientRect();
        sparkleBurst(host, e.clientX - r.left, e.clientY - r.top, 20);
        entry.tweens.forEach((t) => t.kill());
        gsap.to(el, { opacity: 0, duration: 0.35, onComplete: () => killComet(entry) });
        showToast();
      });
    };

    const schedule = (delay: number) => {
      window.clearTimeout(spawnTimer);
      spawnTimer = window.setTimeout(() => {
        spawn();
        if (active) schedule(4000 + Math.random() * 3000);
      }, delay);
    };

    const ctx = gsap.context(() => {
      setupSection(root.current!);
      ScrollTrigger.create({
        trigger: root.current,
        start: "top 70%",
        end: "bottom 30%",
        onToggle: (self) => {
          active = self.isActive;
          if (active) schedule(1400);
          else {
            window.clearTimeout(spawnTimer);
            comets.forEach(killComet);
          }
        },
      });
    }, root);

    return () => {
      active = false;
      window.clearTimeout(spawnTimer);
      window.clearTimeout(toastTimer.current);
      comets.forEach(killComet);
      ctx.revert();
    };
  }, []);

  useEffect(() => () => window.clearTimeout(toastTimer.current), []);

  return (
    <section ref={root} id="stars" className="section">
      <div ref={sky} className="pointer-events-none absolute inset-0 z-[3] overflow-hidden" aria-hidden="true" />
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3"
        style={{ background: "radial-gradient(ellipse at 50% 100%, rgba(212,175,55,.08), transparent 70%)" }}
      />
      <div className="relative z-[2] flex flex-col items-center">
        <SplitText as="h2" scroll text="Now, look up." className="heading" />
        <p className="subtext mt-4" data-reveal="">
          A shooting star crosses this sky every few seconds. Catch it and tap it before it's gone.
        </p>
      </div>

      <div className="pointer-events-none fixed inset-x-0 bottom-[max(28px,env(safe-area-inset-bottom))] z-[45] flex justify-center px-4">
        <AnimatePresence>
          {toast && (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 16, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className="rounded-full border px-6 py-3 text-center text-[0.98rem] font-semibold text-[#f7f3e8]"
              style={{
                background: "rgba(14,14,36,.6)",
                borderColor: "rgba(212,175,55,.45)",
                backdropFilter: "blur(12px)",
                WebkitBackdropFilter: "blur(12px)",
                boxShadow: "0 8px 40px rgba(0,0,0,.5), 0 0 30px rgba(212,175,55,.2)",
              }}
            >
              {toast.text}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
