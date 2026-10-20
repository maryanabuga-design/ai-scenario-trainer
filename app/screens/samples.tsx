"use client";

import { StepsTopicView } from "@/components/StepsView/StepsTopic";
import { checklists } from "@/lib/checklists";
import { QuickActionsBar } from "@/components/QuickActionsBar/QuickActionsBar";
import { Tag } from "@/components/Tag/Tag";
import { StatusChip } from "@/components/StatusChip/StatusChip";
import { GuideChip } from "@/components/GuideChip/GuideChip";
import { Chip } from "@/components/Chip/Chip";
import { FileText, History, ListChecks, Sparkles } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { QuestionScreen } from "@/components/QuestionScreen/QuestionScreen";
import { Media3D } from "@/components/Media3D/Media3D";
import { Toggle } from "@/components/Toggle/Toggle";
import { AskAiThread } from "@/components/AskAiThread/AskAiThread";
import { AskAiView } from "@/components/AskAiView/AskAiView";
import { answerTo, followUp, newThread, questionThread, userMessage } from "@/lib/ask-ai";
import type { AiMessage, Thread } from "@/lib/ask-ai";
import { CertificateView } from "@/components/CertificateView/CertificateView";
import { CertificatesList } from "@/components/CertificatesList/CertificatesList";
import { StudentDetailView } from "@/components/InstructorStudents/StudentDetailView";
import { StudentsListView } from "@/components/InstructorStudents/StudentsListView";
import {
  examRowsFor,
  profiles,
  readinessOf,
  sortProfiles,
  studentStatus,
  visibleStudents,
} from "@/lib/students";
import { AssignExamView } from "@/components/InstructorExams/AssignExamView";
import { ExamDetailView } from "@/components/InstructorExams/ExamDetailView";
import { InstructorExamsView } from "@/components/InstructorExams/InstructorExamsView";
import { groupCounts, participants, studentRows } from "@/lib/cohort";
import type { Attempt } from "@/lib/cohort";
import { seedGroupExams } from "@/lib/group-exams";
import { AnswerReview } from "@/components/AnswerReview/AnswerReview";
import { SessionBar } from "@/components/SessionBar/SessionBar";
import { ConfirmDialog } from "@/components/ConfirmDialog/ConfirmDialog";
import { ExamView } from "@/components/ExamView/ExamView";
import { deadlineText } from "@/lib/exam-deadline";
import { ExamTimer } from "@/components/ExamTimer/ExamTimer";
import { SessionTopBar } from "@/components/SessionTopBar/SessionTopBar";
import { stripStates } from "@/components/StepStrip/StepStrip";
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
import { nextIndex, previousIndex } from "@/lib/onboarding";
import { ProgressView } from "@/components/ProgressView/ProgressView";
import { ResultsActions, ResultsView } from "@/components/ResultsView/ResultsView";
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
import { GuideText } from "@/components/GuideText/GuideText";
import { SelectionToolbar } from "@/components/SelectionToolbar/SelectionToolbar";
import { addHighlights, blockTexts } from "@/lib/highlights";
import { toolbarActions } from "@/lib/selection-actions";
import { homeArtwork, homeCounts, homeSummary } from "@/lib/home";
import { NotificationsView } from "@/components/NotificationsView/NotificationsView";
import { InstructorOverviewView } from "@/components/InstructorOverview/InstructorOverviewView";
import { nearestActiveExam } from "@/lib/overview";
import { AboutView } from "@/components/AboutView/AboutView";
import { EditProfileView } from "@/components/EditProfileView/EditProfileView";
import { SignInView } from "@/components/SignInView/SignInView";
import { SignUpView } from "@/components/SignUpView/SignUpView";
import { VerifyView } from "@/components/VerifyView/VerifyView";
import { WelcomeView } from "@/components/WelcomeView/WelcomeView";
import type { Role } from "@/lib/role";
import { assignedLine } from "@/lib/exams-to-take";
import { demoExam } from "@/lib/assigned-exams";
import { seedNotifications } from "@/lib/notifications";
import { readinessAfter, scopeItemIds } from "@/lib/readiness";
import { topicIdsOf } from "@/lib/session";

