"use client";

import type { ReactNode } from "react";
import { ActionBar } from "@/components/ActionBar/ActionBar";
import { AskAiButton } from "@/components/AskAi/AskAi";
import { Button } from "@/components/Button/Button";
import { CircleBackButton } from "@/components/CircleBackButton/CircleBackButton";
import { GuideChip } from "@/components/GuideChip/GuideChip";
import { StatusBadge } from "@/components/StatusBadge/StatusBadge";
import { StatusRows } from "@/components/StatusRows/StatusRows";
import { describeEffects } from "@/lib/outcome";
import { formatPoints } from "@/lib/progress";
import { getStep } from "@/lib/scenario";
import type { ScoredItem } from "@/lib/scoring";
import { analysisOrder, groupByErrorType, weakItems } from "@/lib/scoring";

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <h4 className="type-label text-text-secondary">{label}</h4>
      {children}
    </div>
  );
}

/** One answer in the analysis: status rows, the choices, the full why and what happened. */
function AnswerCard({ item }: { item: ScoredItem }) {
  const step = item.kind === "step";
  const change = step ? describeEffects(item.id, item.effects) : [];
  return (
    <article className="flex flex-col gap-4 rounded-card bg-soft-card p-5 shadow-(--soft-shadow)">
      <h3 className="type-item-title">{item.title}</h3>
      <StatusRows
        result={item.correct ? "correct" : item.score > 0 ? "partial" : "wrong"}
        errorType={item.hasConfidence ? item.errorType : null}
      />
      {item.markedByYou && <StatusBadge status="marked" />}
      {item.reason && <p className="type-small text-text-secondary">{item.reason}</p>}
      {item.note && <p className="type-small text-text-secondary">{item.note}</p>}
      <Field label={step ? "You chose" : "Your answer"}>
        <p>{item.yourAnswer || "No answer"}</p>
      </Field>
      {(!item.correct || item.markedByYou) && (
        <Field label={step ? "Better choice" : "Correct answer"}>
          <p>{item.correctAnswer}</p>
        </Field>
      )}
      {item.kind === "question" && item.score > 0 && item.score < 1 && (
        <p className="type-small text-text-secondary tabular-nums">
          Partly correct: {formatPoints(item.score)} of 1 point
        </p>
      )}
      <Field label="Why">
        {item.why.map((line) => (
          <p key={line}>{line}</p>
        ))}
        <div className="flex flex-wrap gap-2 pt-1">
          {item.sources.map((sectionId) => (
            <GuideChip key={sectionId} sectionId={sectionId} />
          ))}
        </div>
      </Field>
      {step && item.consequence && (
        <Field label="What happened">
          <p>{item.consequence}</p>
          {change.length > 0 && (
            <p className="type-small text-text-secondary">{change.join(" · ")}</p>
          )}
        </Field>
      )}
      {step && <AskAiButton step={getStep(item.id)} phase="feedback" />}
    </article>
  );
}

/**
 * The Error analysis screen: every answer (or only the correct or incorrect ones) grouped by
 * error type, the most serious first. Repeat is offered only when something is weak.
 */
export function AnalysisView({
  items,
  quiz,
  backHref,
  onRepeat,
}: {
  items: ScoredItem[];
  quiz: boolean;
  backHref: string;
  onRepeat: (ids: string[]) => void;
}) {
  const repeatIds = weakItems(items).map((item) => item.id);
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col items-start gap-4">
        <CircleBackButton href={backHref} label="Back to results" />
        <h1 className="type-page-title">Error analysis</h1>
      </div>
      {groupByErrorType(items, analysisOrder).map((group) => (
        <section
          key={group.type}
          aria-labelledby={`analysis-${group.type}`}
          className="flex flex-col gap-3"
        >
          <h2 id={`analysis-${group.type}`} className="flex items-center gap-2">
            <StatusBadge status={group.type} />
            <span className="type-small text-text-secondary tabular-nums">
              {group.items.length} {group.items.length === 1 ? "answer" : "answers"}
            </span>
          </h2>
          <ol className="flex flex-col gap-4">
            {group.items.map((item) => (
              <li key={item.id}>
                <AnswerCard item={item} />
              </li>
            ))}
          </ol>
        </section>
      ))}
      {repeatIds.length > 0 && (
        <ActionBar>
          <Button onClick={() => onRepeat(repeatIds)}>
            {quiz ? "Repeat weak questions" : "Repeat weak topics"}
          </Button>
        </ActionBar>
      )}
    </div>
  );
}
