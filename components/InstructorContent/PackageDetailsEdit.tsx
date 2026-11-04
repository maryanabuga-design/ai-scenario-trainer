"use client";

import { useState } from "react";
import { ActionBar } from "@/components/ActionBar/ActionBar";
import { Button } from "@/components/Button/Button";
import { PageHeaderBand } from "@/components/PageHeaderBand/PageHeaderBand";
import { TextField } from "@/components/TextField/TextField";

export const TITLE_MAX = 120;
export const SUMMARY_MAX = 400;

/**
 * Edit title and summary (DESIGN.md: One document in, a draft topic out): the two texts of a topic as
 * plain text, Primary Save (disabled while the title is empty) above Secondary Cancel. Reached from
 * the topic menu.
 */
export function PackageDetailsEdit({
  title,
  summary,
  backHref,
  onSave,
  onCancel,
}: {
  title: string;
  summary: string;
  backHref: string;
  onSave: (title: string, summary: string) => void;
  onCancel: () => void;
}) {
  const [draftTitle, setTitle] = useState(title);
  const [draftSummary, setSummary] = useState(summary);
  return (
    <div className="flex flex-col gap-6 pb-4 idesk:[&>*:not([data-page-header-band])]:max-w-[720px]">
      <PageHeaderBand
        title="Edit title and summary"
        back={{ label: "Back to topic", href: backHref }}
      />
      <div className="contents idesk:block">
        <div className="idesk:max-w-[560px]">
          <TextField label="Title" name="title" value={draftTitle} onChange={setTitle} />
        </div>
      </div>
      <section aria-labelledby="details-summary" className="flex flex-col gap-2">
        <h2 id="details-summary" className="type-label text-text-secondary">
          SUMMARY
        </h2>
        <textarea
          aria-labelledby="details-summary"
          rows={4}
          maxLength={SUMMARY_MAX}
          value={draftSummary}
          onChange={(event) => setSummary(event.target.value)}
          className="type-body min-h-24 w-full rounded-[14px] border border-selectable-stroke bg-card px-[var(--gutter,1rem)] py-3 text-text focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-primary"
        />
      </section>
      <ActionBar inHeader>
        <Button
          disabled={draftTitle.trim() === ""}
          onClick={() => onSave(draftTitle, draftSummary)}
        >
          Save
        </Button>
        <Button variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
      </ActionBar>
    </div>
  );
}
