"use client";

import { ActionBar } from "@/components/ActionBar/ActionBar";
import { BackLink } from "@/components/BackLink/BackLink";
import { Button } from "@/components/Button/Button";
import { ChoiceCard } from "@/components/ChoiceCard/ChoiceCard";
import { Tag } from "@/components/Tag/Tag";
import { scenario, sessionLengths } from "@/lib/scenario";

export type Length = "short" | "full";

const lengths: { id: Length; tag: string; tone: "peach" | "lilac"; summary: string }[] = [
  {
    id: "short",
    tag: "Short",
    tone: "peach",
    summary: "The evacuation: the alarm, a hot door and smoke.",
  },
  {
    id: "full",
    tag: "Full",
    tone: "lilac",
    summary: "The whole story, through first aid to the handover.",
  },
];

export function SessionSetup({
  length,
  onLengthChange,
  onStart,
  replacesUnfinished = false,
}: {
  replacesUnfinished?: boolean;
  length: Length;
  onLengthChange: (length: Length) => void;
  onStart: () => void;
}) {
  return (
    <div className="flex flex-col gap-6">
      <BackLink href="/materials/evacuation-guide" />
      <div className="flex flex-col gap-1">
        <h1 className="font-serif text-2xl">Session setup</h1>
        <p className="text-text-secondary">{scenario.title}</p>
      </div>
      <fieldset className="flex flex-col gap-3">
        <legend className="mb-3 text-sm font-medium">How long do you want to practise?</legend>
        {lengths.map((option) => {
          const { stepIds, minutes } = sessionLengths[option.id];
          return (
            <ChoiceCard
              key={option.id}
              name="length"
              value={option.id}
              checked={length === option.id}
              onChange={(value) => onLengthChange(value as Length)}
            >
              <span className="flex flex-col items-start gap-2">
                <Tag tone={option.tone}>{option.tag}</Tag>
                <span className="text-lg font-medium">
                  <span className="tabular-nums">{stepIds.length}</span> decisions
                </span>
                <span className="text-sm text-text-secondary">
                  About <span className="tabular-nums">{minutes}</span> min (estimate).{" "}
                  {option.summary}
                </span>
              </span>
            </ChoiceCard>
          );
        })}
      </fieldset>
      <p className="text-sm text-text-secondary">
        At each step you choose an action, say how sure you are and explain your choice in one
        sentence.
      </p>
      <ActionBar>
        {replacesUnfinished && (
          <p className="text-center text-sm text-text-secondary">
            Starting replaces your unfinished session.
          </p>
        )}
        <Button onClick={onStart}>Start session</Button>
      </ActionBar>
    </div>
  );
}
