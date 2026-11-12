import { useState } from "react";
import { music } from "../lib/audio";

export default function SoundToggle() {
  const [muted, setMuted] = useState(music.muted);
  return (
    <button
      type="button"
      aria-label={muted ? "Turn music on" : "Turn music off"}
      aria-pressed={!muted}
      onClick={() => {
        const m = !muted;
        music.setMuted(m);
        setMuted(m);
      }}
      className="glass no-select fixed right-3 top-3 z-[250] flex h-12 w-12 items-center justify-center !rounded-full text-xl transition-transform duration-300 active:scale-90"
      style={{ animation: "fade-in-slow 1.6s var(--lux) both", animationDelay: "0.6s" }}
    >
      <span aria-hidden="true">{muted ? "🔇" : "🔊"}</span>
    </button>
  );
}
