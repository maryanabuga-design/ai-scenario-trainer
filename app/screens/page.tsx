import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { BottomNav } from "@/components/BottomNav/BottomNav";
import { Button } from "@/components/Button/Button";
import { Card } from "@/components/Card/Card";
import { ComingNext } from "@/components/ComingNext/ComingNext";
import { Gradient } from "@/components/Gradient/Gradient";
import { PhoneFrame } from "@/components/PhoneFrame/PhoneFrame";
import { Tag } from "@/components/Tag/Tag";

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="font-serif text-xl">{title}</h2>
      <div className="flex gap-6 overflow-x-auto pb-2">{children}</div>
    </section>
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
        <div className="flex flex-col gap-3">
          <Button>Primary action</Button>
          <div className="flex gap-3">
            <Button variant="secondary">Secondary</Button>
            <Button variant="text">Text</Button>
            <Button disabled>Disabled</Button>
          </div>
        </div>
      </div>
      <BottomNav activePath="/" />
    </>
  );
}

function ComingNextScreen() {
  return (
    <>
      <div className="flex-1 p-4 pt-6">
        <ComingNext title="Progress" />
      </div>
      <BottomNav activePath="/progress" />
    </>
  );
}

export default function Screens() {
  if (process.env.NODE_ENV === "production") notFound();

  return (
    <main className="flex flex-col gap-10 bg-surface-muted p-8">
      <header className="flex flex-col gap-1">
        <h1 className="font-serif text-2xl">Screen review</h1>
        <p className="text-sm text-text-secondary">
          Development only. Every planned screen at 390 by 844. Dashed frames are not built yet.
        </p>
      </header>
      <Group title="Built so far">
        <PhoneFrame label="Foundation kit">
          <FoundationKit />
        </PhoneFrame>
        <PhoneFrame label="Coming next">
          <ComingNextScreen />
        </PhoneFrame>
      </Group>
      <Group title="Materials">
        <PhoneFrame label="Materials list" plannedStep={2} />
        <PhoneFrame label="Upload: choose a file" plannedStep={2} />
        <PhoneFrame label="Upload: processing" plannedStep={2} />
        <PhoneFrame label="Material page" plannedStep={2} />
      </Group>
      <Group title="Scenario session">
        <PhoneFrame label="Session setup" plannedStep={3} />
        <PhoneFrame label="Situation and decision" plannedStep={4} />
        <PhoneFrame label="Confidence check" plannedStep={4} />
        <PhoneFrame label="Explanation and follow-up" plannedStep={4} />
        <PhoneFrame label="Feedback" plannedStep={5} />
      </Group>
      <Group title="Feedback and results">
        <PhoneFrame label="Ask about this step" plannedStep={5} />
        <PhoneFrame label="Results: summary" plannedStep={6} />
        <PhoneFrame label="Results: error analysis" plannedStep={6} />
        <PhoneFrame label="Repeat weak topics" plannedStep={6} />
      </Group>
      <Group title="Sections and onboarding">
        <PhoneFrame label="Home" plannedStep={7} />
        <PhoneFrame label="Progress" plannedStep={8} />
        <PhoneFrame label="Onboarding: choose direction" plannedStep={9} />
        <PhoneFrame label="Onboarding: how it works" plannedStep={9} />
        <PhoneFrame label="Onboarding: example scenario" plannedStep={9} />
      </Group>
      <Group title="Profile">
        <PhoneFrame label="Profile" plannedStep={10} />
        <PhoneFrame label="Reset progress dialog" plannedStep={10} />
      </Group>
    </main>
  );
}
