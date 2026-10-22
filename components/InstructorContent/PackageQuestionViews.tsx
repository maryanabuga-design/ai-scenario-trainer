"use client";

import { Pencil } from "lucide-react";
import { useState } from "react";
import { ActionBar } from "@/components/ActionBar/ActionBar";
import { Button, ButtonLink } from "@/components/Button/Button";
import { Amber } from "@/components/InstructorContent/Amber";
import { OptionResult } from "@/components/OptionCard/OptionCard";
import { GuidePill, NeedsAttention, PackageImage } from "@/components/PackageContent/PackageParts";
import { PageHeaderBand } from "@/components/PageHeaderBand/PageHeaderBand";
import { SelectableRow } from "@/components/SelectableRow/SelectableRow";
import { optionState } from "@/lib/option-state";
import { LETTERS, checkPackage } from "@/lib/package-read";
import type { Issue, Letter, PackageData, PackageQuestion } from "@/lib/package-read";

const areaClass =
  "type-body w-full rounded-[14px] border border-selectable-stroke bg-card px-[var(--gutter,1rem)] py-3 text-text focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-primary";

/** One quiz question of a demo topic, read-only (the options, the right one marked, why, the guide pill). */
export function PackageQuestionView({
  data,
  index,
  issues,
  backHref,
  editHref,
  guideHref,
}: {
  data: PackageData;
  index: number;
  issues: Issue[];
  backHref: string;
  editHref: string;
  guideHref: (section: string) => string;
}) {
  const question = data.questions![index];
  return (
    <div className="flex flex-col gap-4 pb-4">
      <PageHeaderBand
        title={`Question ${index + 1}`}
        subtitle={question.id}
        back={{ label: "Back to quiz", href: backHref }}
      />
      <PackageImage data={data} file={question.imageFile} alt={question.alt} />
      <h2 data-question-text className="type-item-title">
        {question.text || "(no question text)"}
      </h2>
      <ul className="flex flex-col gap-3">
        {question.options.flatMap((text, i) =>
          text === ""
            ? []
            : [
                <OptionResult
                  key={i}
                  state={optionState({
                    mode: "training",
                    optionId: LETTERS[i],
                    choice: null,
                    checked: true,
                    correctOptionId: question.correct ?? "",
                  })}
                >
                  {text}
                </OptionResult>,
              ],
        )}
      </ul>
      <section className="flex flex-col items-start gap-2">
        <h3 className="type-label text-text-secondary">WHY</h3>
        <p>{question.explanation || "(no explanation)"}</p>
        {question.guideRef.trim() !== "" && (
          <GuidePill
            section={question.guideRef.trim()}
            href={guideHref(question.guideRef.trim())}
          />
        )}
        <NeedsAttention issues={issues} />
      </section>
      <ButtonLink href={editHref} variant="secondary" icon={Pencil}>
        Edit question
      </ButtonLink>
    </div>
  );
}

/**
 * Edit question of a demo topic: the question, four answers with a circle for the correct one, the
 * explanation, the guide reference (a choice among the guide sections of the package) and the alt
 * text of its picture. What the checks found shows in amber and updates as the fields change.
 */
