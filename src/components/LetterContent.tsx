import { motion } from "framer-motion";
import type { RefObject } from "react";

type Block = { kind: "greet" | "p" | "dua" | "sign"; italic?: boolean; body: React.ReactNode };

const BLOCKS: Block[] = [
  { kind: "greet", body: "My dearest Areeba," },
  {
    kind: "p",
    body: "Some people wait all year for their birthday to feel special. You make every ordinary day around you feel special — the birthday is just the world's excuse to celebrate you out loud.",
  },
  {
    kind: "p",
    body: "Seventeen. SubhanAllah. Happy birthday! May this year be the softest, kindest, most beautiful chapter of your life so far.",
  },
  {
    kind: "p",
    body: `And can we please talk about your HSSC-I result? Brilliant — of course it was. You didn't get lucky; you earned every single mark, late night by late night, page by page. I'm so proud of you I'd put it on a billboard if I could. Mubarak ho! 🎉 But knowing you, this is just the opening scene. HSSC-II, then MDCAT, then a white coat with ABDULLAH stitched on it. "Dr. Areeba" has a beautiful ring to it, doesn't it?`,
  },
  { kind: "p", body: "And now — my dua for you. Read it slowly; it's from the deepest part of my heart:" },
  {
    kind: "dua",
    italic: true,
    body: "Allah Pak aapko sehat o tandrusti ata farmaye, aapke ghar mein khushiyon ke din baraste rahein, aur aapki har jaiz dua qubool farmaye. Aameen.",
  },
  {
    kind: "dua",
    body: "Ya Allah, make her a source of healing for everyone she meets. Let her hands carry shifa, her heart carry mercy. Make the road to MDCAT smooth for her, put barakah in every hour she studies, and when her result comes, let her score speak so loudly that her family's prayers turn into happy tears. Make her Dr. Areeba — the kind of doctor whose kindness starts healing patients before the medicine even does.",
  },
  {
    kind: "dua",
    body: "May Allah grant you an even higher score in HSSC-II, success in MDCAT beyond everything you've prayed for, and a life full of noor, peace, and ajr. Aameen, summa Aameen. 🤲",
  },
  { kind: "p", body: "Never dim your light for anyone. The world is waiting for Dr. Areeba." },
  { kind: "p", body: "Happy birthday, superstar. See you at the top." },
  {
    kind: "sign",
    body: (
      <>
        — From your friend who believes in you more than you know,
        <br />
        <span className="font-display text-[1.7rem] font-bold italic tracking-wide">ABDULLAH</span>
      </>
    ),
  },
];

/** keep "HSSC-I" / "HSSC-II" from breaking across lines */
function nb(body: React.ReactNode): React.ReactNode {
  if (typeof body !== "string") return body;
  return body.split(/(HSSC-II|HSSC-I)/).map((part, i) =>
    part.startsWith("HSSC-") ? (
      <span key={i} style={{ whiteSpace: "nowrap" }}>
        {part}
      </span>
    ) : (
      part
    )
  );
}

export default function LetterContent({ scrollRef }: { scrollRef: RefObject<HTMLDivElement | null> }) {
  return (
    <div className="mx-auto max-w-[34rem] px-7 pb-32 pt-24 text-left">
      {BLOCKS.map((b, i) => {
        const delay = i < 3 ? 0.75 + i * 0.18 : 0;
        const common = {
          initial: { opacity: 0, y: 26 },
          whileInView: { opacity: 1, y: 0 },
          viewport: { root: scrollRef as RefObject<Element>, once: true, amount: 0.25 as const },
          transition: { duration: 1.1, delay, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
        };
        if (b.kind === "greet")
          return (
            <motion.h2 key={i} {...common} className="ink mb-8 font-display text-[2rem] font-bold leading-tight">
              {nb(b.body)}
            </motion.h2>
          );
        if (b.kind === "dua")
          return (
            <motion.p key={i} {...common} className={b.italic ? "dua italic" : "dua"}>
              {nb(b.body)}
            </motion.p>
          );
        if (b.kind === "sign")
          return (
            <motion.p key={i} {...common} className="ink mt-12 font-display text-[1.05rem] italic leading-relaxed">
              {nb(b.body)}
            </motion.p>
          );
        return (
          <motion.p key={i} {...common} className="letter-p my-6">
            {nb(b.body)}
          </motion.p>
        );
      })}
    </div>
  );
}
