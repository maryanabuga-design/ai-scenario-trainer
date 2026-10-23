"use client";

import {
  BookOpen,
  FileText,
  Image as ImageIcon,
  ListChecks,
  LoaderCircle,
  X,
  Route,
  ClipboardCheck,
  Shapes,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Image from "next/image";
import { useRef } from "react";
import { ActionBar } from "@/components/ActionBar/ActionBar";
import { Button, ButtonLink } from "@/components/Button/Button";
import { Amber } from "@/components/InstructorContent/Amber";
import { Notice } from "@/components/Notice/Notice";
import { PageHeaderBand } from "@/components/PageHeaderBand/PageHeaderBand";
import { SelectableRow } from "@/components/SelectableRow/SelectableRow";
import { TextField } from "@/components/TextField/TextField";
import { LucideTile } from "@/components/TopicTile/TopicTile";
import { checkPackage, imagesLabel, missingImages, shortName } from "@/lib/package-read";
import type { PartKind, ReadOutcome } from "@/lib/package-read";

export const FILES_HELP = "CSV files and images · choose them together";
export const INFO_TITLE = "How the package is read";
export const INFO_TEXT =
  "Each CSV describes one part: topic, guide, steps, scenario or questions. Choose all files together, with the images they mention. Steps, scenario and questions should point to the guide section they rely on. Word, Excel and PDF files are not read in this prototype. A person always reviews before publishing.";
export const FIX_IN_REVIEW = "You can import now and fix the issues in the review.";
export const ACCEPT = ".csv,.png,.jpg,.jpeg,.webp";

const ICONS: Record<PartKind | "images", LucideIcon> = {
  topic: Shapes,
  guide: BookOpen,
  steps: ListChecks,
  scenario: Route,
  questions: ClipboardCheck,
  images: ImageIcon,
};

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
      className="absolute top-0 right-0 flex h-11 w-11 items-start justify-end p-1.5 has-focus-visible:outline-2 focus-visible:outline-2"
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

export type QuestionsChoice = "builtin" | "package" | null;

/**
 * Import content (DESIGN.md: Instructor, content package import and demo topics): FILES (choose
 * several at once, what was recognised, one row per part with its status pill and Remove), the
 * download links, TITLE and SUMMARY, and the pinned Primary "Import and review" above Secondary
 * "Cancel". Nothing is uploaded: the files are read on this device.
 */
export function PackageImportView({
  outcome,
  title,
  summary,
  reading = false,
  notice = "",
  extraMessage = "",
  onlyQuestions = false,
  questionsChoice,
  onChoice,
  onFiles,
  onRemove,
  onTitle,
  onSummary,
  onImport,
  onCancel,
}: {
  outcome: ReadOutcome;
  title: string;
  summary: string;
  reading?: boolean;
  /** A clear message at the top (Replace files, a full device). */
  notice?: string;
  extraMessage?: string;
  /** Only a questions file was chosen: ask where it goes. */
  onlyQuestions?: boolean;
  questionsChoice: QuestionsChoice;
  onChoice: (choice: Exclude<QuestionsChoice, null>) => void;
  onFiles: (files: File[]) => void;
  /** Removes the file (or all pictures) of a recognised row. */
  onRemove: (row: { part: PartKind | "images"; fileName?: string }) => void;
  onTitle: (value: string) => void;
  onSummary: (value: string) => void;
  onImport: () => void;
  onCancel: () => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const issues = checkPackage(outcome.data);
  const blockingBy = (part: string) => issues.filter((i) => i.blocking && i.part === part).length;
  const rows = [
    ...outcome.recognised,
    ...(imagesLabel(outcome.data)
      ? [{ part: "images" as const, label: imagesLabel(outcome.data)! }]
      : []),
  ];
  const ready = outcome.recognised.length > 0 && title.trim() !== "";
  const canImport = ready && !reading && (!onlyQuestions || questionsChoice !== null);
  return (
    <div className="flex flex-col gap-6 pb-4">
      <PageHeaderBand
        title="Import content"
        subtitle="Create a demo topic from files"
        back={{ label: "Back to Content", href: "/instructor/content" }}
      />
      {notice && (
        <Notice variant="to-fix" alert clamp={false} title="Choose the corrected files">
          {notice}
        </Notice>
      )}

      <section aria-labelledby="files-label" className="flex flex-col gap-3">
        <h2 id="files-label" className="type-label text-text-secondary">
          FILES
        </h2>
        <div
          data-drop-area
          className="flex flex-col items-center gap-3 rounded-card border border-dashed border-placeholder-stroke bg-card p-[var(--gutter,1rem)] text-center"
        >
          <FileText
            size={28}
            strokeWidth={1.75}
            aria-hidden="true"
            className="text-text-secondary"
          />
          <p className="type-body-strong">{FILES_HELP}</p>
          <input
            ref={input}
            type="file"
            multiple
            accept={ACCEPT}
            aria-label="Choose files"
            data-file-input
            className="sr-only"
            tabIndex={-1}
            onChange={(event) => {
              onFiles(Array.from(event.target.files ?? []));
              event.target.value = "";
            }}
          />
          <Button variant="secondary" onClick={() => input.current?.click()}>
            Choose files
          </Button>
        </div>

        {outcome.messages.map((message) => (
          <Amber key={message}>{message}</Amber>
        ))}
        {extraMessage && <Amber>{extraMessage}</Amber>}

        {rows.length > 0 && (
          <ul data-recognised className="flex flex-col gap-2">
            {rows.map((row) => {
              const fileName =
                "fileName" in row ? (row as { fileName?: string }).fileName : undefined;
              const missing = row.part === "images" ? missingImages(outcome.data) : [];
              const problems = row.part === "images" ? missing.length : blockingBy(row.part);
              const pill =
                row.part === "images" && problems > 0
                  ? `${problems} to add`
                  : problems > 0
                    ? `${problems} to fix`
                    : "Ready";
              const isImages = row.part === "images";
              const pictures = isImages ? Object.entries(outcome.data.images) : [];
              return (
                <li
                  key={`${row.part}-${fileName ?? ""}`}
                  data-recognised-row={row.part}
                  className="relative flex min-h-[72px] flex-col gap-3 rounded-card border border-selectable-stroke bg-card px-3 py-2"
                >
                  <div className="flex items-center gap-3 pr-8">
                    <LucideTile icon={ICONS[row.part]} size="tile" />
                    <span className="flex min-w-0 flex-1 flex-col gap-1">
                      <span className="type-body-strong">{row.label}</span>
                      <span
                        data-row-pill={problems > 0 ? "to-fix" : "ready"}
                        className={`type-caption w-fit rounded-full px-2.5 py-0.5 whitespace-nowrap ${
                          problems > 0
                            ? "bg-status-attention-bg text-status-attention-ink"
                            : "bg-status-success-bg text-status-success-ink"
                        }`}
                      >
                        {pill}
                      </span>
                      {missing.length > 0 && (
                        <span data-missing className="type-small text-text-secondary">
                          Missing: {missing.join(", ")}
                        </span>
                      )}
                      {fileName && (
                        <span
                          data-file-name
                          aria-label={fileName}
                          className="type-small text-text-secondary"
                        >
                          <span aria-hidden="true">{shortName(fileName)}</span>
                        </span>
                      )}
                    </span>
                  </div>
                  {isImages && (pictures.length > 0 || missing.length > 0) && (
                    <ul data-thumbnails className="flex flex-wrap gap-3">
                      {pictures.map(([name, picture]) => (
                        <li
                          key={name}
                          data-thumbnail={name}
                          className="flex w-16 flex-col items-start gap-1"
                        >
                          <span className="relative block h-14 w-14">
                            <Image
                              src={picture.data}
                              alt=""
                              width={56}
                              height={56}
                              unoptimized
                              className="h-14 w-14 rounded-[12px] border border-selectable-stroke object-cover"
                            />
                            <RemoveCorner
                              label={`Remove ${name}`}
                              onClick={() => onRemove({ part: "images", fileName: name })}
                            />
                          </span>
                          <span
                            aria-label={name}
                            className="type-caption w-full truncate text-text-secondary"
                          >
                            <span aria-hidden="true">{shortName(name, 12)}</span>
                          </span>
                        </li>
                      ))}
                      {missing.map((name) => (
                        <li
                          key={name}
                          data-thumbnail-missing={name}
                          className="flex w-16 flex-col items-start gap-1"
                        >
                          <span
                            aria-hidden="true"
                            className="flex h-14 w-14 items-center justify-center rounded-[12px] border-[1.5px] border-dashed border-placeholder-stroke text-text-secondary"
                          >
                            <ImageIcon size={20} strokeWidth={1.75} />
                          </span>
                          <span
                            aria-label={`${name}, missing`}
                            className="type-caption w-full truncate text-text-secondary"
                          >
                            <span aria-hidden="true">{shortName(name, 12)}</span>
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                  {!isImages && (
                    <RemoveCorner
                      label={`Remove ${fileName ?? row.part}`}
                      onClick={() => onRemove({ part: row.part, fileName })}
                    />
                  )}
                </li>
              );
            })}
          </ul>
        )}

        {rows.some((row) =>
          row.part === "images" ? missingImages(outcome.data).length > 0 : blockingBy(row.part) > 0,
        ) && (
          <p data-fix-in-review className="type-small text-text-secondary">
            {FIX_IN_REVIEW}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-x-2">
          <ButtonLink
            href="/templates/csv-templates.zip"
            download="csv-templates.zip"
            variant="tertiary"
          >
            Download templates
          </ButtonLink>
          <ButtonLink
            href="/templates/sample-package.zip"
            download="sample-package.zip"
            variant="tertiary"
          >
            Download sample package
          </ButtonLink>
        </div>
      </section>

      <div className="flex flex-col gap-1">
        <Notice variant="info" clamp={false} title={INFO_TITLE}>
          {INFO_TEXT}
        </Notice>
        <div className="-ml-3 self-start">
          <ButtonLink href="/instructor/content/import/questions" variant="tertiary">
            Import questions to a built-in topic
          </ButtonLink>
        </div>
      </div>

      {onlyQuestions && (
        <section aria-labelledby="where-label" className="flex flex-col gap-3">
          <h2 id="where-label" className="type-label text-text-secondary">
            WHERE SHOULD THE QUESTIONS GO?
          </h2>
          <fieldset
            role="radiogroup"
            aria-labelledby="where-label"
            className="flex min-w-0 flex-col gap-2"
          >
            <SelectableRow
              name="questions-choice"
              value="builtin"
              compact
              checked={questionsChoice === "builtin"}
              onChange={() => onChoice("builtin")}
            >
              <span className="type-body-strong">Add to a built-in topic</span>
            </SelectableRow>
            <SelectableRow
              name="questions-choice"
              value="package"
              compact
              checked={questionsChoice === "package"}
              onChange={() => onChoice("package")}
            >
              <span className="type-body-strong">Create a demo topic</span>
            </SelectableRow>
          </fieldset>
        </section>
      )}

      <section aria-labelledby="title-label" className="flex flex-col gap-2">
        <h2 id="title-label" className="type-label text-text-secondary">
          TITLE
        </h2>
        <TextField
          label="Topic title"
          hideLabel
          name="topic-title"
          value={title}
          onChange={onTitle}
        />
      </section>
      <section aria-labelledby="summary-label" className="flex flex-col gap-2">
        <h2 id="summary-label" className="type-label text-text-secondary">
          SUMMARY
        </h2>
        <TextField
          label="Summary"
          hideLabel
          name="topic-summary"
          rows={2}
          value={summary}
          onChange={onSummary}
        />
      </section>

      {reading && (
        <p
          role="status"
          data-reading
          className="type-small flex items-center justify-center gap-2 text-text-secondary"
        >
          <LoaderCircle
            size={16}
            aria-hidden="true"
            className="animate-spin motion-reduce:animate-none"
          />
          Reading the files
        </p>
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
