"use client";

import { usePathname } from "next/navigation";
import { useRef, useState } from "react";
import { AnswerChoice } from "@/components/AnswerChoice/AnswerChoice";
import { ActionBar } from "@/components/ActionBar/ActionBar";
import { Button, ButtonLink } from "@/components/Button/Button";
import { FlashNotice } from "@/components/FlashNotice/FlashNotice";
import { ConfirmDialog } from "@/components/ConfirmDialog/ConfirmDialog";
import { Amber } from "@/components/InstructorContent/Amber";
import { Notice } from "@/components/Notice/Notice";
import { PackageImage } from "@/components/PackageContent/PackageParts";
import { PageHeaderBand } from "@/components/PageHeaderBand/PageHeaderBand";
import { SelectableRow } from "@/components/SelectableRow/SelectableRow";
import { TextField } from "@/components/TextField/TextField";
import { confirmed, getItem, imageProblem, setItem, withImage } from "@/lib/package-edit";
import type { ItemDraft } from "@/lib/package-edit";
import { LETTERS, checkPackage, findImage } from "@/lib/package-read";
import type {
  GuideSection,
  Issue,
  Letter,
  PackageData,
  PackageImage as Picture,
  PackageQuestion,
  ScenarioStep,
  StepItem,
} from "@/lib/package-read";
import { setFlash } from "@/lib/flash";
import { itemName, needsSentence, parseKey } from "@/lib/package-review";

const areaClass =
  "type-body w-full rounded-[14px] border border-selectable-stroke bg-card px-[var(--gutter,1rem)] py-3 text-text focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-primary";

/** Where the person is in a guided review: "1 of 11". */
export type ReviewPosition = { position: number; total: number };

function Area({
  id,
  label,
  value,
  rows = 3,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  rows?: number;
  onChange: (value: string) => void;
}) {
  return (
    <section aria-labelledby={id} className="flex flex-col gap-2">
      <h2 id={id} className="type-label text-text-secondary">
        {label}
      </h2>
      <textarea
        aria-labelledby={id}
        rows={rows}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={`${areaClass} min-h-24`}
      />
    </section>
  );
}

function AnswersBlock({
  options,
  correct,
  onChange,
}: {
  options: [string, string, string, string];
  correct: Letter | null;
  onChange: (part: { options?: [string, string, string, string]; correct?: Letter }) => void;
}) {
  return (
    <section aria-labelledby="pe-answers" className="flex flex-col gap-3">
      <h2 id="pe-answers" className="type-label text-text-secondary">
        ANSWERS · CHOOSE THE CORRECT ONE
      </h2>
      {correct && (
        <Notice variant="info" clamp={false} title="Check the correct answer">
          Option {correct.toUpperCase()} is marked as correct. Change it if that is wrong.
        </Notice>
      )}
      {LETTERS.map((letter, i) => (
        <AnswerChoice
          key={letter}
          letter={letter}
          value={options[i]}
          checked={correct === letter}
          radioLabel={`Correct answer ${letter.toUpperCase()}`}
          fieldLabel={`Answer ${letter.toUpperCase()}`}
          fieldName={`option-${letter}`}
          onValue={(value) =>
            onChange({
              options: options.map((o, n) => (n === i ? value : o)) as [
                string,
                string,
                string,
                string,
              ],
            })
          }
          onChoose={() => onChange({ correct: letter as Letter })}
        />
      ))}
    </section>
  );
}

