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
import { PhoneFrame } from "@/components/PhoneFrame/PhoneFrame";
import { SourceSheetProvider } from "@/components/SourceSheet/SourceSheet";
import { Tag } from "@/components/Tag/Tag";
import { loadAllSections } from "@/lib/guide";
import {
  ChatFeedbackSample,
  SessionSample,
  ButtonsSample,
  ChipTonesSample,
  PaletteSample,
  EmptyStatesSample,
  CreateTrainingSample,
  GeneratingSample,
  FloodResultsSample,
  FloodSetupSample,
  FloodStepSample,
  HomeSample,
  MaterialTypesSample,
  TopicIconsSample,
  WeakTopicsSample,
  ReviewSample,
  AnswerReviewSample,
  Media3DSample,
  NotesMaterialSample,
  UploadSample,
  OnboardingSample,
  ProfileSample,
  ProgressSample,
  ResultsSample,
  ResultsButtonsSample,
  SetupSample,
} from "./samples";

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section
      id={title.toLowerCase().replace(/ /g, "-")}
      className="flex scroll-mt-4 flex-col gap-3"
    >
      <h2 className="type-card-title">{title}</h2>
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

/** Every named text style from DESIGN.md (Typography), as the screens use them. */
function TextStyles() {
  const styles = [
    ["type-display", "Display headline"],
    ["type-display-sub", "Display sub-line"],
    ["type-page-title", "Page title"],
    ["type-card-title", "Card title"],
    ["type-item-title", "Item title"],
    ["type-body", "Body text for reading"],
    ["type-body-strong", "Body strong"],
    ["type-small text-text-secondary", "Grey secondary text"],
    ["type-label", "Uppercase label"],
    ["type-numeral", "28"],
    ["type-button", "Button label"],
    ["type-action", "Small action (tertiary button)"],
    ["type-caption", "Small caption"],
  ];
  return (
    <ul className="flex flex-1 flex-col gap-3 overflow-y-auto p-4">
      {styles.map(([className, sample]) => (
        <li key={className} className="flex flex-col">
          <span className="type-caption text-text-secondary">{className}</span>
          <span className={className}>{sample}</span>
        </li>
      ))}
    </ul>
  );
}

