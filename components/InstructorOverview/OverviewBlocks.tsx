"use client";

import {
  ArrowDown,
  ArrowRight,
  ArrowUp,
  Award,
  Check,
  ChevronDown,
  CirclePlus,
  ClipboardCheck,
  ClipboardList,
  Clock,
  FileText,
  FileUp,
  Lock,
  Shield,
  UserRoundPlus,
  UserRoundX,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { ButtonLink } from "@/components/Button/Button";
import { Chevron } from "@/components/Chevron/Chevron";
import { Chip } from "@/components/Chip/Chip";
import { IconTile } from "@/components/IconTile/IconTile";
import { ExamCard } from "@/components/InstructorExams/ExamCard";
import { LucideTile } from "@/components/TopicTile/TopicTile";
import { ALL_CAUGHT_UP } from "@/lib/actions";
import type { Action, ActionKind } from "@/lib/actions";
import { GET_STARTED } from "@/lib/get-started";
import type { StartStep } from "@/lib/get-started";
import { scopeName } from "@/lib/groups";
import type { Scope } from "@/lib/groups";
import { deltaLine, deltaTone, studentsCount } from "@/lib/overview";
import type { TopicStanding } from "@/lib/overview";
import type { ExamRow, GroupRow } from "@/lib/overview-model";
import { groupLine } from "@/lib/students";

export const NO_ACTIVE_EXAM = "No active exam";

/** The white card of the Overview blocks (the framed blocks of the approved reference). */
const card =
  "overflow-hidden rounded-card border border-selectable-stroke bg-card shadow-(--card-shadow)";
const divided = "divide-y divide-soft-divider";

/** The uppercase label of a block, with an optional muted note at the right ("1 Active"). */
export function BlockLabel({
  id,
  children,
  note,
}: {
  id: string;
  children: string;
  note?: string;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <h2 id={id} className="type-label text-text-secondary">
        {children}
      </h2>
      {note && (
        <span data-block-note className="type-small text-text-secondary">
          {note}
        </span>
      )}
    </div>
  );
}

/**
 * The group switcher (DESIGN.md: Instructor, Overview rebuilt): a rounded pill 40px high inside a
 * 44px tap target, a small olive dot, the group name and a chevron down. It opens the picker.
 */
export function GroupPill({ scope, from = "overview" }: { scope: Scope; from?: string }) {
  return (
    <Link
      href={`/instructor/groups?from=${from}`}
      data-group-pill
      aria-label={`Group: ${scopeName(scope)}. Change group`}
      className="flex min-h-11 w-fit max-w-full items-center has-focus-visible:outline-2"
    >
      <span className="type-small-strong flex h-10 min-w-0 items-center gap-2 rounded-full bg-secondary-sand px-4 text-text">
        <span aria-hidden="true" className="h-2 w-2 shrink-0 rounded-full bg-primary" />
        <span className="truncate">{scopeName(scope)}</span>
        <ChevronDown size={16} strokeWidth={2} aria-hidden="true" className="shrink-0" />
      </span>
    </Link>
  );
}

/** The ring graphic of the readiness card: an arc of the same number on a light track, a shield in the middle. Decorative. */
export function ReadinessRing({ percent }: { percent: number }) {
  const size = 56;
  const stroke = 5;
  const radius = size / 2 - stroke / 2 - 1;
  const length = 2 * Math.PI * radius;
  return (
    <div
      aria-hidden="true"
      data-ring
      className="relative shrink-0"
      style={{ width: size, height: size }}
    >
      <svg viewBox={`0 0 ${size} ${size}`} className="h-full w-full -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          className="stroke-secondary-sand-pressed"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${(percent / 100) * length} ${length}`}
          className="stroke-primary"
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-primary">
        <Shield size={20} strokeWidth={2} />
      </span>
    </div>
  );
}

const deltaLook = {
  success: "bg-status-success-bg text-status-success-ink",
  attention: "bg-status-attention-bg text-status-attention-ink",
  neutral: "bg-secondary-sand text-text-secondary",
} as const;

/** The soft pill with the weekly change: "+4 points this week" (arrow up), "No change this week", "-3 points this week" (arrow down, amber, never red). */
export function DeltaPill({ delta }: { delta: number }) {
  const tone = deltaTone(delta);
  return (
    <span
      data-delta
      data-delta-tone={tone}
      className={`type-caption inline-flex w-fit items-center gap-1 rounded-full px-2.5 py-1 whitespace-nowrap ${deltaLook[tone]}`}
    >
      {delta > 0 && <ArrowUp size={14} strokeWidth={2.25} aria-hidden="true" />}
      {delta < 0 && <ArrowDown size={14} strokeWidth={2.25} aria-hidden="true" />}
      {deltaLine(delta)}
    </span>
  );
}

/**
 * GROUP READINESS (one group; the ONE percentage of the screen): the label, the large figure with
 * the delta pill, the ring at the right and a sand strip with the group line that opens Students.
 */
export function ReadinessCard({
  scope,
  readiness,
  delta,
  students,
  notStarted,
}: {
  scope: Scope;
  readiness: number;
  delta: number | null;
  students: number;
  notStarted: number;
}) {
  return (
    <section
      aria-labelledby="group-readiness"
      data-group-readiness
      className={`${card} flex flex-col`}
    >
      <div className="flex items-center justify-between gap-3 px-[var(--gutter,1rem)] pt-[var(--gutter,1rem)] pb-3">
        <div className="flex min-w-0 flex-col gap-1">
          <h2 id="group-readiness" className="type-label text-text-secondary">
            GROUP READINESS
          </h2>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <p data-readiness-figure className="type-display tabular-nums">
              {readiness}%
            </p>
            {delta !== null && <DeltaPill delta={delta} />}
          </div>
        </div>
        <ReadinessRing percent={readiness} />
      </div>
      <Link
        href="/instructor/students?from=overview"
        data-readiness-strip
        className="type-small flex min-h-11 items-center justify-between gap-3 bg-secondary-sand px-[var(--gutter,1rem)] py-2 text-text-secondary has-focus-visible:outline-2"
      >
        <span data-group-line className="min-w-0 truncate">
          {groupLine(scopeName(scope), students, notStarted)}
        </span>
        <ArrowRight size={18} strokeWidth={2} aria-hidden="true" className="shrink-0 text-text" />
      </Link>
    </section>
  );
}

/** GROUPS (All groups): one card with a row per group, "14 students · 5 need attention"; tapping selects the group. No average. */
export function GroupsCard({
  rows,
  onSelect,
}: {
  rows: GroupRow[];
  onSelect: (id: string) => void;
}) {
  return (
    <section aria-labelledby="groups-title" data-groups-card className="flex flex-col gap-3">
      <BlockLabel id="groups-title">GROUPS</BlockLabel>
      <ul className={`${card} ${divided}`}>
        {rows.map(({ group, students, needs }) => (
          <li key={group.id}>
            <Link
              href="/instructor/students?from=overview"
              data-group-row={group.id}
              onClick={() => onSelect(group.id)}
              className="flex h-[72px] items-center gap-3 px-[var(--gutter,1rem)] has-focus-visible:outline-2"
            >
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="type-body-strong truncate">{group.name}</span>
                <span className="type-small truncate text-text-secondary">
                  {studentsCount(students)} · {needs} {needs === 1 ? "needs" : "need"} attention
                </span>
              </span>
              <Chevron />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

const actionIcons: Record<ActionKind, LucideIcon> = {
  "exam-not-started": Clock,
  "needs-attention": UserRoundX,
  "draft-set": FileText,
  "no-exam": ClipboardList,
};

/** NEEDS YOUR ACTION: the label and ONE card with up to three rows (the neutral tile, a bold one-line title, a muted reason, a chevron). */
export function ActionsCard({
  actions,
  onSelect,
}: {
  actions: Action[];
  onSelect: (id: string) => void;
}) {
  return (
    <section aria-labelledby="actions-title" className="flex flex-col gap-3">
      <BlockLabel id="actions-title">NEEDS YOUR ACTION</BlockLabel>
      {actions.length === 0 ? (
        <div
          data-all-caught-up
          className={`${card} flex h-[72px] items-center gap-3 px-[var(--gutter,1rem)]`}
        >
          <IconTile tone="success" className="h-11 w-11 rounded-[12px]">
            <Award size={22} strokeWidth={2} />
          </IconTile>
          <p className="type-body-strong">{ALL_CAUGHT_UP}</p>
        </div>
      ) : (
        <ul className={`${card} ${divided}`}>
          {actions.map((action) => (
            <li key={`${action.kind}-${action.scopeTo ?? ""}`}>
              <Link
                href={action.href}
                data-action={action.kind}
                onClick={() => action.scopeTo && onSelect(action.scopeTo)}
                className="flex h-[72px] items-center gap-3 px-[var(--gutter,1rem)] has-focus-visible:outline-2"
              >
                <LucideTile icon={actionIcons[action.kind]} size="tile" />
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="type-body-strong truncate">{action.title}</span>
                  <span className="type-small truncate text-text-secondary">{action.reason}</span>
                </span>
                <Chevron />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/**
 * EXAMS: the label with "1 Active", then ONE card: the exam rows and a full-width Secondary
 * "Assign exam" with a plus-in-circle icon; without an active exam "No active exam" and the Primary
 * button. More active exams than rows: the underlined link "All exams (n)".
 */
export function ExamsCard({ rows, activeCount }: { rows: ExamRow[]; activeCount: number }) {
  return (
    <section aria-labelledby="exams-title" className="flex flex-col gap-3">
      <BlockLabel id="exams-title" note={`${activeCount} Active`}>
        EXAMS
      </BlockLabel>
      <div data-exams-card className={`${card} flex flex-col gap-3 pb-[var(--gutter,1rem)]`}>
        {rows.length > 0 ? (
          <>
            <ul className={divided}>
              {rows.map(({ exam, counts, tag }) => (
                <li key={exam.id}>
                  <ExamCard
                    bare
                    exam={exam}
                    passed={counts.certified}
                    total={counts.total}
                    notStarted={counts.notStarted}
                    from="overview"
                    tag={tag ?? undefined}
                  />
                </li>
              ))}
            </ul>
            <div className="px-[var(--gutter,1rem)]">
              <ButtonLink
                href="/instructor/exams/new?from=overview"
                variant="secondary"
                icon={CirclePlus}
              >
                Assign exam
              </ButtonLink>
            </div>
          </>
        ) : (
          <div
            data-no-exam
            className="flex flex-col gap-4 px-[var(--gutter,1rem)] pt-[var(--gutter,1rem)]"
          >
            <p className="type-body-strong">{NO_ACTIVE_EXAM}</p>
            <ButtonLink href="/instructor/exams/new?from=overview" icon={CirclePlus}>
              Assign exam
            </ButtonLink>
          </div>
        )}
      </div>
      {activeCount > rows.length && (
        <div className="-ml-3 self-start">
          <ButtonLink href="/instructor/exams" variant="tertiary">
            {`All exams (${activeCount})`}
          </ButtonLink>
        </div>
      )}
    </section>
  );
}

/** WEAKEST TOPIC: the S badge and topic name, the muted count, a Secondary "Assign exam on this topic" and the centred link "All topics". */
export function WeakestCard({
  weakest,
  title,
  href,
}: {
  weakest: TopicStanding;
  title: string;
  href: string;
}) {
  return (
    <section aria-labelledby="weakest-title" className="flex flex-col gap-3">
      <BlockLabel id="weakest-title">WEAKEST TOPIC</BlockLabel>
      <div
        data-weakest-topic={weakest.sectionId}
        className={`${card} flex flex-col gap-3 p-[var(--gutter,1rem)]`}
      >
        <div className="flex items-center gap-3">
          <Chip tone="sand" size="caption">
            {weakest.sectionId}
          </Chip>
          <p className="type-body-strong min-w-0 flex-1 truncate">{title}</p>
        </div>
        <p className="type-small text-text-secondary tabular-nums">
          {weakest.passing} of {weakest.total} students at or above the pass mark
        </p>
        <ButtonLink href={href} variant="secondary" icon={ClipboardCheck}>
          Assign exam on this topic
        </ButtonLink>
        <div className="flex justify-center">
          <ButtonLink href="/instructor/topics" variant="tertiary">
            All topics
          </ButtonLink>
        </div>
      </div>
    </section>
  );
}

/** Get started (a group with no students and no exams): three rows, each done, next or locked, each opening its screen. */
export function GetStartedCard({ steps }: { steps: StartStep[] }) {
  return (
    <section aria-labelledby="start-title" data-get-started className="flex flex-col gap-3">
      <BlockLabel id="start-title">{GET_STARTED.toUpperCase()}</BlockLabel>
      <ul className={`${card} ${divided}`}>
        {steps.map((step) => (
          <li key={step.id}>
            <Link
              href={step.href}
              data-start-step={step.id}
              data-state={step.state}
              className="flex h-[72px] items-center gap-3 px-[var(--gutter,1rem)] has-focus-visible:outline-2"
            >
              {step.state === "done" ? (
                <IconTile tone="success" className="h-11 w-11 rounded-[12px]">
                  <Check size={22} strokeWidth={2} />
                </IconTile>
              ) : (
                <LucideTile
                  icon={
                    step.state === "locked"
                      ? Lock
                      : step.id === "invite"
                        ? UserRoundPlus
                        : step.id === "import"
                          ? FileUp
                          : ClipboardList
                  }
                  size="tile"
                />
              )}
              <span className="flex min-w-0 flex-1 flex-col">
                <span
                  className={`type-body-strong truncate ${step.state === "locked" ? "text-text-secondary" : ""}`}
                >
                  {step.title}
                </span>
                <span className="type-small truncate text-text-secondary">
                  {step.state === "done"
                    ? "Done"
                    : step.state === "locked"
                      ? "After the step above"
                      : step.reason}
                </span>
              </span>
              <Chevron />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
