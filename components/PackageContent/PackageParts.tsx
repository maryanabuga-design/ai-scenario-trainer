"use client";

import { Check, FileText, Pencil } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { ButtonLink } from "@/components/Button/Button";
import { Chip } from "@/components/Chip/Chip";
import { OptionResult } from "@/components/OptionCard/OptionCard";
import { SituationCard } from "@/components/SituationCard/SituationCard";
import { optionState } from "@/lib/option-state";
import { LETTERS, coverage, findImage, usedByText } from "@/lib/package-read";
import { pillOf } from "@/lib/package-review";
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
 * The ONE small pill of an item card (DESIGN.md: Guided review of a content package): the most
 * important issue as text, no dot and no coloured card. Must fix uses the attention style, please
 * confirm the neutral one; an item without an issue has none.
 */
export function IssuePill({ issues, itemKey }: { issues: Issue[]; itemKey: string }) {
  const pill = pillOf(issues, itemKey);
  if (!pill) return null;
  return (
    <span
      data-issue-pill={pill.kind}
      className={`type-caption w-fit max-w-full truncate rounded-full px-2.5 py-0.5 ${
        pill.kind === "must"
          ? "bg-status-attention-bg text-status-attention-ink"
          : "bg-neutral-tile-bg text-neutral-tile-ink"
      }`}
    >
      {pill.text}
    </span>
  );
}

/**
 * The pencil of a card (DESIGN.md: Corner pencil): a 32px light sand tile with a muted icon INSIDE its
 * card, 12px from the top and right edges (a 44px tap area centred on it), "Edit <name>". `className`
 * moves it for the step card, where it shares the chevron's centre line.
 */
export function PencilButton({
  href,
  label,
  className = "absolute top-[6px] right-[6px]",
}: {
  href: string;
  label: string;
  className?: string;
}) {
  return (
    <Link
      href={href}
      aria-label={label}
      data-pencil
      className={`${className} flex h-11 w-11 items-center justify-center has-focus-visible:outline-2 focus-visible:outline-2`}
    >
      <span
        aria-hidden="true"
        className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-tile-bg text-neutral-tile-ink"
      >
        <Pencil size={16} strokeWidth={2.25} />
      </span>
    </Link>
  );
}

/** The muted line "Based on: <guide section title>" of a step or a question (nothing when it names no section). */
export function BasedOn({ data, section }: { data: PackageData; section: string }) {
  const ref = section.trim();
  if (ref === "") return null;
  const title = (data.guide ?? []).find((entry) => String(entry.section) === ref)?.title;
  return (
    <p data-based-on className="type-small text-text-secondary">
      Based on: {title || `section ${ref}`}
    </p>
  );
}

/**
 * A note about a whole part (section numbers that are not consecutive, more than ten steps): it has
 * no item of its own, so it shows once at the top of its tab with the underlined link "Replace document".
 */
export function PartNote({ issues, replaceHref }: { issues: Issue[]; replaceHref: string }) {
  const notes = issues.filter((issue) => issue.kind === "must");
  if (notes.length === 0) return null;
  return (
    <div
      data-part-note
      className="flex flex-col items-start gap-1 rounded-card border border-selectable-stroke bg-card p-3"
    >
      <span className="type-caption rounded-full bg-status-attention-bg px-2.5 py-0.5 whitespace-nowrap text-status-attention-ink">
        Must fix
      </span>
      {notes.map((issue) => (
        <p key={issue.id} className="type-small text-text-secondary">
          {issue.reason}
        </p>
      ))}
      <div className="-ml-3">
        <ButtonLink href={replaceHref} variant="tertiary">
          Replace document
        </ButtonLink>
      </div>
    </div>
  );
}

/** The issues of one item, by its key ("guide:2"); the whole-part notes ("guide:all") belong to the part. */
export const issuesOfKey = (issues: Issue[], key: string) =>
  issues.filter((issue) => issue.key === key);

/** The Guide: numbered section cards with their pictures; the Instructor's tab adds the pill, the pencil and the "Used by" line. */
export function GuideSections({
  data,
  issues = [],
  showUse = false,
  editHref,
}: {
  data: PackageData;
  issues?: Issue[];
  showUse?: boolean;
  /** The edit screen of an item key; the cards of the Instructor's tab show a pencil for it. */
  editHref?: (key: string) => string;
}) {
  const use = coverage(data).sections;
  return (
    <ol className="flex flex-col gap-3">
      {(data.guide ?? []).map((section, index) => {
        const key = `guide:${index}`;
        const name = `Guide section ${section.section || index + 1}`;
        return (
          <li
            key={index}
            id={`section-${section.section}`}
            data-guide-section={section.section}
            className={`${card} relative flex scroll-mt-4 flex-col gap-3 p-[var(--gutter,1rem)]`}
          >
            <div className={`flex flex-col items-start gap-1 ${editHref ? "pr-10" : ""}`}>
              <h3 className="type-item-title">
                {section.section}. {section.title}
              </h3>
              <IssuePill issues={issues} itemKey={key} />
            </div>
            <PackageImage data={data} file={section.imageFile} alt={section.alt} />
            <p className="type-body whitespace-pre-line">{section.text}</p>
            {showUse && (
              <p data-used-by className="type-small text-text-secondary">
                {usedByText(use[index])}
              </p>
            )}
            {editHref && <PencilButton href={editHref(key)} label={`Edit ${name}`} />}
          </li>
        );
      })}
    </ol>
  );
}

