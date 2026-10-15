"use client";

import { Tag } from "@/components/Tag/Tag";
import { StatusChip } from "@/components/StatusChip/StatusChip";
import { GuideChip } from "@/components/GuideChip/GuideChip";
import { Chip } from "@/components/Chip/Chip";
import { FileText, History, ListChecks, Sparkles } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { DecisionStep } from "@/components/DecisionStep/DecisionStep";
import { AnswerReview } from "@/components/AnswerReview/AnswerReview";
import { SessionBar } from "@/components/SessionBar/SessionBar";
import { SessionTopBar } from "@/components/SessionTopBar/SessionTopBar";
import { stripStates } from "@/components/StepStrip/StepStrip";
import { AskAiProvider } from "@/components/AskAi/AskAi";
import type { ChatMessage } from "@/components/AskAi/AskAi";
import { ButtonPreview } from "@/components/Button/Button";
import { AnalysisView } from "@/components/AnalysisView/AnalysisView";
import { EmptyState } from "@/components/EmptyState/EmptyState";
import { ErrorTypesCard } from "@/components/ErrorTypesCard/ErrorTypesCard";
import { HomeView } from "@/components/HomeView/HomeView";
import { TopicCard } from "@/components/TopicCard/TopicCard";
import { WeakTopicsView } from "@/components/WeakTopicsView/WeakTopicsView";
import { initialChoice, TrainingCreate } from "@/components/TrainingCreate/TrainingCreate";
import {
  generationSteps,
  TrainingGenerating,
} from "@/components/TrainingGenerating/TrainingGenerating";
import { TrainingReview } from "@/components/TrainingReview/TrainingReview";
import { QuizQuestion } from "@/components/QuizQuestion/QuizQuestion";
import {
  emptyQuizDraft,
  emptyStepDraft,
  isQuizComplete,
  isStepComplete,
} from "@/lib/session-draft";
import type { QuizDraft, StepDraft } from "@/lib/session-draft";
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
import { ResultsView } from "@/components/ResultsView/ResultsView";
import { SessionSetup } from "@/components/SessionSetup/SessionSetup";
import { defaultSetup } from "@/components/SessionSetup/SessionSetup";
import type { SetupValue } from "@/components/SessionSetup/SessionSetup";
import { notCoveredId, replyToChip } from "@/lib/chat";
import { getQuestion, scoreQuestion } from "@/lib/quiz";
import type { Response } from "@/lib/quiz";
import type { Answer } from "@/lib/session";
import { questionReview, stepReview } from "@/lib/answer-review";
import { getScenario, getStep, sessionLengths } from "@/lib/scenario";
import type { Confidence } from "@/lib/scenario";
import { defaultDirection } from "@/lib/directions";
import { sampleMaterials } from "@/lib/materials";
import { materialFromSample, sampleFiles } from "@/lib/training";
import { currentWeakItems, scoreStep } from "@/lib/scoring";
import { topicIcon, weakTopics } from "@/lib/weak-topics";
import { scenarioLine } from "@/lib/home";

/** Interactive sample screens for the /screens review page. They never touch the saved session. */
export function SetupSample({
  start = defaultSetup,
  scenarioId,
}: {
  start?: SetupValue;
  scenarioId?: string;
}) {
  const [value, setValue] = useState<SetupValue>(start);
  const def = getScenario(scenarioId);
  return (
    <SessionSetup
      value={value}
      onChange={setValue}
      onStart={() => undefined}
      scenarioDef={def}
      materialName={scenarioId ? "Flood preparedness guide.pdf" : undefined}
    />
  );
}