function FoundationKit() {
  return (
    <>
      <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-4">
        <h1 className="type-page-title">Foundation kit</h1>
        <Card>
          <p className="type-small text-text-secondary">Card</p>
          <p className="type-card-title">White card, 24px radius</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Tag tone="yellow">Scenario</Tag>
            <Tag tone="peach">Short</Tag>
            <Tag tone="blue">Material</Tag>
            <Tag tone="lilac">S2</Tag>
          </div>
        </Card>
        <div className="flex flex-col gap-3">
          <Button>Primary action</Button>
          <Button variant="secondary">Secondary action</Button>
          <div className="-ml-3">
            <Button variant="tertiary">Tertiary action</Button>
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
          <h1 className="type-page-title">Screen review</h1>
          <p className="type-small text-text-secondary">
            Development only. Every planned screen at 390 by 844. Dashed frames are not built yet.
          </p>
        </header>
        <Group title="Buttons">
          <PhoneFrame label="Buttons: three types in every state">
            <Screen>
              <ButtonsSample />
            </Screen>
          </PhoneFrame>
        </Group>
        <Group title="Palette">
          <PhoneFrame label="Pastel palette: six tones and sand, with ΔE">
            <Screen>
              <PaletteSample />
            </Screen>
          </PhoneFrame>
        </Group>
        <Group title="Chips">
          <PhoneFrame label="Chips: every tone and status, no strokes">
            <Screen>
              <ChipTonesSample />
            </Screen>
          </PhoneFrame>
        </Group>
        <Group title="Foundation">
          <PhoneFrame label="Foundation kit">
            <FoundationKit />
          </PhoneFrame>
          <PhoneFrame label="Text styles">
            <TextStyles />
          </PhoneFrame>
        </Group>
        <Group title="Materials">
          <PhoneFrame label="Materials list">
            <Screen nav="/materials">
              <Materials />
            </Screen>
          </PhoneFrame>
          <PhoneFrame label="Material types: PDF, DOCX and an example LINK">
            <Screen nav="/materials">
              <MaterialTypesSample />
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
        <Group title="Session setup">
          <PhoneFrame label="Session setup: scenario">
            <Screen>
              <SetupSample />
            </Screen>
          </PhoneFrame>
          <PhoneFrame label="Session setup: quiz (shuffle)">
            <Screen>
              <SetupSample start={{ ...defaultSetup, mode: "quiz", length: 20 }} />
            </Screen>
          </PhoneFrame>
          <PhoneFrame label="Session setup: first visit, nothing to repeat">
            <Screen>
              <SetupSample withHistory={false} weakSectionIds={[]} />
            </Screen>
          </PhoneFrame>
          <PhoneFrame label="Session setup: flood guide (all 3)">
            <Screen>
              <FloodSetupSample />
            </Screen>
          </PhoneFrame>
        </Group>
        <Group title="Question session">
          <PhoneFrame label="Question 1: nothing chosen (Back leaves, strip, Next only)">
            <Screen>
              <SessionSample />
            </Screen>
          </PhoneFrame>
          <PhoneFrame label="Question 3: chosen, ready for Next">
            <Screen>
              <SessionSample itemId="s3" index={2} answered={[0, 1]} choice="a" />
            </Screen>
          </PhoneFrame>
          <PhoneFrame label="Back to question 2: the stored choice is filled in">
            <Screen>
              <SessionSample itemId="s2" index={1} answered={[0, 1, 2]} choice="c" />
            </Screen>
          </PhoneFrame>
          <PhoneFrame label="Quiz question 4 of 10">
            <Screen>
              <SessionSample
                itemId="q-s3-3"
                kind="quiz"
                index={3}
                answered={[0, 1, 2]}
                choice="b"
              />
            </Screen>
          </PhoneFrame>
          <PhoneFrame label="Last question: Finish">
            <Screen>
              <SessionSample
                itemId="s6"
                index={9}
                answered={[0, 1, 2, 3, 4, 5, 6, 7, 8]}
                choice="c"
              />
            </Screen>
          </PhoneFrame>
          <PhoneFrame label="Flood: question 1 of 3">
            <Screen>
              <FloodStepSample />
            </Screen>
          </PhoneFrame>
        </Group>
        <Group title="Answer review">
          <PhoneFrame label="Review: with the right and wrong strip, the person was right">
            <Screen>
              <AnswerReviewSample itemId="s1" choice="b" />
            </Screen>
          </PhoneFrame>
          <PhoneFrame label="Review: the person was wrong">
            <Screen>
              <AnswerReviewSample itemId="s1" choice="d" />
            </Screen>
          </PhoneFrame>
          <PhoneFrame label="Review: a quiz question, wrong">
            <Screen>
              <AnswerReviewSample itemId="q-s3-3" choice="a" position={4} />
            </Screen>
          </PhoneFrame>
        </Group>
        <Group title="Results">
          <PhoneFrame label="Results: Not passed yet">
            <Screen>
              <ResultsSample />
            </Screen>
          </PhoneFrame>
          <PhoneFrame label="Results: Passed">
            <Screen>
              <ResultsSample passed />
            </Screen>
          </PhoneFrame>
          <PhoneFrame label="Results: end of the page">
            <Screen>
              <ResultsSample scrolled />
            </Screen>
          </PhoneFrame>
          <PhoneFrame label="Results: the button pair at three widths">
            <Screen>
              <ResultsButtonsSample />
            </Screen>
          </PhoneFrame>
          <PhoneFrame label="Flood: results">
            <Screen>
              <FloodResultsSample />
            </Screen>
          </PhoneFrame>
        </Group>
        <Group title="3D placeholders">
          <PhoneFrame label="Media3D: hero, step and icon; Toggle">
            <Screen>
              <Media3DSample />
            </Screen>
          </PhoneFrame>
        </Group>
        <Group title="Ask AI">
          <PhoneFrame label="Ask AI: in the Answer review">
            <Screen>
              <ChatFeedbackSample />
            </Screen>
          </PhoneFrame>
        </Group>
        <Group title="Home and progress">
          <PhoneFrame label="Home: first visit">
            <Screen nav="/">
              <HomeSample state="first" />
            </Screen>
          </PhoneFrame>
          <PhoneFrame label="Home: topics to repeat">
            <Screen nav="/">
              <HomeSample state="repeat" />
            </Screen>
          </PhoneFrame>
          <PhoneFrame label="Home: continue a session">
            <Screen nav="/">
              <HomeSample state="continue" />
            </Screen>
          </PhoneFrame>
          <PhoneFrame label="Home: all repeated">
            <Screen nav="/">
              <HomeSample state="new" />
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
          <PhoneFrame label="Progress: no data">
            <Screen nav="/progress">
              <ProgressSample />
            </Screen>
          </PhoneFrame>
          <PhoneFrame label="Progress: exactly one session">
            <Screen nav="/progress">
              <ProgressSample sessions={1} />
            </Screen>
          </PhoneFrame>
          <PhoneFrame label="Progress: with history">
            <Screen nav="/progress">
              <ProgressSample withHistory />
            </Screen>
          </PhoneFrame>
          <PhoneFrame label="Progress: 12 sessions, 5 shown with See more">
            <Screen nav="/progress">
              <ProgressSample sessions={12} />
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
          <PhoneFrame label="Onboarding: step 1, practise a decision">
            <Screen>
              <OnboardingSample start={0} />
            </Screen>
          </PhoneFrame>
          <PhoneFrame label="Onboarding: step 2, explain it">
            <Screen>
              <OnboardingSample start={1} />
            </Screen>
          </PhoneFrame>
          <PhoneFrame label="Onboarding: step 3, see what to repeat">
            <Screen>
              <OnboardingSample start={2} />
            </Screen>
          </PhoneFrame>
          <PhoneFrame label="Onboarding: ready to start">
            <Screen>
              <OnboardingSample start={3} />
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
