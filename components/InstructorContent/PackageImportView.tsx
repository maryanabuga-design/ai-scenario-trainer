"use client";

import { FileSpreadsheet, X } from "lucide-react";
import { ChevronDown } from "lucide-react";
import { useRef, useState } from "react";
import { ActionBar } from "@/components/ActionBar/ActionBar";
import { Button, ButtonLink } from "@/components/Button/Button";
import { Amber } from "@/components/InstructorContent/Amber";
import { Notice } from "@/components/Notice/Notice";
import { PageHeaderBand } from "@/components/PageHeaderBand/PageHeaderBand";
import { sizeText } from "@/lib/content-import";

export const CHOOSE_TITLE = "Choose a document";
export const CHOOSE_HELP = "Excel (.xlsx), up to 10 MB";
export const IMAGES_LINE = "You can also add them later.";
export const ACCEPT = ".xlsx";
export const IMAGE_ACCEPT = ".png,.jpg,.jpeg,.webp";

const INCLUDE: { name: string; note: string; required?: boolean }[] = [
  { name: "Guide", note: "The sections people learn from, in order. Required.", required: true },
  { name: "Steps", note: "Short step guides that rely on a guide section. Optional." },
  { name: "Scenario", note: "Situations with four answers and one correct. Optional." },
  { name: "Questions", note: "Quiz questions with four answers and one correct. Optional." },
];

/**
 * A small "x" in the top-right corner of a card: a 28px neutral circle inside a 44px tap area that
 * extends inward, so nothing overlaps the text next to it.
 */
function RemoveCorner({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      data-remove
      className="absolute top-0 right-0 flex h-11 w-11 items-start justify-end p-1.5 focus-visible:outline-2"
    >
      <span
        aria-hidden="true"
        className="flex h-7 w-7 items-center justify-center rounded-full bg-neutral-tile-bg text-neutral-tile-ink"
      >
        <X size={14} strokeWidth={2.25} />
      </span>
    </button>
  );
}

/**
 * Import content (DESIGN.md: One document in, a draft topic out): ONE large card "Choose a document"
 * that becomes ONE file card (name, size, a corner x), the tertiary links "Download template" and
 * "Use sample document", the collapsed row "What to include", the optional images, plain messages
 * under the file card, and the pinned Primary "Import and review" above Secondary "Cancel". Nothing
 * is uploaded: the document is read on this device.
 */
