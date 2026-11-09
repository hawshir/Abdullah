import type { ElementType, CSSProperties } from "react";

interface Props {
  text: string;
  className?: string;
  charClass?: string;
  as?: ElementType;
  /** reveal letters on scroll (handled by setupSection) */
  scroll?: boolean;
  /** stagger the shimmer highlight from letter to letter */
  shimmer?: boolean;
  style?: CSSProperties;
}

/** Splits text into words → letters (.ch) while keeping natural word wrapping. */
export function SplitText({ text, className = "", charClass = "", as: Tag = "span", scroll, shimmer, style }: Props) {
  const words = text.split(" ");
  let i = 0;
  return (
    <Tag className={className} aria-label={text} data-split={scroll ? "" : undefined} style={style}>
      {words.map((w, wi) => (
        <span key={wi} aria-hidden="true">
          <span style={{ display: "inline-block", whiteSpace: "nowrap" }}>
            {Array.from(w).map((c) => {
              const idx = i++;
              return (
                <span
                  key={idx}
                  className={`ch ${charClass}`}
                  style={shimmer ? { animationDelay: `${-idx * 0.28}s` } : undefined}
                >
                  {c}
                </span>
              );
            })}
          </span>
          {wi < words.length - 1 ? " " : null}
        </span>
      ))}
    </Tag>
  );
}
