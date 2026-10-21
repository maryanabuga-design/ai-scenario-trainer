"use client";

import { Calendar, ClipboardCheck, FileCheck, Shield, UsersRound } from "lucide-react";
import { useState } from "react";
import type { ReactNode } from "react";
import { ActionBar } from "@/components/ActionBar/ActionBar";
import { Button } from "@/components/Button/Button";
import { ConfirmDialog } from "@/components/ConfirmDialog/ConfirmDialog";
import { PageHeaderBand } from "@/components/PageHeaderBand/PageHeaderBand";
import { SegmentedControl } from "@/components/SegmentedControl/SegmentedControl";
import { SelectableRow } from "@/components/SelectableRow/SelectableRow";
import { TextField } from "@/components/TextField/TextField";
import { LucideTile } from "@/components/TopicTile/TopicTile";
import { isoDay } from "@/lib/exam-deadline";
import {
  DEFAULT_ATTEMPTS,
  MIN_QUESTIONS,
  assignProblems,
  defaultTitle,
  examQuestionCount,
  knownTopicIds,
  presetDeadline,
  presets,
  totalQuestions,
} from "@/lib/group-exams";
import type { AttemptsAllowed, DeadlinePreset } from "@/lib/group-exams";
import { groups } from "@/lib/groups";
import { studentsCount } from "@/lib/overview";
import { trainingSections as allTopics } from "@/lib/parts";

export type AssignValues = {
  title: string;
  topicIds: string[];
  deadline: string;
  groupIds: string[];
  attemptsAllowed: AttemptsAllowed;
};

const attemptOptions: { value: "1" | "3" | "unlimited"; label: string }[] = [
  { value: "1", label: "1 attempt" },
  { value: "3", label: "3 attempts" },
  { value: "unlimited", label: "Unlimited" },
];
const toKey = (value: AttemptsAllowed) =>
  value === null ? "unlimited" : (String(value) as "1" | "3");
const fromKey = (key: string): AttemptsAllowed =>
  key === "unlimited" ? null : key === "1" ? 1 : 3;

/** A white section card with its small uppercase label (and an optional action at the right). */
function Section({
  id,
  label,
  action,
  children,
}: {
  id: string;
  label: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section
      aria-labelledby={id}
      className="flex flex-col gap-3 rounded-card border border-selectable-stroke bg-card p-[var(--gutter,1rem)]"
    >
      <div className="flex min-h-9 items-center justify-between gap-3">
        <h2 id={id} className="type-label text-text-secondary">
          {label}
        </h2>
        {action}
      </div>
      {children}
    </section>
  );
}

/**
 * Assign exam (DESIGN.md: Instructor, Exams rebuilt): the compact specs card, then white section
 * cards TITLE, TOPICS (all ten, selection circles), DEADLINE (a 2 by 2 grid), ATTEMPTS (three
 * segments) and AUDIENCE (the groups). Pinned: Primary "Assign exam" (disabled until valid) above
 * Secondary "Cancel" (a dialog only after input). Duplicate and "Assign exam on this topic" prefill it.
 */
