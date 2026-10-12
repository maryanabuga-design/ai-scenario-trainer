"use client";

import { Check, Contrast, Minus, UserCheck, X } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { Button } from "@/components/Button/Button";
import { ChoiceCard } from "@/components/ChoiceCard/ChoiceCard";
import { SourceChip } from "@/components/SourceChip/SourceChip";
import type {
  AnswerBox,
  BoxTone,
  QuestionVerdict,
  SheetContent,
  StepSheet,
} from "@/lib/answer-sheet";
import { formatSelfCheck } from "@/lib/explanation-match";

const verdictIcons: Record<StepSheet["verdict"] | QuestionVerdict, [LucideIcon, string]> = {
  right: [Check, "text-correct"],
  wrong: [X, "text-wrong"],
  noMatch: [X, "text-wrong"],
  partial: [Contrast, "text-text-secondary"],
  marked: [UserCheck, "text-text-secondary"],
  dontKnow: [Minus, "text-text-secondary"],
};

const boxStyles: Record<BoxTone, { className: string; icon?: [LucideIcon, string] }> = {
  right: { className: "border border-correct", icon: [Check, "text-correct"] },
  wrong: { className: "border border-wrong", icon: [X, "text-wrong"] },
  better: { className: "border border-dashed border-correct", icon: [Check, "text-correct"] },
  partial: { className: "border border-border-strong", icon: [Contrast, "text-text-secondary"] },
  neutral: { className: "border border-border" },
};

function Label({ children }: { children: ReactNode }) {
  return (
    <h3 className="text-xs font-medium tracking-[0.04em] text-text-secondary uppercase">
      {children}
    </h3>
  );
}

function Box({ box }: { box: AnswerBox }) {
  const style = boxStyles[box.tone];
  const [Icon, color] = style.icon ?? [null, ""];
  const List = box.ordered ? "ol" : "ul";
  return (
    <div className={`flex items-start gap-3 rounded-panel p-4 ${style.className}`}>
      {Icon && (
        <Icon size={20} strokeWidth={2} aria-hidden="true" className={`mt-0.5 shrink-0 ${color}`} />
      )}
      <div className="flex min-w-0 flex-col gap-1">
        <Label>{box.label}</Label>
        {box.lines.length === 1 ? (
          <p>{box.lines[0]}</p>
        ) : (
          <List className="flex flex-col gap-1">
            {box.lines.map((line, index) => (
              <li key={line}>
                {box.ordered && (
                  <span className="text-text-secondary tabular-nums">{index + 1}. </span>
                )}
                {line}
              </li>
            ))}
          </List>
        )}
      </div>
    </div>
  );
}

function SelfCheck({
  sheet,
  onChange,
}: {
  sheet: StepSheet;
  onChange?: (selfCheck: boolean[]) => void;
}) {
  const boxes = sheet.points.map((point) => point.covered);
  return (
    <section className="flex flex-col gap-3">
      <Label>Points a strong answer covers</Label>
      {sheet.skipped ? (
        <>
          <p className="text-sm text-text-secondary">Skipped</p>
          <ul className="flex list-disc flex-col gap-1 pl-5">
            {sheet.points.map((point) => (
              <li key={point.text}>{point.text}</li>
            ))}
          </ul>
        </>
      ) : (
        <fieldset className="flex flex-col gap-3">
          <legend className="sr-only">Points a strong answer covers</legend>
          <p className="text-sm text-text-secondary tabular-nums" aria-live="polite">
            {formatSelfCheck({ covered: boxes.filter(Boolean).length, total: boxes.length })}
          </p>
          {sheet.points.map((point, position) => (
            <ChoiceCard
              key={point.text}
              type="checkbox"
              compact
              name="self-check"
              value={String(position)}
              checked={point.covered}
              onChange={() =>
                onChange?.(boxes.map((box, other) => (other === position ? !box : box)))
              }
            >
              <span className="flex flex-col">
                <span>{point.text}</span>
                <span className="text-sm text-text-secondary">My answer covers this</span>
              </span>
            </ChoiceCard>
          ))}
          {!sheet.allCovered && (
            <>
              <p className="text-sm text-text-secondary">
                Your explanation may still be right. Check the points you covered.
              </p>
              <div>
                <Button variant="secondary" onClick={() => onChange?.(boxes.map(() => true))}>
                  My answer covers all points
                </Button>
              </div>
            </>
          )}
        </fieldset>
      )}
    </section>
  );
}

