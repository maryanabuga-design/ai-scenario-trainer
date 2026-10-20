"use client";

import { useState } from "react";
import { ActionBar } from "@/components/ActionBar/ActionBar";
import { Button } from "@/components/Button/Button";
import { Card } from "@/components/Card/Card";
import { ConfirmDialog } from "@/components/ConfirmDialog/ConfirmDialog";
import { PageHeaderBand } from "@/components/PageHeaderBand/PageHeaderBand";
import { SelectableRow } from "@/components/SelectableRow/SelectableRow";
import { TextField } from "@/components/TextField/TextField";
import { GROUP_NAME } from "@/lib/cohort";
import {
  assignProblems,
  defaultTitle,
  examQuestionCount,
  knownTopicIds,
  presetDeadline,
  presets,
  topicQuestionCount,
} from "@/lib/group-exams";
import type { DeadlinePreset } from "@/lib/group-exams";
import { isoDay } from "@/lib/exam-deadline";
import { trainingSections as allTopics } from "@/lib/parts";

export type AssignValues = { title: string; topicIds: string[]; deadline: string };

/**
 * Assign exam (DESIGN.md: Instructor, Assign exam): ONE scrolling screen with a title, topics,
 * a deadline and a read-only information card. Pinned: Primary "Assign exam" (disabled until it is
 * valid) and Secondary "Cancel" (a dialog only when something was entered).
 */
export function AssignExamView({
  titleOf,
  now,
  onAssign,
  onCancel,
  initial,
  confirmingInitially = false,
  dialogInline = false,
}: {
  titleOf: (id: string) => string;
  now: number;
  onAssign: (values: AssignValues) => void;
  onCancel: () => void;
  /** Only for the screen review page: a filled form. */
  initial?: { topics?: string[]; title?: string; preset?: DeadlinePreset | null; date?: string };
  confirmingInitially?: boolean;
  dialogInline?: boolean;
}) {
  const [topics, setTopics] = useState<string[]>(initial?.topics ?? []);
  const [title, setTitle] = useState(initial?.title ?? "");
  const [touched, setTouched] = useState(initial?.title !== undefined);
  const [preset, setPreset] = useState<DeadlinePreset | null>(initial?.preset ?? null);
  const [date, setDate] = useState(initial?.date ?? "");
  const [confirming, setConfirming] = useState(confirmingInitially);

  const shownTitle = touched ? title : defaultTitle(topics, titleOf);
  const deadline = preset === "date" ? date || null : preset ? presetDeadline(preset, now) : null;
  const problems = assignProblems({ title: shownTitle, topicIds: topics, deadline }, now);
  const count = topics.length > 0 ? examQuestionCount(topics) : 20;
  const entered = touched || topics.length > 0 || preset !== null;
  const allSelected = topics.length === allTopics.length;

  function toggleTopic(id: string) {
    setTopics((current) =>
      knownTopicIds(current.includes(id) ? current.filter((t) => t !== id) : [...current, id]),
    );
  }

  return (
    <div className="flex flex-col gap-6 pb-4">
      <PageHeaderBand
        title="Assign exam"
        back={{ label: "Back to Exams", href: "/instructor/exams" }}
      />

      <section aria-labelledby="title-label" className="flex flex-col gap-2">
        <h2 id="title-label" className="type-label text-text-secondary">
          TITLE
        </h2>
        <TextField
          label="Exam title"
          name="title"
          value={shownTitle}
          onChange={(value) => {
            setTouched(true);
            setTitle(value);
          }}
        />
      </section>

      <section aria-labelledby="topics-label" className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <h2 id="topics-label" className="type-label text-text-secondary">
            TOPICS
          </h2>
          <Button
            variant="secondary"
            wide={false}
            compact
            onClick={() => setTopics(allSelected ? [] : [...allTopics])}
          >
            {allSelected ? "Clear" : "Select all"}
          </Button>
        </div>
        <fieldset className="flex flex-col gap-2" aria-labelledby="topics-label">
          {allTopics.map((id) => (
            <SelectableRow
              key={id}
              name="topics"
              value={id}
              type="checkbox"
              compact
              checked={topics.includes(id)}
              onChange={toggleTopic}
            >
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="type-body-strong truncate">{titleOf(id)}</span>
                <span className="type-small text-text-secondary">
                  {topicQuestionCount(id)} questions
                </span>
              </span>
            </SelectableRow>
          ))}
        </fieldset>
      </section>

      <section aria-labelledby="deadline-label" className="flex flex-col gap-3">
        <h2 id="deadline-label" className="type-label text-text-secondary">
          DEADLINE
        </h2>
        <fieldset
          role="radiogroup"
          aria-labelledby="deadline-label"
          className="flex flex-col gap-2"
        >
          {presets.map((option) => (
            <SelectableRow
              key={option.id}
              name="deadline"
              value={option.id}
              checked={preset === option.id}
              onChange={() => setPreset(option.id)}
            >
              <span className="type-body-strong">{option.label}</span>
            </SelectableRow>
          ))}
        </fieldset>
        {preset === "date" && (
          <TextField
            label="Deadline date"
            name="deadline-date"
            type="date"
            min={isoDay(new Date(now))}
            value={date}
            onChange={setDate}
          />
        )}
      </section>

      <Card className="flex flex-col gap-1">
        <p data-info-rules className="type-body-strong">
          {count} questions · 20 minutes · pass mark 80
        </p>
        <p data-info-audience className="type-small text-text-secondary">
          Audience: all students in {GROUP_NAME}
        </p>
      </Card>

      <ActionBar>
        <Button
          disabled={problems.length > 0}
          onClick={() =>
            onAssign({ title: shownTitle.trim(), topicIds: topics, deadline: deadline! })
          }
        >
          Assign exam
        </Button>
        <Button variant="secondary" onClick={() => (entered ? setConfirming(true) : onCancel())}>
          Cancel
        </Button>
      </ActionBar>

      {(confirming || !dialogInline) && (
        <ConfirmDialog
          open={confirming}
          inline={dialogInline}
          title="Discard this exam?"
          description="What you entered will be lost."
          confirmLabel="Discard"
          cancelLabel="Keep editing"
          onConfirm={onCancel}
          onCancel={() => setConfirming(false)}
        />
      )}
    </div>
  );
}
