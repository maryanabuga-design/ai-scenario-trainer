"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AskAiProvider } from "@/components/AskAi/AskAi";
import { ButtonLink } from "@/components/Button/Button";
import { DecisionStep, emptyDraft } from "@/components/DecisionStep/DecisionStep";
import { ExplainStep } from "@/components/ExplainStep/ExplainStep";
import type { Draft } from "@/components/DecisionStep/DecisionStep";
import { FeedbackView } from "@/components/FeedbackView/FeedbackView";
import { QuizFeedback } from "@/components/QuizFeedback/QuizFeedback";
import { emptyQuizDraft, QuizQuestion } from "@/components/QuizQuestion/QuizQuestion";
import type { QuizDraft } from "@/components/QuizQuestion/QuizQuestion";
import type { Unit } from "@/components/SessionTopBar/SessionTopBar";
import { selfCheckOf } from "@/lib/explanation-match";
import { simulatedFeedback } from "@/lib/feedback";
import { getQuestion } from "@/lib/quiz";
import { getStep } from "@/lib/scenario";
import type { Answer, QuizAnswer, Session } from "@/lib/session";
import {
  finishSession,
  isQuiz,
  isRepeatRound,
  itemCount,
  saveSession,
  useSession,
} from "@/lib/session";
import type { RepeatItem } from "@/lib/weak-topics";

function NoSession() {
  return (
    <div className="flex flex-col items-start gap-4">
      <h1 className="font-serif text-2xl">No session in progress</h1>
      <p className="text-text-secondary">Start a scenario from a material.</p>
      <ButtonLink href="/materials" variant="secondary">
        Go to Materials
      </ButtonLink>
    </div>
  );
}

/** The step or question the session is on, whatever kind of session it is. */
function currentItem(session: Session): RepeatItem {
  if (isRepeatRound(session)) return session.items[session.index];
  if (isQuiz(session)) return { type: "question", id: session.questionIds[session.index] };
  return { type: "step", id: session.stepIds[session.index] };
}

function savedAnswer(session: Session, item: RepeatItem): Answer | QuizAnswer | undefined {
  if (isRepeatRound(session)) {
    return session.answers.find((answer) =>
      answer.type === "step" ? answer.stepId === item.id : answer.questionId === item.id,
    );
  }
  if (isQuiz(session)) return session.answers.find((answer) => answer.questionId === item.id);
  return session.answers.find((answer) => answer.stepId === item.id);
}

/** Adds an answer. A step goes on to the Explain screen; a question straight to feedback. */
function withAnswer(session: Session, answer: Answer | QuizAnswer): Session {
  const phase = "stepId" in answer ? "explain" : "feedback";
  if (isRepeatRound(session)) {
    const tagged =
      "stepId" in answer
        ? { type: "step" as const, ...answer }
        : { type: "question" as const, ...answer };
    return { ...session, answers: [...session.answers, tagged], phase };
  }
  if (isQuiz(session) && "questionId" in answer) {
    return { ...session, answers: [...session.answers, answer], phase };
  }
  if (!isQuiz(session) && "stepId" in answer) {
    return { ...session, answers: [...session.answers, answer], phase };
  }
  return session;
}

/** Changes the saved answer of a step: its explanation, self-check or skip. */
function withStepAnswer(session: Session, stepId: string, patch: Partial<Answer>): Session {
  if (isRepeatRound(session)) {
    return {
      ...session,
      answers: session.answers.map((answer) =>
        answer.type === "step" && answer.stepId === stepId ? { ...answer, ...patch } : answer,
      ),
    };
  }
  if (isQuiz(session)) return session;
  return {
    ...session,
    answers: session.answers.map((answer) =>
      answer.stepId === stepId ? { ...answer, ...patch } : answer,
    ),
  };
}

function StepDecide({
  stepId,
  index,
  total,
  unit,
  onAnswer,
}: {
  stepId: string;
  index: number;
  total: number;
  unit: Unit;
  onAnswer: (answer: Answer) => void;
}) {
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const step = getStep(stepId);
  return (
    <DecisionStep
      step={step}
      index={index}
      total={total}
      unit={unit}
      draft={draft}
      onDraftChange={setDraft}
      onSubmit={() => {
        if (!draft.optionId || !draft.confidence) return;
        onAnswer({
          stepId: step.id,
          optionId: draft.optionId,
          confidence: draft.confidence,
          explanation: "",
        });
      }}
    />
  );
}

