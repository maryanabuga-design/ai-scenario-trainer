"use client";

import { Eye } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ButtonLink, Button } from "@/components/Button/Button";
import { PackageImage, GuidePill } from "@/components/PackageContent/PackageParts";
import { QuestionScreen } from "@/components/QuestionScreen/QuestionScreen";
import { ReadingView } from "@/components/ReadingView/ReadingView";
import { ResultsView } from "@/components/ResultsView/ResultsView";
import { SessionBar } from "@/components/SessionBar/SessionBar";
import { SessionTopBar } from "@/components/SessionTopBar/SessionTopBar";
import { stripStates } from "@/components/StepStrip/StepStrip";
import { StepsTopicView } from "@/components/StepsView/StepsTopic";
import { initialOpen, toggleOpen } from "@/lib/accordion";
import { partsOf } from "@/lib/package-read";
import type { PackageData } from "@/lib/package-read";
import { demoItems, demoMinutes, demoStepGuide, stepExtras } from "@/lib/package-student";
import type { PracticePart } from "@/lib/package-student";
import { scoreItem } from "@/lib/scoring";

/** The screens a demo topic has for a student, and for the Instructor's preview of them. */
export type StudentPart = "guide" | "steps" | "scenario" | "quiz" | "practise";

export const isStudentPart = (value: string): value is Exclude<StudentPart, "guide"> =>
  value === "steps" || value === "scenario" || value === "quiz" || value === "practise";

/** The tabs of the topic screen the preview can come from; the preview returns to the same one. */
const FROM_TABS = ["guide", "steps", "scenario", "quiz"];
export const fromTab = (value: string | null | undefined): string =>
  value && FROM_TABS.includes(value) ? value : "guide";

/** The routes of a demo topic: the student's, or the preview of them (the same pages, one flag). */
export function packagePaths(id: string, preview: boolean, from = "guide") {
  const base = preview ? `/instructor/content/package/${id}/preview` : `/materials/package/${id}`;
  // the preview carries the tab it came from, so a reload and the way back keep working
  const q = preview ? `?from=${from}` : "";
  return {
    reading: `${base}${q}`,
    steps: `${base}/steps${q}`,
    practise: `${base}/practise${q}`,
    guideSection: (section: string) => `${base}${q}#section-${section}`,
    /** Where Back and Exit go: Materials for a student, the topic screen (same tab) for the Instructor. */
    leave: preview ? `/instructor/content/package/${id}?tab=${from}` : "/materials",
  };
}

/**
 * The preview card (DESIGN.md: Instructor content flow polish): one compact white card at the top of
 * the student screen content: an eye in a sand tile, "Previewing as student" and the tertiary link
 * "Exit preview". It has no nested blocks so it can be taken out of the page as one piece.
 */
export function PreviewBar({ exitHref }: { exitHref: string }) {
  return (
    <div
      data-preview-bar
      className="mb-4 flex min-h-14 items-center gap-3 rounded-[14px] border border-selectable-stroke bg-card px-3 py-1"
    >
      <span
        aria-hidden="true"
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-secondary-sand text-text-secondary"
      >
        <Eye size={18} strokeWidth={2} />
      </span>
      <p className="type-small-strong min-w-0 flex-1 whitespace-nowrap">Previewing as student</p>
      <span className="-mr-2 shrink-0">
        <ButtonLink href={exitHref} variant="tertiary" wide={false}>
          Exit preview
        </ButtonLink>
      </span>
    </div>
  );
}

/** The guide as the reading screen's body: headings, text and pictures in the built-in text styles. */
function GuideBody({ data }: { data: PackageData }) {
  return (
    <div className="flex flex-col gap-3">
      {(data.guide ?? []).map((section, index) => (
        <div
          key={index}
          id={`section-${section.section}`}
          className="flex scroll-mt-20 flex-col gap-3"
        >
          <h2 className="type-card-title mt-3 first:mt-0">{section.title}</h2>
          <PackageImage data={data} file={section.imageFile} alt={section.alt} />
          <p className="type-body whitespace-pre-line">{section.text}</p>
        </div>
      ))}
    </div>
  );
}

function Reading({
  id,
  title,
  data,
  preview,
  from,
}: {
  id: string;
  title: string;
  data: PackageData;
  preview: boolean;
  from: string;
}) {
  const router = useRouter();
  const paths = packagePaths(id, preview, from);
  const minutes = demoMinutes(data);
  const hasSteps = partsOf(data).includes("steps");
  const canPractise = demoItems(data, "practise").length > 0;
  return (
    <ReadingView
      key={id}
      topic={{
        id,
        title,
        guideTitle: "From your instructor",
        minutes,
        body: "",
        canPractise,
        stepsHref: hasSteps ? paths.steps : null,
        position: 1,
        total: 1,
        previous: null,
        next: null,
        demo: {
          label: "From your instructor",
          meta: `From your instructor · ${minutes} min read`,
          content: <GuideBody data={data} />,
          onPractise: () => router.push(paths.practise),
          onBack: () => router.push(paths.leave),
        },
      }}
    />
  );
}

