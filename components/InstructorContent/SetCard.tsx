import Link from "next/link";
import { Chevron } from "@/components/Chevron/Chevron";
import { SetStatusLine } from "@/components/InstructorContent/StatusLine";
import { Media3D } from "@/components/Media3D/Media3D";
import type { ContentSet } from "@/lib/content-sets";

/** "S3 Evacuation routes · 20 questions". */
export const setLine = (set: Pick<ContentSet, "topic" | "questions">, topicTitle: string) =>
  `${set.topic} ${topicTitle} · ${set.questions.length} ${set.questions.length === 1 ? "question" : "questions"}`;

/**
 * An imported set on the Content tab (DESIGN.md: Instructor, Content): FIXED 88px, the 3D slot (the
 * dashed placeholder until `content-set.webp` is supplied), the title, the topic and count line, the
 * status line and a chevron. The whole card opens the Review.
 */
export function SetCard({ set, topicTitle }: { set: ContentSet; topicTitle: string }) {
  return (
    <Link
      href={`/instructor/content/${set.id}`}
      data-set-card={set.id}
      className="flex h-[88px] items-center gap-3 rounded-card bg-card px-3 shadow-(--card-shadow) has-focus-visible:outline-2"
    >
      <Media3D variant="card" />
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="type-body-strong truncate">{set.title}</span>
        <span className="type-small truncate text-text-secondary">{setLine(set, topicTitle)}</span>
        <SetStatusLine status={set.status} />
      </span>
      <Chevron />
    </Link>
  );
}
