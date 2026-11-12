import { useEffect } from "react";
import { ScrollTrigger } from "../lib/gsap";
import Starfield from "./Starfield";
import MuteToggle from "./MuteToggle";
import Hero from "./Hero";
import Cake from "./Cake";
import ShootingStars from "./ShootingStars";
import Certificate from "./Certificate";
import LetterSection from "./LetterSection";
import Finale from "./Finale";

export default function Experience() {
  useEffect(() => {
    const refresh = () => ScrollTrigger.refresh();
    const fonts = (document as Document & { fonts?: { ready: Promise<unknown> } }).fonts;
    fonts?.ready.then(refresh).catch(() => {});
    window.addEventListener("load", refresh);
    const t = window.setTimeout(refresh, 2600);
    return () => {
      window.removeEventListener("load", refresh);
      window.clearTimeout(t);
    };
  }, []);

  return (
    <>
      <Starfield />
      <div className="exp">
        <MuteToggle />
        <main>
          <Hero />
          <Cake />
          <ShootingStars />
          <Certificate />
          <LetterSection />
          <Finale />
        </main>
      </div>
    </>
  );
}
