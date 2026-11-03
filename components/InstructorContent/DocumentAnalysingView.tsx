"use client";

import { ImportSummaryCard } from "@/components/InstructorContent/ImportSummaryCard";
import { Check, FileText, LoaderCircle } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { ActionBar } from "@/components/ActionBar/ActionBar";
import { Button } from "@/components/Button/Button";
import { FlashNotice } from "@/components/FlashNotice/FlashNotice";
import { Notice } from "@/components/Notice/Notice";

export const STAGES = [
  "Reading the text",
  "Finding guide sections",
  "Building steps and scenario",
  "Preparing questions",
  "Checking links to the guide",
] as const;

export const ANALYSING_IMAGE = "/images/instructor/import-analysing.webp";
export const SUCCESS_IMAGE = "/images/instructor/import-success.webp";

export type AnalysingPhase = "running" | "finished" | "partial" | "error";

export type StageResult = string;

/**
 * The picture at the top of the screen (about 160px). `src` is null for the partial and error states:
 * then, and when the file is missing, the neutral document icon shows instead, so nothing breaks.
 */
function Art({ src }: { src: string | null }) {
  const [failed, setFailed] = useState(false);
  const image = useRef<HTMLImageElement>(null);
  // an error that happened before this component was hydrated is not reported by onError
  useEffect(() => {
    const el = image.current;
    if (el && el.complete && el.naturalWidth === 0) setFailed(true);
  }, []);
  if (src === null || failed) {
    return (
      <div
        data-art-fallback
        className="flex h-40 w-40 items-center justify-center rounded-full bg-secondary-sand"
      >
        <FileText size={56} strokeWidth={1.75} aria-hidden="true" className="text-text-secondary" />
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      ref={image}
      key={src}
      data-art
      src={src}
      alt=""
      width={160}
      height={160}
      className="h-40 w-40 object-contain"
      onError={() => setFailed(true)}
    />
  );
}

/** A stage's state mark: a check in a round success tile, a calm spinner (a static dot with reduced motion) or an empty ring. */
function Mark({ state }: { state: "done" | "current" | "waiting" }) {
  if (state === "done") {
    return (
      <span
        aria-hidden="true"
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-status-success-bg text-status-success-ink"
      >
        <Check size={16} strokeWidth={2.5} />
      </span>
    );
  }
  if (state === "current") {
    return (
      <span
        aria-hidden="true"
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-selectable-stroke text-primary"
      >
        <LoaderCircle size={18} strokeWidth={2} className="animate-spin motion-reduce:hidden" />
        <span
          data-static-dot
          className="hidden size-2 rounded-full bg-primary motion-reduce:block"
        />
      </span>
    );
  }
  return (
    <span
      aria-hidden="true"
      className="h-8 w-8 shrink-0 rounded-full border border-selectable-stroke"
    />
  );
}

/**
 * The Analysing and result screen (DESIGN.md: Simpler Import content, and a centred Analysing and
 * result screen): everything centred, top to bottom a 160px picture, the title, the file name in
 * muted text and the content block, with the buttons pinned at the bottom. While reading: five compact
 * stage rows with the real result of each finished stage, a calm line and Secondary Cancel. Finished:
 * the rows collapse away, the picture changes and one summary card shows the counts and the Links to
 * the guide row under a small success badge. Partial and error use the neutral icon. No percentages,
 * no AI wording. Stage changes are announced in a polite live region.
 */
export function DocumentAnalysingView({
  fileName,
  phase,
  done,
  results,
  counts,
  linkProblems = 0,
  partialLine = "",
  onCancel,
  onContinue,
  onChooseAnother,
  onOpenDraft,
  onBackToContent,
}: {
  fileName: string;
  phase: AnalysingPhase;
  /** How many stages are finished (0 to 5). */
  done: number;
  /** The result of each finished stage ("4 found"). */
  results: StageResult[];
  counts: { guide: number; steps: number; scenario: number; questions: number };
  /** Items whose link to the guide needs attention (0: "all linked"). */
  linkProblems?: number;
  /** The partial state's sentence ("We could not find questions in this document."). */
  partialLine?: string;
  onCancel: () => void;
  onContinue: () => void;
  onChooseAnother: () => void;
  onOpenDraft: () => void;
  onBackToContent: () => void;
}) {
  const running = phase === "running";
  const announce = running
    ? done < STAGES.length
      ? `${STAGES[done]}...`
      : ""
    : phase === "finished"
      ? "Draft is ready"
      : phase === "partial"
        ? partialLine
        : "We could not read this file.";
  const title = running
    ? "Reading your document…"
    : phase === "finished"
      ? "Draft is ready"
      : "Your document";
  return (
    <div data-analysing className="flex flex-col items-center gap-4 pt-6 pb-4 text-center">
      <FlashNotice />
      <Art src={running ? ANALYSING_IMAGE : phase === "finished" ? SUCCESS_IMAGE : null} />
      <h1 className="type-page-title">{title}</h1>
      <p
        data-file-name
        className="type-body max-w-full text-text-secondary [overflow-wrap:anywhere]"
      >
        {fileName}
      </p>
      <p className="sr-only" role="status" aria-live="polite" data-announce>
        {announce}
      </p>

      {running && (
        <>
          <ol data-stages className="flex w-full max-w-[360px] flex-col gap-2 text-left">
            {STAGES.map((label, index) => {
              const state = index < done ? "done" : index === done ? "current" : "waiting";
              return (
                <li
                  key={label}
                  data-stage={state}
                  className="flex min-h-14 items-center gap-3 rounded-card border border-selectable-stroke bg-card px-3 py-2"
                >
                  <Mark state={state} />
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span
                      className={
                        state === "waiting" ? "type-body text-text-secondary" : "type-body-strong"
                      }
                    >
                      {label}
                      <span className="sr-only">
                        {`, ${state === "done" ? "done" : state === "current" ? "in progress" : "waiting"}`}
                      </span>
                    </span>
                    {state === "done" && results[index] && (
                      <span data-stage-result className="type-small text-text-secondary">
                        {results[index]}
                      </span>
                    )}
                  </span>
                </li>
              );
            })}
          </ol>
          <p className="type-small text-text-secondary">
            This is a draft. You will review everything before it is published.
          </p>
        </>
      )}

      {phase === "finished" && <ImportSummaryCard counts={counts} linkProblems={linkProblems} />}
      {phase === "partial" && (
        <div className="w-full max-w-[360px] text-left">
          <Notice variant="info" id="draft-partial" title="Some parts are missing" clamp={false}>
            {partialLine}
          </Notice>
        </div>
      )}
      {phase === "error" && (
        <div className="w-full max-w-[360px] text-left">
          <Notice variant="to-fix" alert id="draft-error" title="File not readable" clamp={false}>
            We could not read this file. Try another file.
          </Notice>
        </div>
      )}

      <ActionBar>
        {running && (
          <Button variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
        )}
        {phase === "finished" && (
          <>
            <Button onClick={onOpenDraft}>Open draft</Button>
            <Button variant="secondary" onClick={onBackToContent}>
              Back to Content
            </Button>
          </>
        )}
        {phase === "partial" && (
          <>
            <Button onClick={onContinue}>Continue</Button>
            <Button variant="secondary" onClick={onChooseAnother}>
              Choose another file
            </Button>
          </>
        )}
        {phase === "error" && (
          <>
            <Button onClick={onChooseAnother}>Choose another file</Button>
            <Button variant="secondary" onClick={onCancel}>
              Cancel
            </Button>
          </>
        )}
      </ActionBar>
    </div>
  );
}
