"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import { QuestionScreen } from "@/components/QuestionScreen/QuestionScreen";
import { SessionBar } from "@/components/SessionBar/SessionBar";
import { SessionTopBar } from "@/components/SessionTopBar/SessionTopBar";
import type { Unit } from "@/components/SessionTopBar/SessionTopBar";
import { useSourceSheet } from "@/components/SourceSheet/SourceSheet";
import { stripStates } from "@/components/StepStrip/StepStrip";
import { getItem, hintFor } from "@/lib/items";
import { isSaved, toggleSaved, useSaved } from "@/lib/saved";
import type { Session } from "@/lib/session";
import type { QuestionMode } from "@/lib/option-state";
import { answerFor, isDone, withAnswer, withChecked, withHintUsed } from "@/lib/session";

export type RunnerSession = Pick<Session, "itemIds" | "answers" | "index" | "hintsOpened">;

/**
 * A running session, one question at a time, for the normal sessions and the exam. The choice is
 * saved as soon as it is made (`onChange`), Back and the step strip show it again, and nothing
 * says whether it is right until Finish. In a training mode the primary button first reads
 * "Check": it locks the answer and shows the feedback and Why, then it reads "Next" ("Finish" on
 * the last question). The exam passes `mode="exam"` (no Check, no feedback), `hints={false}`, a
 * timer and its own leave texts.
 */
export function SessionRunner<T extends RunnerSession>({
  session,
  unit,
  subtitle,
  hints = true,
  mode = "training",
  timer,
  leave,
  onChange,
  onFinish,
  onLeave,
}: {
  session: T;
  unit: Unit;
  subtitle?: string;
  /** False in the exam: no hint button and no hint card. */
  hints?: boolean;
  /** The training modes give feedback after Check; the exam never does. */
  mode?: QuestionMode;
  timer?: ReactNode;
  leave?: { title: string; description: string };
  onChange: (session: T) => void;
  onFinish: () => void;
  onLeave: () => void;
}) {
  const { sections } = useSourceSheet();
  const saved = useSaved();
  /** The question whose hint is open: it closes by itself when the person moves to another. */
  const [hintOpenFor, setHintFor] = useState<string | null>(null);
  const total = session.itemIds.length;
  const index = Math.min(session.index, total - 1);
  const item = getItem(session.itemIds[index]);
  const answer = answerFor(session, item.id);
  const choice = answer?.optionId ?? null;
  const feedback = mode === "training";
  const checked = feedback && answer?.checked === true;
  const hint = hints
    ? hintFor(item, (id) => sections.find((section) => section.id === id)?.title)
    : null;
  // A checked question has its answer: the hint is closed and cannot be opened.
  const hintOpen = hint !== null && hintOpenFor === item.id && !checked;

  function toggleHint() {
    if (hintOpen) {
      setHintFor(null);
      return;
    }
    setHintFor(item.id);
    onChange(withHintUsed(session, item.id));
  }

  function jump(position: number) {
    onChange({ ...session, index: position });
    window.scrollTo(0, 0);
  }

  function check() {
    if (choice === null || checked) return;
    setHintFor(null);
    onChange(withChecked(session, item.id));
  }

  function next() {
    if (index === total - 1) {
      onFinish();
      return;
    }
    jump(index + 1);
  }

  const answered = session.itemIds.map((id) => isDone(answerFor(session, id), mode));
  const unanswered = answered.indexOf(false);
  const last = index === total - 1;
  const note =
    last && unanswered !== -1 && unanswered !== index
      ? `Answer ${unit.toLowerCase()} ${unanswered + 1} to finish.`
      : null;

  return (
    <div className="flex flex-col gap-4 pb-4">
      <SessionTopBar
        index={index}
        total={total}
        unit={unit}
        subtitle={subtitle}
        states={stripStates(answered, index)}
        onJump={jump}
        onBack={() => jump(index - 1)}
        onLeave={onLeave}
        trailing={timer}
        leave={leave}
      />
      <QuestionScreen
        key={item.id}
        item={item}
        choice={choice}
        onChoose={(optionId) => onChange(withAnswer(session, item.id, optionId))}
        mode={mode}
        checked={checked}
        saved={isSaved(saved, item.id)}
        onToggleSaved={() => toggleSaved(item.id)}
        hint={hintOpen ? hint : null}
      />
      <SessionBar
        label={feedback && !checked ? "Check" : last ? "Finish" : "Next"}
        last={last}
        disabled={choice === null || (feedback && !checked ? false : last && unanswered !== -1)}
        note={note}
        hint={hint ? { open: hintOpen, onToggle: toggleHint, disabled: checked } : undefined}
        onNext={feedback && !checked ? check : next}
      />
    </div>
  );
}
