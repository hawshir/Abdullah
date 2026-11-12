import { lazy, Suspense, useCallback, useEffect, useState } from "react";
import Background from "./components/Background";
import Gate from "./components/Gate";
import { loadExperience } from "./lib/loaders";

const Experience = lazy(loadExperience);

export default function App() {
  const [open, setOpen] = useState(false);
  const [gateGone, setGateGone] = useState(false);

  // lock scroll while the gate is up
  useEffect(() => {
    document.documentElement.classList.add("lock");
    return () => document.documentElement.classList.remove("lock");
  }, []);

  // pause CSS animations when the tab is hidden
  useEffect(() => {
    const f = () => document.documentElement.classList.toggle("paused", document.hidden);
    document.addEventListener("visibilitychange", f);
    return () => document.removeEventListener("visibilitychange", f);
  }, []);

  const onUnlock = useCallback(() => setOpen(true), []);
  const onDone = useCallback(() => {
    setGateGone(true);
    document.documentElement.classList.remove("lock");
    window.scrollTo(0, 0);
  }, []);

  return (
    <>
      <Background />
      {open && (
        <Suspense fallback={null}>
          <Experience />
        </Suspense>
      )}
      {!gateGone && <Gate onUnlock={onUnlock} onDone={onDone} />}
    </>
  );
}
