import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import MaterialPage from "@/app/(app)/materials/evacuation-guide/page";
import Materials from "@/app/(app)/materials/page";
import { ActionBarProvider, ActionBarSlot } from "@/components/ActionBar/ActionBar";
import { AskAiProvider } from "@/components/AskAi/AskAi";
import { defaultSetup } from "@/components/SessionSetup/SessionSetup";
import { BottomNav } from "@/components/BottomNav/BottomNav";
import { Button } from "@/components/Button/Button";
import { Card } from "@/components/Card/Card";
import { Gradient } from "@/components/Gradient/Gradient";
import { PhoneFrame } from "@/components/PhoneFrame/PhoneFrame";
import { SourceSheetProvider } from "@/components/SourceSheet/SourceSheet";
import { Tag } from "@/components/Tag/Tag";
import { loadAllSections } from "@/lib/guide";
import {
  ChatDecideSample,
  ChatFeedbackSample,
  DecisionSample,
  AnalysisSample,
  EmptyStatesSample,
  ErrorTypesSample,
  ExplainSample,
  CreateTrainingSample,
  GeneratingSample,
  FloodResultsSample,
  FloodSetupSample,
  FloodStepSample,
  HomeSample,
  TopicIconsSample,
  WeakTopicsSample,
  ReviewSample,
  QuestionSheetSample,
  StepSheetSample,
  QuizResultsSample,
  QuizSample,
  NotesMaterialSample,
  UploadSample,
  OnboardingSample,
  ProfileSample,
  ProgressSample,
  RepeatSample,
  ResultsSample,
  SetupSample,
} from "./samples";

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section
      id={title.toLowerCase().replace(/ /g, "-")}
      className="flex scroll-mt-4 flex-col gap-3"
    >
      <h2 className="font-serif text-xl">{title}</h2>
      <div className="flex gap-6 overflow-x-auto pb-2">{children}</div>
    </section>
  );
}

/** One app screen inside a frame: scrolling content, then the action bar slot and optional navigation. */
function Screen({ nav, children }: { nav?: string; children: ReactNode }) {
  return (
    <ActionBarProvider>
      <AskAiProvider inline>
        <div data-frame-scroll className="min-h-0 flex-1 overflow-y-auto px-4 pt-6 pb-6">
          {children}
        </div>
        <div className="bg-bg">
          <ActionBarSlot />
          {nav && <BottomNav activePath={nav} />}
        </div>
      </AskAiProvider>
    </ActionBarProvider>
  );
}

function FoundationKit() {
  return (
    <>
      <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-4">
        <h1 className="font-serif text-2xl">Foundation kit</h1>
        <Gradient tone="warm" className="flex h-32 items-end rounded-card p-4">
          <p className="font-serif text-xl">Warm gradient zone</p>
        </Gradient>
        <Gradient tone="cool" className="flex h-32 items-end rounded-card p-4">
          <p className="font-serif text-xl">Cool gradient zone</p>
        </Gradient>
        <Card>
          <p className="text-sm text-text-secondary">Card</p>
          <p className="font-serif text-xl">White card, 24px radius</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Tag tone="yellow">Scenario</Tag>
            <Tag tone="peach">Short</Tag>
            <Tag tone="blue">Material</Tag>
            <Tag tone="lilac">S2</Tag>
          </div>
        </Card>
        <div className="flex flex-col gap-6">
          <Button>Primary action</Button>
          <div className="flex flex-wrap items-center gap-4">
            <Button variant="secondary">Secondary</Button>
            <Button variant="text">Text</Button>
            <Button variant="secondary" disabled>
              Disabled
            </Button>
          </div>
        </div>
      </div>
      <BottomNav activePath="/" />
    </>
  );
}

