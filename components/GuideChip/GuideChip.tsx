"use client";

import { FileText } from "lucide-react";
import { useSourceSheet } from "@/components/SourceSheet/SourceSheet";

/**
 * "Guide · S2": the one Guide chip, used everywhere a guide section is referenced. A reference, not an action. Smaller than a button and without a border, but its
 * tap area still reaches 44px. With showTitle, also the section title. Opens the source sheet.
 */
export function GuideChip({
  sectionId,
  showTitle = false,
}: {
  sectionId: string;
  showTitle?: boolean;
}) {
  const { sections, open } = useSourceSheet();
  const title = sections.find((section) => section.id === sectionId)?.title;

  return (
    <button
      type="button"
      onClick={() => open(sectionId)}
      className="relative inline-flex min-h-9 items-center gap-1.5 rounded-full bg-neutral-surface px-3 text-left type-small text-text before:absolute before:-inset-y-1 before:inset-x-0 before:content-[''] active:bg-neutral-surface-pressed"
    >
      <FileText
        size={14}
        strokeWidth={2}
        aria-hidden="true"
        className="shrink-0 text-text-secondary"
      />
      <span>Guide · {sectionId}</span>
      {showTitle && title && <span>· {title}</span>}
    </button>
  );
}
