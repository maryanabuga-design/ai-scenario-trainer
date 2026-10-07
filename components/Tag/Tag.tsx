import type { ReactNode } from "react";

type Tone = "yellow" | "peach" | "blue" | "lilac";

const tones: Record<Tone, string> = {
  yellow: "bg-tag-yellow",
  peach: "bg-tag-peach",
  blue: "bg-tag-blue",
  lilac: "bg-tag-lilac",
};

export function Tag({ tone = "yellow", children }: { tone?: Tone; children: ReactNode }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs leading-none font-medium tracking-[0.04em] text-text uppercase ${tones[tone]}`}
    >
      {children}
    </span>
  );
}
