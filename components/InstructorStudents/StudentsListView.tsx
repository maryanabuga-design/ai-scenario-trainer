"use client";

import { Funnel, SlidersHorizontal, UserPlus, UserRoundSearch, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { PageAction } from "@/components/ActionBar/ActionBar";
import { Button, ButtonLink } from "@/components/Button/Button";
import { DataTable } from "@/components/DataTable/DataTable";
import type { Column } from "@/components/DataTable/DataTable";
import { FilterSheet } from "@/components/FilterSheet/FilterSheet";
import { GetStartedCard } from "@/components/InstructorOverview/OverviewBlocks";
import { StatusMenu } from "@/components/InstructorStudents/StatusMenu";
import { StudentRow, StudentRowsCard } from "@/components/InstructorStudents/StudentRow";
import { StatusChip, studentTone } from "@/components/StatusChip/StatusChip";
import { TopicCodeBadge } from "@/components/TopicCodeBadge/TopicCodeBadge";
import { SearchField } from "@/components/SearchField/SearchField";
import { SelectableRow } from "@/components/SelectableRow/SelectableRow";
import { getStarted } from "@/lib/get-started";
import { studentsCount } from "@/lib/overview";
import {
  isNotStarted,
  lastActiveShort,
  profileStatus,
  readinessOf,
  rowMuted,
  statusLabels,
  statusOptions,
  statusRank,
  topicsToReview,
  weakTopicOf,
} from "@/lib/students";
import type { FilterOrigin, StudentProfile, StudentsFilter } from "@/lib/students";

type StudentTableRow = {
  id: string;
  name: string;
  initials: string;
  href: string;
  profile: StudentProfile;
};

const dash = <span className="text-text-secondary">—</span>;

/** The columns of the desktop table; only what the data has (DESIGN.md: Responsive instructor, step 3). */
const studentColumns: Column<StudentTableRow>[] = [
  {
    id: "status",
    header: "Status",
    width: "180px",
    sortValue: ({ profile }) => statusRank[profileStatus(profile)],
    cell: ({ profile }) => {
      const status = profileStatus(profile);
      return (
        <StatusChip tone={studentTone[status]} value={status}>
          {statusLabels[status]}
        </StatusChip>
      );
    },
  },
  {
    id: "readiness",
    header: "Readiness",
    width: "120px",
    align: "right",
    sortValue: ({ profile }) => (isNotStarted(profile) ? -1 : readinessOf(profile)),
    cell: ({ profile }) => (isNotStarted(profile) ? dash : `${readinessOf(profile)}%`),
  },
  {
    id: "to-review",
    header: "To review",
    width: "110px",
    align: "right",
    cell: ({ profile }) => (isNotStarted(profile) ? dash : topicsToReview(profile)),
  },
  {
    id: "weak-topic",
    header: "Weak topic",
    width: "130px",
    hideBelow: 800,
    cell: ({ profile }) => {
      const topic = weakTopicOf(profile);
      return topic ? <TopicCodeBadge id={topic} compact /> : dash;
    },
  },
  {
    id: "last-active",
    header: "Last active",
    width: "130px",
    hideBelow: 960,
    cell: ({ profile }) =>
      profile.lastActiveDaysAgo === null ? dash : lastActiveShort(profile.lastActiveDaysAgo),
  },
];

export const NO_SEARCH_MATCH = "No students match this search.";

/** The address of a student detail opened from the list, so Back returns to the same filter (topic, origin). */
export const studentHref = (
  id: string,
  filter: StudentsFilter,
  topic: string | null = null,
  origin: FilterOrigin | null = null,
) =>
  `/instructor/students/${encodeURIComponent(id)}?from=students&filter=${filter}${topic ? `&topic=${topic}` : ""}${origin ? `&origin=${origin}` : ""}`;

/** The muted 44px filter line: a funnel, the words and an underlined "Clear filter". */
export function FilterLine({ text, onClear }: { text: string; onClear: () => void }) {
  return (
    <div
      data-filter-line
      className="flex min-h-11 items-center gap-2 rounded-[14px] bg-secondary-sand pr-1 pl-3"
    >
      <Funnel
        size={16}
        strokeWidth={2}
        aria-hidden="true"
        className="shrink-0 text-text-secondary"
      />
      <p data-showing className="type-small min-w-0 flex-1 truncate">
        {text}
      </p>
      <Button variant="tertiary" onClick={onClear}>
        Clear filter
      </Button>
    </div>
  );
}

export const NO_RESULTS_IMAGE = "/images/instructor/students-no-results.webp";

/** The icon tile of an empty state (also the stand-in when the picture is missing). */
function EmptyTile() {
  return (
    <span
      aria-hidden="true"
      data-empty-tile
      className="flex h-14 w-14 items-center justify-center rounded-[16px] bg-chip-neutral-bg text-text"
    >
      <UserRoundSearch size={28} strokeWidth={1.75} />
    </span>
  );
}

/** The "no students found" picture (140px, decorative); the icon tile when it is missing. */
function NoResultsArt() {
  const [failed, setFailed] = useState(false);
  const image = useRef<HTMLImageElement>(null);
  // an error that happened before hydration is not reported by onError
  useEffect(() => {
    const el = image.current;
    if (el && el.complete && el.naturalWidth === 0) setFailed(true);
  }, []);
  if (failed) return <EmptyTile />;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      ref={image}
      data-no-results-art
      src={NO_RESULTS_IMAGE}
      alt=""
      width={140}
      height={140}
      className="h-[140px] w-[140px] object-contain"
      onError={() => setFailed(true)}
    />
  );
}

