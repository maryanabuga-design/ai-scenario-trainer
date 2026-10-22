"use client";

import { Eye, FolderSync } from "lucide-react";
import { ActionBar } from "@/components/ActionBar/ActionBar";
import { Button, ButtonLink } from "@/components/Button/Button";
import { ConfirmDialog } from "@/components/ConfirmDialog/ConfirmDialog";
import { Amber } from "@/components/InstructorContent/Amber";
import {
  ChecklistCards,
  GuideSections,
  QuizRows,
  ScenarioCards,
} from "@/components/PackageContent/PackageParts";
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

export const issueCount = (n: number) => `${n} ${n === 1 ? "issue" : "issues"}`;

/**
 * The demo topic of the Instructor (DESIGN.md: Instructor, content package import and demo topics):
 * the band with the title, the status line and the coverage, the four-option selector Guide | Steps |
 * Scenario | Quiz (a missing part is disabled), the part in the student's components with the guide
 * links and the flagged items, Replace files and Preview as student, and the pinned area:
 * Draft: hint, Primary "Publish", Secondary "Delete demo topic"; Published: Secondary "Unpublish".
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
  dialogInline?: boolean;
}) {
  const present = partsOf(topic);
  const blocking = blockingIssues(issues);
  const own = issuesOfPart(issues, tab);
  const ownBlocking = own.filter((issue) => issue.blocking);
  const base = `/instructor/content/package/${topic.id}`;
  const guideHref = (section: string) => `${base}?tab=guide#section-${section}`;
  const coverage = coverageLine(topic);
  const published = topic.status === "published";
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
          </span>
          <span className="text-text-secondary">
            {topic.code} · Last edited {editedText(topic.editedAt, now)}
          </span>
        </p>
        {coverage && (
          <p data-coverage className="type-small text-text-secondary">
            {coverage}
          </p>
        )}
      </div>

      <SegmentedControl
        name="package-tab"
        legend="Part"
        hideLegend
        dense
        options={tabs.map((entry) => ({ ...entry, disabled: !present.includes(entry.value) }))}
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
            <Amber>{issueCount(ownBlocking.length)} to fix in this tab</Amber>
          )}
          {own
            .filter((issue) => issue.key.endsWith(":all") || !issue.key.includes(":"))
            .map((issue) => (
              <Amber key={issue.id}>
                {issue.where}: {issue.reason}
              </Amber>
            ))}
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
            />
          )}
          {own
            .filter((issue) => !issue.blocking)
            .map((issue) => (
              <p key={issue.id} data-info-note className="type-small text-text-secondary">
                {issue.reason}
              </p>
            ))}
          <ButtonLink href={`${base}/preview/${tab}`} variant="secondary" icon={Eye}>
            Preview as student
          </ButtonLink>
        </>
      )}

      <ButtonLink
        href={`/instructor/content/import?replace=${topic.id}`}
        variant="secondary"
        icon={FolderSync}
      >
        Replace files
      </ButtonLink>
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
          <Button variant="secondary" onClick={() => onAsk("unpublish")}>
            Unpublish
          </Button>
        ) : (
          <>
            {blocking.length > 0 && (
              <p data-publish-hint className="type-small text-center text-text-secondary">
                Fix {issueCount(blocking.length)} to publish
              </p>
            )}
            <Button disabled={blocking.length > 0} onClick={() => onAsk("publish")}>
              Publish
            </Button>
            <Button variant="secondary" onClick={() => onAsk("delete")}>
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
