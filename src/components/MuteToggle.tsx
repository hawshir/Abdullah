import { useEffect, useState } from "react";
import { isMuted, subscribeMusic, toggleMute } from "../lib/music";

export default function MuteToggle() {
  const [m, setM] = useState(isMuted());
  useEffect(() => subscribeMusic(() => setM(isMuted())), []);
  return (
    <button
      type="button"
      className="mute-btn"
      aria-label={m ? "Unmute music" : "Mute music"}
      onClick={() => setM(toggleMute())}
    >
      {m ? "🔇" : "🔊"}
    </button>
  );
}