function GuideLinkBlock({
  sections,
  value,
  auto,
  onChange,
}: {
  sections: GuideSection[];
  value: string;
  /** The section was matched automatically: ask the person to confirm it. */
  auto: boolean;
  onChange: (value: string) => void;
}) {
  if (sections.length === 0) return null;
  return (
    <section aria-labelledby="pe-guide" className="flex flex-col gap-3">
      <h2 id="pe-guide" className="type-label text-text-secondary">
        GUIDE SECTION
      </h2>
      {auto && (
        <Notice variant="info" clamp={false} title="Please confirm">
          Section {value.trim()} was matched automatically. Choose another one or confirm this one.
        </Notice>
      )}
      <fieldset
        role="radiogroup"
        aria-labelledby="pe-guide"
        className="flex min-w-0 flex-col gap-2"
      >
        {sections.map((section) => (
          <SelectableRow
            key={section.section}
            name="guide-ref"
            value={String(section.section)}
            compact
            emphasis
            checked={value.trim() === String(section.section)}
            onChange={onChange}
          >
            <span className="type-body-strong min-w-0 flex-1 truncate">
              {section.section}. {section.title}
            </span>
          </SelectableRow>
        ))}
      </fieldset>
    </section>
  );
}

/**
 * The picture of an item: "Add image" (a png, jpg or webp up to 300 KB inside the package budget,
 * kept in this browser), "Change image", "Remove image" and the image description (the alt text).
 */
function ImageBlock({
  data,
  imageFile,
  alt,
  onChange,
}: {
  data: PackageData;
  imageFile: string;
  alt: string;
  onChange: (part: {
    imageFile?: string;
    alt?: string;
    picture?: { name: string; image: Picture };
  }) => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [problem, setProblem] = useState("");
  const present = imageFile !== "" && findImage(data, imageFile) !== undefined;

  function choose(file: File | undefined) {
    if (!file) return;
    const message = imageProblem(data, file);
    setProblem(message ?? "");
    if (message) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== "string") return;
      onChange({
        imageFile: file.name,
        picture: {
          name: file.name,
          image: { data: reader.result, size: file.size },
        },
      });
    };
    reader.readAsDataURL(file);
  }

  return (
    <section aria-labelledby="pe-image" className="flex flex-col gap-3">
      <h2 id="pe-image" className="type-label text-text-secondary">
        IMAGE
      </h2>
      {present && <PackageImage data={data} file={imageFile} alt={alt} />}
      {imageFile !== "" && !present && (
        <p data-image-missing className="type-small text-text-secondary">
          {imageFile} is not in the package yet.
        </p>
      )}
      {imageFile !== "" && present && <p className="type-small text-text-secondary">{imageFile}</p>}
      <input
        ref={input}
        type="file"
        accept=".png,.jpg,.jpeg,.webp"
        aria-label="Choose an image"
        data-image-input
        className="sr-only"
        tabIndex={-1}
        onChange={(event) => {
          choose(event.target.files?.[0]);
          event.target.value = "";
        }}
      />
      <Button variant="secondary" onClick={() => input.current?.click()}>
        {present ? "Change image" : imageFile === "" ? "Add image" : "Choose image"}
      </Button>
      {imageFile !== "" && (
        <div className="-ml-3 self-start">
          <Button variant="tertiary" onClick={() => onChange({ imageFile: "", alt: "" })}>
            Remove image
          </Button>
        </div>
      )}
      {problem && <Amber>{problem}</Amber>}
      {imageFile !== "" && (
        <TextField
          label="Image description"
          name="alt"
          value={alt}
          helper="Describe the picture for people who cannot see it."
          onChange={(value) => onChange({ alt: value })}
        />
      )}
    </section>
  );
}

/**
 * The edit screen of ONE item of a demo topic, for every part (DESIGN.md: Guided review of a content
 * package): the fields of a guide section, a step, a scenario step or a question, the guide link and
 * the picture. What the checks find shows at the top and updates as the fields change. Opened from a
 * card it has Save and Cancel; in a guided review its header says "1 of N" and it has Save and next
 * (Mark as OK for an item that only needs confirming) and Skip. Saving also confirms the guide link.
 */
