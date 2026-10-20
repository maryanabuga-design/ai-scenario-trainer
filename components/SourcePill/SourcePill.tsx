"use client";

import { FileText } from "lucide-react";
import Link from "next/link";
import { useSourceSheet } from "@/components/SourceSheet/SourceSheet";
import { readingPath } from "@/lib/reading";

/**
 * A source of an Ask AI answer ("S3 · Moving through smoke", DESIGN.md: Ask AI): a Guide-style pill that
 * opens the reading screen of that guide section. Its tap area reaches 44px.
 */
export function SourcePill({ sectionId }: { sectionId: string }) {
  const { sections } = useSourceSheet();
  const title = sections.find((section) => section.id === sectionId)?.title;
  return (
    <Link
      href={readingPath(sectionId)}
      data-source-pill={sectionId}
      className="type-small relative inline-flex min-h-9 max-w-full items-center gap-1.5 rounded-full bg-pastel-sand px-3 text-text before:absolute before:-inset-y-1 before:inset-x-0 before:content-[''] has-focus-visible:outline-2"
    >
      <FileText
        size={14}
        strokeWidth={2}
        aria-hidden="true"
        className="shrink-0 text-text-secondary"
      />
      <span className="truncate">
        {sectionId}
        {title ? ` · ${title}` : ""}
      </span>
    </Link>
  );
}
