"use client";

import { BookOpen, ClipboardCheck, ListChecks, Route } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { ButtonLink } from "@/components/Button/Button";
import { Chevron } from "@/components/Chevron/Chevron";
import { PageHeaderBand } from "@/components/PageHeaderBand/PageHeaderBand";
import { ChecklistCards, GuideSections } from "@/components/PackageContent/PackageParts";
import { PackageRunner } from "@/components/PackageContent/PackageRunner";
import type { RunItem } from "@/components/PackageContent/PackageRunner";
import { LucideTile } from "@/components/TopicTile/TopicTile";
import { partsOf } from "@/lib/package-read";
import type { PackageData, PathPart } from "@/lib/package-read";

export const PART_TITLES: Record<PathPart, string> = {
  guide: "Read the guide",
  steps: "Read the step guide",
  scenario: "Practise the scenario",
  quiz: "Take the quiz",
};
const PART_ICONS: Record<PathPart, LucideIcon> = {
  guide: BookOpen,
  steps: ListChecks,
  scenario: Route,
  quiz: ClipboardCheck,
};
const PART_LINES: Record<PathPart, string> = {
  guide: "Sections with pictures",
  steps: "Steps, each with a guide link",
  scenario: "Choose the best action, step by step",
  quiz: "Test what you read",
};

/** The parts of a demo topic under two small labels: what to read and what to practise. */
const GROUPS: { label: string; parts: PathPart[] }[] = [
  { label: "READ", parts: ["guide", "steps"] },
  { label: "PRACTISE", parts: ["scenario", "quiz"] },
];

export const isPart = (value: string): value is PathPart =>
  value === "guide" || value === "steps" || value === "scenario" || value === "quiz";

/** The questions of a scenario or a quiz for the runner. */
export function runItems(data: PackageData, part: "scenario" | "quiz"): RunItem[] {
  if (part === "scenario") {
    return (data.scenario ?? []).flatMap((step) =>
      step.correct
        ? [
            {
              situation: step.situation,
              question: step.question,
              options: [...step.options],
              correct: step.correct,
              explanation: step.why,
              guideRef: step.guideRef,
              imageFile: step.imageFile,
              alt: step.alt,
            },
          ]
        : [],
    );
  }
  return (data.questions ?? []).flatMap((q) =>
    q.correct
      ? [
          {
            question: q.text,
            options: [...q.options],
            correct: q.correct,
            explanation: q.explanation,
            guideRef: q.guideRef,
            imageFile: q.imageFile,
            alt: q.alt,
          },
        ]
      : [],
  );
}

/** The slim sticky bar of the preview: "Previewing as student" and a Secondary "Exit preview". */
export function PreviewBar({ exitHref }: { exitHref: string }) {
  return (
    <div
      data-preview-bar
      className="sticky top-0 z-30 -mx-[var(--gutter,1rem)] flex min-h-12 items-center justify-between gap-3 border-b border-selectable-stroke bg-secondary-sand px-[var(--gutter,1rem)]"
    >
      <p className="type-small-strong">Previewing as student</p>
      <ButtonLink href={exitHref} variant="secondary" wide={false} compact>
        Exit preview
      </ButtonLink>
    </div>
  );
}

/**
 * The topic screen of a demo topic for a student (and its preview): the parts in the learning path
 * order, Read the guide, Follow the steps, Practise the scenario, Take the quiz.
 */
export function PackageTopicStudentView({
  title,
  summary,
  data,
  partHref,
  back,
  preview,
}: {
  title: string;
  summary: string;
  data: PackageData;
  partHref: (part: PathPart) => string;
  back: { label: string; href: string };
  preview?: { exitHref: string };
}) {
  return (
    <div className="flex flex-col gap-4 pb-4">
      {preview && <PreviewBar exitHref={preview.exitHref} />}
      <PageHeaderBand title={title} subtitle={summary || undefined} back={back} />
      {GROUPS.map((group) => {
        const parts = partsOf(data).filter((part) => group.parts.includes(part));
        if (parts.length === 0) return null;
        return (
          <section
            key={group.label}
            aria-label={group.label}
            data-part-group={group.label}
            className="flex flex-col gap-3"
          >
            <h2 className="type-label text-text-secondary">{group.label}</h2>
            <ul className="flex flex-col gap-3">
              {parts.map((part) => (
                <li key={part}>
                  <Link
                    href={partHref(part)}
                    data-package-part={part}
                    className="flex h-[88px] items-center gap-3 rounded-card border border-selectable-stroke bg-card px-3 shadow-(--card-shadow) has-focus-visible:outline-2"
                  >
                    <LucideTile icon={PART_ICONS[part]} size="tile" />
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className="type-body-strong truncate">{PART_TITLES[part]}</span>
                      <span className="type-small truncate text-text-secondary">
                        {PART_LINES[part]}
                      </span>
                    </span>
                    <Chevron />
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
      <p className="type-small text-center text-text-secondary">
        This topic is separate from the guide topics: it does not count towards readiness or exams.
      </p>
    </div>
  );
}

/** One part of a demo topic for a student (and its preview): the guide, the steps, the scenario or the quiz. */
export function PackagePartView({
  title,
  part,
  data,
  guideHref,
  back,
  preview,
}: {
  title: string;
  part: PathPart;
  data: PackageData;
  guideHref: (section: string) => string;
  back: { label: string; href: string };
  preview?: { exitHref: string };
}) {
  return (
    <div className="flex flex-col gap-4 pb-4">
      {preview && <PreviewBar exitHref={preview.exitHref} />}
      <PageHeaderBand title={PART_TITLES[part]} subtitle={title} back={back} />
      {part === "guide" && <GuideSections data={data} />}
      {part === "steps" && <ChecklistCards data={data} guideHref={guideHref} />}
      {part === "scenario" && (
        <PackageRunner
          key="scenario"
          data={data}
          items={runItems(data, "scenario")}
          guideHref={guideHref}
          noun="step"
        />
      )}
      {part === "quiz" && (
        <PackageRunner
          key="quiz"
          data={data}
          items={runItems(data, "quiz")}
          guideHref={guideHref}
          noun="question"
        />
      )}
    </div>
  );
}

/** A demo topic that is not published (or was removed): a calm screen with a way back. */
export function PackageGone() {
  return (
    <div className="flex flex-col items-start gap-4">
      <h1 className="type-page-title">This topic is not available</h1>
      <p className="text-text-secondary">
        Your instructor has not published it, or it was removed.
      </p>
      <ButtonLink href="/materials" variant="secondary">
        Back to Materials
      </ButtonLink>
    </div>
  );
}
