import { useEffect } from "react";
import Hero from "./Hero";
import Cake from "./Cake";
import ShootingStars from "./ShootingStars";
import Certificate from "./Certificate";
import SealedLetter from "./SealedLetter";
import Finale from "./Finale";
import { ScrollTrigger } from "../lib/gsap";

export default function Experience() {
  useEffect(() => {
    const refresh = () => ScrollTrigger.refresh();
    const t1 = window.setTimeout(refresh, 400);
    const t2 = window.setTimeout(refresh, 2600);
    document.fonts?.ready.then(refresh).catch(() => {});
    window.addEventListener("load", refresh);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.removeEventListener("load", refresh);
    };
  }, []);

  return (
    <main className="relative z-10 w-full overflow-x-clip" style={{ animation: "fade-in-slow 1.6s ease both" }}>
      <Hero />
      <Cake />
      <ShootingStars />
      <Certificate />
      <SealedLetter />
      <Finale />
    </main>
  );
}
