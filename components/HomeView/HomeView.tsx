"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { NextUpCard } from "@/components/NextUpCard/NextUpCard";
import { ScenarioCard } from "@/components/ScenarioCard/ScenarioCard";
import { TopicRow } from "@/components/TopicRow/TopicRow";
import { nextUp } from "@/lib/home";
import type { ScoredItem } from "@/lib/scoring";
import type { Session } from "@/lib/session";
import type { WeakTopic } from "@/lib/weak-topics";
import { weakTopics } from "@/lib/weak-topics";

export type HomeScenario = { id: string; title: string; lines: string[]; onOpen: () => void };

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
        <p className="type-small flex flex-col gap-2 text-text-secondary">
          {directionTitle}
          <span aria-hidden="true" className="h-px w-14 bg-border-strong" />
        </p>
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
          <div className="flex items-center justify-between gap-4">
            <h2 id="topics-title" className="type-item-title">
              Topics
            </h2>
            <Link
              href="/weak-topics"
              className="type-body -mr-2 inline-flex min-h-11 items-center gap-1.5 px-2 text-text underline decoration-1 underline-offset-4 hover:decoration-2"
            >
              See all
              <ArrowRight size={18} strokeWidth={2} aria-hidden="true" />
            </Link>
          </div>
          <TopicRow
            topics={topics}
            unfinished={unfinished}
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
              <ScenarioCard title={card.title} lines={card.lines} onOpen={card.onOpen} />
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
