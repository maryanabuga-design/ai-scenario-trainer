"use client";

import { FileUp, LoaderCircle } from "lucide-react";
import Link from "next/link";
import { useRef, useState } from "react";
import { ActionBar } from "@/components/ActionBar/ActionBar";
import { Button, ButtonLink } from "@/components/Button/Button";
import { Card } from "@/components/Card/Card";
import { Chevron } from "@/components/Chevron/Chevron";
import { ConfirmDialog } from "@/components/ConfirmDialog/ConfirmDialog";
import { Amber } from "@/components/InstructorContent/Amber";
import { PageHeaderBand } from "@/components/PageHeaderBand/PageHeaderBand";
import { TextField } from "@/components/TextField/TextField";
import { checkFile, sizeText } from "@/lib/content-import";
import type { ImportDraft } from "@/lib/import-draft";

export const FILE_HELP = "CSV, Excel, Word or PDF · up to 5 MB";
export const INFO_TITLE = "One row is one question";
export const INFO_TEXT =
  "Download the template, fill it in and choose it above. Word, Excel and PDF files are not read in this prototype; a sample result is shown. A person always reviews before publishing.";
export const TOPIC_PICKER = "/instructor/content/import/topic";

/**
 * Import questions (DESIGN.md: Instructor, Content): ONE scrolling screen in the order FILE, TITLE
 * (prefilled from the file name), TOPIC (found in the file, or chosen on its own screen) and the card
 * "One row is one question". Pinned: Primary "Import and review" (disabled until a file, a title and a
 * topic exist) and Secondary "Cancel" (a dialog only when something was entered). A file problem is
 * amber text, never red.
 */
