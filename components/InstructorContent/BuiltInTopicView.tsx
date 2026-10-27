"use client";

import { BookOpen, ListOrdered } from "lucide-react";
import { useState } from "react";
import { PageHeaderBand } from "@/components/PageHeaderBand/PageHeaderBand";
import { SegmentedControl } from "@/components/SegmentedControl/SegmentedControl";
import { StepCard } from "@/components/StepsView/StepCard";
import { LucideTile } from "@/components/TopicTile/TopicTile";
import { initialOpen, toggleOpen } from "@/lib/accordion";
import { stepCountLabel } from "@/lib/checklists";
import type { Checklist } from "@/lib/checklists";

export const BUILT_IN_LABEL = "Course topic · read-only";

export type BuiltInTab = "overview" | "steps";

/**
 * A built-in topic for the Instructor (DESIGN.md: Steps in Materials, Content labels): read-only. The
 * band names the topic and says "Course topic · read-only"; the Overview card counts its questions and
 * names its guide section; only a topic with an attached step guide (S1, S7, S8) has the second tab
 * "Steps", which lists that guide's steps as the shared read-only step cards.
 */
export function BuiltInTopicView({
  id,
  title,
  questions,
  minutes,
  guide,
  tab: fixedTab,
}: {
  id: string;
  title: string;
  questions: number;
  /** The reading time of the topic in minutes. */
  minutes: number;
  guide: Checklist | undefined;
  /** For tests and the review page: the tab without local state. */
  tab?: BuiltInTab;
}) {
  const [chosen, setChosen] = useState<BuiltInTab>("overview");
  const [open, setOpen] = useState<string | null>(() =>
    initialOpen((guide?.steps ?? []).map((step) => step.id)),
  );
  const tab = guide ? (fixedTab ?? chosen) : "overview";
  return (
    <div data-built-in-topic={id} className="flex flex-col gap-4 pb-4">
      <PageHeaderBand
        title={title}
        subtitle={`${id} · ${BUILT_IN_LABEL}`}
        back={{ label: "Back to Course topics", href: "/instructor/content/course" }}
      />
      {guide && (
        <SegmentedControl
          name="built-in-tab"
          legend="Part"
          hideLegend
          options={[
            { value: "overview", label: "Overview" },
            { value: "steps", label: "Steps" },
          ]}
          value={tab}
          onChange={setChosen}
        />
      )}
      {tab === "overview" ? (
        <ul data-built-in-overview className="flex flex-col gap-3">
          <li className="flex min-h-[72px] items-center gap-3 rounded-card bg-card px-4 shadow-(--card-shadow)">
            <LucideTile icon={BookOpen} size="tile" />
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="type-body-strong">Guide section {id}</span>
              <span className="type-small text-text-secondary tabular-nums">
                {minutes} min read · {questions} {questions === 1 ? "question" : "questions"}
              </span>
            </span>
          </li>
          {guide && (
            <li className="flex min-h-[72px] items-center gap-3 rounded-card bg-card px-4 shadow-(--card-shadow)">
              <LucideTile icon={ListOrdered} size="tile" />
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="type-body-strong">{guide.title}</span>
                <span className="type-small text-text-secondary tabular-nums">
                  Step guide · {stepCountLabel(guide.steps.length)}
                </span>
              </span>
            </li>
          )}
        </ul>
      ) : (
        guide && (
          <ol data-built-in-steps className="flex flex-col gap-3">
            {guide.steps.map((step, index) => (
              <StepCard
                key={step.id}
                step={step}
                index={index}
                open={open === step.id}
                onToggleOpen={() => setOpen((current) => toggleOpen(current, step.id))}
              />
            ))}
          </ol>
        )
      )}
    </div>
  );
}