/**
 * The Training screen: empty, or with some progress (the first part of a topic done, one passed,
 * and wrong answers in two topics).
 */
export function TrainingSample({
  mode = "scenario",
  progress = false,
  cards = false,
}: {
  mode?: TrainingMode;
  progress?: boolean;
  /** Show the Continue card and an assigned exam, with their pictures. */
  cards?: boolean;
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
      resume={cards ? "Scenario · Question 2 of 3" : undefined}
      exams={
        cards
          ? [
              {
                id: "demo",
                title: "Evacuation basics exam",
                deadline: deadlineText("2026-10-25", new Date(2026, 9, 19)),
              },
            ]
          : []
      }
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
  itemId = "q-scn-s01-001",
  index = 0,
  total = 10,
  answered = [],
  choice = null,
  kind = "scenario",
  hintOpen = false,
  startSaved = false,
  examSeconds,
  checked = false,
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
  /** A training question that was checked: its feedback and Why show. */
  checked?: boolean;
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
  const [done, setDone] = useState(checked);
  const exam = examSeconds !== undefined;
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
          mode={exam ? "exam" : "training"}
          checked={done}
          saved={saved}
          onToggleSaved={() => setSaved(!saved)}
          hint={open ? hint : null}
        />
      </div>
      <div ref={endRef} />
      <SessionBar
        label={exam || done ? (index === total - 1 ? "Finish" : "Next") : "Check"}
        last={index === total - 1}
        disabled={picked === null}
        hint={
          hint
            ? {
                open: open && !done,
                onToggle: () => setOpen(!open),
                disabled: done,
              }
            : undefined
        }
        onNext={() => setDone(true)}
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
  total = 6,
  results = "mixed",
}: {
  itemId: string;
  choice: string;
  position?: number;
  total?: number;
  /** The pager: a mixed list (the sample session), or every question wrong or right. */
  results?: "mixed" | "allWrong" | "allCorrect";
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
      marks={sampleAnswers.map((item) =>
        results === "allWrong"
          ? "wrong"
          : results === "allCorrect"
            ? "correct"
            : item.correct
              ? "correct"
              : "wrong",
      )}
      onJump={() => undefined}
      saved={false}
      onToggleSaved={() => undefined}
    />
  );
}

const pick = (id: string, optionId: string) => scoreItem(getItem(id), optionId);

/** Six answers in one session: three wrong, so the result is "Not passed yet". */
const sampleAnswers = [
  pick("q-scn-s01-001", "a"),
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
  examRepeat = false,
}: {
  scrolled?: boolean;
  passed?: boolean;
  /** A repeat session for an assigned exam: Done over Review answers. */
  examRepeat?: boolean;
}) {
  const endRef = useScrollFrameToEnd(scrolled);
  const items = passed ? passedAnswers : sampleAnswers;
  return (
    <>
      <ResultsView
        kind={examRepeat ? "repeat" : "scenario"}
        items={items}
        topics={weakTopics(currentWeakItems(items))}
        onRepeat={() => undefined}
        examRepeat={examRepeat}
        doneHref={examRepeat ? "#exam" : undefined}
      />
      <div ref={endRef} />
    </>
  );
}

const passedAnswers = [
  pick("q-scn-s01-001", "b"),
  pick("s2", "c"),
  pick("s3", "a"),
  pick("s4", "d"),
  pick("s5", "a"),
  pick("s6", "c"),
];