/** A scenario step with the top bar, the step strip and the bottom bar. */
export function SessionStepSample({
  stepId = "s1",
  index = 0,
  total = 6,
  answered = [],
  start = emptyStepDraft,
}: {
  stepId?: string;
  index?: number;
  total?: number;
  /** Positions already answered, for the strip. */
  answered?: number[];
  start?: StepDraft;
}) {
  const [draft, setDraft] = useState<StepDraft>(start);
  const endRef = useScrollFrameToEnd(isStepComplete(start));
  const flags = Array.from({ length: total }, (_, position) => answered.includes(position));
  return (
    <>
      <div className="flex flex-col gap-6">
        <SessionTopBar
          index={index}
          total={total}
          unit="Step"
          states={stripStates(flags, index)}
          onJump={() => undefined}
          onLeave={() => undefined}
        />
        <DecisionStep step={getStep(stepId)} draft={draft} onDraftChange={setDraft} />
      </div>
      <div ref={endRef} />
      <SessionBar
        backLabel={index > 0 ? "Previous step" : null}
        onBack={() => undefined}
        last={index === total - 1}
        disabled={!isStepComplete(draft)}
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

/** The Answer review of one step, with the "still correct" button working. */
export function StepReviewSample({
  stepId,
  optionId,
  explanation = "",
  position,
  marked = false,
}: {
  stepId: string;
  optionId: string;
  explanation?: string;
  position: number;
  marked?: boolean;
}) {
  const step = getStep(stepId);
  const [markedCorrect, setMarkedCorrect] = useState(marked);
  const answer: Answer = {
    stepId,
    optionId,
    confidence: 3,
    explanation,
    skipped: !explanation,
    markedCorrect,
  };
  return (
    <AnswerReview
      data={{
        position,
        total: 6,
        title: step.title,
        narrative: step.narrative,
        question: step.question,
        content: stepReview(step, answer),
        step,
      }}
      noun="step"
      backHref="#results"
      backLabel="Back to results"
      hrefFor={() => "#review"}
      onMarkCorrect={setMarkedCorrect}
    />
  );
}

/** A full session with one answer of each kind of result. */
const sampleAnswers = [
  scoreStep(getStep("s1"), "b", 3),
  scoreStep(getStep("s2"), "c", 2),
  scoreStep(getStep("s3"), "b", 3),
  scoreStep(getStep("s4"), "d", 3),
  scoreStep(getStep("s5"), "a", 1),
  scoreStep(getStep("s6"), "c", 3),
];

/** Results for the sample session; fewer weak answers give the passed variant. */
export function ResultsSample({
  scrolled = false,
  passed = false,
}: {
  scrolled?: boolean;
  passed?: boolean;
}) {
  const endRef = useScrollFrameToEnd(scrolled);
  return (
    <>
      <ResultsView
        results={{ kind: "scenario", mode: "full" }}
        items={passed ? passedAnswers : sampleAnswers}
        onRepeat={() => undefined}
      />
      <div ref={endRef} />
    </>
  );
}

/** Five of six right: 83%, above the pass mark. */
const passedAnswers = [
  scoreStep(getStep("s1"), "b", 3),
  scoreStep(getStep("s2"), "c", 3),
  scoreStep(getStep("s3"), "b", 3),
  scoreStep(getStep("s4"), "d", 3),
  scoreStep(getStep("s5"), "b", 3),
  scoreStep(getStep("s6"), "c", 3),
];

/** Home in each Next up state: first visit, weak topics, an unfinished session, all repeated. */
export function HomeSample({
  state = "first",
}: {
  state?: "first" | "repeat" | "continue" | "new";
}) {
  const scenarioDef = getScenario(undefined);
  return (
    <HomeView
      directionTitle={defaultDirection.title}
      unfinished={
        state === "continue"
          ? {
              mode: "full",
              stepIds: [...sessionLengths.full.stepIds],
              index: 2,
              answers: [],
              finished: false,
            }
          : null
      }
      weakItems={state === "repeat" || state === "continue" ? currentWeakItems(sampleAnswers) : []}
      hasHistory={state !== "first"}
      scenarios={[
        {
          id: "evacuation-guide",
          title: scenarioDef.title,
          line: scenarioLine(scenarioDef),
          onOpen: () => undefined,
        },
      ]}
      onRepeat={() => undefined}
      onStartScenario={() => undefined}
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
  const answer = (stepId: string, optionId: string, confidence: 1 | 2 | 3) => ({
    stepId,
    optionId,
    confidence,
    explanation: "",
  });
  const history = withHistory
    ? [
        {
          mode: "short" as const,
          finishedAt: Date.UTC(2026, 9, 7, 9, 20),
          answers: [answer("s1", "d", 1), answer("s2", "c", 3), answer("s3", "a", 3)],
        },
        {
          mode: "full" as const,
          finishedAt: Date.UTC(2026, 9, 8, 12, 5),
          answers: sampleAnswers.map((scored, index) =>
            answer(scored.id, ["b", "c", "b", "d", "a", "c"][index], 2),
          ),
        },
      ]
    : Array.from({ length: sessions ?? 0 }, (_, index) => ({
        mode: "short" as const,
        finishedAt: Date.UTC(2026, 9, 1 + index, 9, 20),
        answers: [answer("s1", "d", 1), answer("s2", "c", 3), answer("s3", "a", 3)],
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
  const step = getStep("s3");
  const messages: ChatMessage[] = [
    { role: "trainee", text: "Why not run upright?", chipId: "s3-upright" },
    { role: "ai", reply: replyToChip(step, "s3-upright", "feedback") },
    {
      role: "trainee",
      text: "Which type of cloth filters smoke best?",
      chipId: notCoveredId(step),
    },
    { role: "ai", reply: replyToChip(step, notCoveredId(step), "feedback") },
    { role: "trainee", text: "Why not break a window?", chipId: "s3-window" },
  ];
  return (
    <AskAiProvider inline initial={{ chat: { step, phase: "feedback" }, messages, typing: true }}>
      <StepReviewSample
        stepId="s3"
        optionId="a"
        explanation="Smoke rises, so we stay low."
        position={3}
      />
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

/** One quiz question of each type with the top bar, strip and bottom bar, optionally answered. */
export function QuizSample({
  questionId,
  index,
  response,
  dontKnow = false,
}: {
  questionId: string;
  index: number;
  response?: Response;
  dontKnow?: boolean;
}) {
  const question = getQuestion(questionId);
  const [draft, setDraft] = useState<QuizDraft>(
    response ? { response, confidence: null, dontKnow } : emptyQuizDraft(question),
  );
  const flags = Array.from({ length: 5 }, (_, position) => position < index);
  return (
    <>
      <div className="flex flex-col gap-6">
        <SessionTopBar
          index={index}
          total={5}
          unit="Question"
          states={stripStates(flags, index)}
          onJump={() => undefined}
          onLeave={() => undefined}
        />
        <QuizQuestion question={question} draft={draft} onDraftChange={setDraft} />
      </div>
      <SessionBar
        backLabel={index > 0 ? "Previous question" : null}
        onBack={() => undefined}
        last={index === 4}
        disabled={!isQuizComplete(draft)}
        onNext={() => undefined}
      />
    </>
  );
}

/** The Answer review of one quiz question, for every question type. */
export function QuestionReviewSample({
  questionId,
  response,
  marked = false,
  dontKnow = false,
  confidence = null,
}: {
  questionId: string;
  response: Response;
  marked?: boolean;
  dontKnow?: boolean;
  confidence?: Confidence | null;
}) {
  const question = getQuestion(questionId);
  const [markedCorrect, setMarkedCorrect] = useState(marked);
  const answer = { questionId, response, confidence, markedCorrect, dontKnow };
  return (
    <AnswerReview
      data={{
        position: 2,
        total: 5,
        question: question.question,
        content: questionReview(question, answer),
      }}
      noun="question"
      backHref="#results"
      backLabel="Back to results"
      hrefFor={() => "#review"}
      onMarkCorrect={setMarkedCorrect}
    />
  );
}

export function QuizResultsSample() {
  const items = [
    scoreQuestion(getQuestion("q-s1-1"), { type: "single", optionId: "b" }, 3),
    scoreQuestion(getQuestion("q-s1-3"), { type: "multiple", optionIds: ["a", "b", "c"] }, 2),
    scoreQuestion(getQuestion("q-s2-3"), { type: "ordering", order: ["a", "b", "d", "c"] }, null),
    scoreQuestion(getQuestion("q-s2-1"), { type: "text", text: "with my knuckles" }, 3, true),
    scoreQuestion(getQuestion("q-s1-2"), { type: "truefalse", value: true }, 3),
  ];
  return (
    <ResultsView
      results={{ kind: "quiz", mode: "quiz" }}
      items={items}
      onRepeat={() => undefined}
    />
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

const FLOOD = "flood-preparedness-001";

/** The flood scenario's first step: F-section chips. */
export function FloodStepSample() {
  return <SessionStepSample stepId="flood-s1" total={3} />;
}

/** Flood results: time lost and water level only. */
export function FloodResultsSample() {
  return (
    <ResultsView
      results={{ kind: "scenario", mode: "short", scenarioId: FLOOD }}
      items={[
        scoreStep(getStep("flood-s1"), "c", 3),
        scoreStep(getStep("flood-s2"), "a", 3),
        scoreStep(getStep("flood-s3"), "a", 2),
      ]}
      onRepeat={() => undefined}
    />
  );
}

export function FloodSetupSample() {
  return <SetupSample start={{ ...defaultSetup, length: "short" }} scenarioId={FLOOD} />;
}

/** The Weak topics page with the sample answers, or empty. */
export function WeakTopicsSample({ empty = false }: { empty?: boolean }) {
  const topics = empty ? [] : weakTopics(currentWeakItems(sampleAnswers));
  const [selected, setSelected] = useState(() => topics.map((topic) => topic.sectionId));
  return (
    <WeakTopicsView
      topics={topics}
      selected={selected}
      onToggle={(id) =>
        setSelected((current) =>
          current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
        )
      }
      onRepeat={() => undefined}
    />
  );
}

/** Every topic icon on its material's tile: the evacuation guide in yellow, the flood guide in blue. */
export function TopicIconsSample() {
  const item = currentWeakItems(sampleAnswers)[0];
  const sections = ["F1", "F4", "S1", "S2", "S3", "S4", "S5", "S6", "S7", "S8", "S9", "S10"];
  return (
    <div className="flex flex-col gap-4">
      <h1 className="type-page-title">Topic cards</h1>
      <ul className="grid grid-cols-2 gap-3">
        {sections.map((sectionId) => (
          <li key={sectionId}>
            <TopicCard
              topic={{ sectionId, icon: topicIcon(sectionId), errorType: "guess", items: [item] }}
              onRepeat={() => undefined}
            />
          </li>
        ))}
      </ul>
    </div>
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

/** The Error types card on its own: counts with a zero row, and an empty one. */
export function ErrorTypesSample() {
  return (
    <div className="flex flex-col gap-6">
      <ErrorTypesCard
        counts={{ secure: 2, guess: 1, knowledge_gap: 0, misconception: 1 }}
        detailsHref="#error-analysis"
      />
      <ErrorTypesCard counts={{ secure: 0, guess: 0, knowledge_gap: 0, misconception: 0 }} />
    </div>
  );
}

/** The Error analysis screen for the sample session. */
export function AnalysisSample() {
  return (
    <AnalysisView
      items={sampleAnswers}
      quiz={false}
      backHref="#results"
      onRepeat={() => undefined}
    />
  );
}

const buttonStates = ["default", "pressed", "disabled", "focus"] as const;

function ButtonStates() {
  return (
    <div className="flex flex-col gap-4">
      {(["primary", "secondary", "tertiary"] as const).map((variant) => (
        <div key={variant} className="flex flex-col gap-2">
          <h3 className="type-label text-text-secondary">
            {{ primary: "Primary", secondary: "Secondary", tertiary: "Tertiary" }[variant]}
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
  const statuses = [
    "ready",
    "processing",
    "failed",
    "secure",
    "guess",
    "knowledge_gap",
    "misconception",
    "correct",
    "wrong",
    "partial",
  ] as const;
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