export function PackageImportView({
  file,
  message = "",
  images,
  imageMessage = "",
  notice = "",
  includeOpen = false,
  onFile,
  onRemove,
  onSample,
  onImages,
  onImport,
  onCancel,
}: {
  file: { name: string; size: number } | null;
  /** The plain message under the file card; any message blocks the Primary. */
  message?: string;
  /** The names of the pictures added so far. */
  images: string[];
  imageMessage?: string;
  /** Replace document: what the new document replaces. */
  notice?: string;
  /** For the review page: "What to include" drawn open. */
  includeOpen?: boolean;
  onFile: (file: File) => void;
  onRemove: () => void;
  onSample: () => void;
  onImages: (files: File[]) => void;
  onImport: () => void;
  onCancel: () => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const pictures = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(includeOpen);
  const canImport = file !== null && message === "";
  return (
    <div className="flex flex-col gap-6 pb-4">
      <PageHeaderBand
        title="Import content"
        back={{ label: "Back to Content", href: "/instructor/content" }}
      />
      {notice && (
        <Notice variant="info" clamp={false} title="Replace document">
          {notice}
        </Notice>
      )}

      <section aria-label="Document" className="flex flex-col gap-3">
        <input
          ref={input}
          type="file"
          accept={ACCEPT}
          aria-label="Choose a document"
          data-file-input
          className="sr-only"
          tabIndex={-1}
          onChange={(event) => {
            const chosen = event.target.files?.[0];
            if (chosen) onFile(chosen);
            event.target.value = "";
          }}
        />
        {file ? (
          <div
            data-file-card
            className="relative flex min-h-[72px] items-center gap-3 rounded-card border border-selectable-stroke bg-card px-3 py-2 pr-12"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-neutral-tile-bg text-neutral-tile-ink">
              <FileSpreadsheet size={20} strokeWidth={1.75} aria-hidden="true" />
            </span>
            <span className="flex min-w-0 flex-col">
              <span data-file-name className="type-body-strong break-words">
                {file.name}
              </span>
              <span className="type-small text-text-secondary">{sizeText(file.size)}</span>
            </span>
            <RemoveCorner label="Remove file" onClick={onRemove} />
          </div>
        ) : (
          <button
            type="button"
            data-drop-area
            onClick={() => input.current?.click()}
            className="flex min-h-[160px] w-full flex-col items-center justify-center gap-2 rounded-card border border-dashed border-placeholder-stroke bg-card p-[var(--gutter,1rem)] text-center focus-visible:outline-2"
          >
            <FileSpreadsheet
              size={28}
              strokeWidth={1.75}
              aria-hidden="true"
              className="text-text-secondary"
            />
            <span className="type-body-strong">{CHOOSE_TITLE}</span>
            <span className="type-small text-text-secondary">{CHOOSE_HELP}</span>
          </button>
        )}
        {message && <Amber id="import-message">{message}</Amber>}
        <div className="flex flex-wrap items-center gap-x-2">
          <ButtonLink
            href="/templates/guide-template.xlsx"
            download="guide-template.xlsx"
            variant="tertiary"
            wide={false}
          >
            Download template
          </ButtonLink>
          <Button variant="tertiary" onClick={onSample}>
            Use sample document
          </Button>
        </div>
      </section>

      <section
        aria-label="What to include"
        className="rounded-card border border-selectable-stroke bg-card"
      >
        <button
          type="button"
          aria-expanded={open}
          aria-controls="include-panel"
          onClick={() => setOpen(!open)}
          className="flex min-h-11 w-full items-center justify-between gap-3 px-[var(--gutter,1rem)] py-3 text-left focus-visible:outline-2"
        >
          <span className="type-body-strong">What to include</span>
          <ChevronDown
            size={20}
            aria-hidden="true"
            className={`shrink-0 text-text-secondary ${open ? "rotate-180" : ""}`}
          />
        </button>
        {open && (
          <div id="include-panel" className="flex flex-col gap-3 px-[var(--gutter,1rem)] pb-4">
            <ul className="flex flex-col gap-2">
              {INCLUDE.map((part) => (
                <li key={part.name} className="type-small text-text-secondary">
                  <span className="type-body-strong text-text">{part.name}</span>
                  {" · "}
                  {part.note}
                </li>
              ))}
            </ul>
            <p className="type-small text-text-secondary">
              Every step, scenario step and question points to a guide section. Only questions?{" "}
              <ButtonLink
                href="/instructor/content/import/questions"
                variant="tertiary"
                compact
                wide={false}
              >
                Import a question set
              </ButtonLink>
            </p>
          </div>
        )}
      </section>

      {file && (
        <section aria-labelledby="images-label" className="flex flex-col gap-3">
          <h2 id="images-label" className="type-label text-text-secondary">
            IMAGES (OPTIONAL)
          </h2>
          <input
            ref={pictures}
            type="file"
            multiple
            accept={IMAGE_ACCEPT}
            aria-label="Choose images"
            data-image-input
            className="sr-only"
            tabIndex={-1}
            onChange={(event) => {
              onImages(Array.from(event.target.files ?? []));
              event.target.value = "";
            }}
          />
          <Button variant="secondary" onClick={() => pictures.current?.click()}>
            Add images
          </Button>
          {images.length > 0 ? (
            <p data-images className="type-small text-text-secondary">
              {images.length} {images.length === 1 ? "image" : "images"} added: {images.join(", ")}
            </p>
          ) : (
            <p className="type-small text-text-secondary">{IMAGES_LINE}</p>
          )}
          {imageMessage && <Amber>{imageMessage}</Amber>}
        </section>
      )}

      <ActionBar>
        <Button disabled={!canImport} onClick={onImport}>
          Import and review
        </Button>
        <Button variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
      </ActionBar>
    </div>
  );
}
