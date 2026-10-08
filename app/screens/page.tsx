import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import MaterialPage from "@/app/(app)/materials/evacuation-guide/page";
import Materials from "@/app/(app)/materials/page";
import { ActionBarProvider, ActionBarSlot } from "@/components/ActionBar/ActionBar";
import { BottomNav } from "@/components/BottomNav/BottomNav";
import { Button } from "@/components/Button/Button";
import { Card } from "@/components/Card/Card";
import { Gradient } from "@/components/Gradient/Gradient";
import { PhoneFrame } from "@/components/PhoneFrame/PhoneFrame";
import { SourceSheetProvider } from "@/components/SourceSheet/SourceSheet";
import { Tag } from "@/components/Tag/Tag";
import { loadGuide } from "@/lib/guide";
import {
  AskSample,
  DecisionSample,
  FeedbackSample,
  HomeSample,
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
      <div data-frame-scroll className="min-h-0 flex-1 overflow-y-auto px-4 pt-6 pb-6">
        {children}
      </div>
      <div className="bg-bg">
        <ActionBarSlot />
        {nav && <BottomNav activePath={nav} />}
      </div>
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
    <SourceSheetProvider sections={loadGuide().sections}>
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
          <PhoneFrame label="Upload: choose a file" plannedStep={2} />
          <PhoneFrame label="Upload: processing" plannedStep={2} />
        </Group>
        <Group title="Scenario session">
          <PhoneFrame label="Session setup">
            <Screen>
              <SetupSample />
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
          <PhoneFrame label="Explanation">
            <Screen>
              <DecisionSample start="complete" />
            </Screen>
          </PhoneFrame>
          <PhoneFrame label="Feedback">
            <Screen>
              <FeedbackSample />
            </Screen>
          </PhoneFrame>
        </Group>
        <Group title="Feedback and results">
          <PhoneFrame label="Ask about this step">
            <Screen>
              <AskSample />
            </Screen>
          </PhoneFrame>
          <PhoneFrame label="Results: summary">
            <Screen>
              <ResultsSample />
            </Screen>
          </PhoneFrame>
          <PhoneFrame label="Results: error analysis">
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
        <Group title="Sections and onboarding">
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
