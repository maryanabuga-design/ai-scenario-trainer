"use client";

import { History } from "lucide-react";
import { useState } from "react";
import { Button, ButtonLink } from "@/components/Button/Button";
import { Card } from "@/components/Card/Card";
import { EmptyState } from "@/components/EmptyState/EmptyState";
import { HeaderRow } from "@/components/HeaderRow/HeaderRow";
import { RepeatSummary } from "@/components/RepeatSummary/RepeatSummary";
import { Tag } from "@/components/Tag/Tag";
import type { FinishedSession } from "@/lib/session";
import type { WeakTopic } from "@/lib/weak-topics";
import { HISTORY_PAGE, seeMore, visibleHistory } from "@/lib/history";
import { formatPoints, scoreSession, sessionLabel, weakItemsFromHistory } from "@/lib/progress";
import { totalScore, weakItems } from "@/lib/scoring";

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
        <span className="type-small text-text-secondary tabular-nums">
          {dateFormat.format(session.finishedAt)}
        </span>
      </div>
      <p className="type-item-title tabular-nums">
        {quiz
          ? `${formatPoints(totalScore(scored))} of ${scored.length} points`
          : `${correct} of ${scored.length} correct`}
      </p>
      <p className="type-small text-text-secondary">
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
  const [shown, setShown] = useState(HISTORY_PAGE);
  const { visible, hasMore } = visibleHistory([...history].reverse(), shown);
  return (
    <div className="flex flex-col gap-6">
      <HeaderRow
        title={<h1 className="type-page-title">Progress</h1>}
        subtitle={
          <p className="type-small text-text-secondary">Topics to repeat and your past sessions.</p>
        }
      />

      {history.length === 0 ? (
        <EmptyState
          icon={History}
          text="No sessions yet. Finished sessions are saved here, in this browser only."
          action={<ButtonLink href="/materials/evacuation-guide">Start a scenario</ButtonLink>}
        />
      ) : (
        <>
          <RepeatSummary weakItems={weakItemsFromHistory(history)} onRepeat={onRepeat} />
          <section aria-labelledby="history-title" className="flex flex-col gap-3">
            <h2 id="history-title" className="type-item-title">
              Session history
            </h2>
            <ol className="flex flex-col gap-3">
              {visible.map((session) => (
                <li key={session.finishedAt}>
                  <HistoryRow session={session} />
                </li>
              ))}
            </ol>
            {hasMore && (
              <div className="-ml-3">
                <Button variant="tertiary" onClick={() => setShown(seeMore(shown))}>
                  See more
                </Button>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