function StepGuide({
  id,
  title,
  data,
  preview,
  from,
}: {
  id: string;
  title: string;
  data: PackageData;
  preview: boolean;
  from: string;
}) {
  const router = useRouter();
  const paths = packagePaths(id, preview, from);
  const guide = demoStepGuide(data, title);
  const [open, setOpen] = useState<string | null>(() =>
    initialOpen((guide?.steps ?? []).map((step) => step.id)),
  );
  if (!guide) return null;
  const extras = stepExtras(data);
  return (
    <StepsTopicView
      checklist={guide}
      open={open}
      onBack={() => router.push(preview ? paths.leave : paths.reading)}
      onToggleOpen={(stepId) => setOpen((current) => toggleOpen(current, stepId))}
      footerFor={(_, index) => {
        const extra = extras[index];
        if (!extra || (extra.imageFile === "" && extra.guideRef === "")) return null;
        return (
          <div className="flex flex-col items-start gap-3">
            <PackageImage data={data} file={extra.imageFile} alt={extra.alt} />
            {extra.guideRef !== "" && (
              <GuidePill section={extra.guideRef} href={paths.guideSection(extra.guideRef)} />
            )}
          </div>
        );
      }}
    />
  );
}

/**
 * The practice of a demo topic in the shared question screens: the top bar with the step strip, the
 * question with Check and Why, then the shared Results. The answers live in this component only:
 * nothing is saved (no session, history, progress or bookmark), and Try again starts over.
 */
export function PackagePlayer({
  id,
  data,
  part,
  preview,
  from = "guide",
}: {
  id: string;
  data: PackageData;
  part: PracticePart;
  preview: boolean;
  from?: string;
}) {
  const router = useRouter();
  const paths = packagePaths(id, preview, from);
  const items = demoItems(data, part);
  const [round, setRound] = useState(0);
  const [index, setIndex] = useState(0);
  const [choices, setChoices] = useState<Record<number, { id: string; checked: boolean }>>({});
  const [finished, setFinished] = useState(false);

  if (items.length === 0) return null;
  // the preview goes back to the topic screen on the same tab, the student to the reading screen
  const topicHref = preview ? paths.leave : paths.reading;
  if (finished) {
    const scored = items.map((item, i) => scoreItem(item, choices[i]?.id ?? ""));
    return (
      <ResultsView
        key={round}
        kind={part === "quiz" ? "quiz" : "scenario"}
        items={scored}
        topics={[]}
        backHref={topicHref}
        backLabel="Back to topic"
        onRepeat={() => undefined}
        actions={
          <>
            <ButtonLink href={topicHref}>Done</ButtonLink>
            <Button
              variant="secondary"
              onClick={() => {
                setChoices({});
                setIndex(0);
                setFinished(false);
                setRound((n) => n + 1);
              }}
            >
              Try again
            </Button>
          </>
        }
      />
    );
  }

  const item = items[index];
  const choice = choices[index]?.id ?? null;
  const checked = choices[index]?.checked === true;
  const last = index === items.length - 1;
  const answered = items.map((_, i) => choices[i]?.checked === true);
  const unit = part === "scenario" ? "Step" : "Question";
  const jump = (position: number) => {
    setIndex(position);
    window.scrollTo(0, 0);
  };
  return (
    <div className="flex flex-col gap-4 pb-4">
      <SessionTopBar
        index={index}
        total={items.length}
        unit={unit}
        states={stripStates(answered, index)}
        onJump={jump}
        onBack={() => jump(index - 1)}
        onLeave={() => router.push(topicHref)}
        leave={{ title: "Leave this practice?", description: "Your answers are not saved." }}
      />
      <QuestionScreen
        key={item.id}
        item={item}
        choice={choice}
        onChoose={(optionId) =>
          setChoices((current) => ({ ...current, [index]: { id: optionId, checked: false } }))
        }
        mode="training"
        checked={checked}
        saved={false}
        onToggleSaved={() => undefined}
        bookmark={false}
        hint={null}
      />
      <SessionBar
        label={checked ? (last ? "Finish" : "Next") : "Check"}
        last={last}
        disabled={choice === null}
        onNext={() => {
          if (!checked) {
            setChoices((current) => ({ ...current, [index]: { id: choice ?? "", checked: true } }));
            return;
          }
          if (last) setFinished(true);
          else jump(index + 1);
        }}
      />
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

/**
 * ONE screen for the Student and for Preview as student: the same page components, and the preview
 * flag only adds the slim bar and changes where Back and Exit go (DESIGN.md: Content package review).
 */
export function PackageStudentScreen({
  id,
  title,
  data,
  part,
  preview = false,
  from = "guide",
}: {
  id: string;
  title: string;
  data: PackageData;
  part: StudentPart;
  preview?: boolean;
  /** The tab of the topic screen the preview came from. */
  from?: string;
}) {
  const paths = packagePaths(id, preview, from);
  return (
    <div className="flex flex-1 flex-col">
      {preview && <PreviewBar exitHref={paths.leave} />}
      {part === "guide" && (
        // the reading header tucks into the page's top padding: the preview bar needs it back
        <div className={preview ? "flex flex-1 flex-col pt-6" : "flex flex-1 flex-col"}>
          <Reading id={id} title={title} data={data} preview={preview} from={from} />
        </div>
      )}
      {part === "steps" && (
        <StepGuide id={id} title={title} data={data} preview={preview} from={from} />
      )}
      {(part === "scenario" || part === "quiz" || part === "practise") && (
        <PackagePlayer key={part} id={id} data={data} part={part} preview={preview} from={from} />
      )}
    </div>
  );
}
