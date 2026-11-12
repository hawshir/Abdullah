import { Fragment, type CSSProperties } from "react";

type Props = {
  text: string;
  /** start invisible (to be revealed by GSAP) */
  hidden?: boolean;
  /** shimmering gold gradient per letter */
  gold?: boolean;
  charClass?: string;
};

/** Splits text into word > letter spans (words never break mid-word). */
export default function Chars({ text, hidden = true, gold = false, charClass = "" }: Props) {
  let n = 0;
  const words = text.split(" ");
  return (
    <>
      {words.map((w, wi) => (
        <Fragment key={wi}>
          <span className="word" aria-hidden="true">
            {Array.from(w).map((c, ci) => (
              <span
                key={ci}
                className={`ch${hidden ? " ch-h" : ""}${gold ? " gold-char" : ""} ${charClass}`}
                style={{ "--i": n++ } as CSSProperties}
              >
                {c}
              </span>
            ))}
          </span>
          {wi < words.length - 1 ? " " : null}
        </Fragment>
      ))}
    </>
  );
}
