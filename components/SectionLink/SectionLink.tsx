"use client";

import { useSourceSheet } from "@/components/SourceSheet/SourceSheet";

/** A quiet list row for a guide section. Opens the section in the source sheet. */
export function SectionLink({ sectionId, title }: { sectionId: string; title: string }) {
  const { open } = useSourceSheet();

  return (
    <button
      type="button"
      onClick={() => open(sectionId)}
      className="flex min-h-12 w-full items-center gap-3 py-2 text-left text-sm hover:underline"
    >
      <span className="w-8 shrink-0 text-text-secondary tabular-nums">{sectionId}</span>
      <span className="flex-1">{title}</span>
      <span aria-hidden="true" className="text-text-secondary">
        ›
      </span>
    </button>
  );
}
