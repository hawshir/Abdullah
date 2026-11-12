import { Suspense, lazy, useCallback, useEffect, useState } from "react";
import { Background, Grain } from "./components/Background";
import Gate from "./components/Gate";
import SoundToggle from "./components/SoundToggle";
import { music } from "./lib/audio";
import { vibrate } from "./lib/device";

// heavy animation code is only fetched/executed after the unlock tap
const Experience = lazy(() => import("./components/Experience"));

type Stage = "gate" | "reveal" | "done";

export default function App() {
  const [stage, setStage] = useState<Stage>("gate");

  // lock page scroll while the gate is up
  useEffect(() => {
    const root = document.documentElement;
    root.style.overflow = stage === "done" ? "" : "hidden";
    if (stage === "reveal") window.scrollTo(0, 0);
  }, [stage]);

  // pause animations + audio when the tab is hidden
  useEffect(() => {
    const onVis = () => {
      const hidden = document.hidden;
      document.documentElement.classList.toggle("tab-hidden", hidden);
      music.setHidden(hidden);
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  const onUnlockTap = useCallback(() => {
    music.start();
    vibrate(30);
  }, []);
  const onReveal = useCallback(() => setStage((s) => (s === "gate" ? "reveal" : s)), []);
  const onDone = useCallback(() => setStage("done"), []);

  return (
    <>
      <Background />
      {stage !== "gate" && (
        <Suspense fallback={null}>
          <Experience />
        </Suspense>
      )}
      {stage !== "done" && <Gate onUnlockTap={onUnlockTap} onReveal={onReveal} onDone={onDone} />}
      {stage !== "gate" && <SoundToggle />}
      <Grain />
    </>
  );
}
