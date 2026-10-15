"use client";

import { Tag } from "@/components/Tag/Tag";
import { StatusChip } from "@/components/StatusChip/StatusChip";
import { GuideChip } from "@/components/GuideChip/GuideChip";
import { Chip } from "@/components/Chip/Chip";
import { FileText, History, ListChecks, Sparkles } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { QuestionScreen } from "@/components/QuestionScreen/QuestionScreen";
import { Media3D } from "@/components/Media3D/Media3D";
import { Toggle } from "@/components/Toggle/Toggle";
import { AnswerReview } from "@/components/AnswerReview/AnswerReview";
import { SessionBar } from "@/components/SessionBar/SessionBar";
import { ConfirmDialog } from "@/components/ConfirmDialog/ConfirmDialog";
import { ExamIntroView } from "@/components/ExamIntroView/ExamIntroView";
import { ExamTimer } from "@/components/ExamTimer/ExamTimer";
import { SessionTopBar } from "@/components/SessionTopBar/SessionTopBar";
import { stripStates } from "@/components/StepStrip/StepStrip";
import { AskAiProvider } from "@/components/AskAi/AskAi";
import type { ChatMessage } from "@/components/AskAi/AskAi";
import { ButtonPreview } from "@/components/Button/Button";
import { EmptyState } from "@/components/EmptyState/EmptyState";
import { HomeView } from "@/components/HomeView/HomeView";
import { TopicTile } from "@/components/TopicTile/TopicTile";
import { ReviewQuestion } from "@/components/ReviewQuestion/ReviewQuestion";
import { SavedView } from "@/components/SavedView/SavedView";
import { WeakTopicsView } from "@/components/WeakTopicsView/WeakTopicsView";
import { initialChoice, TrainingCreate } from "@/components/TrainingCreate/TrainingCreate";
import {
  generationSteps,
  TrainingGenerating,
} from "@/components/TrainingGenerating/TrainingGenerating";
import { TrainingReview } from "@/components/TrainingReview/TrainingReview";
import { MaterialView } from "@/components/MaterialView/MaterialView";
import type { Material } from "@/lib/materials";
import { MaterialsList } from "@/components/MaterialsList/MaterialsList";
import { UploadPanel } from "@/components/UploadSheet/UploadSheet";
import type { Stage } from "@/components/UploadSheet/UploadSheet";
import { OnboardingView } from "@/components/OnboardingView/OnboardingView";
import { ProfileView } from "@/components/ProfileView/ProfileView";
import { nextStep, previousStep } from "@/lib/onboarding";
import type { OnboardingStep } from "@/lib/onboarding";
import { ProgressView } from "@/components/ProgressView/ProgressView";
import { ResultsActions, ResultsView } from "@/components/ResultsView/ResultsView";
import { notCoveredId, replyToChip } from "@/lib/chat";
import { getItem, hintFor } from "@/lib/items";
import { MiniQuizView } from "@/components/MiniQuizView/MiniQuizView";
import { fitAmount, miniQuizPool, miniQuizSections } from "@/lib/mini-quiz";
import { TrainingView } from "@/components/TrainingView/TrainingView";
import type { TrainingTopic } from "@/components/TrainingView/TrainingView";
import {
  modeStats,
  partState,
  recommendedPart,
  weakCount,
  withPartResult,
} from "@/lib/part-progress";
import type { PartRecords } from "@/lib/part-progress";
import { partsFor, sectionsWithParts } from "@/lib/parts";
import type { TrainingMode } from "@/lib/parts";
import { useSourceSheet } from "@/components/SourceSheet/SourceSheet";
import { defaultDirection } from "@/lib/directions";
import { sampleMaterials } from "@/lib/materials";
import { materialFromSample, sampleFiles } from "@/lib/training";
import { currentWeakItems, scoreItem } from "@/lib/scoring";
import type { FinishedSession, Session } from "@/lib/session";
import { topicIcon, weakTopics } from "@/lib/weak-topics";
import { homeCounts, homeSummary, readiness } from "@/lib/home";
import { DEMO_USER } from "@/lib/user";

