"use client";

import { Eye } from "lucide-react";
import { useState } from "react";
import { ActionBar } from "@/components/ActionBar/ActionBar";
import { Button } from "@/components/Button/Button";
import { DropdownMenu } from "@/components/DropdownMenu/DropdownMenu";
import { ConfirmDialog } from "@/components/ConfirmDialog/ConfirmDialog";
import {
  ChecklistCards,
  GuideSections,
  PartNote,
  QuizRows,
  ScenarioCards,
} from "@/components/PackageContent/PackageParts";
import { Notice } from "@/components/Notice/Notice";
import { FlashNotice } from "@/components/FlashNotice/FlashNotice";
import { PageHeaderBand } from "@/components/PageHeaderBand/PageHeaderBand";
import { SegmentedControl } from "@/components/SegmentedControl/SegmentedControl";
import { coverageLine, partsOf } from "@/lib/package-read";
import { flaggedItems, keySlug, partCounts, reviewLabel } from "@/lib/package-review";
import type { Issue, PathPart } from "@/lib/package-read";
import { editedText } from "@/lib/packages";
import type { DemoTopic } from "@/lib/packages";

export type PackageDialog = "publish" | "unpublish" | "delete" | null;

const tabs: { value: PathPart; label: string }[] = [
  { value: "guide", label: "Guide" },
  { value: "steps", label: "Steps" },
  { value: "scenario", label: "Scenario" },
  { value: "quiz", label: "Quiz" },
];

const EMPTY: Record<PathPart, string> = {
  guide: "This package has no guide.",
  steps: "This package has no steps.",
  scenario: "This package has no scenario.",
  quiz: "This package has no quiz questions.",
};

/** The issues that belong to a tab: its items and the notes about the whole part. */
export function issuesOfPart(issues: Issue[], part: PathPart): Issue[] {
  const name = part === "quiz" ? "questions" : part;
  return issues.filter((issue) => issue.part === name);
}

/**
 * The demo topic of the Instructor (DESIGN.md: Guided review of a content package): the band with the
 * title and the ⋯ menu, the meta line "Draft · Last edited today", ONE notice (the
 * items to review per part, or "All items checked"), the coverage, the four-option selector, the tab
 * with compact item cards (one pill and a pencil each), and the pinned area. A draft with flagged
 * items has the Primary "Review N items" and the Secondary "Preview as student"; when nothing is
 * flagged, the Primary "Publish" and the same Secondary. A Published topic has Secondary Unpublish and
 * Secondary Preview as student.
 */
