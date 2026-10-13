"use client";

import { Check, Contrast, X } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { Button } from "@/components/Button/Button";
import { MarkCorrect } from "@/components/MarkCorrect/MarkCorrect";
import { GuideChip } from "@/components/GuideChip/GuideChip";
import type { AnswerBox, BoxTone, SheetContent } from "@/lib/answer-sheet";

/** Your own answer is always the Your choice block; the tone only picks its icon. */
const yoursBlock = "border border-l-[3px] border-secondary-sand-pressed border-l-primary bg-secondary-sand";

const boxStyles: Record<BoxTone, { className: string; icon?: [LucideIcon, string] }> = {
  right: { className: yoursBlock, icon: [Check, "text-correct"] },
  wrong: { className: yoursBlock, icon: [X, "text-wrong"] },
  better: { className: "border border-dashed border-correct", icon: [Check, "text-correct"] },
  partial: { className: yoursBlock, icon: [Contrast, "text-text-secondary"] },
  neutral: { className: "border border-border" },
};

const verdicts: Record<SheetContent["result"], string> = {
  correct: "Correct.",
  wrong: "Incorrect.",
  partial: "Partly correct.",
};

/** A section label; dark on the Your choice block, grey everywhere else. */
function Label({ children, dark = false }: { children: ReactNode; dark?: boolean }) {
  return <h3 className={`type-label ${dark ? "text-text" : "text-text-secondary"}`}>{children}</h3>;
}

function Box({ box }: { box: AnswerBox }) {
  const style = boxStyles[box.tone];
  const [Icon, color] = style.icon ?? [null, ""];
  const List = box.ordered ? "ol" : "ul";
  return (
    <div
      className={`flex items-start gap-3 rounded-panel p-4 ${box.yours ? yoursBlock : style.className}`}
    >
      {Icon && (
        <Icon size={20} strokeWidth={2} aria-hidden="true" className={`mt-0.5 shrink-0 ${color}`} />
      )}
      <div className="flex min-w-0 flex-col gap-1">
        <Label dark={box.yours}>{box.label}</Label>
        {box.lines.length === 1 ? (
          <p>{box.lines[0]}</p>
        ) : (
          <List className="flex flex-col gap-1">
            {box.lines.map((line, index) => (
              <li key={line}>
                {box.ordered && (
                  <span
                    className={`tabular-nums ${box.yours ? "text-text" : "text-text-secondary"}`}
                  >
                    {index + 1}.{" "}
                  </span>
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

/**
 * The answer sheet: rises over the screen just answered with the Result and Error type rows,
 * the right answer, the user's own explanation, the why with sources and, for a scenario step,
 * what happened, and the override after a wrong answer. Only Continue closes it. With inline, it is drawn inside its nearest positioned parent (the screen review).
 */
export function AnswerSheet({
  content,
  continueLabel = "Continue",
  onContinue,
  onMarkCorrect,
  inline = false,
}: {
  content: SheetContent;
  continueLabel?: string;
  onContinue: () => void;
  /** "My answer is still correct" (true) and its Undo (false). */
  onMarkCorrect?: (marked: boolean) => void;
  inline?: boolean;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const [announced, setAnnounced] = useState("");
  const verdict = verdicts[content.result];
  const announcement = [verdict, content.kind === "question" && content.note]
    .filter(Boolean)
    .join(" ");

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
    const timer = setTimeout(() => setAnnounced(announcement), 100);
    return () => clearTimeout(timer);
  }, [announcement]);

  const body = (
    <>
      <div aria-hidden="true" className="flex justify-center pt-2 pb-1">
        <span className="h-1 w-9 rounded-full bg-border-strong" />
      </div>
      <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-4 pt-3 pb-6">
        {/* The verdict is for screen readers; the boxes below show it with icons and labels. */}
        <h2 ref={titleRef} id="answer-sheet-title" tabIndex={-1} className="sr-only">
          {verdict}
        </h2>
        {content.kind === "question" && (content.detail || content.note) && (
          <div className="-mb-2 flex flex-col gap-1">
            {content.detail && <p className="type-small text-text-secondary">{content.detail}</p>}
            {content.note && <p className="type-small text-text-secondary">{content.note}</p>}
          </div>
        )}
        <p role="status" className="sr-only">
          {announced}
        </p>

        <div className="flex flex-col gap-3">
          {content.boxes.map((box) => (
            <Box key={box.label} box={box} />
          ))}
        </div>

        {content.kind === "step" && content.explanation && (
          <section className="flex flex-col gap-1">
            <Label>Your explanation</Label>
            <p>{content.explanation}</p>
          </section>
        )}

        <section className="flex flex-col gap-2">
          <Label>Why</Label>
          {content.why.map((line) => (
            <p key={line}>{line}</p>
          ))}
          <div className="flex flex-wrap gap-2">
            {content.sources.map((sectionId) => (
              <GuideChip key={sectionId} sectionId={sectionId} />
            ))}
          </div>
        </section>

        {content.kind === "step" && (
          <section className="flex flex-col gap-1">
            <Label>What happened</Label>
            <p>{content.whatHappened}</p>
            {content.stateChange.length > 0 && (
              <p className="type-small text-text-secondary">{content.stateChange.join(" · ")}</p>
            )}
          </section>
        )}
      </div>
      <div className="flex flex-col gap-3 border-t border-border bg-surface px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <Button onClick={onContinue}>{continueLabel}</Button>
        {content.override !== "none" && onMarkCorrect && (
          <MarkCorrect marked={content.override === "marked"} onChange={onMarkCorrect} />
        )}
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
      className="fixed inset-x-0 top-auto bottom-0 m-0 mx-auto max-h-[65dvh] outline-none focus-visible:outline-none w-full max-w-app flex-col overflow-hidden rounded-t-card bg-surface p-0 text-text open:flex"
    >
      {body}
    </dialog>
  );
}