/**
 * The Training screen: empty, or with some progress (the first part of a topic done, one passed,
 * and wrong answers in two topics).
 */
export function TrainingSample({
  mode = "scenario",
  progress = false,
}: {
  mode?: TrainingMode;
  progress?: boolean;
}) {
  const { sections } = useSourceSheet();
  const [current, setCurrent] = useState<TrainingMode>(mode);
  const parts = partsFor(current);
  const done = progress ? sampleDone(current) : { history: [], records: null };
  const unfinished: Session | null = null;
  const topics: TrainingTopic[] = sectionsWithParts(current).map((sectionId) => {
    const own = parts.filter((part) => part.sectionId === sectionId);
    const next = recommendedPart(own, done.records, unfinished);
    return {
      sectionId,
      title: sections.find((section) => section.id === sectionId)?.title ?? sectionId,
      toRepeat: weakCount(done.history, current, sectionId),
      parts: own.map((part) => ({
        part,
        state: partState(part, done.records, unfinished),
        recommended: next?.id === part.id,
      })),
    };
  });
  return (
    <TrainingView
      guideName="Sample evacuation guide.pdf"
      mode={current}
      onModeChange={setCurrent}
      stats={modeStats(done.history, current)}
      topics={topics}
      records={done.records}
      onStartPart={() => undefined}
    />
  );
}

/** Finished part sessions for the sample Training screen: the first part of S1 passed, one of S2 not. */
function sampleDone(mode: TrainingMode) {
  const parts = partsFor(mode);
  const wrongOf = (id: string) => {
    const item = getItem(id);
    return item.options.find((option) => option.id !== item.correctOptionId)!.id;
  };
  const sessions: FinishedSession[] = [];
  let records: PartRecords | null = null;
  parts
    .filter((part) => part.n === 1 && ["S1", "S2", "S4"].includes(part.sectionId))
    .forEach((part, index) => {
      const answers = part.itemIds.map((itemId, position) => ({
        itemId,
        optionId:
          part.sectionId === "S1" || position % 2 === 0
            ? getItem(itemId).correctOptionId
            : wrongOf(itemId),
      }));
      const finished: FinishedSession = {
        kind: mode,
        itemIds: part.itemIds,
        answers,
        partId: part.id,
        finishedAt: 1 + index,
      };
      sessions.push(finished);
      records = withPartResult(records, { partId: part.id, answers });
    });
  return { history: sessions, records };
}

/** One question screen with the top row, the step strip and the Next bar. */
export function SessionSample({
  itemId = "s1",
  index = 0,
  total = 10,
  answered = [],
  choice = null,
  kind = "scenario",
  hintOpen = false,
  startSaved = false,
  examSeconds,
}: {
  itemId?: string;
  index?: number;
  total?: number;
  /** Positions already answered, for the strip. */
  answered?: number[];
  choice?: string | null;
  kind?: "scenario" | "quiz";
  /** Start with the hint card open. */
  hintOpen?: boolean;
  startSaved?: boolean;
  /** The exam: seconds left on the timer; no hint button. */
  examSeconds?: number;
}) {
  const { sections } = useSourceSheet();
  const item = getItem(itemId);
  const hint =
    examSeconds === undefined
      ? hintFor(item, (id) => sections.find((section) => section.id === id)?.title)
      : null;
  const [open, setOpen] = useState(hintOpen);
  const [saved, setSaved] = useState(startSaved);
  const [picked, setPicked] = useState<string | null>(choice);
  const endRef = useScrollFrameToEnd(choice !== null || hintOpen);
  const flags = Array.from({ length: total }, (_, position) => answered.includes(position));
  return (
    <>
      <div className="flex flex-col gap-4">
        <SessionTopBar
          index={index}
          total={total}
          unit={kind === "scenario" ? "Step" : "Question"}
          states={stripStates(flags, index)}
          onJump={() => undefined}
          onBack={() => undefined}
          onLeave={() => undefined}
          trailing={examSeconds === undefined ? undefined : <ExamTimer seconds={examSeconds} />}
        />
        <QuestionScreen
          item={item}
          choice={picked}
          onChoose={setPicked}
          saved={saved}
          onToggleSaved={() => setSaved(!saved)}
          hint={open ? hint : null}
        />
      </div>
      <div ref={endRef} />
      <SessionBar
        last={index === total - 1}
        disabled={picked === null}
        hint={hint ? { open, onToggle: () => setOpen(!open) } : undefined}
        onNext={() => undefined}
      />
    </>
  );
}

