import Link from "next/link";
import { Chevron } from "@/components/Chevron/Chevron";
import { BUILT_IN_LABEL } from "@/components/InstructorContent/BuiltInTopicView";
import { PageHeaderBand } from "@/components/PageHeaderBand/PageHeaderBand";

export type CourseTopic = { id: string; title: string; count: number };

/**
 * The full-screen list of the ten course topics (DESIGN.md: Content page): read-only rows with the
 * S1 to S10 tile, the title and "Course topic · read-only", each opening its read-only detail. Back
 * returns to Content.
 */
export function CourseTopicsView({ topics }: { topics: CourseTopic[] }) {
  return (
    <div className="@container flex flex-col gap-4 pb-4">
      <PageHeaderBand
        title="Course topics"
        subtitle="Provided with the product · read-only"
        back={{ label: "Back to Content", href: "/instructor/content" }}
      />
      <ul className="flex flex-col gap-2 idesk:grid idesk:grid-cols-2 idesk:gap-6 idesk:@[1100px]:grid-cols-3">
        {topics.map((topic) => (
          <li key={topic.id}>
            <Link
              href={`/instructor/content/built-in/${topic.id}`}
              data-built-in={topic.id}
              className="flex h-[72px] items-center gap-3 rounded-card bg-card px-4 shadow-(--card-shadow) has-focus-visible:outline-2"
            >
              <span
                aria-hidden="true"
                className="type-caption flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-olive-tint text-text"
              >
                {topic.id}
              </span>
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="type-body-strong truncate">
                  <span className="sr-only">{topic.id} </span>
                  {topic.title}
                </span>
                <span data-built-in-label className="type-small truncate text-text-secondary">
                  {BUILT_IN_LABEL}
                </span>
              </span>
              <Chevron />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