/**
 * The answer sheet: rises over the screen just answered with the verdict, the right answer, the
 * why with sources and, for a scenario step, what happened and the self-check. Only Continue
 * closes it. With inline, it is drawn inside its nearest positioned parent (the screen review).
 */
export function AnswerSheet({
  content,
  continueLabel = "Continue",
  onContinue,
  onSelfCheckChange,
  onMarkCorrect,
  askAi,
  inline = false,
}: {
  content: SheetContent;
  continueLabel?: string;
  onContinue: () => void;
  onSelfCheckChange?: (selfCheck: boolean[]) => void;
  onMarkCorrect?: () => void;
  askAi?: ReactNode;
  inline?: boolean;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const [announced, setAnnounced] = useState("");
  const [Icon, color] = verdictIcons[content.verdict];

  // Open as a modal (focus stays inside, the page behind is inert), focus the title and
  // announce the verdict. Escape and the scrim do not close it: only Continue does.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (inline || !dialog) return;
    dialog.setAttribute("closedby", "none");
    if (!dialog.open) dialog.showModal();
    titleRef.current?.focus();
    return () => dialog.close();
  }, [inline]);

  useEffect(() => {
    const timer = setTimeout(() => setAnnounced(content.title), 100);
    return () => clearTimeout(timer);
  }, [content.title]);

  const body = (
    <>
      <div aria-hidden="true" className="flex justify-center pt-2 pb-1">
        <span className="h-1 w-9 rounded-full bg-border-strong" />
      </div>
      <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-4 pt-3 pb-6">
        <h2
          ref={titleRef}
          id="answer-sheet-title"
          tabIndex={-1}
          className="flex items-start gap-2 text-xl leading-tight font-medium"
        >
          <Icon
            size={24}
            strokeWidth={2}
            aria-hidden="true"
            className={`mt-0.5 shrink-0 ${color}`}
          />
          {content.title}
        </h2>
        <p role="status" className="sr-only">
          {announced}
        </p>

        <div className="flex flex-col gap-3">
          {content.boxes.map((box) => (
            <Box key={box.label} box={box} />
          ))}
          {content.kind === "question" && content.detail && (
            <p className="text-sm text-text-secondary">{content.detail}</p>
          )}
          {content.kind === "question" && content.canMarkCorrect && onMarkCorrect && (
            <div>
              <Button
                variant="secondary"
                onClick={() => {
                  onMarkCorrect();
                  titleRef.current?.focus();
                }}
              >
                My answer is still correct
              </Button>
            </div>
          )}
        </div>

        <section className="flex flex-col gap-2">
          <Label>Why</Label>
          {content.why.map((line) => (
            <p key={line}>{line}</p>
          ))}
          <div className="flex flex-wrap gap-2">
            {content.sources.map((sectionId) => (
              <SourceChip key={sectionId} sectionId={sectionId} />
            ))}
          </div>
        </section>

        {content.kind === "step" && (
          <>
            <section className="flex flex-col gap-1">
              <Label>What happened</Label>
              <p>{content.whatHappened}</p>
              {content.stateChange.length > 0 && (
                <p className="text-sm text-text-secondary">{content.stateChange.join(" · ")}</p>
              )}
            </section>
            <SelfCheck sheet={content} onChange={onSelfCheckChange} />
          </>
        )}
      </div>
      <div className="flex flex-col gap-3 border-t border-border bg-surface px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
        {askAi}
        <Button onClick={onContinue}>{continueLabel}</Button>
      </div>
    </>
  );

  if (inline) {
    return (
      <div className="scrim absolute inset-0 z-20 flex items-end">
        <div
          role="dialog"
          aria-labelledby="answer-sheet-title"
          className="flex max-h-[65%] w-full flex-col rounded-t-card bg-surface text-text"
        >
          {body}
        </div>
      </div>
    );
  }

  return (
    <dialog
      ref={dialogRef}
      data-sheet
      aria-labelledby="answer-sheet-title"
      onCancel={(event) => event.preventDefault()}
      onClose={() => {
        // Only Continue may close the sheet: reopen it if the browser closed it anyway.
        if (dialogRef.current?.isConnected && !dialogRef.current.open) {
          dialogRef.current.showModal();
        }
      }}
      className="fixed inset-x-0 top-auto bottom-0 m-0 mx-auto max-h-[65dvh] w-full max-w-app flex-col overflow-hidden rounded-t-card bg-surface p-0 text-text open:flex"
    >
      {body}
    </dialog>
  );
}
