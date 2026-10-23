"use client";

import { Eye } from "lucide-react";
import { ActionBar } from "@/components/ActionBar/ActionBar";
import { Button, ButtonLink } from "@/components/Button/Button";
import { ConfirmDialog } from "@/components/ConfirmDialog/ConfirmDialog";
import { Notice } from "@/components/Notice/Notice";
import { IssuePill } from "@/components/PackageContent/PackageParts";
import { PageHeaderBand } from "@/components/PageHeaderBand/PageHeaderBand";
import { flaggedItems, itemName, keySlug } from "@/lib/package-review";
import type { Issue } from "@/lib/package-read";
import type { DemoTopic } from "@/lib/packages";

/**
 * The end of the guided review (DESIGN.md: Guided review of a content package): never a silent return
 * to the topic. Everything checked: a success notice, Primary "Publish", Secondary "Preview as
 * student". Items left: a calm notice, a compact list (pill, name, Edit), Primary "Review remaining N"
 * and Secondary "Back to topic".
 */
export function PackageReviewSummary({
  topic,
  issues,
  publishing = false,
  onPublishAsk,
  onPublish,
  onPublishCancel,
  onReview,
  onPreview,
  onBack,
  dialogInline = false,
}: {
  topic: DemoTopic;
  issues: Issue[];
  publishing?: boolean;
  onPublishAsk: () => void;
  onPublish: () => void;
  onPublishCancel: () => void;
  onReview: () => void;
  onPreview: () => void;
  onBack: () => void;
  dialogInline?: boolean;
}) {
  const flagged = flaggedItems(issues);
  const base = `/instructor/content/package/${topic.id}`;
  return (
    <div className="flex flex-col gap-4 pb-4">
      <PageHeaderBand
        title="Review summary"
        subtitle={topic.title}
        back={{ label: "Back to topic", onClick: onBack }}
      />
      {flagged.length === 0 ? (
        <Notice variant="success" id="review-summary" title="All items checked">
          Preview as student, then publish.
        </Notice>
      ) : (
        <>
          <Notice
            variant="to-fix"
            id="review-summary"
            title={`${flagged.length} ${flagged.length === 1 ? "item" : "items"} still need${flagged.length === 1 ? "s" : ""} your attention`}
          >
            Fix them to publish this topic.
          </Notice>
          <ul data-remaining className="flex flex-col gap-2">
            {flagged.map((item) => (
              <li
                key={item.key}
                className="flex min-h-11 items-center justify-between gap-3 rounded-card border border-selectable-stroke bg-card px-[var(--gutter,1rem)] py-2"
              >
                <span className="flex min-w-0 flex-col gap-1">
                  <span className="type-body-strong truncate">{itemName(topic, item.key)}</span>
                  <IssuePill issues={issues} itemKey={item.key} />
                </span>
                <ButtonLink
                  href={`${base}/edit/${keySlug(item.key)}`}
                  variant="tertiary"
                  aria-label={`Edit ${itemName(topic, item.key)}`}
                >
                  Edit
                </ButtonLink>
              </li>
            ))}
          </ul>
        </>
      )}
      <ActionBar>
        {flagged.length === 0 ? (
          <>
            <Button onClick={onPublishAsk}>Publish</Button>
            <Button variant="secondary" icon={Eye} onClick={onPreview}>
              Preview as student
            </Button>
          </>
        ) : (
          <>
            <Button onClick={onReview}>Review remaining {flagged.length}</Button>
            <Button variant="secondary" onClick={onBack}>
              Back to topic
            </Button>
          </>
        )}
      </ActionBar>
      <ConfirmDialog
        open={publishing}
        inline={dialogInline}
        title="Publish this demo topic?"
        description="Students will see it in Materials under From your instructor. It does not count towards exams or readiness."
        confirmLabel="Publish"
        cancelLabel="Keep editing"
        onConfirm={onPublish}
        onCancel={onPublishCancel}
      />
    </div>
  );
}
