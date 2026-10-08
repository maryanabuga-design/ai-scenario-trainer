"use client";

import { useSourceSheet } from "@/components/SourceSheet/SourceSheet";

/**
 * "Guide · S2": a reference, not an action. Smaller than a button and without a border, but its
 * tap area still reaches 44px. With showTitle, also the section title. Opens the source sheet.
 */
export function SourceChip({
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
      className="relative inline-flex min-h-9 items-center gap-1.5 rounded-full bg-surface-muted px-3 text-left text-sm text-text before:absolute before:-inset-y-1 before:inset-x-0 before:content-[''] hover:bg-border active:bg-border"
    >
      <svg
        viewBox="0 0 24 24"
        width="14"
        height="14"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        className="shrink-0 text-text-secondary"
      >
        <path d="M6 3h8l4 4v14H6zM14 3v4h4M9 12h6M9 16h6" />
      </svg>
      <span>Guide · {sectionId}</span>
      {showTitle && title && <span className="text-text-secondary">· {title}</span>}
    </button>
  );
}
