"use client";

import { FileText } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { ButtonLink } from "@/components/Button/Button";
import { Chip } from "@/components/Chip/Chip";
import { Chevron } from "@/components/Chevron/Chevron";
import { OptionResult } from "@/components/OptionCard/OptionCard";
import { SituationCard } from "@/components/SituationCard/SituationCard";
import { StepCard } from "@/components/StepsView/StepCard";
import { optionState } from "@/lib/option-state";
import { LETTERS, coverage, findImage, usedByText } from "@/lib/package-read";
import type { Issue, PackageData } from "@/lib/package-read";

/**
 * The parts of a demo topic as the student sees them, read-only (DESIGN.md: Instructor, content
 * package import and demo topics): Guide sections, Steps, Scenario steps and Quiz rows. The same
 * components serve the Instructor's tabs, the preview and the Student's own screens. Everything is
 * drawn as plain text: nothing here injects HTML.
 */
const card = "rounded-card border border-selectable-stroke bg-card shadow-(--card-shadow)";

/** A picture of the package with its alt text (a data URL kept in this browser). */
export function PackageImage({
  data,
  file,
  alt,
}: {
  data: PackageData;
  file: string;
  alt: string;
}) {
  const image = findImage(data, file);
  if (!image) return null;
  return (
    <Image
      src={image.data}
      alt={alt}
      width={640}
      height={360}
      unoptimized
      className="aspect-video w-full rounded-[16px] object-cover"
    />
  );
}

/** "Guide · section 2": a reference that opens that guide section. */
export function GuidePill({ section, href }: { section: string; href: string }) {
  return (
    <Chip tone="sand" size="small" className="relative min-h-9 text-left">
      <FileText
        size={14}
        strokeWidth={2}
        aria-hidden="true"
        className="shrink-0 text-text-secondary"
      />
      <Link
        href={href}
        data-guide-pill={section}
        className="before:absolute before:-inset-y-1 before:inset-x-0 before:content-['']"
      >
        Guide · section {section}
      </Link>
    </Chip>
  );
}

/**
 * A flagged item: the amber "To fix" pill with the reasons under it and what to do: a Secondary
 * "Edit question" when the fix is in the question editor (`editHref`), otherwise the text "Fix this
 * in the files, then replace them." The element carries the ids of its issues so "Show next issue"
 * can find it, take the focus to it and outline it.
 */
export function NeedsAttention({ issues, editHref }: { issues: Issue[]; editHref?: string }) {
  const blocking = issues.filter((issue) => issue.blocking);
  if (blocking.length === 0) return null;
  const editable = editHref !== undefined && blocking.some((issue) => issue.fix === "edit");
  const inFiles = blocking.some((issue) => issue.fix === "files");
  return (
    <div
      data-to-fix
      data-issue-ids={blocking.map((issue) => issue.id).join(" ")}
      tabIndex={-1}
      className="flex flex-col items-start gap-1 rounded-[10px] outline-offset-4 data-[flash=true]:outline-2 data-[flash=true]:outline-status-attention-ink"
    >
      <span className="type-caption rounded-full bg-status-attention-bg px-2.5 py-0.5 whitespace-nowrap text-status-attention-ink">
        To fix
      </span>
      {blocking.map((issue) => (
        <p key={issue.id} className="type-small text-status-attention-ink">
          {issue.reason}
        </p>
      ))}
      {editable && (
        <div className="mt-1 w-full">
          <ButtonLink href={editHref} variant="secondary">
            Edit question
          </ButtonLink>
        </div>
      )}
      {inFiles && (
        <p className="type-small text-text-secondary">Fix this in the files, then replace them.</p>
      )}
    </div>
  );
}

/** The issues of one item, by its key ("guide:2"); the whole-part notes ("guide:all") belong to the part. */
export const issuesOfKey = (issues: Issue[], key: string) =>
  issues.filter((issue) => issue.key === key);

/** The Guide: numbered section cards with their pictures; the Instructor's tab adds the "Used by" line. */
export function GuideSections({
  data,
  issues = [],
  showUse = false,
}: {
  data: PackageData;
  issues?: Issue[];
  showUse?: boolean;
}) {
  const use = coverage(data).sections;
  return (
    <ol className="flex flex-col gap-3">
      {(data.guide ?? []).map((section, index) => (
        <li
          key={index}
          id={`section-${section.section}`}
          data-guide-section={section.section}
          className={`${card} flex scroll-mt-4 flex-col gap-3 p-[var(--gutter,1rem)]`}
        >
          <h3 className="type-item-title">
            {section.section}. {section.title}
          </h3>
          <PackageImage data={data} file={section.imageFile} alt={section.alt} />
          <p className="type-body whitespace-pre-line">{section.text}</p>
          {showUse && (
            <p data-used-by className="type-small text-text-secondary">
              {usedByText(use[index])}
            </p>
          )}
          <NeedsAttention issues={issuesOfKey(issues, `guide:${index}`)} />
        </li>
      ))}
    </ol>
  );
}

