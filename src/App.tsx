import { lazy, Suspense, useCallback, useEffect, useState } from "react";
import { Background, Grain, Starfield } from "./components/Background";
import Gate from "./components/Gate";
import { celebrate, preloadConfetti, vibrate } from "./lib/device";
import { music } from "./lib/music";

const loadExperience = () => import("./Experience");
const Experience = lazy(loadExperience);

type Phase = "locked" | "opening" | "open";

export default function App() {
  const [phase, setPhase] = useState<Phase>("locked");
  const [revealed, setRevealed] = useState(false);
  const [ambient, setAmbient] = useState(false);

  // heavy animation code is only touched after the first keypad interaction / unlock
  const warm = useCallback(() => {
    preloadConfetti().catch(() => {});
    loadExperience().catch(() => {});
  }, []);

  useEffect(() => {
    // paint the gate first, then bring the ambient canvas in
    const id = window.setTimeout(() => setAmbient(true), 400);
    return () => window.clearTimeout(id);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("locked", phase !== "open");
  }, [phase]);

  useEffect(() => {
    const onVis = () => document.documentElement.classList.toggle("tab-hidden", document.hidden);
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  // Runs synchronously inside the 4th-digit tap → audio is allowed to start.
  const handleUnlock = useCallback(() => {
    music.start();
    vibrate(30);
    void celebrate();
    window.scrollTo(0, 0);
    setPhase("opening");
  }, []);

  return (
    <>
      <Background />
      {ambient && <Starfield />}
      {phase !== "locked" && (
        <Suspense fallback={null}>
          <Experience revealed={revealed} />
        </Suspense>
      )}
      {phase !== "open" && (
        <Gate
          onUnlock={handleUnlock}
          onReveal={() => setRevealed(true)}
          onDone={() => setPhase("open")}
          onWarm={warm}
        />
      )}
      <Grain />
    </>
  );
}
