"use client";

import { useState } from "react";
import { ActionBar } from "@/components/ActionBar/ActionBar";
import { Button } from "@/components/Button/Button";
import { PageHeaderBand } from "@/components/PageHeaderBand/PageHeaderBand";
import { SelectableRow } from "@/components/SelectableRow/SelectableRow";
import { TextField } from "@/components/TextField/TextField";
import { isoDay } from "@/lib/exam-deadline";
import { extendOptions, extendedDeadline } from "@/lib/exam-detail";
import type { ExtendOption } from "@/lib/exam-detail";
import { shortDate } from "@/lib/group-exams";
import type { GroupExam } from "@/lib/group-exams";

/**
 * Extend deadline (DESIGN.md: Instructor, Exams rebuilt): single-choice rows "+3 days", "+1 week",
 * "Pick a date" (a date field), the note that students will be notified, and the pinned Primary
 * "Extend deadline" above Secondary "Cancel". The new date counts from the old deadline.
 */
export function ExtendDeadlineView({
  exam,
  now,
  onExtend,
  onCancel,
  initial,
}: {
  exam: GroupExam;
  now: number;
  onExtend: (deadline: string) => void;
  onCancel: () => void;
  /** Only for the screen review page. */
  initial?: ExtendOption;
}) {
  const [option, setOption] = useState<ExtendOption | null>(initial ?? null);
  const [date, setDate] = useState("");
  const next = option ? extendedDeadline(exam, option, date) : null;
  return (
    <div className="flex flex-col gap-4 pb-4">
      <PageHeaderBand
        title="Extend deadline"
        subtitle={`${exam.title} · due ${shortDate(exam.deadline)}`}
        back={{ label: "Back to exam", href: `/instructor/exams/${exam.id}` }}
      />
      <fieldset role="radiogroup" aria-label="New deadline" className="flex flex-col gap-2">
        {extendOptions.map((entry) => (
          <SelectableRow
            key={entry.id}
            name="extend"
            value={entry.id}
            checked={option === entry.id}
            onChange={() => setOption(entry.id)}
          >
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="type-body-strong">{entry.label}</span>
              {entry.days !== undefined && (
                <span className="type-small text-text-secondary">
                  New deadline{" "}
                  {extendedDeadline(exam, entry.id, "")
                    ? shortDate(extendedDeadline(exam, entry.id, "")!)
                    : ""}
                </span>
              )}
            </span>
          </SelectableRow>
        ))}
      </fieldset>
      {option === "date" && (
        <TextField
          label="New deadline date"
          name="extend-date"
          type="date"
          min={isoDay(new Date(now), 1)}
          value={date}
          onChange={setDate}
          error={date !== "" && !next ? "Choose a date after the current deadline." : null}
        />
      )}
      <p data-extend-note className="type-small text-text-secondary">
        Students will be notified.
      </p>
      <ActionBar>
        <Button disabled={!next} onClick={() => next && onExtend(next)}>
          Extend deadline
        </Button>
        <Button variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
      </ActionBar>
    </div>
  );
}