function useScrollFrameToEnd(enabled: boolean) {
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!enabled) return;
    // Wait for fonts and layout so the frame scrolls to its real end.
    const timer = setTimeout(() => {
      const frame = endRef.current?.closest("[data-frame-scroll]");
      if (frame) frame.scrollTop = frame.scrollHeight;
    }, 500);
    return () => clearTimeout(timer);
  }, [enabled]);
  return endRef;
}

/** The Answer review of one question, with the person's choice (a wrong or the right option). */
export function AnswerReviewSample({
  itemId,
  choice,
  position = 1,
  total = 10,
}: {
  itemId: string;
  choice: string;
  position?: number;
  total?: number;
}) {
  return (
    <AnswerReview
      item={getItem(itemId)}
      choice={choice}
      position={position}
      total={total}
      backHref="#results"
      backLabel="Back to results"
      hrefFor={() => "#review"}
      marks={sampleAnswers.map((item) => (item.correct ? "correct" : "incorrect"))}
      onJump={() => undefined}
      saved={false}
      onToggleSaved={() => undefined}
    />
  );
}

const pick = (id: string, optionId: string) => scoreItem(getItem(id), optionId);

/** Six answers in one session: three wrong, so the result is "Not passed yet". */
const sampleAnswers = [
  pick("s1", "d"),
  pick("s2", "c"),
  pick("s3", "a"),
  pick("s4", "a"),
  pick("s5", "a"),
  pick("s6", "c"),
];

const floodAnswers = [pick("flood-s1", "c"), pick("flood-s2", "a"), pick("flood-s3", "b")];

/** Results for the sample session; the passed variant has a single wrong answer (83%). */
export function ResultsSample({
  scrolled = false,
  passed = false,
}: {
  scrolled?: boolean;
  passed?: boolean;
}) {
  const endRef = useScrollFrameToEnd(scrolled);
  const items = passed ? passedAnswers : sampleAnswers;
  return (
    <>
      <ResultsView
        kind="scenario"
        items={items}
        topics={weakTopics(currentWeakItems(items))}
        onRepeat={() => undefined}
      />
      <div ref={endRef} />
    </>
  );
}

const passedAnswers = [
  pick("s1", "b"),
  pick("s2", "c"),
  pick("s3", "a"),
  pick("s4", "d"),
  pick("s5", "a"),
  pick("s6", "c"),
];