export function ImportView({
  draft,
  topicTitle,
  onFile,
  onRemoveFile,
  onTitle,
  onImport,
  onCancel,
  reading = false,
  readError = "",
  confirmingInitially = false,
  dialogInline = false,
}: {
  draft: Pick<ImportDraft, "title" | "topic" | "detected"> & {
    file: { name: string; size: number } | null;
  };
  /** The title of a guide topic. */
  topicTitle: (id: string) => string;
  onFile: (file: File) => void;
  onRemoveFile: () => void;
  onTitle: (title: string) => void;
  onImport: () => void;
  onCancel: () => void;
  /** The short "Reading questions..." state before the Review opens. */
  reading?: boolean;
  /** What the reader said about the file (empty, no question column), in amber. */
  readError?: string;
  confirmingInitially?: boolean;
  dialogInline?: boolean;
}) {
  const [problem, setProblem] = useState("");
  const [confirming, setConfirming] = useState(confirmingInitially);
  const input = useRef<HTMLInputElement>(null);
  const { file, title, detected } = draft;
  const topic = detected ?? draft.topic;
  const entered = title.trim() !== "" || topic !== null || file !== null;
  const ready = file !== null && title.trim() !== "" && topic !== null;

  function choose(chosen: File | undefined) {
    if (!chosen) return;
    const error = checkFile(chosen);
    setProblem(error ?? "");
    if (!error) onFile(chosen);
    if (input.current) input.current.value = "";
  }

  const header = (
    <PageHeaderBand
      title="Import questions"
      back={{ label: "Back to Content", href: "/instructor/content" }}
    />
  );

  if (reading) {
    return (
      <div className="flex flex-col gap-6 pb-4">
        {header}
        <div
          role="status"
          data-reading
          className="type-body flex flex-col items-center gap-4 py-12 text-text-secondary"
        >
          <LoaderCircle
            size={32}
            strokeWidth={2}
            aria-hidden="true"
            className="animate-spin motion-reduce:animate-none"
          />
          Reading questions...
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 pb-4">
      {header}

      <section aria-labelledby="file-label" className="flex flex-col gap-3">
        <h2 id="file-label" className="type-label text-text-secondary">
          FILE
        </h2>
        <div
          data-file-area
          className="flex flex-col items-center gap-3 rounded-card border-[1.5px] border-dashed border-placeholder-stroke px-4 py-6 text-center"
        >
          <FileUp size={32} strokeWidth={1.75} aria-hidden="true" className="text-text-secondary" />
          <p className="type-body text-text-secondary">{FILE_HELP}</p>
          <input
            ref={input}
            type="file"
            accept=".csv,.xlsx,.docx,.pdf"
            aria-label="Choose file"
            data-file-input
            className="sr-only"
            tabIndex={-1}
            onChange={(event) => choose(event.target.files?.[0])}
          />
          <Button variant="secondary" wide={false} onClick={() => input.current?.click()}>
            Choose file
          </Button>
        </div>
        {(problem || readError) && <Amber id="file-problem">{problem || readError}</Amber>}
        {file && (
          <div
            data-file-row
            className="flex min-h-14 items-center gap-3 rounded-card bg-card px-4 py-2 shadow-(--card-shadow)"
          >
            <span className="flex min-w-0 flex-1 flex-col">
              <span data-file-name className="type-body-strong truncate">
                {file.name}
              </span>
              <span className="type-small text-text-secondary">{sizeText(file.size)}</span>
            </span>
            <Button
              variant="secondary"
              wide={false}
              compact
              onClick={() => {
                setProblem("");
                onRemoveFile();
              }}
            >
              Remove
            </Button>
          </div>
        )}
        <div className="-ml-3 self-start">
          <ButtonLink
            variant="tertiary"
            href="/templates/question-template.csv"
            download="question-template.csv"
          >
            Download CSV template
          </ButtonLink>
        </div>
      </section>

      <section aria-labelledby="set-title-label" className="flex flex-col gap-2">
        <h2 id="set-title-label" className="type-label text-text-secondary">
          TITLE
        </h2>
        <TextField label="Set title" hideLabel name="set-title" value={title} onChange={onTitle} />
      </section>

      <section aria-labelledby="topic-label" className="flex flex-col gap-2">
        <h2 id="topic-label" className="type-label text-text-secondary">
          TOPIC
        </h2>
        {detected ? (
          <div
            data-topic-detected
            className="type-body-strong flex h-16 items-center rounded-card border border-secondary-sand-pressed bg-secondary-sand px-4 text-text"
          >
            <span className="min-w-0 truncate">
              Detected from file: {detected} {topicTitle(detected)}
            </span>
          </div>
        ) : (
          <Link
            href={TOPIC_PICKER}
            data-topic-row
            className="flex h-16 items-center gap-3 rounded-card border border-selectable-stroke bg-card px-4 has-focus-visible:outline-2"
          >
            <span className="type-body-strong shrink-0">Topic</span>
            <span
              data-topic-value
              className={`type-body min-w-0 flex-1 truncate text-right ${draft.topic ? "" : "text-text-secondary"}`}
            >
              {draft.topic ? `${draft.topic} ${topicTitle(draft.topic)}` : "Choose a topic"}
            </span>
            <Chevron />
          </Link>
        )}
      </section>

      <Card className="flex flex-col gap-2">
        <h2 className="type-body-strong">{INFO_TITLE}</h2>
        <p className="type-small text-text-secondary">{INFO_TEXT}</p>
      </Card>

      <ActionBar>
        <Button disabled={!ready} onClick={onImport}>
          Import and review
        </Button>
        <Button variant="secondary" onClick={() => (entered ? setConfirming(true) : onCancel())}>
          Cancel
        </Button>
      </ActionBar>

      {(confirming || !dialogInline) && (
        <ConfirmDialog
          open={confirming}
          inline={dialogInline}
          title="Discard this import?"
          description="What you entered will be lost."
          confirmLabel="Discard"
          cancelLabel="Keep editing"
          onConfirm={() => {
            setConfirming(false);
            onCancel();
          }}
          onCancel={() => setConfirming(false)}
        />
      )}
    </div>
  );
}
