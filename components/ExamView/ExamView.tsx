"use client";

import { CircleCheck, Clock, Info, ListChecks, LightbulbOff, Target } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/Button/Button";
import { Card } from "@/components/Card/Card";
import { IconTile } from "@/components/IconTile/IconTile";
import { PageHeaderBand } from "@/components/PageHeaderBand/PageHeaderBand";
import { ReadinessBar } from "@/components/ReadinessBar/ReadinessBar";
import { EXAM_MINUTES, EXAM_QUESTIONS, PASS_MARK } from "@/lib/config";
import type { Deadline } from "@/lib/exam-deadline";
import { EXAM_PASS_MARK, isReady } from "@/lib/readiness";

const shortDate = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short" });

/** One past exam attempt, as a count (a Score percentage lives on the results screen only). */
export type ExamAttemptCount = { correct: number; questions: number; finishedAt: number };

/** The rules of the exam, read from the named constants. */
export const examRules: { icon: LucideIcon; text: string }[] = [
  { icon: ListChecks, text: `${EXAM_QUESTIONS} questions from all topics` },
  { icon: Clock, text: `${EXAM_MINUTES} minutes` },
  { icon: LightbulbOff, text: "No hints or feedback during the exam" },
  { icon: Target, text: `Pass mark ${PASS_MARK}%` },
];

/** The subtitle of the band: "Assigned by Admin · Due 25 Oct", with a clock when overdue. */
export function ExamSubtitle({ assignedBy, deadline }: { assignedBy: string; deadline: Deadline }) {
  return (
    <>
      Assigned by {assignedBy} ·{" "}
      {deadline.tone === "overdue" && (
        <Clock size={16} strokeWidth={2} aria-hidden="true" className="mr-1 -mt-0.5 inline" />
      )}
      {deadline.short}
    </>
  );
}

function AttemptRow({ label, attempt }: { label: string; attempt: ExamAttemptCount }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className="text-text-secondary">{label}</span>
      <span className="type-body-strong tabular-nums">
        {attempt.correct} of {attempt.questions}{" "}
        <span className="type-small text-text-secondary">
          · {shortDate.format(attempt.finishedAt)}
        </span>
      </span>
    </div>
  );
}

/**
 * The exam screen: the band (title, "Assigned by Admin · Due 25 Oct"), the readiness card (neutral,
 * with the bar and its 80% tick), the rules, the last and best attempt as counts, and the buttons
 * in the page flow. The exam can always be started; below the pass mark "Repeat weak topics" is the
 * recommended action and "Start exam anyway" the secondary one.
 */
export function ExamView({
  title,
  assignedBy,
  deadline,
  readiness,
  canRepeat,
  last,
  best,
  onStart,
  onRepeat,
}: {
  title: string;
  assignedBy: string;
  deadline: Deadline;
  readiness: number;
  /** There are mistakes or unanswered questions in the exam's scope. */
  canRepeat: boolean;
  last: ExamAttemptCount | null;
  best: ExamAttemptCount | null;
  onStart: () => void;
  onRepeat: () => void;
}) {
  const ready = isReady(readiness);
  return (
    <div className="flex flex-1 flex-col gap-4 pb-[var(--gutter,1rem)]">
      <PageHeaderBand
        title={title}
        subtitle={<ExamSubtitle assignedBy={assignedBy} deadline={deadline} />}
        back={{ label: "Back to Home", href: "/" }}
      />

      <section aria-label="Readiness">
        <Card className="flex flex-col gap-3">
          <div className="flex items-start gap-3">
            <IconTile tone={ready ? "success" : "attention"} className="h-11 w-11 rounded-[12px]">
              {ready ? (
                <CircleCheck size={22} strokeWidth={2} />
              ) : (
                <Info size={22} strokeWidth={2} />
              )}
            </IconTile>
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <h2 className="type-body-strong">{ready ? "You're ready" : "Not ready yet"}</h2>
              <p className="type-body text-text-secondary">
                {ready
                  ? `Your readiness is ${readiness}%.`
                  : `Your readiness is ${readiness}%. The pass mark is ${EXAM_PASS_MARK}%.`}
              </p>
            </div>
          </div>
          <ReadinessBar percent={readiness} />
        </Card>
      </section>

      <Card className="flex flex-col gap-4">
        <h2 className="type-body-strong">How it works</h2>
        <ul className="flex flex-col gap-3">
          {examRules.map(({ icon: Icon, text }) => (
            <li key={text} className="flex items-center gap-3">
              <IconTile className="h-9 w-9 rounded-full">
                <Icon size={18} strokeWidth={1.75} />
              </IconTile>
              <span>{text}</span>
            </li>
          ))}
        </ul>
      </Card>

      <Card className="flex flex-col gap-3">
        <h2 className="type-body-strong">Your results</h2>
        {last && best ? (
          <>
            <AttemptRow label="Last" attempt={last} />
            <AttemptRow label="Best" attempt={best} />
          </>
        ) : (
          <p className="text-text-secondary">You have not taken the exam yet</p>
        )}
      </Card>

      {/* the buttons end the column: at the bottom of a short screen, after the content on a tall one */}
      <div className="mt-auto flex flex-col gap-3 pt-2">
        {ready || !canRepeat ? (
          <Button onClick={onStart}>Start exam</Button>
        ) : (
          <>
            <Button onClick={onRepeat}>Repeat weak topics</Button>
            <Button variant="secondary" onClick={onStart}>
              Start exam anyway
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