/** Home in its four states, with fake data and a fixed date. */
export function HomeSample({
  state = "first",
  assigned = false,
}: {
  state?: "first" | "continue" | "weak" | "goal";
  /** The Exam tile with an assigned exam ("1 assigned · due 26 Oct"). */
  assigned?: boolean;
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
  const wrongStep = getItem("q-quiz-s01-001");
  const history: FinishedSession[] =
    state === "first"
      ? []
      : state === "goal"
        ? [done(["q-quiz-s01-001", "q-quiz-s01-002", "q-quiz-s01-003", "q-quiz-s01-004", "q-s2-1"])]
        : [
            {
              kind: "quiz",
              itemIds: ["q-quiz-s01-001", "q-s2-1", "q-s2-2"],
              answers: [
                {
                  itemId: "q-quiz-s01-001",
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
          itemIds: Array.from({ length: 20 }, () => "q-scn-s01-001"),
          index: 6,
          answers: [],
          finished: false,
        }
      : null;
  return (
    <HomeView
      name="Maryana"
      summary={homeSummary({ unfinished, history })}
      counts={homeCounts({
        history,
        saved: state === "first" ? [] : ["s3", "q-s2-1", "q-s7-3", "s5"],
        assigned: assigned
          ? assignedLine(seedGroupExams(new Date(2026, 9, 24).getTime()).slice(0, 1))
          : null,
      })}
    />
  );
}

/** Progress with seeded sessions and an assigned exam, or without an exam. */
export function ProgressSample({
  state = "seeded",
  open = false,
  scrolled = false,
}: {
  state?: "seeded" | "no-exam";
  /** The other topics are open. */
  open?: boolean;
  /** The frame is scrolled to its end. */
  scrolled?: boolean;
}) {
  const endRef = useScrollFrameToEnd(scrolled);
  const now = new Date(2026, 9, 19, 14, 0);
  const day = (daysAgo: number, hour = 10, minute = 37) =>
    new Date(2026, 9, 19 - daysAgo, hour, minute).getTime();
  const answers = (ids: string[], right: number) =>
    ids.map((id, index) => ({
      itemId: id,
      optionId:
        index < right
          ? getItem(id).correctOptionId
          : getItem(id).options.find((option) => option.id !== getItem(id).correctOptionId)!.id,
    }));
  const s1 = scopeItemIds(["S1"]);
  const s2 = scopeItemIds(["S2"]);
  const s3 = scopeItemIds(["S3"]);
  const s5 = scopeItemIds(["S5"]);
  const entry = (
    ids: string[],
    right: number,
    finishedAt: number,
    extra: Partial<FinishedSession> = {},
  ): FinishedSession => ({
    kind: "quiz",
    mode: "practice",
    topicIds: topicIdsOf(ids),
    itemIds: ids,
    answers: answers(ids, right),
    finishedAt,
    ...extra,
  });
  const raw: FinishedSession[] = [
    entry(s1, s1.length - 1, day(6)),
    entry(s2.slice(0, 10), 4, day(3)),
    entry([...s3.slice(0, 3), ...s5.slice(0, 2)], 3, day(1, 18, 5), {
      mode: "mini-quiz",
    }),
    entry(s2.slice(0, 10), 7, day(0), { kind: "repeat" }),
  ];
  // each record stores the readiness after it, as a finished session does (the change line reads it)
  const scope = state === "no-exam" ? null : demoExam(now).topicIds;
  const history = raw.map((record, index) => ({
    ...record,
    readinessAfter: readinessAfter(raw.slice(0, index + 1), scope),
  }));
  return (
    <>
      <ProgressView
        history={history}
        exam={state === "no-exam" ? null : demoExam(now)}
        now={now}
        otherOpen={open}
      />
      <div ref={endRef} />
    </>
  );
}

export function OnboardingSample({ role = "student", start }: { role?: Role; start: number }) {
  const [index, setIndex] = useState(start);
  return (
    <OnboardingView
      role={role}
      index={index}
      direction="next"
      onNext={() => setIndex(nextIndex(index, 3))}
      onPrevious={() => setIndex(previousIndex(index))}
      onSkip={() => undefined}
      onFinish={() => undefined}
    />
  );
}

/** Profile, or a confirmation (reset or delete) drawn in place of the overlay. */
export function ProfileSample({
  dialog = null,
  role = "student",
  scrolled = false,
}: {
  dialog?: "reset" | "delete" | null;
  role?: Role;
  /** The frame is scrolled to its end. */
  scrolled?: boolean;
}) {
  const endRef = useScrollFrameToEnd(scrolled);
  return (
    <>
      <ProfileView
        certificates={1}
        backHref={role === "student" ? "/" : "/instructor"}
        account={{ name: "Maryana", email: "maryana@example.com", role }}
        onRoleChange={() => undefined}
        direction={defaultDirection.id}
        onDirectionChange={() => undefined}
        dialog={dialog}
        onAskReset={() => undefined}
        onAskDelete={() => undefined}
        onCancelDialog={() => undefined}
        onReset={() => undefined}
        onDelete={() => undefined}
        onSignOut={() => undefined}
        resetDone={false}
        dialogInline
      />
      <div ref={endRef} />
    </>
  );
}

/** Ask AI in fixed states for the screen review page. */
export function AskAiSample({
  state = "history",
}: {
  state?: "empty" | "history" | "thread" | "fallback" | "typing" | "clear";
}) {
  const now = new Date(2026, 9, 23, 14, 0).getTime();
  const minutes = (n: number) => now - n * 60_000;
  const at = (thread: Thread, updatedAt: number): Thread => ({
    ...thread,
    updatedAt,
    createdAt: updatedAt,
  });
  const { sections } = useSourceSheet();
  const titleOf = (id: string) => sections.find((section) => section.id === id)?.title;
  const smoke = newThread("How do I move through smoke?", answerTo("smoke", now), titleOf, now);
  const burn = newThread("What should I do for a burn?", answerTo("burn", now), titleOf, now);
  const item = getItem("q-scn-s01-001");
  const question = questionThread(item, 1, "a", titleOf, now);
  const history = [
    at(smoke, minutes(4)),
    at(question, minutes(95)),
    at(burn, new Date(2026, 9, 21, 9, 0).getTime()),
  ];
  const answered = (t: Thread): Thread => ({
    ...t,
    messages: t.messages.flatMap((m) => (m.reply ? [{ ...m, reply: undefined }, m.reply] : [m])),
  });
  if (state === "empty" || state === "history" || state === "clear") {
    return (
      <AskAiView
        threads={state === "empty" ? [] : history}
        now={now}
        onSend={() => undefined}
        onSuggested={() => undefined}
        confirming={state === "clear"}
        onAskClear={() => undefined}
        onCancelClear={() => undefined}
        onClear={() => undefined}
        dialogInline
      />
    );
  }
  const base = answered(at(smoke, minutes(4)));
  const withReply = (t: Thread, text: string, reply: AiMessage, waiting: boolean): Thread => ({
    ...t,
    messages: [
      ...t.messages,
      waiting
        ? userMessage(text, reply, now)
        : { ...userMessage(text, reply, now), reply: undefined },
      ...(waiting ? [] : [reply]),
    ],
  });
  const thread: Thread =
    state === "fallback"
      ? withReply(base, "Who won the match?", answerTo("zzz", now), false)
      : state === "typing"
        ? withReply(base, "Give an example", followUp("example", "S3", now), true)
        : base;
  return (
    <AskAiThread
      thread={thread}
      typing={state === "typing"}
      onSend={() => undefined}
      onAction={() => undefined}
      onSuggested={() => undefined}
    />
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
  const tones = ["yellow", "peach", "blue", "lilac", "olive", "sand", "primary"] as const;
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
        <Tag tone="olive">Training</Tag>
        <GuideChip sectionId="S1" />
      </div>
    </div>
  );
  return (
    <div className="flex flex-col gap-6">
      <h1 className="type-page-title">Chips</h1>
      <p className="type-small text-text-secondary">
        Soft pastel fills, no strokes. Green and rose are not chip tones: they mean answer
        correctness only.
      </p>
      <section className="flex flex-col gap-3">
        <h2 className="type-item-title">On the page</h2>
        {group}
      </section>
      <section className="flex flex-col gap-3 rounded-card bg-card p-4 shadow-(--card-shadow)">
        <h2 className="type-item-title">On a card</h2>
        {group}
      </section>
      <section className="flex flex-col gap-3 rounded-card border border-selectable-stroke bg-olive-tint p-4">
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
        <h2 className="type-label text-text-secondary">
          icon (the flat icon is the fallback, on the one neutral tile)
        </h2>
        <Media3D variant="icon" fallback={<TopicTile icon={topicIcon("S2")} />} />
      </section>
      <section className="flex flex-col items-start gap-2">
        <h2 className="type-label text-text-secondary">tile (80px placeholder, Home hero card)</h2>
        <Media3D variant="tile" />
        <h2 className="type-label text-text-secondary">tile with its picture (fixed 80px frame)</h2>
        <Media3D
          variant="tile"
          src="/heroes/hero-training.webp"
          artwork={homeArtwork.heroTraining}
        />
      </section>
      <section className="flex flex-col items-start gap-2">
        <h2 className="type-label text-text-secondary">row (72px placeholder, Mini-quiz row)</h2>
        <Media3D variant="row" />
        <h2 className="type-label text-text-secondary">row with its picture (fixed 72px frame)</h2>
        <Media3D
          variant="row"
          src="/heroes/icon-miniquiz.webp"
          artwork={homeArtwork.iconMiniQuiz}
        />
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

/** The exam screen in a fixed state (the screen review page): readiness, deadline and attempts. */
export function ExamIntroSample({
  readiness = 0,
  overdue = false,
  attempted = false,
  assigned = false,
}: {
  readiness?: number;
  overdue?: boolean;
  attempted?: boolean;
  /** The "Assigned by your instructor" section (two exams to take). */
  assigned?: boolean;
}) {
  const now = new Date(2026, 9, 19, 10, 0);
  const groupExams = seedGroupExams(new Date(2026, 9, 24).getTime());
  return (
    <ExamView
      assigned={
        assigned
          ? [
              groupExams[0],
              {
                ...groupExams[0],
                id: "journey",
                title: "Exam: Responding to an alarm",
                deadline: "2026-10-27",
              },
            ]
          : []
      }
      title="Evacuation basics exam"
      assignedBy="Instructor"
      deadline={deadlineText(overdue ? "2026-10-15" : "2026-10-25", now)}
      readiness={readiness}
      canRepeat={readiness < 100}
      last={
        attempted
          ? {
              correct: 14,
              questions: 20,
              finishedAt: new Date(2026, 9, 14).getTime(),
            }
          : null
      }
      best={
        attempted
          ? {
              correct: 17,
              questions: 20,
              finishedAt: new Date(2026, 9, 12).getTime(),
            }
          : null
      }
      onStart={() => undefined}
      onRepeat={() => undefined}
    />
  );
}

/** The leave confirmation of the exam, drawn in place over a question. */
export function ExamLeaveSample() {
  return (
    <>
      <SessionSample
        kind="quiz"
        itemId="q-quiz-s01-002"
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
      certificateHref="#certificate"
    />
  );
}

/** A sample certificate for the screen review page. */
const sampleCertificate = {
  id: "QT-2026-0042",
  accountId: "maryana@example.com",
  examTitle: "Evacuation basics exam",
  date: new Date(2026, 9, 23, 12, 0).getTime(),
  correct: 17,
  total: 20,
  passMark: 80,
  attemptAt: 1,
};

/** The certificate screen, or the list of certificates (or its empty state). */
export function CertificateSample({
  state = "certificate",
}: {
  state?: "certificate" | "list" | "empty";
}) {
  if (state === "certificate") {
    return (
      <CertificateView certificate={sampleCertificate} name="Maryana" onBack={() => undefined} />
    );
  }
  return (
    <CertificatesList
      certificates={
        state === "empty"
          ? []
          : [
              sampleCertificate,
              {
                ...sampleCertificate,
                id: "QT-2026-0041",
                date: new Date(2026, 9, 18).getTime(),
                examTitle: "Flood preparedness exam",
              },
            ]
      }
      onBack={() => undefined}
    />
  );
}

/** The reading text with highlights and the floating toolbar, drawn in place (not positioned). */
export function HighlightSample({
  markdown,
  state,
}: {
  markdown: string;
  state: "selection" | "highlight" | "copied";
}) {
  const texts = blockTexts(markdown);
  let list = addHighlights([], [{ block: 0, start: 6, end: 17 }], texts, () => "a").list;
  list = addHighlights(list, [{ block: 3, start: 0, end: 29 }], texts, () => "b").list;
  const selected = state === "selection" ? list.slice(0, 0) : list;
  return (
    <div className="flex flex-col gap-4">
      <h1 className="type-page-title">Responding to an alarm</h1>
      <GuideText markdown={markdown.split("\n").slice(0, 4).join("\n")} highlights={selected} />
      <div className="flex justify-center">
        <SelectionToolbar
          inline
          copied={state === "copied"}
          actions={toolbarActions({ onHighlight: state !== "selection" })}
        />
      </div>
    </div>
  );
}

/** The reading screen's quick-actions bar drawn inside a phone frame (the frame is its container). */
export function QuickBarSample({ stepsHref }: { stepsHref: string | null }) {
  return (
    <QuickActionsBar visible stepsHref={stepsHref} onPractise={() => {}} placement="absolute" />
  );
}

/** A Steps topic screen with one step open, for the screen review page. */
export function StepsTopicSample({
  checklistIndex,
  openStep,
}: {
  checklistIndex: number;
  /** 1-based number of the open step. */
  openStep: number;
}) {
  const checklist = checklists[checklistIndex];
  return (
    <StepsTopicView
      checklist={checklist}
      open={checklist.steps[openStep - 1].id}
      onBack={() => {}}
      onToggleOpen={() => {}}
    />
  );
}

/** The Notifications screen: with two exams to take, read history only, and empty. */
export function NotificationsSample({ state }: { state: "exams" | "read" | "empty" }) {
  const now = new Date(2026, 9, 24, 14, 0).getTime();
  const seeded = seedNotifications(now);
  const exams = seedGroupExams(now);
  const second = {
    ...exams[0],
    id: "journey",
    title: "Exam: Responding to an alarm",
    deadline: "2026-10-27",
  };
  const toTake =
    state === "exams"
      ? [exams[0], second].sort((x, y) => x.deadline.localeCompare(y.deadline))
      : [];
  const items =
    state === "empty"
      ? []
      : state === "exams"
        ? [
            {
              id: "notice-journey",
              type: "message" as const,
              title: `New exam assigned: ${second.title}`,
              text: "",
              target: "/exam?id=journey",
              createdAt: now - 10 * 60_000,
              read: false,
            },
            ...seeded,
          ]
        : seeded.map((n) => ({ ...n, read: true }));
  const fresh = new Set(
    items
      .filter((n) => !n.read)
      .slice(0, 2)
      .map((n) => n.id),
  );
  return <NotificationsView items={items} toTake={toTake} now={now} freshIds={fresh} />;
}

/** The Instructor Overview for the screen review page (the seeded demo group, a fixed date). */
export function InstructorHomeSample({
  state = "default",
}: {
  state?: "default" | "few" | "on-track" | "no-exam";
}) {
  const { sections } = useSourceSheet();
  const titleOf = (id: string) => sections.find((section) => section.id === id)?.title ?? id;
  const now = new Date(2026, 9, 24, 10, 0).getTime();
  const exams = state === "no-exam" ? [] : seedGroupExams(now);
  const people = participants([{ name: "Maryana", email: "maryana@example.com" }]);
  const everyone = profiles(people, { "maryana@example.com": null });
  const needs = (p: (typeof everyone)[number]) => studentStatus(readinessOf(p)) === "needs";
  const list =
    state === "on-track"
      ? everyone.filter((p) => !needs(p))
      : state === "few"
        ? [...everyone.filter(needs).slice(0, 2), ...everyone.filter((p) => !needs(p))]
        : everyone;
  const exam = nearestActiveExam(exams, now);
  return (
    <InstructorOverviewView
      name="Maryana"
      list={list}
      exam={exam}
      counts={exam ? groupCounts(people, exam, { attempts: [], active: true }) : null}
      titleOf={titleOf}
    />
  );
}

/** The Instructor exams screens for the screen review page (the seeded demo group, a fixed date). */
export function InstructorExamsSample({
  state = "list",
}: {
  state?:
    | "list"
    | "closed"
    | "empty"
    | "assign"
    | "assign-filled"
    | "discard"
    | "detail"
    | "detail-closed";
}) {
  const { sections } = useSourceSheet();
  const titleOf = (id: string) => sections.find((section) => section.id === id)?.title ?? id;
  const now = new Date(2026, 9, 24, 10, 0).getTime();
  const exams = seedGroupExams(now);
  const people = participants([{ name: "Maryana", email: "maryana@example.com" }]);
  const attempts: Attempt[] = [];
  if (state === "list" || state === "closed" || state === "empty") {
    return (
      <InstructorExamsView
        exams={state === "empty" ? [] : exams}
        people={people}
        attempts={attempts}
        now={now}
        initiallyOpen={state === "closed"}
      />
    );
  }
  if (state === "assign" || state === "assign-filled" || state === "discard") {
    return (
      <AssignExamView
        titleOf={titleOf}
        now={now}
        onAssign={() => undefined}
        onCancel={() => undefined}
        initial={
          state === "assign"
            ? undefined
            : {
                topics: ["S1", "S2", "S3"],
                preset: "1w",
                ...(state === "discard" && { title: "Exam: Alarm" }),
              }
        }
        confirmingInitially={state === "discard"}
        dialogInline
      />
    );
  }
  const closed = state === "detail-closed";
  const exam = closed ? exams[1] : exams[0];
  const context = { attempts, active: !closed };
  return (
    <ExamDetailView
      exam={exam}
      active={!closed}
      counts={groupCounts(people, exam, context)}
      rows={studentRows(people, exam, context)}
      titleOf={titleOf}
      message=""
      confirmingClose={false}
      onRemind={() => undefined}
      onAskClose={() => undefined}
      onCancelClose={() => undefined}
      onClose={() => undefined}
      dialogInline
    />
  );
}

/** The Instructor Students screens for the screen review page (the demo group, a fixed date). */
export function InstructorStudentsSample({
  state = "all",
}: {
  state?: "all" | "needs" | "certified" | "empty" | "detail-needs" | "detail-ready";
}) {
  const { sections } = useSourceSheet();
  const titleOf = (id: string) => sections.find((section) => section.id === id)?.title ?? id;
  const now = new Date(2026, 9, 24, 10, 0).getTime();
  const exams = seedGroupExams(now);
  const people = participants([{ name: "Maryana", email: "maryana@example.com" }]);
  const all = profiles(people, { "maryana@example.com": null });
  if (state === "detail-needs" || state === "detail-ready") {
    const wanted = state === "detail-needs" ? "needs" : "ready";
    const profile = sortProfiles(all).find(
      (p) => !p.participant.local && studentStatus(readinessOf(p)) === wanted,
    )!;
    return (
      <StudentDetailView
        profile={profile}
        backHref="#students"
        backLabel="Back to students"
        rows={examRowsFor(profile.participant, exams, [], now)}
        titleOf={titleOf}
        certificateHref={() => null}
      />
    );
  }
  const filter = state === "empty" ? "certified" : state;
  return (
    <StudentsListView
      shown={state === "empty" ? [] : visibleStudents(all, filter, exams, [], now)}
      count={people.length}
      filter={filter}
      onFilter={() => undefined}
    />
  );
}

export function AboutSample({ confirming = false }: { confirming?: boolean }) {
  return <AboutView confirming={confirming} dialogInline />;
}

/** The signed-out and account screens for the screen review page. */
export function WelcomeSample() {
  return <WelcomeView />;
}

export function SignUpSample({
  errors = false,
  instructor = false,
}: {
  errors?: boolean;
  instructor?: boolean;
}) {
  return (
    <SignUpView
      onSubmit={() => "ok"}
      initialTouched={errors}
      initial={{
        name: "",
        email: "",
        role: instructor ? "instructor" : "student",
      }}
    />
  );
}

export function SignInSample({ unknown = false }: { unknown?: boolean }) {
  return (
    <SignInView
      onSubmit={() => "unknown"}
      initialEmail={unknown ? "nobody@example.com" : ""}
      initialUnknown={unknown}
    />
  );
}

export function VerifySample({
  wrong = false,
  filled = false,
}: {
  wrong?: boolean;
  filled?: boolean;
}) {
  return (
    <VerifyView
      email="ana@example.com"
      now={() => 0}
      onVerify={() => false}
      onChangeEmail={() => undefined}
      initialWrong={wrong}
      initialDigits={wrong ? "000000" : filled ? "482913" : ""}
    />
  );
}

export function EditProfileSample() {
  return (
    <EditProfileView
      account={{
        name: "Maryana",
        email: "maryana@example.com",
        role: "student",
      }}
      onSave={() => undefined}
    />
  );
}
