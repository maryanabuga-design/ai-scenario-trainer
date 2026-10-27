"use client";

import { Check } from "lucide-react";
import { ActionBar } from "@/components/ActionBar/ActionBar";
import { Button } from "@/components/Button/Button";
import { Notice } from "@/components/Notice/Notice";
import { PageHeaderBand } from "@/components/PageHeaderBand/PageHeaderBand";

export const STAGES = [
  "Reading the text",
  "Finding guide sections",
  "Building steps and scenario",
  "Preparing questions",
  "Checking links to the guide",
] as const;

export type AnalysingPhase = "running" | "finished" | "partial" | "error";

export type StageResult = string;

/**
 * The Analysing screen (DESIGN.md: One document in, a draft topic out): the file name, "Reading your
 * document...", five stages (done check, current, waiting) with the real result of each finished
 * stage, a calm line, and Secondary Cancel. Then the end states: Finished ("Draft is ready" with the
 * counts), Partial (a part is missing) and Error. No percentages, no AI wording. The stage changes are
 * announced in a polite live region.
 */
export function DocumentAnalysingView({
  fileName,
  phase,
  done,
  results,
  counts,
  partialLine = "",
  reviewCount = 0,
  onCancel,
  onContinue,
  onChooseAnother,
  onReview,
  onPreview,
  onBackToContent,
}: {
  fileName: string;
  phase: AnalysingPhase;
  /** How many stages are finished (0 to 5). */
  done: number;
  /** The result of each finished stage ("4 found"). */
  results: StageResult[];
  counts: { guide: number; steps: number; scenario: number; questions: number };
  /** The partial state's sentence ("We could not find questions in this document."). */
  partialLine?: string;
  /** Items the review would visit; 0 offers Preview as student instead. */
  reviewCount?: number;
  onCancel: () => void;
  onContinue: () => void;
  onChooseAnother: () => void;
  onReview: () => void;
  onPreview: () => void;
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
  return (
    <div className="flex flex-col gap-6 pb-4">
      <PageHeaderBand
        title={
          running
            ? "Reading your document…"
            : phase === "finished"
              ? "Draft is ready"
              : "Your document"
        }
        subtitle={
          <span data-file-name className="break-words">
            {fileName}
          </span>
        }
      />
      <p className="sr-only" role="status" aria-live="polite" data-announce>
        {announce}
      </p>

      {(running || phase === "partial" || phase === "finished") && (
        <ol data-stages className="flex flex-col gap-2">
          {STAGES.map((label, index) => {
            const state = index < done ? "done" : running && index === done ? "current" : "waiting";
            return (
              <li
                key={label}
                data-stage={state}
                className="flex min-h-14 items-center gap-3 rounded-card border border-selectable-stroke bg-card px-3 py-2"
              >
                <span
                  aria-hidden="true"
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                    state === "done"
                      ? "bg-status-success-bg text-status-success-ink"
                      : state === "current"
                        ? "border-2 border-primary text-primary"
                        : "border border-selectable-stroke text-text-secondary"
                  }`}
                >
                  {state === "done" ? <Check size={16} strokeWidth={2.5} /> : null}
                </span>
                <span className="flex min-w-0 flex-1 flex-col">
                  <span
                    className={
                      state === "waiting" ? "type-body text-text-secondary" : "type-body-strong"
                    }
                  >
                    {label}
                    <span className="sr-only">{`, ${state === "done" ? "done" : state === "current" ? "in progress" : "waiting"}`}</span>
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
      )}

      {running && (
        <p className="type-small text-center text-text-secondary">
          This is a draft. You will review everything before it is published.
        </p>
      )}

      {phase === "finished" && (
        <dl
          data-counts
          className="flex flex-col gap-2 rounded-card border border-selectable-stroke bg-card p-[var(--gutter,1rem)]"
        >
          {[
            ["Guide sections", counts.guide],
            ["Steps", counts.steps],
            ["Scenario steps", counts.scenario],
            ["Questions", counts.questions],
          ].map(([label, value]) => (
            <div key={label} className="flex items-baseline justify-between gap-3">
              <dt className="type-body text-text-secondary">{label}</dt>
              <dd className="type-body-strong">{value}</dd>
            </div>
          ))}
        </dl>
      )}
      {phase === "partial" && (
        <Notice variant="info" id="draft-partial" title="Some parts are missing" clamp={false}>
          {partialLine}
        </Notice>
      )}
      {phase === "error" && (
        <Notice variant="to-fix" alert id="draft-error" title="File not readable" clamp={false}>
          We could not read this file. Try another file.
        </Notice>
      )}

      <ActionBar>
        {running && (
          <Button variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
        )}
        {phase === "finished" && (
          <>
            {reviewCount > 0 ? (
              <Button onClick={onReview}>
                Review {reviewCount} {reviewCount === 1 ? "item" : "items"}
              </Button>
            ) : (
              <Button onClick={onPreview}>Preview as student</Button>
            )}
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
