import Link from "next/link";
import { Chevron } from "@/components/Chevron/Chevron";
import { TopicTile } from "@/components/TopicTile/TopicTile";
import { allTopics } from "@/lib/materials-topics";
import type { Topic } from "@/lib/materials-topics";
import { MATERIALS_SUBTITLE, MATERIALS_TITLE, readingLabel, readingPath } from "@/lib/reading";
import { topicIcon } from "@/lib/weak-topics";

/** One topic: an olive icon circle, the title, "S1 · 5 min read" and the plain chevron. The whole card is a link. */
function TopicCard({ topic }: { topic: Topic }) {
  return (
    <Link
      href={readingPath(topic.id)}
      className="flex min-h-11 items-center gap-3 rounded-card border border-selectable-stroke bg-card p-[var(--gutter,1rem)] active:bg-secondary-sand has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-accent"
    >
      <TopicTile sectionId={topic.id} icon={topicIcon(topic.id)} size="compact" tone="olive" />
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="type-body-strong">{topic.title}</span>
        <span className="type-small text-text-secondary tabular-nums">
          {topic.id} · {readingLabel(topic.minutes)}
        </span>
      </span>
      <Chevron />
    </Link>
  );
}

/** The Materials tab: the title, the subtitle and every topic of every guide, grouped by guide. */
export function MaterialsTopics({ topics = allTopics() }: { topics?: Topic[] }) {
  const guides = [...new Set(topics.map((topic) => topic.guideId))].map((id) => ({
    id,
    title: topics.find((topic) => topic.guideId === id)!.guideTitle,
    topics: topics.filter((topic) => topic.guideId === id),
  }));
  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="type-page-title">{MATERIALS_TITLE}</h1>
        <p className="type-small text-text-secondary">{MATERIALS_SUBTITLE}</p>
      </header>
      {guides.map((guide) => (
        <section
          key={guide.id}
          aria-labelledby={`guide-${guide.id}`}
          className="flex flex-col gap-3"
        >
          <h2 id={`guide-${guide.id}`} className="type-caption text-text-secondary">
            {guide.title}
          </h2>
          <ul className="flex flex-col gap-3">
            {guide.topics.map((topic) => (
              <li key={topic.id}>
                <TopicCard topic={topic} />
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
