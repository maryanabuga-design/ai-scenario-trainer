import type { ReactNode } from "react";

type Tone = "yellow" | "peach" | "blue" | "lilac" | "sage";

const tones: Record<Tone, string> = {
  yellow: "border border-tag-yellow-stroke bg-tag-yellow",
  peach: "border border-tag-peach-stroke bg-tag-peach",
  blue: "border border-tag-blue-stroke bg-tag-blue",
  lilac: "border border-tag-lilac-stroke bg-tag-lilac",
  sage: "border border-tag-sage-stroke bg-tag-sage",
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
