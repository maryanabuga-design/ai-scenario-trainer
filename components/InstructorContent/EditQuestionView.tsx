"use client";

import { ImagePlus } from "lucide-react";
import { useId, useRef, useState } from "react";
import { ActionBar } from "@/components/ActionBar/ActionBar";
import { Button } from "@/components/Button/Button";
import { ConfirmDialog } from "@/components/ConfirmDialog/ConfirmDialog";
import { Amber } from "@/components/InstructorContent/Amber";
import { PageHeaderBand } from "@/components/PageHeaderBand/PageHeaderBand";
import { SelectableRow } from "@/components/SelectableRow/SelectableRow";
import { TextField } from "@/components/TextField/TextField";
import {
  LETTERS,
  MAX_IMAGE_BYTES,
  MAX_OPTION_CHARS,
  MAX_QUESTION_CHARS,
  problemsOf,
  sizeText,
} from "@/lib/content-import";
import type { ImportedQuestion, Letter } from "@/lib/content-import";
import type { ContentSet } from "@/lib/content-sets";
import { imageFits } from "@/lib/content-sets";

export const IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp"];
export const IMAGE_PROBLEM = `Choose a png, jpg or webp picture up to ${sizeText(MAX_IMAGE_BYTES)}.`;

const areaClass =
  "type-body w-full rounded-[14px] border border-selectable-stroke bg-card px-[var(--gutter,1rem)] py-3 text-text focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-primary";

/** A picture file as a data URL, or null when it is not one of the three types or too big. */
export function readImage(file: File): Promise<string | null> {
  if (!IMAGE_TYPES.includes(file.type) || file.size > MAX_IMAGE_BYTES) return Promise.resolve(null);
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : null);
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(file);
  });
}

/**
 * Edit question (DESIGN.md: Instructor, Content): ONE scrolling form: the question (300 characters),
 * four answers with a single-select circle for the correct one, the explanation, an optional guide
 * reference and an optional picture with its alt text. What the reader found shows as an amber line
 * at the top and next to its field, and updates as the fields change. Pinned: Primary "Save
 * question" and Secondary "Delete question" (a dialog).
 */
