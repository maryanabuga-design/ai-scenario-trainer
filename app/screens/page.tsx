import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import Materials from "@/app/(app)/materials/page";
import { ActionBarProvider, ActionBarSlot } from "@/components/ActionBar/ActionBar";
import { AskAiProvider } from "@/components/AskAi/AskAi";
import { StepsList } from "@/components/StepsView/StepsList";
import { BottomNav } from "@/components/BottomNav/BottomNav";
import type { Role } from "@/lib/role";
import { Button } from "@/components/Button/Button";
import { Card } from "@/components/Card/Card";
import { ReadingView } from "@/components/ReadingView/ReadingView";
import { PhoneFrame } from "@/components/PhoneFrame/PhoneFrame";
import { SourceSheetProvider } from "@/components/SourceSheet/SourceSheet";
import { Tag } from "@/components/Tag/Tag";
import { loadAllSections, loadGuides } from "@/lib/guide";
import { stepsFor, topicFor } from "@/lib/materials-topics";
import { canPractise } from "@/lib/parts";
import {
  ChatFeedbackSample,
  SessionSample,
  SavedSample,
  SavedQuestionSample,
  ButtonsSample,
  ChipTonesSample,
  PaletteSample,
  EmptyStatesSample,
  CreateTrainingSample,
  GeneratingSample,
  FloodResultsSample,
  FloodStepSample,
  ExamIntroSample,
  ExamLeaveSample,
  ExamResultsSample,
  HighlightSample,
  QuickBarSample,
  StepsTopicSample,
  HomeSample,
  NotificationsSample,
  MaterialTypesSample,
  WeakTopicsSample,
  ReviewSample,
  AnswerReviewSample,
  Media3DSample,
  NotesMaterialSample,
  UploadSample,
  OnboardingSample,
  ProfileSample,
  InstructorHomeSample,
  AboutSample,
  WelcomeSample,
  SignUpSample,
  SignInSample,
  VerifySample,
  EditProfileSample,
  ProgressSample,
  ResultsSample,
  ResultsButtonsSample,
  TrainingSample,
  MiniQuizSample,
} from "./samples";

