import { Lightbulb } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

/**
 * The one note (DESIGN.md: One icon tile, a round topic code and a shared note): a soft sand band
 * with a 40px round tile holding an icon (the lightbulb, the icon of "note / tip" in the whole app),
 * a thin vertical divider and the text in the muted style. The text wraps inside its own column; the
 * tile and the divider keep their size and are centred against the text. The tile is a little
 * darker than the band so that it can be seen on it.
 */
export function TipNote({
  children,
  icon: Icon = Lightbulb,
  noteId,
}: {
  children: ReactNode;
  icon?: LucideIcon;
  /** For tests and the review page: the `data-` attribute name without the prefix. */
  noteId?: string;
}) {
  return (
    <div
      {...(noteId ? { [`data-${noteId}`]: "" } : {})}
      data-tip-note
      className="flex items-center gap-3 rounded-[14px] bg-secondary-sand px-4 py-3"
    >
      <span
        aria-hidden="true"
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-neutral-tile-bg text-neutral-tile-ink"
      >
        <Icon size={20} strokeWidth={2} />
      </span>
      <span aria-hidden="true" className="h-8 w-px shrink-0 bg-selectable-stroke" />
      <p className="type-small min-w-0 flex-1 text-text-secondary">{children}</p>
    </div>
  );
}
