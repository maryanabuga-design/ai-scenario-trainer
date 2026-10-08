"use client";

import { ButtonLink } from "@/components/Button/Button";
import { Card } from "@/components/Card/Card";
import { Tag } from "@/components/Tag/Tag";
import { WeakTopics } from "@/components/WeakTopics/WeakTopics";
import { modeLabels, scoreSession, weakAnswersFromHistory } from "@/lib/progress";
import { weakStepIds } from "@/lib/scoring";
import type { FinishedSession } from "@/lib/session";

const dateFormat = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

function HistoryRow({ session }: { session: FinishedSession }) {
  const scored = scoreSession(session);
  const correct = scored.filter((answer) => answer.correct).length;
  const weak = weakStepIds(scored).length;

  return (
    <Card className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-3">
        <Tag tone={session.mode === "short" ? "peach" : session.mode === "full" ? "lilac" : "blue"}>
          {modeLabels[session.mode]}
        </Tag>
        <span className="text-sm text-text-secondary tabular-nums">
          {dateFormat.format(session.finishedAt)}
        </span>
      </div>
      <p className="text-lg font-medium tabular-nums">
        {correct} of {scored.length} correct
      </p>
      <p className="text-sm text-text-secondary">
        {weak === 0 ? (
          "Nothing to repeat."
        ) : (
          <>
            <span className="tabular-nums">{weak}</span> {weak === 1 ? "step" : "steps"} wrong or
            guessed.
          </>
        )}
      </p>
    </Card>
  );
}

export function ProgressView({
  history,
  onPractise,
}: {
  history: FinishedSession[];
  onPractise: (stepIds: string[]) => void;
}) {
  return (
    <div className="flex flex-col gap-8">
      <h1 className="font-serif text-2xl">Progress</h1>

      {history.length === 0 ? (
        <div className="flex flex-col items-start gap-4">
          <p className="text-text-secondary">
            No sessions yet. Finish a scenario and your results, weak topics and history appear
            here. They are saved in this browser only.
          </p>
          <ButtonLink href="/materials/evacuation-guide" variant="secondary">
            Start a scenario
          </ButtonLink>
        </div>
      ) : (
        <>
          <WeakTopics weakAnswers={weakAnswersFromHistory(history)} onPractise={onPractise} />
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
