"use client";

import { ListChecks } from "lucide-react";
import { ActionBar } from "@/components/ActionBar/ActionBar";
import { Button, ButtonLink } from "@/components/Button/Button";
import { CircleBackButton } from "@/components/CircleBackButton/CircleBackButton";
import { EmptyState } from "@/components/EmptyState/EmptyState";
import { Media3D } from "@/components/Media3D/Media3D";
import { SelectableCard } from "@/components/SelectableCard/SelectableCard";
import { useTopicName } from "@/components/TopicName/useTopicName";
import { TopicTile } from "@/components/TopicTile/TopicTile";
import type { WeakTopic } from "@/lib/weak-topics";
import { materialForSection, toRepeatLabel } from "@/lib/weak-topics";

function TopicOption({
  topic,
  checked,
  onToggle,
}: {
  topic: WeakTopic;
  checked: boolean;
  onToggle: () => void;
}) {
  const name = useTopicName(topic.sectionId);
  return (
    <SelectableCard
      type="checkbox"
      size="compactRow"
      name="topics"
      value={topic.sectionId}
      checked={checked}
      onChange={onToggle}
    >
      <span className="flex items-center gap-3">
        <Media3D
          variant="icon"
          fallback={<TopicTile sectionId={topic.sectionId} icon={topic.icon} size="compact" />}
        />
        <span className="flex flex-col gap-0.5">
          <span className="type-body-strong">{name}</span>
          <span className="type-small text-text-secondary">
            {materialForSection(topic.sectionId)} · {topic.sectionId} ·{" "}
            <span className="tabular-nums">{toRepeatLabel(topic)}</span>
          </span>
        </span>
      </span>
    </SelectableCard>
  );
}

/** Every weak topic in one flat list, to pick and repeat. */
export function WeakTopicsView({
  topics,
  selected,
  backHref,
  backLabel,
  onToggle,
  onRepeat,
}: {
  topics: WeakTopic[];
  selected: string[];
  backHref: string;
  backLabel: string;
  onToggle: (sectionId: string) => void;
  onRepeat: () => void;
}) {
  if (topics.length === 0) {
    return (
      <div className="flex flex-col items-start gap-6">
        <CircleBackButton href={backHref} label={backLabel} />
        <h1 className="type-page-title">Weak topics</h1>
        <div className="w-full">
          <EmptyState
            icon={ListChecks}
            text="Nothing to repeat. Guide sections with a wrong answer appear here."
            action={<ButtonLink href="/training/evacuation-guide">Start a scenario</ButtonLink>}
          />
        </div>
      </div>
    );
  }

  const count = selected.length;

  return (
    <div className="flex flex-col gap-6">
      <CircleBackButton href={backHref} label={backLabel} />
      <div className="flex flex-col gap-1">
        <h1 className="type-page-title">Weak topics</h1>
        <p className="text-text-secondary">
          Choose the topics to repeat. A repeat round brings back the questions you answered wrong.
        </p>
      </div>

      <fieldset className="flex flex-col gap-2">
        <legend className="sr-only">Weak topics</legend>
        {topics.map((topic) => (
          <TopicOption
            key={topic.sectionId}
            topic={topic}
            checked={selected.includes(topic.sectionId)}
            onToggle={() => onToggle(topic.sectionId)}
          />
        ))}
      </fieldset>

      <ActionBar>
        {count === 0 && (
          <p className="type-small text-center text-text-secondary">
            Choose at least one topic to repeat.
          </p>
        )}
        <Button disabled={count === 0} onClick={onRepeat}>
          Repeat selected (<span className="tabular-nums">{count}</span>)
        </Button>
      </ActionBar>
    </div>
  );
}