export function PackageQuestionEdit({
  data,
  index,
  backHref,
  onSave,
}: {
  data: PackageData;
  index: number;
  backHref: string;
  onSave: (question: PackageQuestion) => void;
}) {
  const [draft, setDraft] = useState<PackageQuestion>(data.questions![index]);
  const change = (part: Partial<PackageQuestion>) => setDraft((d) => ({ ...d, ...part }));
  const next = {
    ...data,
    questions: data.questions!.map((q, i) => (i === index ? draft : q)),
  };
  const problems = checkPackage(next).filter(
    (issue) => issue.blocking && issue.key === `questions:${index}`,
  );
  const sections = data.guide ?? [];
  return (
    <div className="flex flex-col gap-6 pb-4">
      <PageHeaderBand
        title={`Question ${index + 1}`}
        subtitle={draft.id}
        back={{ label: "Back to question", href: backHref }}
      />
      {problems.length > 0 && (
        <div data-problems className="flex flex-col gap-1">
          {problems.map((issue) => (
            <Amber key={issue.id}>{issue.reason}</Amber>
          ))}
        </div>
      )}
      <section aria-labelledby="pq-q" className="flex flex-col gap-2">
        <h2 id="pq-q" className="type-label text-text-secondary">
          QUESTION
        </h2>
        <textarea
          aria-labelledby="pq-q"
          name="question"
          rows={3}
          value={draft.text}
          onChange={(event) => change({ text: event.target.value })}
          className={`${areaClass} min-h-24`}
        />
      </section>
      <section aria-labelledby="pq-a" className="flex flex-col gap-3">
        <h2 id="pq-a" className="type-label text-text-secondary">
          ANSWERS · CHOOSE THE CORRECT ONE
        </h2>
        {LETTERS.map((letter, i) => (
          <div key={letter} className="flex items-center gap-2">
            <label className="flex min-h-11 min-w-11 cursor-pointer items-center justify-center">
              <input
                type="radio"
                name="correct"
                value={letter}
                aria-label={`Correct answer ${letter.toUpperCase()}`}
                checked={draft.correct === letter}
                onChange={() => change({ correct: letter as Letter })}
                className="size-5 accent-primary"
              />
            </label>
            <input
              aria-label={`Answer ${letter.toUpperCase()}`}
              name={`option-${letter}`}
              value={draft.options[i]}
              onChange={(event) =>
                change({
                  options: draft.options.map((o, n) =>
                    n === i ? event.target.value : o,
                  ) as PackageQuestion["options"],
                })
              }
              className="type-body h-[52px] min-w-0 flex-1 rounded-[14px] border border-selectable-stroke bg-card px-[var(--gutter,1rem)] text-text focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-primary"
            />
          </div>
        ))}
      </section>
      <section aria-labelledby="pq-e" className="flex flex-col gap-2">
        <h2 id="pq-e" className="type-label text-text-secondary">
          EXPLANATION
        </h2>
        <textarea
          aria-labelledby="pq-e"
          name="explanation"
          rows={3}
          value={draft.explanation}
          onChange={(event) => change({ explanation: event.target.value })}
          className={`${areaClass} min-h-24`}
        />
      </section>
      {sections.length > 0 && (
        <section aria-labelledby="pq-g" className="flex flex-col gap-3">
          <h2 id="pq-g" className="type-label text-text-secondary">
            GUIDE SECTION
          </h2>
          <fieldset
            role="radiogroup"
            aria-labelledby="pq-g"
            className="flex min-w-0 flex-col gap-2"
          >
            {sections.map((section) => (
              <SelectableRow
                key={section.section}
                name="guide-ref"
                value={String(section.section)}
                compact
                checked={draft.guideRef.trim() === String(section.section)}
                onChange={(value) => change({ guideRef: value })}
              >
                <span className="type-body-strong min-w-0 flex-1 truncate">
                  {section.section}. {section.title}
                </span>
              </SelectableRow>
            ))}
          </fieldset>
        </section>
      )}
      {draft.imageFile !== "" && (
        <section aria-labelledby="pq-alt" className="flex flex-col gap-2">
          <h2 id="pq-alt" className="type-label text-text-secondary">
            ALT TEXT OF {draft.imageFile.toUpperCase()}
          </h2>
          <input
            aria-labelledby="pq-alt"
            name="alt"
            value={draft.alt}
            onChange={(event) => change({ alt: event.target.value })}
            className="type-body h-[52px] w-full rounded-[14px] border border-selectable-stroke bg-card px-[var(--gutter,1rem)] text-text focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-primary"
          />
        </section>
      )}
      <ActionBar>
        <Button onClick={() => onSave(draft)}>Save question</Button>
        <ButtonLink href={backHref} variant="secondary">
          Cancel
        </ButtonLink>
      </ActionBar>
    </div>
  );
}