/** Home in its four states, with fake data and a fixed date. */
export function HomeSample({
  state = "first",
}: {
  state?: "first" | "continue" | "weak" | "goal";
}) {
  const now = new Date(2026, 9, 17, 15, 0);
  const right = (ids: string[]) =>
    ids.map((id) => ({ itemId: id, optionId: getItem(id).correctOptionId }));
  const done = (ids: string[], kind: "quiz" | "scenario" = "quiz"): FinishedSession => ({
    kind,
    itemIds: ids,
    answers: right(ids),
    finishedAt: now.getTime(),
  });
  const wrongStep = getItem("q-s1-1");
  const history: FinishedSession[] =
    state === "first"
      ? []
      : state === "goal"
        ? [done(["q-s1-1", "q-s1-2", "q-s1-3", "q-s1-4", "q-s2-1"])]
        : [
            {
              kind: "quiz",
              itemIds: ["q-s1-1", "q-s2-1", "q-s2-2"],
              answers: [
                {
                  itemId: "q-s1-1",
                  optionId: wrongStep.options.find((o) => o.id !== wrongStep.correctOptionId)!.id,
                },
                ...right(["q-s2-1", "q-s2-2"]),
              ],
              finishedAt: now.getTime(),
            },
          ];
  const unfinished: Session | null =
    state === "continue"
      ? {
          kind: "scenario",
          itemIds: Array.from({ length: 20 }, () => "s1"),
          index: 6,
          answers: [],
          finished: false,
        }
      : null;
  const record = (lastPercent: number) => ({
    lastPercent,
    attempts: 1,
    answeredIds: [],
    correctIds: [],
  });
  // Some topics done and some in progress, so the strip shows its three states.
  const records: PartRecords | null =
    state === "first"
      ? null
      : state === "goal"
        ? {
            "scenario:S1:1": record(100),
            "quiz:S1:1": record(100),
            "quiz:S2:1": record(100),
            "scenario:S2:1": record(100),
            "quiz:S3:1": record(100),
            "quiz:S4:1": record(60),
          }
        : { "quiz:S1:1": record(60), "quiz:S2:1": record(100) };
  return (
    <HomeView
      name={DEMO_USER.name}
      summary={homeSummary({ unfinished, history, records, now })}
      readiness={readiness(history)}
      counts={homeCounts({
        history,
        saved: state === "first" ? [] : ["s3", "q-s2-1", "q-s7-3", "s5"],
      })}
      guideName={sampleMaterials[0].name}
    />
  );
}

/** Progress on a first visit, or after a short and a full session. */
export function ProgressSample({
  withHistory = false,
  sessions,
}: {
  withHistory?: boolean;
  /** Many short sessions, to show the history pages and See more. */
  sessions?: number;
}) {
  const answers = (picks: [string, string][]) =>
    picks.map(([itemId, optionId]) => ({ itemId, optionId }));
  const short: FinishedSession = {
    kind: "scenario",
    itemIds: ["s1", "s2", "s3"],
    answers: answers([
      ["s1", "d"],
      ["s2", "c"],
      ["s3", "a"],
    ]),
    finishedAt: Date.UTC(2026, 9, 7, 9, 20),
  };
  const history: FinishedSession[] = withHistory
    ? [
        short,
        {
          kind: "scenario",
          itemIds: sampleAnswers.map((item) => item.id),
          answers: sampleAnswers.map((item) => ({
            itemId: item.id,
            optionId: item.chosenOptionId,
          })),
          finishedAt: Date.UTC(2026, 9, 8, 12, 5),
        },
      ]
    : Array.from({ length: sessions ?? 0 }, (_, index) => ({
        ...short,
        finishedAt: Date.UTC(2026, 9, 1 + index, 9, 20),
      }));
  return <ProgressView history={history} />;
}

export function OnboardingSample({ start }: { start: OnboardingStep }) {
  const [step, setStep] = useState<OnboardingStep>(start);
  return (
    <OnboardingView
      step={step}
      onNext={() => setStep(nextStep(step))}
      onBack={() => setStep(previousStep(step))}
      onSkip={() => undefined}
      onFinish={() => undefined}
    />
  );
}

/** Profile, or the reset confirmation drawn in place of the overlay. */
export function ProfileSample({ confirming = false }: { confirming?: boolean }) {
  return (
    <ProfileView
      direction={defaultDirection.id}
      onDirectionChange={() => undefined}
      confirming={confirming}
      onAskReset={() => undefined}
      onCancelReset={() => undefined}
      onReset={() => undefined}
      resetDone={false}
      dialogInline
    />
  );
}