/**
 * A white card with a picture or an icon, a title, a muted line and a Secondary action (the empty
 * states). `art` shows the "no students found" picture (DESIGN.md: Students polish) instead of the tile.
 */
export function EmptyCard({
  title,
  text,
  action,
  dataEmpty,
  art = false,
}: {
  title: string;
  text: string;
  action: ReactNode;
  dataEmpty: string;
  art?: boolean;
}) {
  return (
    <div
      data-empty={dataEmpty}
      className="flex flex-col items-center rounded-card border border-selectable-stroke bg-card p-[var(--gutter,1rem)] text-center shadow-(--card-shadow)"
    >
      {art ? <NoResultsArt /> : <EmptyTile />}
      <h2 data-empty-title className="type-item-title lh-title mt-3 max-w-[280px]">
        {title}
      </h2>
      <p data-empty-text className="type-body lh-text mt-1.5 max-w-[280px] text-text-secondary">
        {text}
      </p>
      {action && (
        <div
          data-empty-action
          className="mt-6 w-full idesk:flex idesk:justify-center idesk:[&>*]:w-auto!"
        >
          {action}
        </div>
      )}
    </div>
  );
}

/**
 * The Students view of the tab (DESIGN.md: Instructor, Students rebuilt): the Primary "Invite
 * students" (24px under the switch), the search field with the filter icon button beside it as ONE row (24px under the button, 12px between them), the filter line when the list comes filtered from
 * elsewhere, then ONE card of rows (or an empty state) and the demo note.
 */