/**
 * The Steps of a draft topic (DESIGN.md: One edit pattern): a card per step that shows everything,
 * does nothing when tapped and has one corner pencil: "STEP n", the action as the title, the detail
 * in the muted colour, the picture, "Based on: <guide section title>" and the issue pill.
 */
export function ChecklistCards({
  data,
  issues = [],
  editHref,
}: {
  data: PackageData;
  issues?: Issue[];
  editHref?: (key: string) => string;
}) {
  return (
    <div className="flex flex-col gap-6">
      {(data.steps ?? []).map((list, li) => (
        <section key={li} data-checklist={li} className="flex flex-col gap-3">
          <h3 className="type-item-title">{list.title}</h3>
          <ol className="flex flex-col gap-3">
            {list.steps.map((step, si) => {
              const key = `steps:${li}:${si}`;
              return (
                <li
                  key={si}
                  data-step-card={`${li}-${si}`}
                  className={`${card} relative flex flex-col items-start gap-2 p-[var(--gutter,1rem)] ${editHref ? "pr-[52px]" : ""}`}
                >
                  <span className="type-label text-text-secondary">STEP {si + 1}</span>
                  <h4 className="type-body-strong max-w-full [overflow-wrap:anywhere]">
                    {step.action || "(no action)"}
                  </h4>
                  {step.detail && (
                    <p className="type-body max-w-full [overflow-wrap:anywhere] whitespace-pre-line text-text-secondary">
                      {step.detail}
                    </p>
                  )}
                  <PackageImage data={data} file={step.imageFile} alt={step.alt} />
                  <BasedOn data={data} section={step.guideRef} />
                  <IssuePill issues={issues} itemKey={key} />
                  {editHref && (
                    <PencilButton
                      href={editHref(key)}
                      label={`Edit step ${si + 1} of ${list.title}`}
                    />
                  )}
                </li>
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
  editHref,
}: {
  data: PackageData;
  issues?: Issue[];
  guideHref: (section: string) => string;
  editHref?: (key: string) => string;
}) {
  return (
    <ol className="flex flex-col gap-6">
      {(data.scenario ?? []).map((step, index) => {
        const key = `scenario:${index}`;
        return (
          <li key={index} data-scenario-step={index} className="relative flex flex-col gap-3">
            <div className="flex flex-col items-start gap-1">
              <h3 className="type-label text-text-secondary">STEP {step.step || index + 1}</h3>
              <IssuePill issues={issues} itemKey={key} />
            </div>
            <PackageImage data={data} file={step.imageFile} alt={step.alt} />
            {(step.situation || editHref) && (
              <SituationCard
                text={step.situation || "(no situation)"}
                corner={
                  editHref ? (
                    <PencilButton
                      href={editHref(key)}
                      label={`Edit scenario step ${step.step || index + 1}`}
                    />
                  ) : undefined
                }
              />
            )}
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
            </div>
          </li>
        );
      })}
    </ol>
  );
}

/**
 * The Quiz of a draft topic (DESIGN.md: One edit pattern): a card per question that shows everything,
 * does nothing when tapped and has one corner pencil: the number and the question, the answers as a
 * compact plain list with the correct one marked, "Based on: <guide section title>" and the issue pill.
 */
export function QuizRows({
  data,
  issues = [],
  editHref,
}: {
  data: PackageData;
  issues?: Issue[];
  /** The edit screen of an item key. */
  editHref?: (key: string) => string;
}) {
  return (
    <ul className="flex flex-col gap-3">
      {(data.questions ?? []).map((question, index) => {
        const key = `questions:${index}`;
        return (
          <li
            key={index}
            data-quiz-row={index}
            className={`${card} relative flex flex-col gap-3 p-3 ${editHref ? "pr-[52px]" : ""}`}
          >
            <div className="flex items-start gap-3">
              <span
                aria-hidden="true"
                className="type-caption-strong flex h-9 min-w-9 shrink-0 items-center justify-center rounded-full bg-olive-tint px-2"
              >
                {index + 1}
              </span>
              <h4 className="type-body-strong min-w-0 flex-1 pt-1 [overflow-wrap:anywhere]">
                {question.text || "(no question text)"}
              </h4>
            </div>
            <ul data-quiz-options className="flex flex-col gap-1.5 pl-12">
              {LETTERS.map((letter, i) =>
                question.options[i] === "" ? null : (
                  <li
                    key={letter}
                    data-correct={question.correct === letter ? "" : undefined}
                    className="type-small flex flex-col items-start"
                  >
                    <span className="max-w-full [overflow-wrap:anywhere] text-text">
                      {question.options[i]}
                    </span>
                    {question.correct === letter && (
                      <span className="flex items-center gap-1 text-status-success-ink">
                        <Check size={14} strokeWidth={2.5} aria-hidden="true" />
                        Correct answer
                      </span>
                    )}
                  </li>
                ),
              )}
            </ul>
            <div className="flex flex-col items-start gap-2 pl-12">
              <BasedOn data={data} section={question.guideRef} />
              <IssuePill issues={issues} itemKey={key} />
            </div>
            {editHref && <PencilButton href={editHref(key)} label={`Edit question ${index + 1}`} />}
          </li>
        );
      })}
    </ul>
  );
}
