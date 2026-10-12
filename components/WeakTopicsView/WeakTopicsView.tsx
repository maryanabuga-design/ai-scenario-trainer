"use client";

import { ListChecks } from "lucide-react";
import { ActionBar } from "@/components/ActionBar/ActionBar";
import { BackLink } from "@/components/BackLink/BackLink";
import { Button, ButtonLink } from "@/components/Button/Button";
import { ChoiceCard } from "@/components/ChoiceCard/ChoiceCard";
import { EmptyState } from "@/components/EmptyState/EmptyState";
import { StatusIcon } from "@/components/StatusBadge/StatusBadge";
import { useTopicName } from "@/components/TopicCard/TopicCard";
import type { ErrorType } from "@/lib/scoring";
import type { WeakTopic } from "@/lib/weak-topics";
import { materialForSection, weakPriority } from "@/lib/weak-topics";

const groupTitles: Record<ErrorType, string> = {
  misconception: "Misconceptions",
  knowledge_gap: "Knowledge gaps",
  guess: "Guesses",
  secure: "Secure",
};

const iconColours: Record<ErrorType, string> = {
  misconception: "text-wrong",
  knowledge_gap: "text-caution",
  guess: "text-text-secondary",
  secure: "text-correct",
};

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
    <ChoiceCard
      type="checkbox"
      name="topics"
      value={topic.sectionId}
      checked={checked}
      onChange={onToggle}
    >
      <span className="flex flex-col gap-0.5">
        <span className="font-medium">{name}</span>
        <span className="text-xs text-text-secondary">
          {materialForSection(topic.sectionId)} · {topic.sectionId} ·{" "}
          <span className="tabular-nums">{topic.items.length}</span> to repeat
        </span>
      </span>
    </ChoiceCard>
  );
}

/** Every weak topic, grouped by error type in priority order, to pick and repeat. */
export function WeakTopicsView({
  topics,
  selected,
  onToggle,
  onRepeat,
}: {
  topics: WeakTopic[];
  selected: string[];
  onToggle: (sectionId: string) => void;
  onRepeat: () => void;
}) {
  if (topics.length === 0) {
    return (
      <div className="flex flex-col items-start gap-6">
        <BackLink href="/" label="Back to Home" />
        <h1 className="font-semibold text-2xl">Weak topics</h1>
        <div className="w-full">
          <EmptyState
            icon={ListChecks}
            text="No weak topics yet. Finish a scenario or a quiz and they appear here."
            action={
              <ButtonLink href="/training/evacuation-guide" variant="secondary">
                Start a scenario
              </ButtonLink>
            }
          />
        </div>
      </div>
    );
  }

  const count = selected.length;

  return (
    <div className="flex flex-col gap-6">
      <BackLink href="/" label="Back to Home" />
      <div className="flex flex-col gap-1">
        <h1 className="font-semibold text-2xl">Weak topics</h1>
        <p className="text-text-secondary">
          Choose the topics to repeat. A repeat round brings back their steps and questions.
        </p>
      </div>

      {weakPriority.map((type) => {
        const group = topics.filter((topic) => topic.errorType === type);
        if (group.length === 0) return null;
        return (
          <fieldset key={type} className="flex flex-col gap-2">
            <legend className="mb-3 flex items-center gap-2 font-medium">
              <span className={iconColours[type]}>
                <StatusIcon status={type} size={16} />
              </span>
              {groupTitles[type]} <span className="tabular-nums">({group.length})</span>
            </legend>
            {group.map((topic) => (
              <TopicOption
                key={topic.sectionId}
                topic={topic}
                checked={selected.includes(topic.sectionId)}
                onToggle={() => onToggle(topic.sectionId)}
              />
            ))}
          </fieldset>
        );
      })}

      <ActionBar>
        {count === 0 && (
          <p className="text-center text-sm text-text-secondary">
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
