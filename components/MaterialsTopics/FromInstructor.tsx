"use client";

import { Shapes } from "lucide-react";
import Link from "next/link";
import { Chevron } from "@/components/Chevron/Chevron";
import { LucideTile } from "@/components/TopicTile/TopicTile";
import { partsOf } from "@/lib/package-read";
import { publishedPackages, usePackages } from "@/lib/packages";

const word = { guide: "Guide", steps: "Steps", scenario: "Scenario", quiz: "Quiz" } as const;

/**
 * The student's section "FROM YOUR INSTRUCTOR" under the built-in topics (DESIGN.md: Instructor,
 * content package import and demo topics): one row per Published demo topic, in the topic row
 * pattern, with the parts it has. A demo topic is separate from the guide topics.
 */
export function FromInstructor() {
  const topics = usePackages();
  if (topics === "loading") return null;
  const published = publishedPackages(topics);
  if (published.length === 0) return null;
  return (
    <section aria-labelledby="from-instructor" data-from-instructor className="flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <h2 id="from-instructor" className="type-item-title min-w-0 flex-1">
          FROM YOUR INSTRUCTOR
        </h2>
      </div>
      <ul>
        {published.map((topic, index) => (
          <li
            key={topic.id}
            className={index < published.length - 1 ? "border-b border-selectable-stroke" : ""}
          >
            <Link
              href={`/materials/package/${topic.id}`}
              data-package-topic={topic.id}
              className="flex min-h-11 items-center gap-3 py-4 active:bg-secondary-sand has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-accent"
            >
              <LucideTile icon={Shapes} size="tile" />
              <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="type-body-strong">{topic.title}</span>
                <span className="type-small text-text-secondary">
                  {partsOf(topic)
                    .map((part) => word[part])
                    .join(" · ")}
                </span>
              </span>
              <Chevron />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
