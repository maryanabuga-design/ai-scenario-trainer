import type { ReactNode } from "react";
import { Chip } from "@/components/Chip/Chip";
import type { ChipTone } from "@/components/Chip/Chip";

type Tone = Extract<ChipTone, "yellow" | "peach" | "blue" | "lilac" | "olive">;

/**
 * A category label, drawn by the shared Chip.
 */
export function Tag({ tone = "yellow", children }: { tone?: Tone; children: ReactNode }) {
  return (
    <Chip tone={tone} size="label">
      {children}
    </Chip>
  );
}
