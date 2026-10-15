"use client";

import { History } from "lucide-react";
import { useState } from "react";
import { Button, ButtonLink } from "@/components/Button/Button";
import { Card } from "@/components/Card/Card";
import { EmptyState } from "@/components/EmptyState/EmptyState";
import { HeaderRow } from "@/components/HeaderRow/HeaderRow";
import { useSourceSheet } from "@/components/SourceSheet/SourceSheet";
import { Tag } from "@/components/Tag/Tag";
import type { FinishedSession } from "@/lib/session";
import { sessionLabel } from "@/lib/session";
import { HISTORY_PAGE, seeMore, visibleHistory } from "@/lib/history";
import { scoreSession, weakItemsFromHistory } from "@/lib/progress";
import { progressSummary, sectionStats, trendSessions } from "@/lib/progress-stats";
import { correctCount, weakItems } from "@/lib/scoring";
import { topicsToRepeat, weakTopics } from "@/lib/weak-topics";

const dateFormat = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

const shortDate = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short" });

const BAR_OLDER = "var(--pastel-green)";

const CHART_HEIGHT = 120;

function SummaryCard({ history }: { history: FinishedSession[] }) {
  const { sessions, averagePercent, correctPercent } = progressSummary(history);
  const numbers = [
    { label: "Sessions", value: String(sessions) },
    { label: "Average result", value: `${averagePercent ?? 0}%` },
    { label: "Correct answers", value: `${correctPercent ?? 0}%` },
  ];
  return (
    <Card>
      <dl className="grid grid-cols-3 gap-2">
        {numbers.map((number) => (
          <div key={number.label} className="flex flex-col gap-1">
            <dd className="type-numeral order-1 tabular-nums">{number.value}</dd>
            <dt className="type-small order-2 text-text-secondary">{number.label}</dt>
          </div>
        ))}
      </dl>
    </Card>
  );
}

function TrendCard({ history }: { history: FinishedSession[] }) {
  const results = trendSessions(history);
  return (
    <Card className="flex flex-col gap-4">
      <h2 className="type-item-title">Result by session</h2>
      {history.length < 2 ? (
        <p className="type-small text-text-secondary">Complete two sessions to see your trend.</p>
      ) : (
        <>
          <ol aria-hidden="true" className="flex items-end gap-2">
            {results.map((result, index) => {
              const latest = index === results.length - 1;
              return (
                <li
                  key={result.finishedAt}
                  className="flex min-w-0 flex-1 flex-col items-center gap-1"
                >
                  <span
                    className="flex w-full flex-col items-center justify-end"
                    style={{ height: CHART_HEIGHT }}
                  >
                    <span className="type-small tabular-nums">{result.percent}%</span>
                    <span
                      className="mt-1 w-full max-w-10 rounded-t-lg"
                      style={{
                        height: `${Math.max(result.percent, 2) * 0.8}px`,
                        backgroundColor: latest ? "var(--primary)" : BAR_OLDER,
                      }}
                    />
                  </span>
                  <span className="type-caption text-text-secondary tabular-nums">
                    {shortDate.format(result.finishedAt)}
                  </span>
                </li>
              );
            })}
          </ol>
          <table className="sr-only">
            <caption>Result by session</caption>
            <thead>
              <tr>
                <th scope="col">Date</th>
                <th scope="col">Correct</th>
              </tr>
            </thead>
            <tbody>
              {results.map((result) => (
                <tr key={result.finishedAt}>
                  <td>{shortDate.format(result.finishedAt)}</td>
                  <td>{`${result.correct} of ${result.total} correct, ${result.percent}%`}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </Card>
  );
}

function TopicsCard({ history }: { history: FinishedSession[] }) {
  const topics = weakTopics(weakItemsFromHistory(history)).length;
  return (
    <Card className="flex flex-col gap-2">
      <h2 className="type-item-title">Weak topics</h2>
      {topics === 0 ? (
        <p className="type-small text-text-secondary">Nothing to repeat right now.</p>
      ) : (
        <div className="-ml-3 self-start">
          <ButtonLink variant="tertiary" href="/weak-topics">
            {topicsToRepeat(topics)} · Weak topics
          </ButtonLink>
        </div>
      )}
    </Card>
  );
}

function SectionsCard({ history }: { history: FinishedSession[] }) {
  const { sections } = useSourceSheet();
  const practised = new Set(
    sectionStats(
      history,
      sections.map((s) => s.id),
    )
      .filter((s) => s.total > 0)
      .map((s) => s.id),
  );
  const rows = sectionStats(
    history,
    sections.filter((s) => /^S\d+$/.test(s.id) || practised.has(s.id)).map((s) => s.id),
  );
  return (
    <Card className="flex flex-col gap-4">
      <h2 className="type-item-title">Guide sections</h2>
      <ul className="flex flex-col gap-4">
        {rows.map((row) => {
          const title = sections.find((section) => section.id === row.id)?.title ?? row.id;
          return (
            <li key={row.id} className="flex items-center gap-3">
              <span
                aria-hidden="true"
                className="type-caption flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-olive-tint text-text"
              >
                {row.id}
              </span>
              <span className="flex min-w-0 flex-1 flex-col gap-1">
                <span className="type-body">
                  <span className="sr-only">{row.id} </span>
                  {title}
                </span>
                <span
                  aria-hidden="true"
                  className="h-1.5 overflow-hidden rounded-full bg-secondary-sand"
                >
                  <span
                    className="block h-full rounded-full"
                    style={{
                      width: `${row.total === 0 ? 0 : (row.correct / row.total) * 100}%`,
                      backgroundColor: BAR_OLDER,
                    }}
                  />
                </span>
                <span className="type-small text-text-secondary tabular-nums">
                  {row.total === 0 ? "Not practised yet" : `${row.correct} of ${row.total} correct`}
                </span>
              </span>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}

function HistoryRow({ session }: { session: FinishedSession }) {
  const scored = scoreSession(session);
  const wrong = weakItems(scored).length;

  return (
    <Card className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-3">
        <Tag
          tone={session.kind === "repeat" ? "yellow" : session.kind === "quiz" ? "blue" : "peach"}
        >
          {sessionLabel(session)}
        </Tag>
        <span className="type-small text-text-secondary tabular-nums">
          {dateFormat.format(session.finishedAt)}
        </span>
      </div>
      <p className="type-item-title tabular-nums">
        {correctCount(scored)} of {scored.length} correct
      </p>
      <p className="type-small text-text-secondary">
        {wrong === 0 ? (
          "Nothing to repeat."
        ) : (
          <>
            <span className="tabular-nums">{wrong}</span> {wrong === 1 ? "answer" : "answers"}{" "}
            wrong.
          </>
        )}
      </p>
    </Card>
  );
}

/** Progress: how you are doing over time. Actions to repeat live on Home. */
export function ProgressView({ history }: { history: FinishedSession[] }) {
  const [shown, setShown] = useState(HISTORY_PAGE);
  const { visible, hasMore } = visibleHistory([...history].reverse(), shown);
  return (
    <div className="flex flex-col gap-6">
      <HeaderRow
        title={<h1 className="type-page-title">Progress</h1>}
        subtitle={<p className="type-small text-text-secondary">How you are doing over time.</p>}
      />

      {history.length === 0 ? (
        <EmptyState
          icon={History}
          text="No sessions yet. Start a scenario to see your progress."
          action={<ButtonLink href="/">Start a scenario</ButtonLink>}
        />
      ) : (
        <>
          <SummaryCard history={history} />
          <TrendCard history={history} />
          <TopicsCard history={history} />
          <SectionsCard history={history} />
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
