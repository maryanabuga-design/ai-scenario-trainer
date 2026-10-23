"use client";

import { Eye, FolderSync } from "lucide-react";
import { useState } from "react";
import { ActionBar } from "@/components/ActionBar/ActionBar";
import { Button, ButtonLink } from "@/components/Button/Button";
import { ConfirmDialog } from "@/components/ConfirmDialog/ConfirmDialog";
import {
  ChecklistCards,
  GuideSections,
  QuizRows,
  ScenarioCards,
} from "@/components/PackageContent/PackageParts";
import { Notice } from "@/components/Notice/Notice";
import { PageHeaderBand } from "@/components/PageHeaderBand/PageHeaderBand";
import { SegmentedControl } from "@/components/SegmentedControl/SegmentedControl";
import { blockingIssues, coverageLine, partsOf } from "@/lib/package-read";
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
 * The demo topic of the Instructor (DESIGN.md: Content package review): the band with the title, the
 * meta line "Draft · Last edited today", ONE notice (to fix, with "Show next issue", or "Nothing to
 * fix"), the coverage, the four-option selector (an amber dot on a tab with issues, a missing part
 * disabled), the tab with its own notice and the flagged items, and the pinned area: Primary Publish,
 * Secondary Preview as student (both off while anything is to fix) and the destructive text link
 * Delete demo topic; a Published topic has Secondary Unpublish and Secondary Preview as student.
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
  onNextIssue,
  onPreview,
  dialogInline = false,
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
  /** "Show next issue". */
  onNextIssue: () => void;
  /** Opens Preview as student. */
  onPreview: () => void;
  dialogInline?: boolean;
}) {
  const [closed, setClosed] = useState(false);
  const present = partsOf(topic);
  const blocking = blockingIssues(issues);
  const own = issuesOfPart(issues, tab);
  const ownBlocking = own.filter((issue) => issue.blocking);
  const base = `/instructor/content/package/${topic.id}`;
  const guideHref = (section: string) => `${base}?tab=guide#section-${section}`;
  const coverage = coverageLine(topic);
  const published = topic.status === "published";
  const toFix = blocking.length > 0;
  const inFiles = ownBlocking.some((issue) => issue.fix === "files");
  const replaceHref = `/instructor/content/import?replace=${topic.id}&fix=${tab}`;
  return (
    <div className="flex flex-col gap-4 pb-4">
      <PageHeaderBand
        title={topic.title}
        subtitle={topic.summary || undefined}
        back={{ label: "Back to Content", href: "/instructor/content" }}
      />
      <div className="flex flex-col gap-1">
        <p data-package-status className="type-small flex flex-wrap items-center gap-2">
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

      {toFix ? (
        <Notice
          variant="to-fix"
          id="package-status"
          title={`${blocking.length} to fix before you can publish`}
          action={
            <div className="-ml-3">
              <Button variant="tertiary" onClick={onNextIssue}>
                Show next issue
              </Button>
            </div>
          }
        >
          Preview and Publish unlock when everything is fixed.
        </Notice>
      ) : (
        !closed && (
          <Notice
            variant="success"
            id="package-status"
            title="Nothing to fix"
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
          const count = issuesOfPart(issues, entry.value).filter((issue) => issue.blocking).length;
          return {
            ...entry,
            disabled: !present.includes(entry.value),
            dot: count > 0 ? `${entry.label}, ${count} to fix` : undefined,
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
          {ownBlocking.length > 0 && (
            <Notice
              variant="to-fix"
              id="tab-notice"
              title={`${ownBlocking.length} to fix in this tab`}
              action={
                inFiles ? (
                  <ButtonLink href={replaceHref} variant="secondary" icon={FolderSync}>
                    Replace files
                  </ButtonLink>
                ) : undefined
              }
            >
              {own
                .filter(
                  (issue) =>
                    issue.blocking && (issue.key.endsWith(":all") || !issue.key.includes(":")),
                )
                .map((issue) => (
                  <span
                    key={issue.id}
                    data-issue-ids={issue.id}
                    tabIndex={-1}
                    className="block rounded-[6px] outline-offset-2 data-[flash=true]:outline-2 data-[flash=true]:outline-status-attention-ink"
                  >
                    {issue.where}: {issue.reason}
                  </span>
                ))}
              {inFiles
                ? "Fix the flagged items in your files, then replace them."
                : "Open each flagged question and use Edit question."}
            </Notice>
          )}
          {tab === "guide" && <GuideSections data={topic} issues={issues} showUse />}
          {tab === "steps" && <ChecklistCards data={topic} issues={issues} guideHref={guideHref} />}
          {tab === "scenario" && (
            <ScenarioCards data={topic} issues={issues} guideHref={guideHref} />
          )}
          {tab === "quiz" && (
            <QuizRows
              data={topic}
              issues={issues}
              guideHref={guideHref}
              questionHref={(index) => `${base}/question/${index}`}
              editHref={(index) => `${base}/question/${index}/edit`}
            />
          )}
          {own
            .filter((issue) => !issue.blocking)
            .map((issue) => (
              <p key={issue.id} data-info-note className="type-small text-text-secondary">
                {issue.reason}
              </p>
            ))}
        </>
      )}

      <div className="-ml-3 self-start">
        <ButtonLink href={`/instructor/content/import?replace=${topic.id}`} variant="tertiary">
          Replace files
        </ButtonLink>
      </div>
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
            <Button variant="secondary" onClick={() => onAsk("unpublish")}>
              Unpublish
            </Button>
            <Button variant="secondary" icon={Eye} disabled={toFix} onClick={onPreview}>
              Preview as student
            </Button>
          </>
        ) : (
          <>
            <Button disabled={toFix} onClick={() => onAsk("publish")}>
              Publish
            </Button>
            <Button variant="secondary" icon={Eye} disabled={toFix} onClick={onPreview}>
              Preview as student
            </Button>
            <Button variant="tertiary" destructive onClick={() => onAsk("delete")}>
              Delete demo topic
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
          title="Delete this demo topic?"
          description="This cannot be undone."
          confirmLabel="Delete demo topic"
          cancelLabel="Keep it"
          onConfirm={onConfirm}
          onCancel={onCancelDialog}
        />
      )}
    </div>
  );
}