/** The Ask AI sheet over the smoke step's Answer review: a "why not" answer, the not-covered answer, typing. */
export function ChatFeedbackSample() {
  const step = getItem("s3");
  const messages: ChatMessage[] = [
    { role: "trainee", text: "Why not run upright?", chipId: "s3-upright" },
    { role: "ai", reply: replyToChip(step, "s3-upright") },
    {
      role: "trainee",
      text: "Which type of cloth filters smoke best?",
      chipId: notCoveredId(step),
    },
    { role: "ai", reply: replyToChip(step, notCoveredId(step)) },
    { role: "trainee", text: "Why not break a window?", chipId: "s3-window" },
  ];
  return (
    <AskAiProvider inline initial={{ chat: { step }, messages, typing: true }}>
      <AnswerReviewSample itemId="s3" choice="a" position={3} />
    </AskAiProvider>
  );
}

/** The materials list with the upload sheet drawn over it in one of its states. */
/** The three material types side by side: a ready PDF, a DOCX and an example LINK (screens only). */
export function MaterialTypesSample() {
  const link: Material = {
    id: "link-example",
    name: "Article: Planning a workplace evacuation drill",
    type: "Link",
    url: "example.org/evacuation-drill",
    added: "2026-10-01",
    status: "ready",
    hasScenario: false,
  };
  return (
    <MaterialsList
      samples={[...sampleMaterials.filter((material) => material.status === "ready"), link]}
    />
  );
}

export function UploadSample({ state }: { state: "choose" | "progress" | "failed" }) {
  const sample = state === "failed" ? sampleFiles[2] : sampleFiles[0];
  const result = materialFromSample(sample, new Date("2026-10-08"));
  const file = { name: sample.name, size: sample.size };
  const stage: Stage =
    state === "choose"
      ? { kind: "choose" }
      : state === "progress"
        ? { kind: "progress", id: result.id, file, percent: 40, result }
        : { kind: "done", material: result };
  return (
    <>
      <MaterialsList samples={sampleMaterials} />
      <div className="scrim absolute inset-0 z-20 flex items-end">
        <div
          role="dialog"
          aria-labelledby="upload-title"
          className="w-full rounded-t-card bg-surface"
        >
          <UploadPanel
            stage={stage}
            onStage={() => undefined}
            onChooseFile={() => undefined}
            onClose={() => undefined}
            onOpenMaterial={() => undefined}
            onCreateTraining={() => undefined}
          />
        </div>
      </div>
    </>
  );
}

/** A ready material without a prepared scenario. */
export function NotesMaterialSample() {
  const material = sampleMaterials.find((candidate) => candidate.id === "shift-notes");
  if (!material) return null;
  return (
    <MaterialView material={material} sections={material.sections ?? []} sectionsOpenable={false} />
  );
}

const guideMaterial = sampleMaterials[0];
const quickCard = {
  ...materialFromSample(sampleFiles[2], new Date("2026-10-08")),
  id: "sample-quick-card",
};

export function CreateTrainingSample({ short = false }: { short?: boolean }) {
  const material = short ? quickCard : guideMaterial;
  const [choice, setChoice] = useState(initialChoice(material));
  return (
    <TrainingCreate
      material={material}
      choice={choice}
      onChange={setChoice}
      onGenerate={() => undefined}
    />
  );
}

export function GeneratingSample() {
  return (
    <TrainingGenerating
      steps={generationSteps(true)}
      active={2}
      percent={60}
      onCancel={() => undefined}
    />
  );
}

export function ReviewSample() {
  return (
    <TrainingReview
      material={guideMaterial}
      training={{
        materialId: guideMaterial.id,
        scenario: true,
        quiz: true,
        sections: ["S1", "S2", "S3"],
        createdAt: 0,
      }}
      onStart={() => undefined}
      expanded
    />
  );
}

/** The flood scenario's first step. */
export function FloodStepSample() {
  return <SessionSample itemId="flood-s1" index={0} total={3} />;
}

/** Flood results. */
export function FloodResultsSample() {
  return (
    <ResultsView
      kind="scenario"
      items={floodAnswers}
      topics={weakTopics(currentWeakItems(floodAnswers))}
      onRepeat={() => undefined}
    />
  );
}

