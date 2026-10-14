import type { ReactNode } from "react";
import { Chip } from "@/components/Chip/Chip";
import type { ChipTone } from "@/components/Chip/Chip";

type Tone = Extract<ChipTone, "yellow" | "peach" | "blue" | "lilac" | "green">;

/**
 * A category label, drawn by the shared Chip; primary while its SelectableCard is selected.
 * `sentenceCase` keeps the text as written (only the direction chip on Home).
 */
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
    <Chip tone={tone} size="label" sentenceCase={sentenceCase}>
      {children}
    </Chip>
  );
}
