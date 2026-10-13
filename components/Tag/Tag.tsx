import type { ReactNode } from "react";

type Tone = "yellow" | "peach" | "blue" | "lilac" | "sage";

const tones: Record<Tone, string> = {
  yellow: "bg-tag-yellow",
  peach: "bg-tag-peach",
  blue: "bg-tag-blue",
  lilac: "bg-tag-lilac",
  sage: "bg-tag-sage",
};

/** A category label. `sentenceCase` keeps the text as written (only the direction chip on Home). */
export function Tag({
  tone = "yellow",
  sentenceCase = false,
  children,
}: {
  tone?: Tone;
  sentenceCase?: boolean;
  children: ReactNode;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 type-label text-text ${tones[tone]} ${sentenceCase ? "normal-case" : ""}`}
    >
      {children}
    </span>
  );
}
