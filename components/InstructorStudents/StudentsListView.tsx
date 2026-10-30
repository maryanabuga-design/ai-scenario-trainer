"use client";

import { Funnel, SlidersHorizontal, UserPlus, UserRoundSearch } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { Button, ButtonLink } from "@/components/Button/Button";
import { FilterSheet } from "@/components/FilterSheet/FilterSheet";
import { GetStartedCard } from "@/components/InstructorOverview/OverviewBlocks";
import { StudentRow, StudentRowsCard } from "@/components/InstructorStudents/StudentRow";
import { SearchField } from "@/components/SearchField/SearchField";
import { SelectableRow } from "@/components/SelectableRow/SelectableRow";
import { DEMO_NOTE } from "@/lib/cohort";
import { getStarted } from "@/lib/get-started";
import { profileStatus, rowMuted, statusOptions } from "@/lib/students";
import type { FilterOrigin, StudentProfile, StudentsFilter } from "@/lib/students";

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
      className="flex h-14 w-14 items-center justify-center rounded-[16px] bg-neutral-tile-bg text-neutral-tile-ink"
    >
      <UserRoundSearch size={28} strokeWidth={1.75} />
    </span>
  );
}

/** The "no students found" picture (about 120px, decorative); the icon tile when it is missing. */
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
      width={120}
      height={120}
      className="h-[120px] w-[120px] object-contain"
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
      <h2 data-empty-title className="type-item-title mt-4">
        {title}
      </h2>
      <p data-empty-text className="type-body mt-1.5 text-text-secondary">
        {text}
      </p>
      {action && (
        <div data-empty-action className="mt-6 w-full">
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
        <ButtonLink href="/instructor/students/invite" icon={UserPlus}>
          Invite students
        </ButtonLink>
        <div data-search-group className="flex items-start gap-3">
          <div className="min-w-0 flex-1">
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
            className={`flex h-12 w-12 shrink-0 cursor-pointer items-center justify-center rounded-[14px] text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
              filter === "all" ? "bg-olive-tint" : "bg-filter-active"
            }`}
          >
            <SlidersHorizontal size={22} strokeWidth={2} aria-hidden="true" />
          </button>
        </div>
      </div>
      {filter !== "all" && (
        <div data-status-line className="-mt-2 flex min-h-11 items-center justify-between gap-3">
          <p className="type-small min-w-0 truncate text-text-secondary">
            Showing: {options.find((option) => option.value === filter)?.label}
          </p>
          <Button variant="tertiary" onClick={() => onFilter("all")}>
            Clear
          </Button>
        </div>
      )}
      <FilterSheet
        open={sheetOpen}
        title="Filter by status"
        onClose={() => setSheetOpen(false)}
        inline={statusOpen}
        returnFocus={filterButton}
        footer={
          <>
            {/* the changing count is announced */}
            <div aria-live="polite" aria-atomic="true">
              <Button onClick={apply}>
                Show {draftCount} {draftCount === 1 ? "student" : "students"}
              </Button>
            </div>
            <Button variant="secondary" onClick={() => setDraft("all")}>
              Reset
            </Button>
          </>
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
      )}
      <p data-demo-note className="type-small text-center text-text-secondary">
        {DEMO_NOTE}
      </p>
    </>
  );
}
