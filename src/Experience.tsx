import { useEffect, useState } from "react";
import { gsap, ScrollTrigger } from "./lib/motion";
import { music } from "./lib/music";
import Hero from "./sections/Hero";
import Cake from "./sections/Cake";
import Stars from "./sections/Stars";
import Certificate from "./sections/Certificate";
import Letter from "./sections/Letter";
import Finale from "./sections/Finale";

export default function Experience({ revealed }: { revealed: boolean }) {
  const [muted, setMuted] = useState(false);

  useEffect(() => {
    // fonts shift layout → recompute trigger positions
    const refresh = () => ScrollTrigger.refresh();
    const fonts = (document as Document & { fonts?: FontFaceSet }).fonts;
    fonts?.ready.then(refresh).catch(() => {});
    const t = window.setTimeout(refresh, 1200);

    const onVis = () => {
      gsap.globalTimeline.paused(document.hidden);
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      window.clearTimeout(t);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  return (
    <main className="relative z-10 w-full overflow-x-clip">
      {revealed && (
        <button
          type="button"
          className="sound-toggle"
          aria-label={muted ? "Unmute music" : "Mute music"}
          aria-pressed={muted}
          onClick={() => setMuted(music.toggle())}
        >
          <span aria-hidden="true">{muted ? "🔇" : "🔊"}</span>
        </button>
      )}
      <Hero revealed={revealed} />
      <Cake />
      <Stars />
      <Certificate />
      <Letter />
      <Finale />
    </main>
  );
}
