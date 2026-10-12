"use client";

import { History } from "lucide-react";
import { ButtonLink } from "@/components/Button/Button";
import { Card } from "@/components/Card/Card";
import { EmptyState } from "@/components/EmptyState/EmptyState";
import { Tag } from "@/components/Tag/Tag";
import { RepeatSummary } from "@/components/RepeatSummary/RepeatSummary";
import { formatPoints, scoreSession, sessionLabel, weakItemsFromHistory } from "@/lib/progress";
import { totalScore, weakItems } from "@/lib/scoring";
import type { FinishedSession } from "@/lib/session";
import type { WeakTopic } from "@/lib/weak-topics";

const dateFormat = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

function HistoryRow({ session }: { session: FinishedSession }) {
  const scored = scoreSession(session);
  const correct = scored.filter((item) => item.correct).length;
  const weak = weakItems(scored).length;
  const quiz = session.kind === "quiz";

  return (
    <Card className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-3">
        <Tag
          tone={
            session.kind === "repeat"
              ? "yellow"
              : quiz
                ? "blue"
                : session.mode === "short"
                  ? "peach"
                  : "lilac"
          }
        >
          {sessionLabel(session)}
        </Tag>
        <span className="text-sm text-text-secondary tabular-nums">
          {dateFormat.format(session.finishedAt)}
        </span>
      </div>
      <p className="text-lg font-medium tabular-nums">
        {quiz
          ? `${formatPoints(totalScore(scored))} of ${scored.length} points`
          : `${correct} of ${scored.length} correct`}
      </p>
      <p className="text-sm text-text-secondary">
        {weak === 0 ? (
          "Nothing to repeat."
        ) : (
          <>
            <span className="tabular-nums">{weak}</span>{" "}
            {session.kind === "repeat"
              ? weak === 1
                ? "item"
                : "items"
              : quiz
                ? weak === 1
                  ? "question"
                  : "questions"
                : weak === 1
                  ? "step"
                  : "steps"}{" "}
            wrong, partly right or guessed.
          </>
        )}
      </p>
    </Card>
  );
}

export function ProgressView({
  history,
  onRepeat,
}: {
  history: FinishedSession[];
  onRepeat: (topics: WeakTopic[]) => void;
}) {
  return (
    <div className="flex flex-col gap-8">
      <h1 className="font-semibold text-2xl">Progress</h1>

      {history.length === 0 ? (
        <EmptyState
          icon={History}
          text="No sessions yet. Finished sessions are saved here, in this browser only."
          action={
            <ButtonLink href="/materials/evacuation-guide" variant="secondary">
              Start a scenario
            </ButtonLink>
          }
        />
      ) : (
        <>
          <RepeatSummary weakItems={weakItemsFromHistory(history)} onRepeat={onRepeat} />
          <section aria-labelledby="history-title" className="flex flex-col gap-3">
            <h2 id="history-title" className="text-lg font-medium">
              Session history
            </h2>
            <ol className="flex flex-col gap-3">
              {[...history].reverse().map((session) => (
                <li key={session.finishedAt}>
                  <HistoryRow session={session} />
                </li>
              ))}
            </ol>
          </section>
        </>
      )}
    </div>
  );
}