export default function Screens() {
  if (process.env.NODE_ENV === "production") notFound();

  return (
    <SourceSheetProvider sections={loadAllSections()}>
      <main className="flex flex-col gap-10 bg-surface-muted p-8">
        <header className="flex flex-col gap-1">
          <h1 className="font-serif text-2xl">Screen review</h1>
          <p className="text-sm text-text-secondary">
            Development only. Every planned screen at 390 by 844. Dashed frames are not built yet.
          </p>
        </header>
        <Group title="Foundation">
          <PhoneFrame label="Foundation kit">
            <FoundationKit />
          </PhoneFrame>
        </Group>
        <Group title="Materials">
          <PhoneFrame label="Materials list">
            <Screen nav="/materials">
              <Materials />
            </Screen>
          </PhoneFrame>
          <PhoneFrame label="Material page">
            <Screen nav="/materials">
              <MaterialPage />
            </Screen>
          </PhoneFrame>
          <PhoneFrame label="Material without a scenario">
            <Screen nav="/materials">
              <NotesMaterialSample />
            </Screen>
          </PhoneFrame>
          <PhoneFrame label="Upload: choose a file">
            <Screen nav="/materials">
              <UploadSample state="choose" />
            </Screen>
          </PhoneFrame>
          <PhoneFrame label="Upload: progress">
            <Screen nav="/materials">
              <UploadSample state="progress" />
            </Screen>
          </PhoneFrame>
          <PhoneFrame label="Upload: failed">
            <Screen nav="/materials">
              <UploadSample state="failed" />
            </Screen>
          </PhoneFrame>
        </Group>
        <Group title="Create training">
          <PhoneFrame label="Create training">
            <Screen>
              <CreateTrainingSample />
            </Screen>
          </PhoneFrame>
          <PhoneFrame label="Create training: too short">
            <Screen>
              <CreateTrainingSample short />
            </Screen>
          </PhoneFrame>
          <PhoneFrame label="Generating">
            <Screen>
              <GeneratingSample />
            </Screen>
          </PhoneFrame>
          <PhoneFrame label="Review training">
            <Screen>
              <ReviewSample />
            </Screen>
          </PhoneFrame>
        </Group>
        <Group title="Scenario session">
          <PhoneFrame label="Session setup">
            <Screen>
              <SetupSample />
            </Screen>
          </PhoneFrame>
          <PhoneFrame label="Session setup: quiz">
            <Screen>
              <SetupSample
                start={{
                  ...defaultSetup,
                  mode: "quiz",
                  sections: ["S1", "S2", "S3"],
                  countChoice: "custom",
                  customCount: 6,
                }}
              />
            </Screen>
          </PhoneFrame>
          <PhoneFrame label="Situation and decision">
            <Screen>
              <DecisionSample start="empty" />
            </Screen>
          </PhoneFrame>
          <PhoneFrame label="Confidence check">
            <Screen>
              <DecisionSample start="option" />
            </Screen>
          </PhoneFrame>
          <PhoneFrame label="Decision: ready to continue">
            <Screen>
              <DecisionSample start="complete" />
            </Screen>
          </PhoneFrame>
          <PhoneFrame label="Explain: the docked input">
            <Screen>
              <ExplainSample />
            </Screen>
          </PhoneFrame>
        </Group>
        <Group title="Answer sheet: scenario">
          <PhoneFrame label="Sheet: correct, with your explanation">
            <Screen>
              <StepSheetSample
                stepId="s1"
                optionId="b"
                explanation="The alarm is real, so we take the stairs, not the lift, and leave our things behind."
                index={0}
              />
            </Screen>
          </PhoneFrame>
          <PhoneFrame label="Sheet: incorrect, with your explanation">
            <Screen>
              <StepSheetSample
                stepId="s2"
                optionId="b"
                explanation="Waiting is safer than walking into fire."
                index={1}
              />
            </Screen>
          </PhoneFrame>
          <PhoneFrame label="Sheet: I don't know">
            <Screen>
              <StepSheetSample stepId="s3" optionId="a" index={2} />
            </Screen>
          </PhoneFrame>
        </Group>
        <Group title="Quiz questions">
          <PhoneFrame label="Quiz: single choice">
            <Screen>
              <QuizSample questionId="q-s1-1" index={0} />
            </Screen>
          </PhoneFrame>
          <PhoneFrame label="Quiz: multiple choice">
            <Screen>
              <QuizSample
                questionId="q-s1-3"
                index={1}
                response={{ type: "multiple", optionIds: ["a", "c"] }}
              />
            </Screen>
          </PhoneFrame>
          <PhoneFrame label="Quiz: ordering">
            <Screen>
              <QuizSample questionId="q-s2-3" index={2} />
            </Screen>
          </PhoneFrame>
          <PhoneFrame label="Quiz: short text">
            <Screen>
              <QuizSample
                questionId="q-s2-1"
                index={3}
                response={{ type: "text", text: "back of my hand" }}
              />
            </Screen>
          </PhoneFrame>
          <PhoneFrame label="Quiz: true or false">
            <Screen>
              <QuizSample
                questionId="q-s1-2"
                index={4}
                response={{ type: "truefalse", value: false }}
              />
            </Screen>
          </PhoneFrame>
        </Group>
        <Group title="Answer sheet: quiz">
          <PhoneFrame label="Single choice: correct">
            <Screen>
              <QuestionSheetSample
                questionId="q-s1-1"
                response={{ type: "single", optionId: "b" }}
              />
            </Screen>
          </PhoneFrame>
          <PhoneFrame label="Single choice: incorrect, no confidence">
            <Screen>
              <QuestionSheetSample
                questionId="q-s1-1"
                response={{ type: "single", optionId: "a" }}
              />
            </Screen>
          </PhoneFrame>
          <PhoneFrame label="Single choice: incorrect, very confident">
            <Screen>
              <QuestionSheetSample
                questionId="q-s1-1"
                response={{ type: "single", optionId: "a" }}
                confidence={3}
              />
            </Screen>
          </PhoneFrame>
          <PhoneFrame label="Multiple choice: partly right">
            <Screen>
              <QuestionSheetSample
                questionId="q-s1-3"
                response={{ type: "multiple", optionIds: ["a", "b", "c"] }}
              />
            </Screen>
          </PhoneFrame>
          <PhoneFrame label="Ordering: partly right">
            <Screen>
              <QuestionSheetSample
                questionId="q-s2-3"
                response={{ type: "ordering", order: ["a", "b", "d", "c"] }}
              />
            </Screen>
          </PhoneFrame>
          <PhoneFrame label="True or false: incorrect">
            <Screen>
              <QuestionSheetSample
                questionId="q-s1-2"
                response={{ type: "truefalse", value: true }}
              />
            </Screen>
          </PhoneFrame>
          <PhoneFrame label="Short text: correct">
            <Screen>
              <QuestionSheetSample
                questionId="q-s2-1"
                response={{ type: "text", text: "The back of my hand" }}
              />
            </Screen>
          </PhoneFrame>
          <PhoneFrame label="Short text: doesn't match">
            <Screen>
              <QuestionSheetSample
                questionId="q-s2-1"
                response={{ type: "text", text: "With my knuckles" }}
              />
            </Screen>
          </PhoneFrame>
          <PhoneFrame label="Short text: marked correct by you">
            <Screen>
              <QuestionSheetSample
                questionId="q-s2-1"
                response={{ type: "text", text: "With my knuckles" }}
                marked
              />
            </Screen>
          </PhoneFrame>
          <PhoneFrame label="Short text: I don't know">
            <Screen>
              <QuestionSheetSample
                questionId="q-s2-1"
                response={{ type: "text", text: "" }}
                dontKnow
              />
            </Screen>
          </PhoneFrame>
          <PhoneFrame label="Quiz results">
            <Screen>
              <QuizResultsSample />
            </Screen>
          </PhoneFrame>
        </Group>
        <Group title="Flood material">
          <PhoneFrame label="Flood: session setup">
            <Screen>
              <FloodSetupSample />
            </Screen>
          </PhoneFrame>
          <PhoneFrame label="Flood: decision step">
            <Screen>
              <FloodStepSample />
            </Screen>
          </PhoneFrame>
          <PhoneFrame label="Flood: results">
            <Screen>
              <FloodResultsSample />
            </Screen>
          </PhoneFrame>
        </Group>
        <Group title="Results">
          <PhoneFrame label="Error analysis">
            <Screen>
              <AnalysisSample />
            </Screen>
          </PhoneFrame>
          <PhoneFrame label="Error analysis: incorrect answers">
            <Screen>
              <AnalysisSample filter="incorrect" />
            </Screen>
          </PhoneFrame>
          <PhoneFrame label="Error types card">
            <Screen>
              <ErrorTypesSample />
            </Screen>
          </PhoneFrame>
          <PhoneFrame label="Results: summary">
            <Screen>
              <ResultsSample />
            </Screen>
          </PhoneFrame>
          <PhoneFrame label="Results: end of the page">
            <Screen>
              <ResultsSample scrolled />
            </Screen>
          </PhoneFrame>
          <PhoneFrame label="Repeat weak topics">
            <Screen>
              <RepeatSample />
            </Screen>
          </PhoneFrame>
        </Group>
        <Group title="Ask AI">
          <PhoneFrame label="Ask AI: decision step">
            <Screen>
              <ChatDecideSample />
            </Screen>
          </PhoneFrame>
          <PhoneFrame label="Ask AI: after feedback">
            <Screen>
              <ChatFeedbackSample />
            </Screen>
          </PhoneFrame>
        </Group>
        <Group title="Home and progress">
          <PhoneFrame label="Home: first visit">
            <Screen nav="/">
              <HomeSample />
            </Screen>
          </PhoneFrame>
          <PhoneFrame label="Home: with progress">
            <Screen nav="/">
              <HomeSample withProgress />
            </Screen>
          </PhoneFrame>
          <PhoneFrame label="Weak topics">
            <Screen>
              <WeakTopicsSample />
            </Screen>
          </PhoneFrame>
          <PhoneFrame label="Weak topics: empty">
            <Screen>
              <WeakTopicsSample empty />
            </Screen>
          </PhoneFrame>
          <PhoneFrame label="Progress: first visit">
            <Screen nav="/progress">
              <ProgressSample />
            </Screen>
          </PhoneFrame>
          <PhoneFrame label="Progress: with history">
            <Screen nav="/progress">
              <ProgressSample withHistory />
            </Screen>
          </PhoneFrame>
        </Group>
        <Group title="Cards and icons">
          <PhoneFrame label="Topic icons and tile colours">
            <Screen nav="/">
              <TopicIconsSample />
            </Screen>
          </PhoneFrame>
          <PhoneFrame label="Empty states">
            <Screen nav="/">
              <EmptyStatesSample />
            </Screen>
          </PhoneFrame>
        </Group>
        <Group title="Onboarding">
          <PhoneFrame label="Onboarding: choose direction">
            <Screen>
              <OnboardingSample start={0} />
            </Screen>
          </PhoneFrame>
          <PhoneFrame label="Onboarding: how it works">
            <Screen>
              <OnboardingSample start={1} />
            </Screen>
          </PhoneFrame>
          <PhoneFrame label="Onboarding: example scenario">
            <Screen>
              <OnboardingSample start={2} />
            </Screen>
          </PhoneFrame>
        </Group>
        <Group title="Profile">
          <PhoneFrame label="Profile">
            <Screen nav="/profile">
              <ProfileSample />
            </Screen>
          </PhoneFrame>
          <PhoneFrame label="Reset progress dialog">
            <Screen nav="/profile">
              <ProfileSample confirming />
            </Screen>
          </PhoneFrame>
        </Group>
      </main>
    </SourceSheetProvider>
  );
}