/** The Weak topics page with the sample answers, or empty. */
export function WeakTopicsSample({ empty = false }: { empty?: boolean }) {
  const topics = empty ? [] : weakTopics(currentWeakItems(sampleAnswers));
  const [selected, setSelected] = useState(() => topics.map((topic) => topic.sectionId));
  return (
    <WeakTopicsView
      topics={topics}
      selected={selected}
      backHref="#home"
      backLabel="Back to Home"
      onToggle={(id) =>
        setSelected((current) =>
          current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
        )
      }
      onRepeat={() => undefined}
    />
  );
}

/** The three empty states: no weak topics, no materials in a tab, no history. */
export function EmptyStatesSample() {
  return (
    <div className="flex flex-col gap-8">
      <h1 className="type-page-title">Empty states</h1>
      <EmptyState
        icon={ListChecks}
        text="No weak topics yet. They appear here after a session or a quiz."
      />
      <EmptyState icon={FileText} text="No failed uploads." />
      <EmptyState
        icon={History}
        text="No sessions yet. Finished sessions are saved here, in this browser only."
      />
    </div>
  );
}

const buttonStates = ["default", "pressed", "disabled", "focus"] as const;

function ButtonStates() {
  return (
    <div className="flex flex-col gap-4">
      {(["primary", "secondary", "tertiary"] as const).map((variant) => (
        <div key={variant} className="flex flex-col gap-2">
          <h3 className="type-label text-text-secondary">
            {
              {
                primary: "Primary",
                secondary: "Secondary",
                tertiary: "Tertiary",
              }[variant]
            }
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {buttonStates.map((state) => (
              <div key={state} className="flex flex-col items-stretch gap-1">
                <span className="type-caption text-text-secondary">{state}</span>
                <ButtonPreview
                  variant={variant}
                  state={state}
                  icon={variant === "tertiary" && state === "default" ? Sparkles : undefined}
                >
                  {variant === "tertiary" ? "Ask AI" : "Continue"}
                </ButtonPreview>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/** The three locked button types in every state, on the page and on a card. */
export function ButtonsSample() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="type-page-title">Buttons</h1>
      <p className="type-small text-text-secondary">
        Primary, secondary and tertiary, in the default, pressed, disabled and keyboard focus
        states.
      </p>
      <section className="flex flex-col gap-3">
        <h2 className="type-item-title">On the page</h2>
        <ButtonStates />
      </section>
      <section className="flex flex-col gap-3 rounded-card bg-card p-4 shadow-(--card-shadow)">
        <h2 className="type-item-title">On a card</h2>
        <ButtonStates />
      </section>
    </div>
  );
}

/** Every chip tone and status, on the page and on a card, without strokes. */
export function ChipTonesSample() {
  const tones = ["yellow", "peach", "blue", "lilac", "green", "rose", "sand", "primary"] as const;
  const statuses = ["ready", "processing", "failed"] as const;
  const group = (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2">
        {tones.map((tone) => (
          <Chip key={tone} tone={tone}>
            {tone}
          </Chip>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        {statuses.map((status) => (
          <StatusChip key={status} status={status} />
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Tag tone="yellow">Scenario</Tag>
        <Tag tone="blue">Quiz</Tag>
        <Tag tone="peach">Short</Tag>
        <Tag tone="lilac">Full</Tag>
        <Tag tone="green">Training</Tag>
        <GuideChip sectionId="S1" />
      </div>
    </div>
  );
  return (
    <div className="flex flex-col gap-6">
      <h1 className="type-page-title">Chips</h1>
      <p className="type-small text-text-secondary">
        Soft pastel fills, no strokes. The last tone is the selected-card chip.
      </p>
      <section className="flex flex-col gap-3">
        <h2 className="type-item-title">On the page</h2>
        {group}
      </section>
      <section className="flex flex-col gap-3 rounded-card bg-card p-4 shadow-(--card-shadow)">
        <h2 className="type-item-title">On a card</h2>
        {group}
      </section>
      <section className="flex flex-col gap-3 rounded-card border-[1.5px] border-selected-stroke bg-selected-tint p-4">
        <h2 className="type-item-title">On a selected card</h2>
        {group}
      </section>
    </div>
  );
}

/** The shared pastel palette: swatch, token, hex and the ΔE from page, card and selected card. */
export function PaletteSample() {
  const tones = [
    ["yellow", "#F8F2CC", "17.4 / 18.0 / 17.6"],
    ["rose", "#F8E4E2", "6.3 / 8.2 / 8.5"],
    ["blue", "#DFECF0", "7.4 / 8.2 / 6.6"],
    ["lilac", "#EDE7F5", "9.5 / 10.1 / 10.1"],
    ["green", "#DDEBE3", "7.2 / 8.6 / 6.4"],
    ["peach", "#F7E1D8", "7.9 / 10.0 / 10.0"],
    ["sand", "#E5DFD4", "6.5 / 9.4 / 8.0"],
  ] as const;
  return (
    <div className="flex flex-col gap-6">
      <h1 className="type-page-title">Pastel palette</h1>
      <p className="type-small text-text-secondary">
        One palette for chips and icon tiles. ΔE is the CIE76 distance from the page, a card and a
        selected card (at least 6).
      </p>
      <ul className="flex flex-col gap-3">
        {tones.map(([tone, hex, delta]) => (
          <li
            key={tone}
            className="flex items-center gap-3 rounded-card bg-card p-3 shadow-(--card-shadow)"
          >
            <span
              aria-hidden="true"
              className="h-12 w-12 shrink-0 rounded-full"
              style={{ backgroundColor: `var(--pastel-${tone})` }}
            />
            <span className="flex flex-col">
              <span className="type-body-strong">
                {tone} <span className="type-small text-text-secondary">{hex}</span>
              </span>
              <span className="type-small text-text-secondary tabular-nums">ΔE {delta}</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Every Media3D variant and the Toggle in each state. */
export function Media3DSample() {
  const [on, setOn] = useState(true);
  return (
    <div className="flex flex-col gap-6">
      <h1 className="type-page-title">3D placeholders</h1>
      <section className="flex flex-col items-start gap-2">
        <h2 className="type-label text-text-secondary">hero</h2>
        <Media3D variant="hero" />
      </section>
      <section className="flex flex-col gap-2">
        <h2 className="type-label text-text-secondary">step</h2>
        <Media3D variant="step" />
      </section>
      <section className="flex flex-col items-start gap-2">
        <h2 className="type-label text-text-secondary">icon (the flat icon is the fallback)</h2>
        <Media3D variant="icon" fallback={<TopicTile sectionId="S2" icon={topicIcon("S2")} />} />
      </section>
      <section className="flex flex-col items-start gap-2">
        <h2 className="type-label text-text-secondary">tile (80px, Home hero card)</h2>
        <Media3D variant="tile" />
      </section>
      <section className="flex flex-col items-start gap-2">
        <h2 className="type-label text-text-secondary">row (72px, Mini-quiz row)</h2>
        <Media3D variant="row" />
      </section>
      <section className="flex flex-col gap-2 rounded-card bg-card p-4 shadow-(--card-shadow)">
        <h2 className="type-label text-text-secondary">toggle</h2>
        <Toggle label="Shuffle questions" checked={on} onChange={setOn} />
        <Toggle label="Off" checked={false} onChange={() => undefined} />
        <Toggle
          label="Only topics to repeat"
          checked={false}
          disabled
          hint="Nothing to repeat yet."
          onChange={() => undefined}
        />
      </section>
    </div>
  );
}

/** The Results buttons at the content widths of a 360, 390 and 430px phone, and with nothing to repeat. */
export function ResultsButtonsSample() {
  const widths = [
    ["360px phone (326px)", 326],
    ["390px phone (358px)", 358],
    ["430px phone (398px)", 398],
  ] as const;
  return (
    <div className="flex flex-col gap-6">
      <h1 className="type-page-title">Results buttons</h1>
      <p className="type-small text-text-secondary">
        One row when both labels fit (Review answers left, Repeat weak topics right); otherwise
        stacked with Repeat weak topics on top.
      </p>
      {widths.map(([label, width]) => (
        <section key={label} className="flex flex-col gap-2">
          <h2 className="type-label text-text-secondary">{label}</h2>
          <div style={{ width }}>
            <ResultsActions canRepeat onRepeat={() => undefined} />
          </div>
        </section>
      ))}
      <section className="flex flex-col gap-2">
        <h2 className="type-label text-text-secondary">Nothing to repeat</h2>
        <div style={{ width: 358 }}>
          <ResultsActions canRepeat={false} onRepeat={() => undefined} />
        </div>
      </section>
    </div>
  );
}

/** The Saved screen, empty or with three saved questions. */
export function SavedSample({ empty = false }: { empty?: boolean }) {
  return (
    <SavedView
      items={empty ? [] : [getItem("s3"), getItem("q-s2-1"), getItem("q-s7-3")]}
      backHref="#profile"
      onRepeat={() => undefined}
    />
  );
}

/** One saved question on its own: no choice, the right answer marked, Why, the bookmark. */
export function SavedQuestionSample() {
  return (
    <div className="flex flex-col gap-6">
      <ReviewQuestion
        item={getItem("q-s2-1")}
        choice={null}
        saved
        onToggleSaved={() => undefined}
      />
    </div>
  );
}

/** The Mini-quiz screen: all topics (default), two topics, or none selected. */
export function MiniQuizSample({ selected }: { selected?: string[] }) {
  const { sections } = useSourceSheet();
  const [topics, setTopics] = useState<string[]>(selected ?? miniQuizSections);
  const [chosen, setChosen] = useState<number | null>(null);
  const pool = miniQuizPool(topics).length;
  return (
    <MiniQuizView
      backHref="#training"
      backLabel="Back to Training"
      topics={miniQuizSections.map((id) => ({
        id,
        title: sections.find((section) => section.id === id)?.title ?? id,
        detail: `${miniQuizPool([id]).length} questions`,
      }))}
      selected={topics}
      onSelectedChange={setTopics}
      pool={pool}
      amount={fitAmount(chosen, pool)}
      onAmountChange={setChosen}
      onStart={() => undefined}
    />
  );
}

/** The Exam intro: the first time, or after an attempt. */
export function ExamIntroSample({ attempted = false }: { attempted?: boolean }) {
  return (
    <ExamIntroView
      last={attempted ? { percent: 70, finishedAt: new Date(2026, 9, 14).getTime() } : null}
      best={attempted ? { percent: 85, finishedAt: new Date(2026, 9, 12).getTime() } : null}
      onStart={() => undefined}
    />
  );
}

/** The leave confirmation of the exam, drawn in place over a question. */
export function ExamLeaveSample() {
  return (
    <>
      <SessionSample
        kind="quiz"
        itemId="q-s1-2"
        index={4}
        answered={[0, 1, 2, 3]}
        examSeconds={842}
      />
      <ConfirmDialog
        open
        inline
        emphasis="cancel"
        title="Leave the exam?"
        description="Your progress will be lost."
        confirmLabel="Leave"
        cancelLabel="Stay"
        onConfirm={() => undefined}
        onCancel={() => undefined}
      />
    </>
  );
}

/** Results of an exam (one wrong answer short of the pass mark would be 75%; this one passes). */
export function ExamResultsSample() {
  return (
    <ResultsView
      kind="exam"
      items={passedAnswers}
      topics={weakTopics(currentWeakItems(passedAnswers))}
      backHref="/exam"
      backLabel="Back to Exam"
      reviewHref="/exam/results/review/1"
      onRepeat={() => undefined}
    />
  );
}
