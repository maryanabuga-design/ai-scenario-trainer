"use client";

import { ButtonLink } from "@/components/Button/Button";
import { NextUpCard } from "@/components/NextUpCard/NextUpCard";
import { ScenarioCard } from "@/components/ScenarioCard/ScenarioCard";
import { Tag } from "@/components/Tag/Tag";
import { TopicRow } from "@/components/TopicRow/TopicRow";
import { nextUp } from "@/lib/home";
import { onboardingHref } from "@/lib/onboarding";
import type { ScoredItem } from "@/lib/scoring";
import type { Session } from "@/lib/session";
import type { WeakTopic } from "@/lib/weak-topics";
import { weakTopics } from "@/lib/weak-topics";

export type HomeScenario = { id: string; title: string; line: string; onOpen: () => void };

/** Home: the direction, the headline, Next up, the weak topics row and the scenarios. */
export function HomeView({
  directionTitle,
  unfinished,
  weakItems,
  hasHistory,
  scenarios,
  onRepeat,
  onStartScenario,
}: {
  directionTitle: string;
  unfinished: Session | null;
  weakItems: ScoredItem[];
  hasHistory: boolean;
  scenarios: HomeScenario[];
  onRepeat: (topics: WeakTopic[]) => void;
  onStartScenario: () => void;
}) {
  const topics = weakTopics(weakItems);
  const next = nextUp({ unfinished, topics, hasHistory });

  return (
    <div className="flex flex-col gap-8 pb-4">
      <header className="flex flex-col items-start gap-3 pt-2">
        <Tag sentenceCase>{directionTitle}</Tag>
        <h1 className="flex flex-col gap-3">
          <span className="type-display text-text">
            <span className="block">Practise a decision.</span>
            <span className="block">Explain it, then check it against the guide.</span>
          </span>
          <span className="type-small text-text-secondary">Small steps. Real progress.</span>
        </h1>
      </header>

      <NextUpCard next={next} onRepeat={() => onRepeat(topics)} onStartScenario={onStartScenario} />

      {topics.length > 0 && (
        <section aria-labelledby="topics-title" className="flex flex-col gap-3">
          <h2 id="topics-title" className="type-item-title">
            Topics
          </h2>
          <TopicRow
            topics={topics}
            labelledBy="topics-title"
            onRepeat={(topic) => onRepeat([topic])}
          />
        </section>
      )}

      <section aria-labelledby="new-title" className="flex flex-col gap-3">
        <h2 id="new-title" className="type-item-title">
          New scenario
        </h2>
        <ul className="flex flex-col gap-3">
          {scenarios.map((card) => (
            <li key={card.id}>
              <ScenarioCard title={card.title} line={card.line} onOpen={card.onOpen} />
            </li>
          ))}
        </ul>
      </section>

      <div className="-ml-3">
        <ButtonLink href={onboardingHref} variant="tertiary">
          How it works
        </ButtonLink>
      </div>
    </div>
  );
}
