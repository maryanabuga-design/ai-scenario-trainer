"use client";

import { CircleAlert, CircleCheck } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { ActionBar } from "@/components/ActionBar/ActionBar";
import { Button } from "@/components/Button/Button";
import { Card } from "@/components/Card/Card";
import { Chevron } from "@/components/Chevron/Chevron";
import { ConfirmDialog } from "@/components/ConfirmDialog/ConfirmDialog";
import { IconTile } from "@/components/IconTile/IconTile";
import { QuestionStatusLine } from "@/components/InstructorContent/StatusLine";
import { PageHeaderBand } from "@/components/PageHeaderBand/PageHeaderBand";
import { SegmentedControl } from "@/components/SegmentedControl/SegmentedControl";
import {
  SAMPLE_LABEL,
  canPublish,
  problemsOf,
  publishHint,
  reviewCounts,
} from "@/lib/content-import";
import type { ContentSet } from "@/lib/content-sets";

type Filter = "all" | "attention";
const filterOptions: { value: Filter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "attention", label: "Needs attention" },
];

export const PUBLISHED_MESSAGE = "Published. Students can practise these questions in Training.";

/** "Publish 20 questions to S3 Evacuation routes? Students will see them in Training." */
export const publishQuestion = (count: number, topic: string, topicTitle: string) =>
  `Publish ${count} ${count === 1 ? "question" : "questions"} to ${topic} ${topicTitle}? Students will see them in Training.`;

function CountTile({
  kind,
  count,
  label,
}: {
  kind: "ready" | "attention";
  count: number;
  label: string;
}) {
  const ready = kind === "ready";
  const Icon = ready ? CircleCheck : CircleAlert;
  return (
    <div
      data-count={kind}
      className="flex flex-col gap-2 rounded-card bg-card p-3 shadow-(--card-shadow)"
    >
      <IconTile tone={ready ? "success" : "attention"} className="h-9 w-9 rounded-full">
        <Icon size={18} strokeWidth={1.75} />
      </IconTile>
      <span className="flex flex-col">
        <span className="type-card-title tabular-nums">{count}</span>
        <span className="type-small text-text-secondary">{label}</span>
      </span>
    </div>
  );
}

/**
 * Review of an imported set (DESIGN.md: Instructor, Content): the band with the title and the
 * topic, the two count tiles (no percentage), the All / Needs attention selector and 72px question
 * rows. Pinned: Primary "Publish" (disabled while any question needs attention, with a hint) and
 * Secondary "Delete set". A Published set is read-only with the Secondary "Unpublish".
 */
export function ReviewView({
  set,
  topicTitle,
  message = "",
  onPublish,
  onUnpublish,
  onDelete,
  initialFilter = "all",
  confirmingInitially = null,
  dialogInline = false,
}: {
  set: ContentSet;
  topicTitle: string;
  message?: string;
  onPublish: () => void;
  onUnpublish: () => void;
  onDelete: () => void;
  initialFilter?: Filter;
  confirmingInitially?: "publish" | "delete" | null;
  dialogInline?: boolean;
}) {
  const [filter, setFilter] = useState<Filter>(initialFilter);
  const [confirming, setConfirming] = useState<"publish" | "delete" | null>(confirmingInitially);
  const published = set.status === "published";
  const counts = reviewCounts(set.questions);
  const rows = set.questions
    .map((question, index) => ({ question, index, problems: problemsOf(question, set.questions) }))
    .filter((row) => filter === "all" || row.problems.length > 0)
    .sort((a, b) =>
      filter === "attention" || a.problems.length > 0 === b.problems.length > 0
        ? a.index - b.index
        : a.problems.length > 0
          ? -1
          : 1,
    );
  const hint = publishHint(counts);

  return (
    <div className="flex flex-col gap-4 pb-4">
      <PageHeaderBand
        title={set.title}
        subtitle={`${set.topic} ${topicTitle}`}
        back={{ label: "Back to Content", href: "/instructor/content" }}
      />
      <p role="status" data-message className="type-body text-center not-empty:py-1">
        {message}
      </p>
      {set.source === "sample" && (
        <p data-sample-label className="type-small text-text-secondary">
          {SAMPLE_LABEL}
        </p>
      )}
      {set.dropped > 0 && (
        <p data-dropped className="type-small text-text-secondary">
          {set.dropped} {set.dropped === 1 ? "row was" : "rows were"} left out: a file may have 100
          questions at most.
        </p>
      )}

      <Card>
        <div className="grid grid-cols-2 gap-2">
          <CountTile kind="ready" count={counts.ready} label="ready" />
          <CountTile kind="attention" count={counts.attention} label="need attention" />
        </div>
      </Card>

      <SegmentedControl
        name="review-filter"
        legend="Show"
        hideLegend
        options={filterOptions}
        value={filter}
        onChange={setFilter}
      />

      {rows.length === 0 ? (
        <p data-empty className="text-text-secondary">
          {set.questions.length === 0
            ? "This set has no questions."
            : "No question needs attention."}
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {rows.map(({ question, index, problems }) => {
            const body = (
              <>
                <span
                  aria-hidden="true"
                  className="type-caption flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-olive-tint text-text"
                >
                  {index + 1}
                </span>
                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="type-body-strong truncate">
                    <span className="sr-only">Question {index + 1}: </span>
                    {question.text || "(no question text)"}
                  </span>
                  <QuestionStatusLine problems={problems} />
                </span>
                {!published && <Chevron />}
              </>
            );
            const classes =
              "flex h-[72px] items-center gap-3 rounded-card bg-card px-4 shadow-(--card-shadow)";
            return (
              <li key={question.id} data-question-row={index + 1}>
                {published ? (
                  <div className={classes}>{body}</div>
                ) : (
                  <Link
                    href={`/instructor/content/${set.id}/${index + 1}`}
                    className={`${classes} has-focus-visible:outline-2`}
                  >
                    {body}
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <ActionBar>
        {published ? (
          <Button variant="secondary" onClick={onUnpublish}>
            Unpublish
          </Button>
        ) : (
          <>
            {hint && (
              <p data-publish-hint className="type-small text-center text-text-secondary">
                {hint}
              </p>
            )}
            <Button disabled={!canPublish(counts)} onClick={() => setConfirming("publish")}>
              Publish
            </Button>
            <Button variant="secondary" onClick={() => setConfirming("delete")}>
              Delete set
            </Button>
          </>
        )}
      </ActionBar>

      {(confirming === "publish" || !dialogInline) && (
        <ConfirmDialog
          open={confirming === "publish"}
          inline={dialogInline}
          title="Publish this set?"
          description={publishQuestion(set.questions.length, set.topic, topicTitle)}
          confirmLabel="Publish"
          cancelLabel="Keep editing"
          onConfirm={() => {
            setConfirming(null);
            onPublish();
          }}
          onCancel={() => setConfirming(null)}
        />
      )}
      {(confirming === "delete" || !dialogInline) && (
        <ConfirmDialog
          open={confirming === "delete"}
          inline={dialogInline}
          title="Delete this set?"
          description="The set and its questions are removed from this browser. This cannot be undone."
          confirmLabel="Delete set"
          cancelLabel="Keep set"
          onConfirm={() => {
            setConfirming(null);
            onDelete();
          }}
          onCancel={() => setConfirming(null)}
        />
      )}
    </div>
  );
}
