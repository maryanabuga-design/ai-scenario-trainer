"use client";

import { Check, Contrast, Minus, X } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { AskAiButton } from "@/components/AskAi/AskAi";
import { ButtonLink } from "@/components/Button/Button";
import { CircleBackButton } from "@/components/CircleBackButton/CircleBackButton";
import { ContentImage } from "@/components/ContentImage/ContentImage";
import { GuideChip } from "@/components/GuideChip/GuideChip";
import { MarkCorrect } from "@/components/MarkCorrect/MarkCorrect";
import type { AnswerBox, BoxTone, OpenAnswer, OpenVerdict, ReviewData } from "@/lib/answer-review";

/** Your own answer is always the Your choice block; the tone only picks its icon. */
const yoursBlock =
  "border border-l-[3px] border-secondary-sand-pressed border-l-primary bg-secondary-sand";

const boxStyles: Record<BoxTone, { className: string; icon?: [LucideIcon, string] }> = {
  right: { className: yoursBlock, icon: [Check, "text-correct"] },
  wrong: { className: yoursBlock, icon: [X, "text-wrong"] },
  better: {
    className: "border border-dashed border-correct",
    icon: [Check, "text-correct"],
  },
  partial: { className: yoursBlock, icon: [Contrast, "text-text-secondary"] },
  neutral: { className: "border border-border" },
};

/** A section label; dark on the Your choice block, grey everywhere else. */
function Label({ children, dark = false }: { children: ReactNode; dark?: boolean }) {
  return <h2 className={`type-label ${dark ? "text-text" : "text-text-secondary"}`}>{children}</h2>;
}

/** The verdict line under typed text: icon and words, never colour alone. */
const openVerdicts: Record<OpenVerdict, { icon: LucideIcon; color: string; text: string }> = {
  matched: { icon: Check, color: "text-correct", text: "Matches the guide" },
  not_matched: {
    icon: Minus,
    color: "text-caution",
    text: "Doesn't match the guide yet",
  },
  marked: { icon: Check, color: "text-text", text: "Marked correct by you" },
};

/** "Your explanation" or "Your answer": the typed text with its verdict, or "I don't know". */
function Open({ open }: { open: OpenAnswer }) {
  const verdict = open.verdict ? openVerdicts[open.verdict] : null;
  const Icon = verdict?.icon;
  return (
    <section className="flex flex-col gap-1">
      <Label>{open.label}</Label>
      {open.text === null ? (
        <p className="text-text-secondary">You pressed I don&apos;t know.</p>
      ) : (
        <>
          <p>{open.text}</p>
          {verdict && Icon && (
            <p className="type-small flex items-center gap-1.5 text-text">
              <Icon size={16} strokeWidth={2} aria-hidden="true" className={verdict.color} />
              {verdict.text}
            </p>
          )}
        </>
      )}
    </section>
  );
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
 * The Answer review of one step or question after Finish: the situation, your choice, your
 * explanation with its verdict, the better explanation, the why with guide chips and what
 * happened. The page ends with Back to results, the "still correct" button and Previous and Next.
 */
export function AnswerReview({
  data,
  noun,
  backHref,
  backLabel,
  hrefFor,
  onMarkCorrect,
}: {
  data: ReviewData;
  /** "question", "step" or "item", for the Previous and Next buttons. */
  noun: string;
  backHref: string;
  backLabel: string;
  /** The review page of another position, keeping where the person came from. */
  hrefFor: (position: number) => string;
  onMarkCorrect: (marked: boolean) => void;
}) {
  const { content, position, total } = data;
  const heading = data.title ?? data.question;
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <CircleBackButton href={backHref} label={backLabel} />
        <span className="type-small text-text-secondary tabular-nums">
          {noun.charAt(0).toUpperCase() + noun.slice(1)} {position} of {total}
        </span>
      </div>

      <ContentImage image={data.image} />

      <section className="flex flex-col gap-3">
        <h1 className={data.title ? "type-page-title" : "type-item-title"}>{heading}</h1>
        {data.narrative && <p className="type-body">{data.narrative}</p>}
        {data.title && <p className="type-item-title">{data.question}</p>}
      </section>

      {content.kind === "question" && content.detail && (
        <p className="type-small -mb-3 text-text-secondary">{content.detail}</p>
      )}
      {content.boxes.length > 0 && (
        <div className="flex flex-col gap-3">
          {content.boxes.map((box) => (
            <Box key={box.label} box={box} />
          ))}
        </div>
      )}

      {content.open && <Open open={content.open} />}
      {content.better && <Box box={content.better} />}

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

      {data.step && <AskAiButton step={data.step} phase="feedback" />}

      <div className="flex flex-col gap-3 pb-6">
        <ButtonLink href="/session/results">Back to results</ButtonLink>
        {content.override !== "none" && (
          <MarkCorrect
            label={
              content.kind === "step"
                ? "My explanation is still correct"
                : "My answer is still correct"
            }
            marked={content.override === "marked"}
            onChange={onMarkCorrect}
          />
        )}
        <div className="flex items-center justify-between">
          {position > 1 ? (
            <ButtonLink href={hrefFor(position - 1)} variant="tertiary">
              Previous {noun}
            </ButtonLink>
          ) : (
            <span />
          )}
          {position < total && (
            <ButtonLink href={hrefFor(position + 1)} variant="tertiary">
              Next {noun}
            </ButtonLink>
          )}
        </div>
      </div>
    </div>
  );
}
