"use client";

import { Clock, ListChecks, LightbulbOff, Target } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { IconTile } from "@/components/IconTile/IconTile";
import { ActionBar } from "@/components/ActionBar/ActionBar";
import { Button } from "@/components/Button/Button";
import { Card } from "@/components/Card/Card";
import { CircleBackButton } from "@/components/CircleBackButton/CircleBackButton";
import { EXAM_MINUTES, EXAM_QUESTIONS, PASS_MARK } from "@/lib/config";

const shortDate = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short" });

export type ExamScore = { percent: number; finishedAt: number };

/** The rules of the exam, read from the named constants. */
export const examRules: { icon: LucideIcon; text: string }[] = [
  { icon: ListChecks, text: `${EXAM_QUESTIONS} questions from all topics` },
  { icon: Clock, text: `${EXAM_MINUTES} minutes` },
  { icon: LightbulbOff, text: "No hints" },
  { icon: Target, text: `Pass mark ${PASS_MARK}%` },
];

function ScoreRow({ label, score }: { label: string; score: ExamScore }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className="text-text-secondary">{label}</span>
      <span className="type-body-strong tabular-nums">
        {score.percent}%{" "}
        <span className="type-small text-text-secondary">
          · {shortDate.format(score.finishedAt)}
        </span>
      </span>
    </div>
  );
}

/**
 * The Exam intro: the rules, the last and best result, and the sticky Start exam. The exam is never
 * resumed: starting always begins a new one.
 */
export function ExamIntroView({
  last,
  best,
  onStart,
}: {
  last: ExamScore | null;
  best: ExamScore | null;
  onStart: () => void;
}) {
  return (
    <div className="flex flex-col gap-4 pb-4">
      <CircleBackButton href="/" label="Back to Home" />
      <header className="flex flex-col gap-1">
        <h1 className="type-page-title">Exam</h1>
        <p className="type-body text-text-secondary">A full check of your knowledge</p>
      </header>

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
            <ScoreRow label="Last" score={last} />
            <ScoreRow label="Best" score={best} />
          </>
        ) : (
          <p className="text-text-secondary">You have not taken the exam yet</p>
        )}
      </Card>

      <ActionBar>
        <Button onClick={onStart}>Start exam</Button>
      </ActionBar>
    </div>
  );
}