export function PackageItemEdit({
  data,
  itemKey,
  review,
  initialIssues,
  onSave,
  onSkip,
  onLeave,
  confirmingInitially = false,
}: {
  data: PackageData;
  itemKey: string;
  review: ReviewPosition | null;
  /** The issues of the item before editing (decides Mark as OK against Save and next). */
  initialIssues: Issue[];
  onSave: (item: ItemDraft, images: Record<string, Picture>) => void;
  onSkip: () => void;
  onLeave: () => void;
  confirmingInitially?: boolean;
}) {
  const start = getItem(data, itemKey);
  const [draft, setDraft] = useState<ItemDraft>(start ?? ({} as ItemDraft));
  const [images, setImages] = useState(data.images);
  const [confirming, setConfirming] = useState(confirmingInitially);
  const pathname = usePathname();
  const ref = parseKey(data, itemKey);
  if (!start || !ref) return null;

  const change = (part: Partial<ItemDraft>) => setDraft((d) => ({ ...d, ...part }) as ItemDraft);
  const working = setItem({ ...data, images }, itemKey, draft);
  const problems = checkPackage(working).filter(
    (issue) => issue.key === itemKey && issue.kind === "must",
  );
  const dirty = JSON.stringify(draft) !== JSON.stringify(start) || images !== data.images;
  const name = itemName(data, itemKey);
  const sections = data.guide ?? [];
  const onlyConfirm =
    initialIssues.some((issue) => issue.key === itemKey && issue.kind === "confirm") &&
    !initialIssues.some((issue) => issue.key === itemKey && issue.kind === "must");
  const picture = (part: {
    imageFile?: string;
    alt?: string;
    picture?: { name: string; image: Picture };
  }) => {
    // adding or removing a picture is confirmed on this screen
    if (part.picture) setFlash("Image added", pathname);
    else if (part.imageFile === "") setFlash("Image removed", pathname);
    if (part.picture)
      setImages(
        (current) =>
          withImage({ ...data, images: current }, part.picture!.name, part.picture!.image).images,
      );
    change({
      ...(part.imageFile !== undefined && { imageFile: part.imageFile }),
      ...(part.alt !== undefined && { alt: part.alt }),
    });
  };
  const image = (d: { imageFile: string; alt: string }) => (
    <ImageBlock data={{ ...data, images }} imageFile={d.imageFile} alt={d.alt} onChange={picture} />
  );
  const auto = (draft as { refAuto?: boolean }).refAuto === true;
  const needs = needsSentence(problems);

  return (
    <div className="flex flex-col gap-6 pb-4">
      <PageHeaderBand
        title={name}
        subtitle={review ? `Item ${review.position} of ${review.total}` : undefined}
        back={{
          label: review ? "Leave the review" : "Back to topic",
          onClick: () => (dirty ? setConfirming(true) : onLeave()),
        }}
      />
      <FlashNotice />
      {problems.length > 0 && (
        <div data-problems>
          <Notice variant="to-fix" clamp={false} title={`${problems.length} to fix in this item`}>
            <ul className="flex flex-col gap-0.5">
              {problems.map((issue) => (
                <li key={issue.id}>{issue.reason}</li>
              ))}
            </ul>
          </Notice>
        </div>
      )}

      {ref.part === "guide" && (
        <>
          <TextField
            label="Title"
            name="title"
            value={(draft as GuideSection).title}
            onChange={(value) => change({ title: value })}
          />
          <Area
            id="pe-text"
            label="TEXT"
            rows={6}
            value={(draft as GuideSection).text}
            onChange={(value) => change({ text: value })}
          />
          {image(draft as GuideSection)}
        </>
      )}

      {ref.part === "steps" && (
        <>
          <TextField
            label="Action"
            name="action"
            value={(draft as StepItem).action}
            onChange={(value) => change({ action: value })}
          />
          <Area
            id="pe-detail"
            label="DETAIL"
            value={(draft as StepItem).detail}
            onChange={(value) => change({ detail: value })}
          />
          <GuideLinkBlock
            sections={sections}
            value={(draft as StepItem).guideRef}
            auto={auto}
            onChange={(value) => change({ guideRef: value })}
          />
          {image(draft as StepItem)}
        </>
      )}

      {ref.part === "scenario" && (
        <>
          <Area
            id="pe-situation"
            label="SITUATION"
            value={(draft as ScenarioStep).situation}
            onChange={(value) => change({ situation: value })}
          />
          <Area
            id="pe-question"
            label="QUESTION"
            value={(draft as ScenarioStep).question}
            onChange={(value) => change({ question: value })}
          />
          <AnswersBlock
            options={(draft as ScenarioStep).options}
            correct={(draft as ScenarioStep).correct}
            onChange={(part) => change(part)}
          />
          <Area
            id="pe-why"
            label="WHY"
            value={(draft as ScenarioStep).why}
            onChange={(value) => change({ why: value })}
          />
          <GuideLinkBlock
            sections={sections}
            value={(draft as ScenarioStep).guideRef}
            auto={auto}
            onChange={(value) => change({ guideRef: value })}
          />
          {image(draft as ScenarioStep)}
        </>
      )}

      {ref.part === "questions" && (
        <>
          <Area
            id="pe-q"
            label="QUESTION"
            value={(draft as PackageQuestion).text}
            onChange={(value) => change({ text: value })}
          />
          <AnswersBlock
            options={(draft as PackageQuestion).options}
            correct={(draft as PackageQuestion).correct}
            onChange={(part) => change(part)}
          />
          <Area
            id="pe-e"
            label="EXPLANATION"
            value={(draft as PackageQuestion).explanation}
            onChange={(value) => change({ explanation: value })}
          />
          <GuideLinkBlock
            sections={sections}
            value={(draft as PackageQuestion).guideRef}
            auto={auto}
            onChange={(value) => change({ guideRef: value })}
          />
          {image(draft as PackageQuestion)}
        </>
      )}

      <ActionBar>
        {review ? (
          <>
            {needs && (
              <p data-needs role="status" className="type-small text-center text-text-secondary">
                {needs}
              </p>
            )}
            <Button disabled={needs !== ""} onClick={() => onSave(confirmed(draft), images)}>
              {onlyConfirm ? "Mark as OK" : "Save and next"}
            </Button>
            <Button variant="secondary" onClick={onSkip}>
              Skip
            </Button>
          </>
        ) : (
          <>
            <Button onClick={() => onSave(confirmed(draft), images)}>Save</Button>
            <Button variant="secondary" onClick={() => (dirty ? setConfirming(true) : onLeave())}>
              Cancel
            </Button>
          </>
        )}
      </ActionBar>

      <ConfirmDialog
        open={confirming}
        title="Discard your changes?"
        description="What you changed on this screen will be lost."
        confirmLabel="Discard"
        cancelLabel="Keep editing"
        onConfirm={() => {
          setConfirming(false);
          onLeave();
        }}
        onCancel={() => setConfirming(false)}
      />
    </div>
  );
}

/**
 * A review step for a problem with a whole part (section numbers that are not consecutive, more than
 * ten steps): there is no item to edit, so the reason is shown with Replace document and Skip.
 */
export function PackagePartStep({
  title,
  review,
  reasons,
  replaceHref,
  onSkip,
  onLeave,
}: {
  title: string;
  review: ReviewPosition | null;
  reasons: string[];
  replaceHref: string;
  onSkip: () => void;
  onLeave: () => void;
}) {
  return (
    <div className="flex flex-col gap-6 pb-4">
      <PageHeaderBand
        title={title}
        subtitle={review ? `Item ${review.position} of ${review.total}` : undefined}
        back={{ label: "Leave the review", onClick: onLeave }}
      />
      <Notice variant="to-fix" clamp={false} title="This is fixed in your files">
        <ul className="flex flex-col gap-0.5">
          {reasons.map((reason) => (
            <li key={reason}>{reason}</li>
          ))}
        </ul>
      </Notice>
      <ActionBar>
        <ButtonLink href={replaceHref}>Replace document</ButtonLink>
        <Button variant="secondary" onClick={onSkip}>
          Skip
        </Button>
      </ActionBar>
    </div>
  );
}
