"use client";

import { useSourceSheet } from "@/components/SourceSheet/SourceSheet";

/** "Guide · S2". With showTitle, also the section title. Opens the section in the source sheet. */
export function SourceChip({ sectionId, showTitle = false }: { sectionId: string; showTitle?: boolean }) {
  const { sections, open } = useSourceSheet();
  const title = sections.find((section) => section.id === sectionId)?.title;

  return (
    <button
      type="button"
      onClick={() => open(sectionId)}
      className="inline-flex min-h-11 items-center gap-1 rounded-full border border-border bg-surface px-3 text-sm text-text hover:bg-surface-muted"
    >
      <span>Guide · {sectionId}</span>
      {showTitle && title && <span className="text-text-secondary">· {title}</span>}
    </button>
  );
}