export function StudentsListView({
  shown,
  total,
  filter,
  query,
  showing = null,
  origin = null,
  topic = null,
  onFilter,
  onQuery,
  onClearFilter,
  counted = shown,
  statusOpen = false,
  initialDraft,
}: {
  /** The rows to show: already searched, filtered and sorted. */
  shown: StudentProfile[];
  /** How many students the group has (0: an empty group). */
  total: number;
  filter: StudentsFilter;
  query: string;
  /** The text of the filter line, or null while none is shown. */
  showing?: string | null;
  origin?: FilterOrigin | null;
  topic?: string | null;
  onFilter: (filter: StudentsFilter) => void;
  onQuery: (query: string) => void;
  onClearFilter: () => void;
  /** The students the status counts are for (the group, or the topic's list): not narrowed by the search or the status. */
  counted?: StudentProfile[];
  /** For the review page: draw the filter sheet open. */
  statusOpen?: boolean;
  /** For the review page: the option marked in the open sheet (default: the applied status). */
  initialDraft?: StudentsFilter;
}) {
  const [sheetOpen, setSheetOpen] = useState(statusOpen);
  const filterButton = useRef<HTMLButtonElement>(null);
  // the window grows into the desktop layout while the phone sheet is open: the sheet closes and
  // applies nothing, so it and the desktop menu are never both there (nothing reopens on the way back)
  useEffect(() => {
    if (!sheetOpen) return;
    const wide = window.matchMedia("(min-width: 1024px)");
    const close = () => {
      if (wide.matches && document.querySelector('[data-shell="instructor"]')) setSheetOpen(false);
    };
    wide.addEventListener("change", close);
    return () => wide.removeEventListener("change", close);
  }, [sheetOpen]);
  // choosing in the sheet only marks a draft; the Primary button applies it
  const [draft, setDraft] = useState<StudentsFilter>(initialDraft ?? filter);
  const options = statusOptions(counted);
  const draftCount = options.find((option) => option.value === draft)?.count ?? 0;
  const openSheet = () => {
    setDraft(filter);
    setSheetOpen(true);
  };
  const apply = () => {
    onFilter(draft);
    setSheetOpen(false);
  };
  return (
    <>
      {/* 24px under the switch (16px gap + 8px), then 24px under the button, grouping by spacing */}
      <div className="mt-2 flex flex-col gap-6">
        <PageAction>
          <ButtonLink href="/instructor/students/invite" icon={UserPlus}>
            Invite students
          </ButtonLink>
        </PageAction>
        <div data-search-group className="flex items-start gap-3 idesk:items-center">
          <div className="min-w-0 flex-1 idesk:max-w-[420px]">
            <SearchField
              label="Search students"
              placeholder="Search students"
              value={query}
              onChange={onQuery}
              compact
            />
          </div>
          <button
            ref={filterButton}
            type="button"
            data-filter-button
            aria-label="Filter by status"
            aria-haspopup="dialog"
            aria-expanded={sheetOpen}
            onClick={openSheet}
            className={`flex h-12 w-12 shrink-0 cursor-pointer items-center justify-center rounded-[14px] text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary idesk:hidden ${
              filter === "all" ? "bg-olive-tint" : "bg-filter-active"
            }`}
          >
            <SlidersHorizontal size={22} strokeWidth={2} aria-hidden="true" />
          </button>
          <StatusMenu options={options} value={filter} onChange={onFilter} />
          <p
            data-student-count
            className="type-small ml-auto hidden text-text-secondary tabular-nums idesk:block"
          >
            {studentsCount(shown.length)}
          </p>
        </div>
      </div>
      {filter !== "all" && (
        <div
          data-status-line
          className="-mt-2 flex min-h-11 items-center justify-between gap-3 idesk:hidden"
        >
          <p className="type-small min-w-0 truncate text-text-secondary">
            Showing: {options.find((option) => option.value === filter)?.label}
          </p>
          <Button variant="tertiary" onClick={() => onFilter("all")}>
            Clear
          </Button>
        </div>
      )}
      {filter !== "all" && (
        <div
          data-status-filter-chip
          className="-mt-2 hidden flex-wrap items-center gap-2 idesk:flex"
        >
          <span className="type-small-strong inline-flex min-h-9 items-center gap-1 rounded-full border border-hover-stroke bg-olive-tint pr-1 pl-3 text-primary">
            Status: {options.find((option) => option.value === filter)?.label}
            <button
              type="button"
              aria-label={`Remove the status filter: ${options.find((option) => option.value === filter)?.label}`}
              onClick={() => onFilter("all")}
              className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full hover:bg-olive-tint-pressed focus-visible:outline-2 focus-visible:outline-primary"
            >
              <X size={16} strokeWidth={2.25} aria-hidden="true" />
            </button>
          </span>
        </div>
      )}
      <FilterSheet
        open={sheetOpen}
        title="Filter by status"
        onClose={() => setSheetOpen(false)}
        inline={statusOpen}
        returnFocus={filterButton}
        footer={
          // the changing count is announced
          <div aria-live="polite" aria-atomic="true">
            <Button onClick={apply}>
              Show {draftCount} {draftCount === 1 ? "student" : "students"}
            </Button>
          </div>
        }
      >
        {options.map((option) => (
          // a tap on the chosen card does not change the radio, so the card itself marks the draft
          <div key={option.value} onClick={() => setDraft(option.value)}>
            <SelectableRow
              emphasis
              short
              name="students-status"
              value={option.value}
              checked={option.value === draft}
              onChange={() => undefined}
            >
              <span className="type-body min-w-0">
                {option.label}
                <span data-option-count className="text-text-secondary">
                  {" · "}
                  {option.count}
                </span>
              </span>
            </SelectableRow>
          </div>
        ))}
      </FilterSheet>
      {showing && <FilterLine text={showing} onClear={onClearFilter} />}
      {total === 0 ? (
        <GetStartedCard
          steps={getStarted({ students: 0, exams: 0, publishedSets: 0 })!.slice(0, 1)}
        />
      ) : shown.length === 0 ? (
        <EmptyCard
          dataEmpty="search"
          art
          title={NO_SEARCH_MATCH}
          text="Try another name or clear the filters."
          action={
            <Button
              variant="secondary"
              onClick={() => {
                onQuery("");
                onFilter("all");
              }}
            >
              Clear search
            </Button>
          }
        />
      ) : (
        <>
          <div className="contents idesk:hidden">
            <StudentRowsCard>
              {shown.map((profile) => (
                <StudentRow
                  key={profile.participant.id}
                  id={profile.participant.id}
                  href={studentHref(profile.participant.id, filter, topic, origin)}
                  name={profile.participant.name}
                  initials={profile.participant.initials}
                  status={profileStatus(profile)}
                  muted={rowMuted(profile)}
                  demo={profile.participant.local}
                />
              ))}
            </StudentRowsCard>
          </div>
          <DataTable
            label="Students"
            dataAttribute="data-students-table"
            columns={studentColumns}
            rows={shown.map((profile) => ({
              id: profile.participant.id,
              name: profile.participant.name,
              initials: profile.participant.initials,
              href: studentHref(profile.participant.id, filter, topic, origin),
              profile,
            }))}
          />
        </>
      )}
    </>
  );
}