function QuestionDecide({
  questionId,
  index,
  total,
  unit,
  onAnswer,
}: {
  questionId: string;
  index: number;
  total: number;
  unit: Unit;
  onAnswer: (answer: QuizAnswer) => void;
}) {
  const question = getQuestion(questionId);
  const [draft, setDraft] = useState<QuizDraft>(() => emptyQuizDraft(question));
  return (
    <QuizQuestion
      question={question}
      index={index}
      total={total}
      unit={unit}
      draft={draft}
      onDraftChange={setDraft}
      onSubmit={() => {
        if (!draft.response) return;
        onAnswer({
          questionId: question.id,
          response: draft.response,
          confidence: draft.confidence,
        });
      }}
    />
  );
}

export default function SessionPage() {
  const router = useRouter();
  const session = useSession();

  if (session === "loading") return null;
  if (!session || session.finished) return <NoSession />;

  const item = currentItem(session);
  const total = itemCount(session);
  const last = session.index === total - 1;
  const unit: Unit = isRepeatRound(session) ? "Item" : item.type === "step" ? "Step" : "Question";

  function answer(next: Answer | QuizAnswer) {
    if (session === "loading" || !session) return;
    saveSession(withAnswer(session, next));
    window.scrollTo(0, 0);
  }

  function goOn() {
    if (session === "loading" || !session) return;
    if (last) {
      finishSession(session);
      router.push("/session/results");
    } else {
      saveSession({ ...session, index: session.index + 1, phase: "decide" });
      window.scrollTo(0, 0);
    }
  }

  if (session.phase === "decide") {
    return item.type === "step" ? (
      <AskAiProvider>
        <StepDecide
          key={session.index}
          stepId={item.id}
          index={session.index}
          total={total}
          unit={unit}
          onAnswer={answer}
        />
      </AskAiProvider>
    ) : (
      <QuestionDecide
        key={session.index}
        questionId={item.id}
        index={session.index}
        total={total}
        unit={unit}
        onAnswer={answer}
      />
    );
  }

  const saved = savedAnswer(session, item);
  if (!saved) return <NoSession />;

  function updateStep(stepId: string, patch: Partial<Answer>, phase?: Session["phase"]) {
    if (session === "loading" || !session) return;
    const next = withStepAnswer(session, stepId, patch);
    saveSession(phase ? { ...next, phase } : next);
    if (phase) window.scrollTo(0, 0);
  }

  if ("stepId" in saved && session.phase === "explain") {
    return (
      <ExplainStep
        key={session.index}
        step={getStep(saved.stepId)}
        answer={saved}
        index={session.index}
        total={total}
        unit={unit}
        onCheck={(explanation, selfCheck) => updateStep(saved.stepId, { explanation, selfCheck })}
        onSelfCheckChange={(selfCheck) => updateStep(saved.stepId, { selfCheck })}
        onSkip={() =>
          updateStep(
            saved.stepId,
            { explanation: "", selfCheck: undefined, skipped: true },
            "feedback",
          )
        }
        onSeeFeedback={() => updateStep(saved.stepId, {}, "feedback")}
      />
    );
  }

  if ("stepId" in saved) {
    const step = getStep(saved.stepId);
    return (
      <AskAiProvider>
        <FeedbackView
          step={step}
          feedback={simulatedFeedback.evaluate(step, saved)}
          selfCheck={selfCheckOf(saved)}
          index={session.index}
          total={total}
          unit={unit}
          nextLabel={last ? "See results" : unit === "Item" ? "Next item" : "Next step"}
          onNext={goOn}
        />
      </AskAiProvider>
    );
  }
  return (
    <QuizFeedback
      question={getQuestion(saved.questionId)}
      response={saved.response}
      confidence={saved.confidence}
      index={session.index}
      total={total}
      unit={unit}
      nextLabel={last ? "See results" : unit === "Item" ? "Next item" : "Next question"}
      onNext={goOn}
    />
  );
}
