"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ButtonLink } from "@/components/Button/Button";
import { DecisionStep } from "@/components/DecisionStep/DecisionStep";
import { QuizQuestion } from "@/components/QuizQuestion/QuizQuestion";
import { SessionBar } from "@/components/SessionBar/SessionBar";
import { SessionTopBar } from "@/components/SessionTopBar/SessionTopBar";
import type { Unit } from "@/components/SessionTopBar/SessionTopBar";
import { stripStates } from "@/components/StepStrip/StepStrip";
import { getQuestion } from "@/lib/quiz";
import { getStep } from "@/lib/scenario";
import type { Answer, QuizAnswer, Session } from "@/lib/session";
import {
  answerFor,
  finishSession,
  isQuiz,
  isRepeatRound,
  saveSession,
  sessionItems,
  useSession,
  withAnswer,
} from "@/lib/session";
import {
  isQuizComplete,
  isStepComplete,
  quizAnswerFrom,
  quizDraftFrom,
  stepAnswerFrom,
  stepDraftFrom,
} from "@/lib/session-draft";
import type { QuizDraft, StepDraft } from "@/lib/session-draft";
import type { RepeatItem } from "@/lib/weak-topics";

function NoSession() {
  return (
    <div className="flex flex-col items-start gap-4">
      <h1 className="type-page-title">No session in progress</h1>
      <p className="text-text-secondary">Start a scenario from a material.</p>
      <ButtonLink href="/materials">Go to Materials</ButtonLink>
    </div>
  );
}

type Draft = StepDraft | QuizDraft;

function draftFor(session: Session, item: RepeatItem): Draft {
  const saved = answerFor(session, item);
  return item.type === "step"
    ? stepDraftFrom(saved as Answer | undefined)
    : quizDraftFrom(getQuestion(item.id), saved as QuizAnswer | undefined);
}

function answerFrom(item: RepeatItem, draft: Draft): Answer | QuizAnswer | null {
  return item.type === "step"
    ? stepAnswerFrom(getStep(item.id), draft as StepDraft)
    : quizAnswerFrom(getQuestion(item.id), draft as QuizDraft);
}

function isComplete(item: RepeatItem, draft: Draft) {
  return item.type === "step"
    ? isStepComplete(draft as StepDraft)
    : isQuizComplete(draft as QuizDraft);
}

/**
 * A running session, one step or question at a time. Answers are saved as they are given, Back
 * and the step strip show them again, and nothing says whether an answer is right until Finish.
 */
function Runner({ session }: { session: Session }) {
  const router = useRouter();
  /** What the person has changed on screen; the saved answer fills in everything else. */
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});

  const items = sessionItems(session);
  const total = items.length;
  const index = Math.min(session.index, total - 1);
  const item = items[index];
  const unit: Unit = isRepeatRound(session) ? "Item" : isQuiz(session) ? "Question" : "Step";
  const draft = drafts[item.id] ?? draftFor(session, item);
  const complete = isComplete(item, draft);

  function change(next: Draft) {
    setDrafts((current) => ({ ...current, [item.id]: next }));
    saveSession(withAnswer(session, item, answerFrom(item, next)));
  }

  function jump(position: number) {
    saveSession({ ...session, index: position });
    window.scrollTo(0, 0);
  }

  /** The session with the current item answered: an untouched ordering is saved as it is shown. */
  function withCurrent(): Session {
    return answerFor(session, item) ? session : withAnswer(session, item, answerFrom(item, draft));
  }

  function next() {
    const current = withCurrent();
    if (index === total - 1) {
      finishSession(current);
      router.push("/session/results");
      return;
    }
    saveSession({ ...current, index: index + 1 });
    window.scrollTo(0, 0);
  }

  const answered = items.map((candidate, position) =>
    position === index ? complete : answerFor(session, candidate) !== undefined,
  );
  const unanswered = answered.indexOf(false);
  const last = index === total - 1;
  const hint =
    last && unanswered !== -1 ? `Answer ${unit.toLowerCase()} ${unanswered + 1} to finish.` : null;

  return (
    <div className="flex flex-col gap-6">
      <SessionTopBar
        index={index}
        total={total}
        unit={unit}
        states={stripStates(answered, index)}
        onJump={jump}
        onLeave={() => router.push("/")}
      />
      {item.type === "step" ? (
        <DecisionStep
          key={item.id}
          step={getStep(item.id)}
          draft={draft as StepDraft}
          onDraftChange={change}
        />
      ) : (
        <QuizQuestion
          key={item.id}
          question={getQuestion(item.id)}
          draft={draft as QuizDraft}
          onDraftChange={change}
        />
      )}
      <SessionBar
        backLabel={index > 0 ? `Previous ${unit.toLowerCase()}` : null}
        onBack={() => jump(index - 1)}
        last={last}
        disabled={!complete || (last && unanswered !== -1)}
        hint={hint}
        onNext={next}
      />
    </div>
  );
}

export default function SessionPage() {
  const session = useSession();
  if (session === "loading") return null;
  if (!session || session.finished) return <NoSession />;
  return <Runner session={session} />;
}