export function EditQuestionView({
  set,
  index,
  topicTitle,
  onSave,
  onDelete,
  confirmingInitially = false,
  dialogInline = false,
}: {
  set: ContentSet;
  /** 0-based position of the question in the set. */
  index: number;
  topicTitle: string;
  onSave: (question: ImportedQuestion) => void;
  onDelete: () => void;
  confirmingInitially?: boolean;
  dialogInline?: boolean;
}) {
  const [draft, setDraft] = useState<ImportedQuestion>(set.questions[index]);
  const [confirming, setConfirming] = useState(confirmingInitially);
  const [imageProblem, setImageProblem] = useState("");
  const input = useRef<HTMLInputElement>(null);
  const id = useId();
  const others = set.questions.map((q, i) => (i === index ? draft : q));
  const problems = problemsOf(draft, others);
  const has = (needle: string) => problems.some((p) => p.includes(needle));

  const change = (part: Partial<ImportedQuestion>) => setDraft((d) => ({ ...d, ...part }));
  const setOption = (i: number, value: string) =>
    change({
      options: draft.options.map((o, n) => (n === i ? value : o)) as ImportedQuestion["options"],
    });

  async function chooseImage(file: File | undefined) {
    if (!file) return;
    const data = await readImage(file);
    if (input.current) input.current.value = "";
    if (data === null) return setImageProblem(IMAGE_PROBLEM);
    setImageProblem("");
    change({ image: { data, alt: draft.image?.alt ?? "" } });
  }

  const problemFor = (needles: string[]) =>
    problems.find((p) => needles.some((n) => p.includes(n)));

  return (
    <div className="flex flex-col gap-6 pb-4">
      <PageHeaderBand
        title={`Question ${index + 1}`}
        subtitle={`${set.title} · ${set.topic} ${topicTitle}`}
        back={{ label: "Back to Review", href: `/instructor/content/${set.id}` }}
      />

      {problems.length > 0 && (
        <div data-problems className="flex flex-col gap-1">
          {problems.map((problem) => (
            <Amber key={problem}>{problem}</Amber>
          ))}
        </div>
      )}

      <section aria-labelledby={`${id}-q`} className="flex flex-col gap-2">
        <h2 id={`${id}-q`} className="type-label text-text-secondary">
          QUESTION
        </h2>
        <textarea
          aria-labelledby={`${id}-q`}
          name="question"
          rows={4}
          value={draft.text}
          onChange={(event) => change({ text: event.target.value })}
          className={`${areaClass} min-h-28`}
        />
        <p data-counter className="type-small text-text-secondary tabular-nums">
          {draft.text.length} of {MAX_QUESTION_CHARS}
        </p>
        {problemFor(["question text", "Question is longer", "Duplicate"]) && (
          <Amber>{problemFor(["question text", "Question is longer", "Duplicate"])}</Amber>
        )}
      </section>

      <section aria-labelledby={`${id}-a`} className="flex flex-col gap-3">
        <h2 id={`${id}-a`} className="type-label text-text-secondary">
          ANSWERS
        </h2>
        <p className="type-small text-text-secondary">
          Fill in 2 to 4 answers and tick the correct one. Up to {MAX_OPTION_CHARS} characters each.
        </p>
        <fieldset role="radiogroup" aria-labelledby={`${id}-a`} className="flex flex-col gap-2">
          {LETTERS.map((letter, i) => (
            <div key={letter} className="flex items-center gap-3">
              <span
                aria-hidden="true"
                className="type-caption flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-olive-tint text-text"
              >
                {letter.toUpperCase()}
              </span>
              <input
                aria-label={`Answer ${letter.toUpperCase()}`}
                name={`answer-${letter}`}
                value={draft.options[i]}
                onChange={(event) => setOption(i, event.target.value)}
                className="type-body h-[52px] min-w-0 flex-1 rounded-[14px] border border-selectable-stroke bg-card px-[var(--gutter,1rem)] text-text focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-primary"
              />
              <label
                data-correct={letter}
                className="flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-accent"
              >
                <input
                  type="radio"
                  name="correct"
                  value={letter}
                  checked={draft.correct === letter}
                  onChange={() => change({ correct: letter as Letter })}
                  aria-label={`Correct answer: ${letter.toUpperCase()}`}
                  className="sr-only"
                />
                <span
                  aria-hidden="true"
                  className="flex h-5 w-5 items-center justify-center rounded-full border border-primary"
                >
                  {draft.correct === letter && (
                    <span className="h-2.5 w-2.5 rounded-full bg-primary" />
                  )}
                </span>
              </label>
            </div>
          ))}
        </fieldset>
        {problemFor(["answers", "Correct answer", "correct answer", "An answer"]) && (
          <Amber>{problemFor(["answers", "Correct answer", "correct answer", "An answer"])}</Amber>
        )}
      </section>

      <section aria-labelledby={`${id}-e`} className="flex flex-col gap-2">
        <h2 id={`${id}-e`} className="type-label text-text-secondary">
          EXPLANATION
        </h2>
        <textarea
          aria-labelledby={`${id}-e`}
          name="explanation"
          rows={3}
          value={draft.explanation}
          onChange={(event) => change({ explanation: event.target.value })}
          className={`${areaClass} min-h-24`}
        />
        {has("explanation") && <Amber>No explanation</Amber>}
      </section>

      <section aria-labelledby={`${id}-g`} className="flex flex-col gap-2">
        <h2 id={`${id}-g`} className="type-label text-text-secondary">
          GUIDE REFERENCE (OPTIONAL)
        </h2>
        <fieldset role="radiogroup" aria-labelledby={`${id}-g`} className="flex flex-col gap-2">
          {[
            { value: "", label: "None" },
            { value: set.topic, label: `${set.topic} ${topicTitle}` },
          ].map((option) => (
            <SelectableRow
              key={option.value || "none"}
              name="guide-ref"
              value={option.value}
              compact
              checked={draft.guideRef === option.value}
              onChange={(value) => change({ guideRef: value })}
            >
              <span className="type-body-strong min-w-0 flex-1 truncate">{option.label}</span>
            </SelectableRow>
          ))}
        </fieldset>
      </section>

      <section aria-labelledby={`${id}-i`} className="flex flex-col gap-3">
        <h2 id={`${id}-i`} className="type-label text-text-secondary">
          IMAGE (OPTIONAL)
        </h2>
        <input
          ref={input}
          type="file"
          accept=".png,.jpg,.jpeg,.webp"
          aria-label="Add image"
          data-image-input
          className="sr-only"
          tabIndex={-1}
          onChange={(event) => void chooseImage(event.target.files?.[0])}
        />
        {draft.image ? (
          <div className="flex flex-col gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element -- a data URL from this device, not a file of the app */}
            <img
              data-image-preview
              src={draft.image.data}
              alt={draft.image.alt}
              className="max-h-48 w-full rounded-[16px] object-contain"
            />
            <TextField
              label="Alt text (a short description)"
              name="alt"
              value={draft.image.alt}
              onChange={(alt) => change({ image: { data: draft.image!.data, alt } })}
            />
            {has("alt text") && <Amber>Image has no alt text</Amber>}
            <Button variant="secondary" onClick={() => change({ image: undefined })}>
              Remove image
            </Button>
          </div>
        ) : (
          <Button variant="secondary" icon={ImagePlus} onClick={() => input.current?.click()}>
            Add image
          </Button>
        )}
        {imageProblem && <Amber>{imageProblem}</Amber>}
        {draft.imageUrl && (
          <p className="type-small text-text-secondary">
            The file named an image address. It is kept as text and is not loaded.
          </p>
        )}
      </section>

      <ActionBar>
        <Button
          onClick={() => {
            if (draft.image && !imageFits(draft.image.data)) return setImageProblem(IMAGE_PROBLEM);
            onSave(draft);
          }}
        >
          Save question
        </Button>
        <Button variant="secondary" onClick={() => setConfirming(true)}>
          Delete question
        </Button>
      </ActionBar>

      {(confirming || !dialogInline) && (
        <ConfirmDialog
          open={confirming}
          inline={dialogInline}
          title="Delete this question?"
          description="The question is removed from this set. This cannot be undone."
          confirmLabel="Delete question"
          cancelLabel="Keep question"
          onConfirm={onDelete}
          onCancel={() => setConfirming(false)}
        />
      )}
    </div>
  );
}
