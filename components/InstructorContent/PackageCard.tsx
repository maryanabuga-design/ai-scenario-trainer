import { Shapes } from "lucide-react";
import Link from "next/link";
import { Chevron } from "@/components/Chevron/Chevron";
import { LucideTile } from "@/components/TopicTile/TopicTile";
import { blockingIssues, checkPackage, partsLine } from "@/lib/package-read";
import type { DemoTopic } from "@/lib/packages";

/**
 * A demo topic on the Content root (DESIGN.md: Instructor, content package import and demo topics):
 * a fixed 88px card, the neutral tile, the title, "Guide · Steps · Scenario · 10 questions" for the
 * parts present, a Draft or Published pill, an amber "2 to fix" when relevant, a chevron.
 */
export function PackageCard({ topic }: { topic: DemoTopic }) {
  const problems = blockingIssues(checkPackage(topic)).length;
  const published = topic.status === "published";
  return (
    <Link
      href={`/instructor/content/package/${topic.id}`}
      data-package-card={topic.id}
      className="flex h-[88px] items-center gap-3 rounded-card border border-selectable-stroke bg-card px-3 shadow-(--card-shadow) has-focus-visible:outline-2"
    >
      <LucideTile icon={Shapes} />
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="type-body-strong truncate">{topic.title}</span>
        <span className="type-small truncate text-text-secondary">{partsLine(topic)}</span>
        <span className="flex items-center gap-2">
          <span
            data-status-pill={topic.status}
            className={`type-caption shrink-0 rounded-full px-2 py-0.5 whitespace-nowrap ${
              published
                ? "bg-status-success-bg text-status-success-ink"
                : "bg-secondary-sand text-text-secondary"
            }`}
          >
            {published ? "Published" : "Draft"}
          </span>
          {problems > 0 && (
            <span
              data-to-fix-count
              className="type-caption truncate whitespace-nowrap text-status-attention-ink"
            >
              {problems} to fix
            </span>
          )}
        </span>
      </span>
      <Chevron />
    </Link>
  );
}
