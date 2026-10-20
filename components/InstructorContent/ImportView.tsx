"use client";

import { FileUp, LoaderCircle } from "lucide-react";
import { useRef, useState } from "react";
import { ActionBar } from "@/components/ActionBar/ActionBar";
import { Button, ButtonLink } from "@/components/Button/Button";
import { Card } from "@/components/Card/Card";
import { ConfirmDialog } from "@/components/ConfirmDialog/ConfirmDialog";
import { Amber } from "@/components/InstructorContent/Amber";
import { PageHeaderBand } from "@/components/PageHeaderBand/PageHeaderBand";
import { SelectableRow } from "@/components/SelectableRow/SelectableRow";
import { TextField } from "@/components/TextField/TextField";
import { checkFile, sizeText } from "@/lib/content-import";
import { trainingSections as allTopics } from "@/lib/parts";

export type ImportValues = { title: string; topic: string; file: File };
export type ChosenFile = { name: string; size: number; file?: File };

export const WORD_NOTE =
  "Word files are not read in this prototype; a sample result is shown instead. A live product would read Word files and always ask a person to review before publishing.";

/**
 * Import questions (DESIGN.md: Instructor, Content): ONE scrolling screen: the set title, a topic
 * (one choice), a file (CSV or Word, up to 1 MB) and the card "How the file is read". Pinned:
 * Primary "Read file" (disabled until everything is set) and Secondary "Cancel" (a dialog only when
 * something was entered). A file problem is amber text, never red.
 */
export function ImportView({
  titleOf,
  onRead,
  onCancel,
  reading = false,
  readError = "",
  initial,
  confirmingInitially = false,
  dialogInline = false,
}: {
  titleOf: (id: string) => string;
  onRead: (values: ImportValues) => void;
  onCancel: () => void;
  /** The short "Reading questions..." state before the Review opens. */
  reading?: boolean;
  /** What the reader said about the file (empty, no question column), in amber. */
  readError?: string;
  /** Only for the screen review page: a filled form. */
  initial?: { title?: string; topic?: string; file?: ChosenFile };
  confirmingInitially?: boolean;
  dialogInline?: boolean;
}) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [topic, setTopic] = useState(initial?.topic ?? "");
  const [file, setFile] = useState<ChosenFile | null>(initial?.file ?? null);
  const [problem, setProblem] = useState("");
  const [confirming, setConfirming] = useState(confirmingInitially);
  const input = useRef<HTMLInputElement>(null);

  const entered = title.trim() !== "" || topic !== "" || file !== null;
  const ready = title.trim() !== "" && topic !== "" && file !== null && problem === "";

  function choose(chosen: File | undefined) {
    if (!chosen) return;
    const error = checkFile(chosen);
    setProblem(error ?? "");
    setFile(error ? null : { name: chosen.name, size: chosen.size, file: chosen });
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

      <section aria-labelledby="set-title-label" className="flex flex-col gap-2">
        <h2 id="set-title-label" className="type-label text-text-secondary">
          SET TITLE
        </h2>
        <TextField label="Set title" name="set-title" value={title} onChange={setTitle} />
      </section>

      <section aria-labelledby="topic-label" className="flex flex-col gap-3">
        <h2 id="topic-label" className="type-label text-text-secondary">
          TOPIC
        </h2>
        <fieldset role="radiogroup" aria-labelledby="topic-label" className="flex flex-col gap-2">
          {allTopics.map((id) => (
            <SelectableRow
              key={id}
              name="topic"
              value={id}
              compact
              checked={topic === id}
              onChange={setTopic}
            >
              <span className="type-body-strong min-w-0 flex-1 truncate">
                <span className="sr-only">{id} </span>
                {titleOf(id)}
              </span>
            </SelectableRow>
          ))}
        </fieldset>
      </section>

      <section aria-labelledby="file-label" className="flex flex-col gap-3">
        <h2 id="file-label" className="type-label text-text-secondary">
          FILE
        </h2>
        <div
          data-file-area
          className="flex flex-col items-center gap-3 rounded-card border-[1.5px] border-dashed border-placeholder-stroke px-4 py-6 text-center"
        >
          <FileUp size={32} strokeWidth={1.75} aria-hidden="true" className="text-text-secondary" />
          <p className="type-body text-text-secondary">CSV or Word file, up to 1 MB</p>
          <input
            ref={input}
            type="file"
            accept=".csv,.docx"
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
                setFile(null);
                setProblem("");
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

      <Card className="flex flex-col gap-2">
        <h2 className="type-body-strong">How the file is read</h2>
        <p className="type-small text-text-secondary">
          Each row is one question. Columns: topic, question, option_a, option_b, option_c,
          option_d, correct (the letter A to D), explanation, guide_reference and image_url. Commas
          and semicolons both work, and up to 100 questions are read. Everything is read as plain
          text.
        </p>
        <p className="type-small text-text-secondary">{WORD_NOTE}</p>
      </Card>

      <ActionBar>
        <Button
          disabled={!ready}
          onClick={() => file && onRead({ title: title.trim(), topic, file: file.file! })}
        >
          Read file
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
          onConfirm={onCancel}
          onCancel={() => setConfirming(false)}
        />
      )}
    </div>
  );
}
