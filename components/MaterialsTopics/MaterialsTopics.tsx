import Link from "next/link";
import { Chevron } from "@/components/Chevron/Chevron";
import { Chip } from "@/components/Chip/Chip";
import { ListScroll } from "@/components/MaterialsTopics/ListScroll";
import { TopicTile } from "@/components/TopicTile/TopicTile";
import { allTopics } from "@/lib/materials-topics";
import type { Topic } from "@/lib/materials-topics";
import { MATERIALS_SUBTITLE, MATERIALS_TITLE, readingLabel, readingPath } from "@/lib/reading";
import { topicIcon } from "@/lib/weak-topics";

/** One topic as a flat row: a 44px olive tile, the title with "S1 · 5 min read", and the plain chevron. */
function TopicRow({ topic }: { topic: Topic }) {
  return (
    <Link
      href={readingPath(topic.id)}
      className="flex min-h-11 items-center gap-3 py-4 active:bg-secondary-sand has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-accent"
    >
      <TopicTile sectionId={topic.id} icon={topicIcon(topic.id)} size="tile" tone="olive" />
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

/**
 * The Materials tab: the title, the subtitle and every topic of every guide as a flat list with
 * dividers, grouped by guide (a heading and a count chip each).
 */
export function MaterialsTopics({ topics = allTopics() }: { topics?: Topic[] }) {
  const guides = [...new Set(topics.map((topic) => topic.guideId))].map((id) => ({
    id,
    title: topics.find((topic) => topic.guideId === id)!.guideTitle,
    topics: topics.filter((topic) => topic.guideId === id),
  }));
  return (
    <div className="flex flex-col gap-6 pb-6">
      <ListScroll />
      <header className="flex flex-col gap-1">
        <h1 className="type-page-title">{MATERIALS_TITLE}</h1>
        <p className="type-body text-text-secondary">{MATERIALS_SUBTITLE}</p>
      </header>
      <div className="flex flex-col gap-8">
        {guides.map((guide) => (
          <section
            key={guide.id}
            aria-labelledby={`guide-${guide.id}`}
            className="flex flex-col gap-3"
          >
            <div className="flex items-start justify-between gap-3">
              <h2 id={`guide-${guide.id}`} className="type-item-title min-w-0 flex-1">
                {guide.title}
              </h2>
              <Chip tone="olive" size="caption">
                {guide.topics.length} topics
              </Chip>
            </div>
            <ul>
              {guide.topics.map((topic, index) => (
                <li
                  key={topic.id}
                  className={
                    index < guide.topics.length - 1 ? "border-b border-selectable-stroke" : ""
                  }
                >
                  <TopicRow topic={topic} />
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