/** A reading screen built from the real guide, as the route builds it. */
function ReadingExample({ id }: { id: string }) {
  const topic = topicFor(id)!;
  const steps = stepsFor(id);
  return (
    <ReadingView
      topic={{
        id: topic.id,
        title: topic.title,
        guideTitle: topic.guideTitle,
        minutes: topic.minutes,
        body: topic.section.body,
        canPractise: canPractise(id),
        stepsHref: steps ? `/checklists/${steps.id}` : null,
        position: Number(id.slice(1)),
        total: id.startsWith("F") ? 7 : 10,
        previous: topic.previous ? { id: topic.previous.id, title: topic.previous.title } : null,
        next: topic.next ? { id: topic.next.id, title: topic.next.title } : null,
      }}
    />
  );
}

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
function Screen({ nav, role, children }: { nav?: string; role?: Role; children: ReactNode }) {
  return (
    <ActionBarProvider>
      <AskAiProvider inline>
        <div
          data-frame-scroll
          className="flex min-h-0 flex-1 flex-col overflow-y-auto px-4 pt-6 pb-6"
        >
          {children}
        </div>
        <div className="bg-bg">
          <ActionBarSlot />
          {nav && <BottomNav activePath={nav} role={role} />}
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
          <PhoneFrame label="Reading screen: S1, the first topic (a long text: the two buttons follow it)">
            <Screen>
              <ReadingExample id="S1" />
            </Screen>
          </PhoneFrame>
          <PhoneFrame label="Reading screen: S2, a short topic (the two buttons at the bottom)">
            <Screen>
              <ReadingExample id="S2" />
            </Screen>
          </PhoneFrame>
          <PhoneFrame label="Reading: the quick-actions bar over the text (Steps and Practise this topic)">
            <Screen>
              <ReadingExample id="S1" />
            </Screen>
            <QuickBarSample stepsHref="/checklists/leaving-a-building" />
          </PhoneFrame>
          <PhoneFrame label="Reading: the quick-actions bar for a topic without steps (Practise only)">
            <Screen>
              <ReadingExample id="S9" />
            </Screen>
            <QuickBarSample stepsHref={null} />
          </PhoneFrame>
          <PhoneFrame label="Reading screen: S10, the last topic (no bottom navigation)">
            <Screen>
              <ReadingExample id="S10" />
            </Screen>
          </PhoneFrame>
          <PhoneFrame label="Reading: toolbar on a new selection (Highlight, Copy)">
            <Screen>
              <HighlightSample markdown={loadGuides()[0].sections[0].body} state="selection" />
            </Screen>
          </PhoneFrame>
          <PhoneFrame label="Reading: two highlights, toolbar on an existing one (Unhighlight, Copy)">
            <Screen>
              <HighlightSample markdown={loadGuides()[0].sections[0].body} state="highlight" />
            </Screen>
          </PhoneFrame>
          <PhoneFrame label="Reading: the Copied state">
            <Screen>
              <HighlightSample markdown={loadGuides()[0].sections[0].body} state="copied" />
            </Screen>
          </PhoneFrame>
          <PhoneFrame label="Reading screen: a flood topic (no Practise or Steps: just the text)">
            <Screen>
              <ReadingExample id="F5" />
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
        <Group title="Training">
          <PhoneFrame label="Training: Scenario, nothing done yet">
            <Screen nav="/">
              <TrainingSample />
            </Screen>
          </PhoneFrame>
          <PhoneFrame label="Training: top, with the Continue card and an exam card (3D pictures)">
            <Screen nav="/">
              <TrainingSample cards />
            </Screen>
          </PhoneFrame>
          <PhoneFrame label="Training: Scenario, with some progress">
            <Screen nav="/">
              <TrainingSample progress />
            </Screen>
          </PhoneFrame>
          <PhoneFrame label="Training: Quiz, with the Mini-quiz card">
            <Screen nav="/">
              <TrainingSample mode="quiz" progress />
            </Screen>
          </PhoneFrame>
        </Group>
        <Group title="Exam">
          <PhoneFrame label="Exam screen: readiness below 80% (Not ready yet)">
            <Screen>
              <ExamIntroSample readiness={62} />
            </Screen>
          </PhoneFrame>
          <PhoneFrame label="Exam screen: readiness 80% or more (You're ready), after an attempt">
            <Screen>
              <ExamIntroSample readiness={84} attempted />
            </Screen>
          </PhoneFrame>
          <PhoneFrame label="Exam screen: overdue (clock icon, plain text)">
            <Screen>
              <ExamIntroSample readiness={0} overdue />
            </Screen>
          </PhoneFrame>
          <PhoneFrame label="Exam question with the timer (no hint button)">
            <Screen>
              <SessionSample
                kind="quiz"
                itemId="q-quiz-s01-002"
                index={4}
                answered={[0, 1, 2, 3]}
                choice="b"
                examSeconds={842}
              />
            </Screen>
          </PhoneFrame>
          <PhoneFrame label="Exam question, last 2 minutes (rose timer)">
            <Screen>
              <SessionSample
                kind="quiz"
                itemId="q-quiz-s01-002"
                index={18}
                total={20}
                answered={[0, 1, 2]}
                examSeconds={95}
              />
            </Screen>
          </PhoneFrame>
          <PhoneFrame label="Leave the exam confirmation">
            <Screen>
              <ExamLeaveSample />
            </Screen>
          </PhoneFrame>
          <PhoneFrame label="Exam results">
            <Screen>
              <ExamResultsSample />
            </Screen>
          </PhoneFrame>
        </Group>
        <Group title="Mini-quiz">
          <PhoneFrame label="Mini-quiz: default, every topic selected">
            <Screen>
              <MiniQuizSample />
            </Screen>
          </PhoneFrame>
          <PhoneFrame label="Mini-quiz: two topics selected (7 questions, only 5)">
            <Screen>
              <MiniQuizSample selected={["S1", "S2"]} />
            </Screen>
          </PhoneFrame>
          <PhoneFrame label="Mini-quiz: one topic (All 4)">
            <Screen>
              <MiniQuizSample selected={["S1"]} />
            </Screen>
          </PhoneFrame>
          <PhoneFrame label="Mini-quiz: no topic, Start disabled">
            <Screen>
              <MiniQuizSample selected={[]} />
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
          <PhoneFrame label="Question 3: the hint card open under the options">
            <Screen>
              <SessionSample itemId="s3" index={2} answered={[0, 1]} choice="a" hintOpen />
            </Screen>
          </PhoneFrame>
          <PhoneFrame label="Question 3: saved (filled bookmark)">
            <Screen>
              <SessionSample itemId="s3" index={2} answered={[0, 1]} startSaved />
            </Screen>
          </PhoneFrame>
          <PhoneFrame label="Quiz: True / False (2 options, no picture, no gap)">
            <Screen>
              <SessionSample itemId="q-quiz-s01-002" kind="quiz" index={1} answered={[0]} />
            </Screen>
          </PhoneFrame>
          <PhoneFrame label="Back to question 2: the stored choice is filled in">
            <Screen>
              <SessionSample itemId="s2" index={1} answered={[0, 1, 2]} choice="c" />
            </Screen>
          </PhoneFrame>
          <PhoneFrame label="Checked, correct: green option, check, Correct and Why">
            <Screen>
              <SessionSample itemId="s2" index={1} answered={[0]} choice="c" checked />
            </Screen>
          </PhoneFrame>
          <PhoneFrame label="Checked, wrong: red option, cross, Not quite, the right one revealed and Why">
            <Screen>
              <SessionSample itemId="s2" index={1} answered={[0]} choice="a" checked />
            </Screen>
          </PhoneFrame>
          <PhoneFrame label="Exam question: selected option only, no Check, no colours, no Why">
            <Screen>
              <SessionSample itemId="s2" index={1} answered={[0]} choice="a" examSeconds={842} />
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
              <AnswerReviewSample itemId="q-scn-s01-001" choice="b" />
            </Screen>
          </PhoneFrame>
          <PhoneFrame label="Review: the person was wrong">
            <Screen>
              <AnswerReviewSample itemId="q-scn-s01-001" choice="d" />
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
        <Group title="Saved questions">
          <PhoneFrame label="Saved: empty">
            <Screen>
              <SavedSample empty />
            </Screen>
          </PhoneFrame>
          <PhoneFrame label="Saved: three questions, Repeat saved (3)">
            <Screen>
              <SavedSample />
            </Screen>
          </PhoneFrame>
          <PhoneFrame label="Saved: one question on its own">
            <Screen>
              <SavedQuestionSample />
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
          <PhoneFrame label="Home: first visit (hero card with Choose a topic)">
            <Screen nav="/">
              <HomeSample state="first" />
            </Screen>
          </PhoneFrame>
          <PhoneFrame label="Home: an unfinished session, Continue">
            <Screen nav="/">
              <HomeSample state="continue" />
            </Screen>
          </PhoneFrame>
          <PhoneFrame label="Home: with history and topics to repeat">
            <Screen nav="/">
              <HomeSample state="weak" />
            </Screen>
          </PhoneFrame>
          <PhoneFrame label="Home: nothing to repeat, ready">
            <Screen nav="/">
              <HomeSample state="goal" />
            </Screen>
          </PhoneFrame>
          <PhoneFrame label="Notifications: new messages (the Home header has the bell with a count)">
            <Screen>
              <NotificationsSample state="new" />
            </Screen>
          </PhoneFrame>
          <PhoneFrame label="Notifications: New and Earlier">
            <Screen>
              <NotificationsSample state="mixed" />
            </Screen>
          </PhoneFrame>
          <PhoneFrame label="Notifications: empty state">
            <Screen>
              <NotificationsSample state="empty" />
            </Screen>
          </PhoneFrame>
          <PhoneFrame label="Steps: the list">
            <Screen>
              <StepsList />
            </Screen>
          </PhoneFrame>
          <PhoneFrame label="Steps: a topic, the olive frame, step 1 open">
            <Screen>
              <StepsTopicSample checklistIndex={1} openStep={1} />
            </Screen>
          </PhoneFrame>
          <PhoneFrame label="Steps: a topic, step 3 open">
            <Screen>
              <StepsTopicSample checklistIndex={1} openStep={3} />
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
          <PhoneFrame label="Progress: the assigned exam, one percentage (Readiness), topic cards in number order">
            <Screen nav="/progress">
              <ProgressSample />
            </Screen>
          </PhoneFrame>
          <PhoneFrame label="Progress: no exam assigned (Overall readiness)">
            <Screen nav="/progress">
              <ProgressSample state="no-exam" />
            </Screen>
          </PhoneFrame>
        </Group>
        <Group title="Cards and icons">
          <PhoneFrame label="Empty states">
            <Screen nav="/">
              <EmptyStatesSample />
            </Screen>
          </PhoneFrame>
        </Group>
        <Group title="Onboarding">
          <PhoneFrame label="Onboarding, student: slide 1">
            <Screen>
              <OnboardingSample start={0} />
            </Screen>
          </PhoneFrame>
          <PhoneFrame label="Onboarding, student: slide 2">
            <Screen>
              <OnboardingSample start={1} />
            </Screen>
          </PhoneFrame>
          <PhoneFrame label="Onboarding, student: slide 3 (Get started, no Skip)">
            <Screen>
              <OnboardingSample start={2} />
            </Screen>
          </PhoneFrame>
          <PhoneFrame label="Onboarding, instructor: slide 1">
            <Screen>
              <OnboardingSample role="instructor" start={0} />
            </Screen>
          </PhoneFrame>
        </Group>
        <Group title="Accounts (simulated)">
          <PhoneFrame label="Welcome">
            <Screen>
              <WelcomeSample />
            </Screen>
          </PhoneFrame>
          <PhoneFrame label="Create account: empty">
            <Screen>
              <SignUpSample />
            </Screen>
          </PhoneFrame>
          <PhoneFrame label="Create account: Instructor selected">
            <Screen>
              <SignUpSample instructor />
            </Screen>
          </PhoneFrame>
          <PhoneFrame label="Create account: errors">
            <Screen>
              <SignUpSample errors />
            </Screen>
          </PhoneFrame>
          <PhoneFrame label="Sign in">
            <Screen>
              <SignInSample />
            </Screen>
          </PhoneFrame>
          <PhoneFrame label="Sign in: unknown email">
            <Screen>
              <SignInSample unknown />
            </Screen>
          </PhoneFrame>
          <PhoneFrame label="Verify: the demo code is always shown">
            <Screen>
              <VerifySample />
            </Screen>
          </PhoneFrame>
          <PhoneFrame label="Verify: filled">
            <Screen>
              <VerifySample filled />
            </Screen>
          </PhoneFrame>
          <PhoneFrame label="Verify: wrong code">
            <Screen>
              <VerifySample wrong />
            </Screen>
          </PhoneFrame>
          <PhoneFrame label="Edit profile">
            <Screen>
              <EditProfileSample />
            </Screen>
          </PhoneFrame>
        </Group>
        <Group title="Profile">
          <PhoneFrame label="Profile: Student (Demo mode, Coming soon)">
            <Screen nav="/profile">
              <ProfileSample />
            </Screen>
          </PhoneFrame>
          <PhoneFrame label="Profile: Instructor (no Direction, no Reset progress)">
            <Screen nav="/profile" role="instructor">
              <ProfileSample role="instructor" />
            </Screen>
          </PhoneFrame>
          <PhoneFrame label="About this prototype, with Restart demo">
            <Screen>
              <AboutSample />
            </Screen>
          </PhoneFrame>
          <PhoneFrame label="Restart the demo? confirmation">
            <Screen>
              <AboutSample confirming />
            </Screen>
          </PhoneFrame>
          <PhoneFrame label="Instructor Home (stub), navigation with Home and Profile">
            <Screen nav="/instructor" role="instructor">
              <InstructorHomeSample />
            </Screen>
          </PhoneFrame>
          <PhoneFrame label="Delete account confirmation">
            <Screen nav="/profile">
              <ProfileSample dialog="delete" />
            </Screen>
          </PhoneFrame>
          <PhoneFrame label="Reset progress dialog">
            <Screen nav="/profile">
              <ProfileSample dialog="reset" />
            </Screen>
          </PhoneFrame>
        </Group>
      </main>
    </SourceSheetProvider>
  );
}
