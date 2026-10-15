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
import { answerFor, withAnswer, withHintUsed } from "@/lib/session";

export type RunnerSession = Pick<Session, "itemIds" | "answers" | "index" | "hintsOpened">;

/**
 * A running session, one question at a time, for the normal sessions and the exam. The choice is
 * saved as soon as it is made (`onChange`), Back and the step strip show it again, and nothing
 * says whether it is right until Finish. The exam passes `hints={false}`, a timer and its own
 * leave texts.
 */
export function SessionRunner<T extends RunnerSession>({
  session,
  unit,
  subtitle,
  hints = true,
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
  const choice = answerFor(session, item.id)?.optionId ?? null;
  const hint = hints
    ? hintFor(item, (id) => sections.find((section) => section.id === id)?.title)
    : null;
  const hintOpen = hint !== null && hintOpenFor === item.id;

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

  function next() {
    if (index === total - 1) {
      onFinish();
      return;
    }
    jump(index + 1);
  }

  const answered = session.itemIds.map((id) => answerFor(session, id) !== undefined);
  const unanswered = answered.indexOf(false);
  const last = index === total - 1;
  const note =
    last && unanswered !== -1 ? `Answer ${unit.toLowerCase()} ${unanswered + 1} to finish.` : null;

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
        saved={isSaved(saved, item.id)}
        onToggleSaved={() => toggleSaved(item.id)}
        hint={hintOpen ? hint : null}
      />
      <SessionBar
        last={last}
        disabled={choice === null || (last && unanswered !== -1)}
        note={note}
        hint={hint ? { open: hintOpen, onToggle: toggleHint } : undefined}
        onNext={next}
      />
    </div>
  );
}
