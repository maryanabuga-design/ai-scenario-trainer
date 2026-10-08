"use client";

import { ActionBar } from "@/components/ActionBar/ActionBar";
import { Button } from "@/components/Button/Button";
import { Card } from "@/components/Card/Card";
import { DirectionPicker } from "@/components/DirectionPicker/DirectionPicker";
import { Gradient } from "@/components/Gradient/Gradient";
import { Tag } from "@/components/Tag/Tag";
import { scenario, sessionLengths } from "@/lib/scenario";

export type OnboardingStep = 0 | 1 | 2;

const titles: [string, string][] = [
  ["Choose a direction.", "Scenarios are built from its study guide."],
  ["How it works.", "Decide, explain, then check against the guide."],
  ["Try an example.", "A ready scenario from the sample guide."],
];

const howItWorks = [
  "Choose an action in a realistic situation.",
  "Say how sure you are.",
  "Explain your choice in one sentence.",
  "Get feedback from the guide: what was right, the error type and the source section.",
];

function TextAction({ onClick, children }: { onClick: () => void; children: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="min-h-11 rounded-full px-3 text-base underline decoration-1 underline-offset-4 hover:decoration-2"
    >
      {children}
    </button>
  );
}

export function OnboardingView({
  step,
  direction,
  onDirectionChange,
  onBack,
  onNext,
  onSkip,
  onTry,
}: {
  step: OnboardingStep;
  direction: string;
  onDirectionChange: (id: string) => void;
  onBack: () => void;
  onNext: () => void;
  onSkip: () => void;
  onTry: () => void;
}) {
  const [first, second] = titles[step];

  return (
    <div className="flex flex-col gap-6">
      <Gradient tone="warm" className="-mx-4 -mt-6 flex flex-col gap-8 px-4 pt-4 pb-10">
        <div className="flex min-h-11 items-center justify-between">
          <div className="-ml-3">{step > 0 && <TextAction onClick={onBack}>Back</TextAction>}</div>
          <div className="flex items-center gap-3">
            <span className="text-sm tabular-nums">Step {step + 1} of 3</span>
            <div className="-mr-3">
              <TextAction onClick={onSkip}>Skip</TextAction>
            </div>
          </div>
        </div>
        <h1 className="text-3xl leading-tight font-medium">
          {first} <span className="text-text-secondary">{second}</span>
        </h1>
      </Gradient>

      {step === 0 && (
        <DirectionPicker value={direction} onChange={onDirectionChange} legend="Your direction" />
      )}

      {step === 1 && (
        <div className="flex flex-col gap-6">
          <ol className="flex flex-col gap-4">
            {howItWorks.map((point, index) => (
              <li key={point} className="flex gap-4">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface font-medium tabular-nums">
                  {index + 1}
                </span>
                <span className="pt-1">{point}</span>
              </li>
            ))}
          </ol>
          <p className="text-sm text-text-secondary">
            AI behavior is simulated in this prototype: every answer comes from a prepared scenario
            built from the guide.
          </p>
        </div>
      )}

      {step === 2 && (
        <Card className="flex flex-col gap-3">
          <div>
            <Tag tone="yellow">Scenario</Tag>
          </div>
          <h2 className="font-serif text-xl">{scenario.title}</h2>
          <p className="font-serif">{scenario.steps[0].narrative}</p>
          <p className="text-sm text-text-secondary">
            <span className="tabular-nums">{sessionLengths.full.stepIds.length}</span> decisions,
            about <span className="tabular-nums">{sessionLengths.full.minutes}</span> min, or a
            short session of{" "}
            <span className="tabular-nums">{sessionLengths.short.stepIds.length}</span>.
          </p>
        </Card>
      )}

      <ActionBar>
        {step < 2 ? (
          <Button onClick={onNext}>Continue</Button>
        ) : (
          <>
            <Button onClick={onTry}>Try it</Button>
            <Button variant="text" onClick={onSkip}>
              Go to Home
            </Button>
          </>
        )}
      </ActionBar>
    </div>
  );
}
