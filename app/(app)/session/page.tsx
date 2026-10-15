"use client";

import { useRouter } from "next/navigation";
import { ButtonLink } from "@/components/Button/Button";
import { QuestionScreen } from "@/components/QuestionScreen/QuestionScreen";
import { SessionBar } from "@/components/SessionBar/SessionBar";
import { SessionTopBar } from "@/components/SessionTopBar/SessionTopBar";
import type { Unit } from "@/components/SessionTopBar/SessionTopBar";
import { stripStates } from "@/components/StepStrip/StepStrip";
import { getItem } from "@/lib/items";
import type { Session } from "@/lib/session";
import {
  answerFor,
  finishSession,
  isValidSession,
  saveSession,
  useSession,
  withAnswer,
} from "@/lib/session";

function NoSession() {
  return (
    <div className="flex flex-col items-start gap-4">
      <h1 className="type-page-title">No session in progress</h1>
      <p className="text-text-secondary">Start a scenario from a material.</p>
      <ButtonLink href="/materials">Go to Materials</ButtonLink>
    </div>
  );
}

/**
 * A running session, one question at a time. The choice is saved as soon as it is made, Back and
 * the step strip show it again, and nothing says whether it is right until Finish.
 */
function Runner({ session }: { session: Session }) {
  const router = useRouter();
  const total = session.itemIds.length;
  const index = Math.min(session.index, total - 1);
  const item = getItem(session.itemIds[index]);
  const unit: Unit = session.kind === "scenario" ? "Step" : "Question";
  const choice = answerFor(session, item.id)?.optionId ?? null;

  function jump(position: number) {
    saveSession({ ...session, index: position });
    window.scrollTo(0, 0);
  }

  function next() {
    if (index === total - 1) {
      finishSession(session);
      router.push("/session/results");
      return;
    }
    jump(index + 1);
  }

  const answered = session.itemIds.map((id) => answerFor(session, id) !== undefined);
  const unanswered = answered.indexOf(false);
  const last = index === total - 1;
  const hint =
    last && unanswered !== -1 ? `Answer ${unit.toLowerCase()} ${unanswered + 1} to finish.` : null;

  return (
    <div className="flex flex-col gap-4">
      <SessionTopBar
        index={index}
        total={total}
        unit={unit}
        states={stripStates(answered, index)}
        onJump={jump}
        onBack={() => jump(index - 1)}
        onLeave={() => router.push("/")}
      />
      <QuestionScreen
        key={item.id}
        item={item}
        choice={choice}
        onChoose={(optionId) => saveSession(withAnswer(session, item.id, optionId))}
      />
      <SessionBar
        last={last}
        disabled={choice === null || (last && unanswered !== -1)}
        hint={hint}
        onNext={next}
      />
    </div>
  );
}

export default function SessionPage() {
  const session = useSession();
  if (session === "loading") return null;
  if (!session || session.finished || !isValidSession(session)) return <NoSession />;
  return <Runner session={session} />;
}