/** The Steps: each checklist with its steps as the student's accordion cards, the picture and the guide pill inside. */
export function ChecklistCards({
  data,
  issues = [],
  guideHref,
}: {
  data: PackageData;
  issues?: Issue[];
  guideHref: (section: string) => string;
}) {
  const [open, setOpen] = useState<string | null>(null);
  return (
    <div className="flex flex-col gap-6">
      {(data.steps ?? []).map((list, li) => (
        <section key={li} data-checklist={li} className="flex flex-col gap-3">
          <h3 className="type-item-title">{list.title}</h3>
          <ol className="flex flex-col gap-3">
            {list.steps.map((step, si) => {
              const id = `${li}-${si}`;
              const own = issuesOfKey(issues, `steps:${li}:${si}`);
              return (
                <StepCard
                  key={id}
                  index={si}
                  open={open === id}
                  onToggleOpen={() => setOpen(open === id ? null : id)}
                  step={{
                    id,
                    title: step.action || "(no action)",
                    details: step.detail ? [step.detail] : [],
                  }}
                  footer={
                    <div className="flex flex-col items-start gap-3" data-step={id}>
                      <PackageImage data={data} file={step.imageFile} alt={step.alt} />
                      {step.guideRef.trim() !== "" && (
                        <GuidePill
                          section={step.guideRef.trim()}
                          href={guideHref(step.guideRef.trim())}
                        />
                      )}
                    </div>
                  }
                  flag={
                    own.some((issue) => issue.blocking) ? (
                      <NeedsAttention issues={own} />
                    ) : undefined
                  }
                />
              );
            })}
          </ol>
        </section>
      ))}
    </div>
  );
}

const optionsOf = (options: string[]) =>
  options.flatMap((text, i) => (text === "" ? [] : [{ id: LETTERS[i], text }]));

/** The Scenario read-only: each step with its situation, the question, the options (the right one in the Correct style), why and the guide pill. */
export function ScenarioCards({
  data,
  issues = [],
  guideHref,
}: {
  data: PackageData;
  issues?: Issue[];
  guideHref: (section: string) => string;
}) {
  return (
    <ol className="flex flex-col gap-6">
      {(data.scenario ?? []).map((step, index) => (
        <li key={index} data-scenario-step={index} className="flex flex-col gap-3">
          <h3 className="type-label text-text-secondary">STEP {step.step || index + 1}</h3>
          <PackageImage data={data} file={step.imageFile} alt={step.alt} />
          {step.situation && <SituationCard text={step.situation} />}
          <p className="type-item-title">{step.question}</p>
          <ul className="flex flex-col gap-2">
            {optionsOf(step.options).map((option) => (
              <OptionResult
                key={option.id}
                state={optionState({
                  mode: "training",
                  optionId: option.id,
                  choice: null,
                  checked: true,
                  correctOptionId: step.correct ?? "",
                })}
              >
                {option.text}
              </OptionResult>
            ))}
          </ul>
          <div className="flex flex-col items-start gap-2">
            {step.why && <p className="type-small text-text-secondary">{step.why}</p>}
            {step.guideRef.trim() !== "" && (
              <GuidePill section={step.guideRef.trim()} href={guideHref(step.guideRef.trim())} />
            )}
            <NeedsAttention issues={issuesOfKey(issues, `scenario:${index}`)} />
          </div>
        </li>
      ))}
    </ol>
  );
}

/** The Quiz: a row per question (72px) that opens the read-only question, with the guide pill and any problem. */
export function QuizRows({
  data,
  issues = [],
  questionHref,
  editHref,
  guideHref,
}: {
  data: PackageData;
  issues?: Issue[];
  questionHref: (index: number) => string;
  /** The question editor of a question (the Secondary "Edit question" of a flagged one). */
  editHref?: (index: number) => string;
  guideHref: (section: string) => string;
}) {
  return (
    <ul className="flex flex-col gap-3">
      {(data.questions ?? []).map((question, index) => {
        const own = issuesOfKey(issues, `questions:${index}`);
        return (
          <li key={index} data-quiz-row={index} className={`${card} flex flex-col gap-2 p-3`}>
            <Link
              href={questionHref(index)}
              className="flex min-h-12 items-center gap-3 has-focus-visible:outline-2"
            >
              <span
                aria-hidden="true"
                className="type-caption-strong flex h-9 min-w-9 shrink-0 items-center justify-center rounded-full bg-olive-tint px-2"
              >
                {index + 1}
              </span>
              <span className="type-body-strong line-clamp-2 min-w-0 flex-1">
                {question.text || "(no question text)"}
              </span>
              <Chevron />
            </Link>
            <div className="flex flex-col items-start gap-2 pl-12">
              {question.guideRef.trim() !== "" && (
                <GuidePill
                  section={question.guideRef.trim()}
                  href={guideHref(question.guideRef.trim())}
                />
              )}
              <NeedsAttention issues={own} editHref={editHref?.(index)} />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