export function AssignExamView({
  titleOf,
  groupCounts,
  initialGroups,
  now,
  onAssign,
  onCancel,
  fromOverview = false,
  initial,
  confirmingInitially = false,
  dialogInline = false,
}: {
  titleOf: (id: string) => string;
  /** The number of students of each group id (the AUDIENCE rows). */
  groupCounts: Record<string, number>;
  /** The groups chosen first: the group in context. */
  initialGroups: string[];
  now: number;
  onAssign: (values: AssignValues) => void;
  onCancel: () => void;
  /** Opened from the Overview: Back returns there. */
  fromOverview?: boolean;
  /** Prefilled values: from a topic, from Duplicate, or for the screen review page. */
  initial?: {
    topics?: string[];
    title?: string;
    preset?: DeadlinePreset | null;
    date?: string;
    attempts?: AttemptsAllowed;
  };
  confirmingInitially?: boolean;
  dialogInline?: boolean;
}) {
  const [topics, setTopics] = useState<string[]>(initial?.topics ?? []);
  const [title, setTitle] = useState(initial?.title ?? "");
  const [touched, setTouched] = useState(initial?.title !== undefined);
  const [preset, setPreset] = useState<DeadlinePreset | null>(initial?.preset ?? null);
  const [date, setDate] = useState(initial?.date ?? "");
  const [attempts, setAttempts] = useState<AttemptsAllowed>(
    initial?.attempts === undefined ? DEFAULT_ATTEMPTS : initial.attempts,
  );
  const [audience, setAudience] = useState<string[]>(initialGroups);
  const [confirming, setConfirming] = useState(confirmingInitially);

  const shownTitle = touched ? title : defaultTitle(topics, titleOf);
  const deadline = preset === "date" ? date || null : preset ? presetDeadline(preset, now) : null;
  const problems = assignProblems(
    {
      title: shownTitle,
      topicIds: topics,
      deadline,
      groupIds: audience,
      attemptsAllowed: attempts,
    },
    now,
  );
  const count = topics.length > 0 ? examQuestionCount(topics) : 20;
  const entered = touched || topics.length > 0 || preset !== null;
  const allSelected = topics.length === allTopics.length;
  const tooFew = topics.length > 0 && totalQuestions(topics) < MIN_QUESTIONS;

  function toggleTopic(id: string) {
    setTopics((current) =>
      knownTopicIds(current.includes(id) ? current.filter((t) => t !== id) : [...current, id]),
    );
  }

  return (
    <div className="flex flex-col gap-4 pb-4">
      <PageHeaderBand
        title="Assign exam"
        back={
          fromOverview
            ? { label: "Back to Overview", href: "/instructor" }
            : { label: "Back to Exams", href: "/instructor/exams" }
        }
      />

      <div
        data-specs-card
        className="flex items-center gap-3 rounded-card border border-selectable-stroke bg-secondary-sand p-[var(--gutter,1rem)]"
      >
        <LucideTile icon={ClipboardCheck} size="tile" />
        <div className="flex min-w-0 flex-col">
          <p className="type-label text-text-secondary">EVALUATION SPECS</p>
          <p data-info-rules className="type-body-strong">
            {count} questions
          </p>
          <p data-info-rules-2 className="type-small text-text-secondary">
            20 minutes · pass mark 80
          </p>
        </div>
      </div>

      <Section id="title-label" label="TITLE">
        <TextField
          label="Exam title"
          hideLabel
          name="title"
          value={shownTitle}
          onChange={(value) => {
            setTouched(true);
            setTitle(value);
          }}
        />
      </Section>

      <Section
        id="topics-label"
        label="TOPICS"
        action={
          <Button
            variant="secondary"
            wide={false}
            compact
            onClick={() => setTopics(allSelected ? [] : [...allTopics])}
          >
            {allSelected ? "Clear" : "Select all"}
          </Button>
        }
      >
        <fieldset className="flex min-w-0 flex-col gap-2" aria-labelledby="topics-label">
          {allTopics.map((id) => (
            <SelectableRow
              key={id}
              name="topics"
              value={id}
              type="checkbox"
              round
              compact
              checked={topics.includes(id)}
              onChange={toggleTopic}
            >
              <span className="type-body-strong min-w-0 flex-1 truncate">
                {id} {titleOf(id)}
              </span>
            </SelectableRow>
          ))}
        </fieldset>
        {tooFew && (
          <p data-too-few className="type-small text-status-attention-ink">
            Choose topics with at least {MIN_QUESTIONS} questions in total.
          </p>
        )}
      </Section>

      <Section id="deadline-label" label="DEADLINE">
        <fieldset
          role="radiogroup"
          aria-labelledby="deadline-label"
          className="grid min-w-0 grid-cols-2 gap-2"
        >
          {presets.map((option) => (
            <SelectableRow
              key={option.id}
              name="deadline"
              value={option.id}
              checked={preset === option.id}
              onChange={() => setPreset(option.id)}
            >
              {option.id === "date" && (
                <Calendar
                  size={18}
                  strokeWidth={2}
                  aria-hidden="true"
                  className="hidden shrink-0 min-[400px]:block"
                />
              )}
              <span className="type-small-strong min-w-0 flex-1 whitespace-nowrap">
                {option.label}
              </span>
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
      </Section>

      <Section id="attempts-label" label="ATTEMPTS">
        <SegmentedControl
          name="attempts"
          legend="Attempts allowed"
          hideLegend
          dense
          options={attemptOptions}
          value={toKey(attempts)}
          onChange={(key) => setAttempts(fromKey(key))}
        />
      </Section>

      <Section id="audience-label" label="AUDIENCE">
        <fieldset className="flex min-w-0 flex-col gap-2" aria-labelledby="audience-label">
          {groups.map((group, index) => (
            <SelectableRow
              key={group.id}
              name="audience"
              value={group.id}
              type="checkbox"
              round
              compact
              checked={audience.includes(group.id)}
              onChange={(id) =>
                setAudience((current) =>
                  groups
                    .map((entry) => entry.id)
                    .filter((entry) =>
                      entry === id ? !current.includes(id) : current.includes(entry),
                    ),
                )
              }
            >
              <LucideTile icon={index === 0 ? UsersRound : Shield} size="compact" />
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="type-body-strong truncate">{group.name}</span>
                <span className="type-small text-text-secondary">
                  {studentsCount(groupCounts[group.id] ?? 0)}
                </span>
              </span>
            </SelectableRow>
          ))}
        </fieldset>
      </Section>

      <ActionBar>
        <Button
          icon={FileCheck}
          disabled={problems.length > 0}
          onClick={() =>
            onAssign({
              title: shownTitle.trim(),
              topicIds: topics,
              deadline: deadline!,
              groupIds: audience,
              attemptsAllowed: attempts,
            })
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
