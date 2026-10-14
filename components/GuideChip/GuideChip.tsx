"use client";

import { FileText } from "lucide-react";
import { Chip } from "@/components/Chip/Chip";
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
    <Chip
      as="button"
      tone="sand"
      size="small"
      onClick={() => open(sectionId)}
      className="relative min-h-9 text-left before:absolute before:-inset-y-1 before:inset-x-0 before:content-['']"
    >
      <FileText
        size={14}
        strokeWidth={2}
        aria-hidden="true"
        className="shrink-0 text-text-secondary"
      />
      <span>Guide · {sectionId}</span>
      {showTitle && title && <span>· {title}</span>}
    </Chip>
  );
}