export function PackageTopicView({
  topic,
  tab,
  issues,
  now,
  dialog,
  onTab,
  onAsk,
  onConfirm,
  onCancelDialog,
  onReview,
  onPreview,
  onEditDetails,
  onReplace,
  dialogInline = false,
  menuOpen = false,
}: {
  topic: DemoTopic;
  tab: PathPart;
  issues: Issue[];
  now: number;
  dialog: PackageDialog;
  onTab: (tab: PathPart) => void;
  onAsk: (dialog: Exclude<PackageDialog, null>) => void;
  onConfirm: () => void;
  onCancelDialog: () => void;
  /** "Review N items": opens the first flagged item. */
  onReview: () => void;
  /** Opens Preview as student. */
  onPreview: () => void;
  /** Menu: "Edit title and summary". */
  onEditDetails: () => void;
  /** Menu: "Replace document...". */
  onReplace: () => void;
  dialogInline?: boolean;
  /** For the review page: the "⋯" menu drawn open. */
  menuOpen?: boolean;
}) {
  const [closed, setClosed] = useState(false);
  const present = partsOf(topic);
  const flagged = flaggedItems(issues);
  const own = issuesOfPart(issues, tab);
  const base = `/instructor/content/package/${topic.id}`;
  const guideHref = (section: string) => `${base}?tab=guide#section-${section}`;
  const published = topic.status === "published";
  // a published topic is read-only: no pencils, no Edit buttons, no editing rows
  const editHref = published ? undefined : (key: string) => `${base}/edit/${keySlug(key)}`;
  const replaceHref = `/instructor/content/import?replace=${topic.id}`;
  const coverage = coverageLine(topic);
  const toReview = flagged.length > 0;
  // notes about a whole part (no item of their own) show once at the top of their tab
  const partNotes = own.filter((issue) => issue.key.endsWith(":all"));
  return (
    <div className="flex flex-col gap-4 pb-4">
      <PageHeaderBand
        title={topic.title}
        subtitle={topic.summary || undefined}
        back={{ label: "Back to Content", href: "/instructor/content" }}
        action={
          <DropdownMenu
            label="More actions"
            initiallyOpen={menuOpen}
            items={[
              { id: "details", label: "Edit title and summary", onSelect: onEditDetails },
              { id: "replace", label: "Replace document…", onSelect: onReplace },
              {
                id: "delete",
                label: "Delete topic",
                destructive: true,
                onSelect: () => onAsk("delete"),
              },
            ]}
          />
        }
      />
      <FlashNotice />
      <div className="flex flex-col gap-1">
        <p data-package-status className="type-small flex flex-wrap items-center gap-x-2">
          <span
            data-status-pill={topic.status}
            className={`type-caption rounded-full px-2.5 py-0.5 ${
              published
                ? "bg-status-success-bg text-status-success-ink"
                : "bg-secondary-sand text-text-secondary"
            }`}
          >
            {published ? "Published" : "Draft"}
          </span>{" "}
          <span className="text-text-secondary">
            · Last edited {editedText(topic.editedAt, now)}
          </span>
        </p>
        {coverage && (
          <p data-coverage className="type-small text-text-secondary">
            {coverage}
          </p>
        )}
      </div>

      {toReview ? (
        <Notice
          variant="to-fix"
          id="package-status"
          title={`${flagged.length} ${flagged.length === 1 ? "item" : "items"} to review`}
        >
          {partCounts(flagged)}
        </Notice>
      ) : (
        !closed && (
          <Notice
            variant="success"
            id="package-status"
            title="All items checked"
            onClose={() => setClosed(true)}
          >
            Preview as student, then publish.
          </Notice>
        )
      )}

      <SegmentedControl
        name="package-tab"
        legend="Part"
        hideLegend
        dense
        options={tabs.map((entry) => {
          const count = flagged.filter((item) => item.tab === entry.value).length;
          return {
            ...entry,
            disabled: !present.includes(entry.value),
            ariaLabel: count > 0 ? `${entry.label}, ${count} to review` : undefined,
          };
        })}
        value={tab}
        onChange={onTab}
      />

      {!present.includes(tab) ? (
        <div
          data-empty-part
          className="rounded-card border border-selectable-stroke bg-card p-[var(--gutter,1rem)] text-center text-text-secondary"
        >
          {EMPTY[tab]}
        </div>
      ) : (
        <>
          {partNotes.length > 0 && <PartNote issues={partNotes} replaceHref={replaceHref} />}
          {tab === "guide" && (
            <GuideSections data={topic} issues={issues} showUse editHref={editHref} />
          )}
          {tab === "steps" && <ChecklistCards data={topic} issues={issues} editHref={editHref} />}
          {tab === "scenario" && (
            <ScenarioCards data={topic} issues={issues} guideHref={guideHref} editHref={editHref} />
          )}
          {tab === "quiz" && <QuizRows data={topic} issues={issues} editHref={editHref} />}
          {own
            .filter((issue) => issue.kind === "note")
            .map((issue) => (
              <p key={issue.id} data-info-note className="type-small text-text-secondary">
                {issue.reason}
              </p>
            ))}
        </>
      )}

      {published && (
        <p data-published-note className="type-small text-center text-text-secondary">
          Visible to students in Materials, in the section From your instructor.
        </p>
      )}
      <p data-demo-note className="type-small text-center text-text-secondary">
        Imported demo content stays in this browser (prototype).
      </p>

      <ActionBar>
        {published ? (
          <>
            <Button icon={Eye} onClick={onPreview}>
              Preview as student
            </Button>
            <Button variant="secondary" onClick={() => onAsk("unpublish")}>
              Unpublish
            </Button>
          </>
        ) : (
          <>
            {toReview ? (
              <Button onClick={onReview}>{reviewLabel(flagged.length)}</Button>
            ) : (
              <Button onClick={() => onAsk("publish")}>Publish</Button>
            )}
            <Button variant="secondary" icon={Eye} onClick={onPreview}>
              Preview as student
            </Button>
          </>
        )}
      </ActionBar>

      {(dialog === "publish" || !dialogInline) && (
        <ConfirmDialog
          open={dialog === "publish"}
          inline={dialogInline}
          title="Publish this demo topic?"
          description="Students will see it in Materials under From your instructor. It does not count towards exams or readiness."
          confirmLabel="Publish"
          cancelLabel="Keep editing"
          onConfirm={onConfirm}
          onCancel={onCancelDialog}
        />
      )}
      {(dialog === "unpublish" || !dialogInline) && (
        <ConfirmDialog
          open={dialog === "unpublish"}
          inline={dialogInline}
          title="Unpublish this demo topic?"
          description="Students will no longer see it. It becomes a draft."
          confirmLabel="Unpublish"
          cancelLabel="Keep published"
          onConfirm={onConfirm}
          onCancel={onCancelDialog}
        />
      )}
      {(dialog === "delete" || !dialogInline) && (
        <ConfirmDialog
          open={dialog === "delete"}
          inline={dialogInline}
          title="Delete this topic?"
          description="This cannot be undone."
          confirmLabel="Delete topic"
          cancelLabel="Keep it"
          onConfirm={onConfirm}
          onCancel={onCancelDialog}
        />
      )}
    </div>
  );
}
