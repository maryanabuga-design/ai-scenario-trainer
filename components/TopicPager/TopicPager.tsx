import { ArrowLeft, ArrowRight } from "lucide-react";
import Link from "next/link";
import { readingPath } from "@/lib/reading";

type Neighbour = { id: string; title: string };

/**
 * The Previous / Next row at the end of a reading screen: two equal columns, each a whole link with
 * a small muted caption (and an arrow) over the neighbouring topic's title. No card, no border.
 * Previous is missing on the first topic of a guide and Next on the last; the other keeps its side.
 */
export function TopicPager({
  previous,
  next,
}: {
  previous: Neighbour | null;
  next: Neighbour | null;
}) {
  if (!previous && !next) return null;
  const link =
    "flex min-h-11 flex-col gap-1 has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-accent active:opacity-70";
  return (
    <nav aria-label="Topics" className="grid grid-cols-2 gap-4 pt-4">
      {previous ? (
        <Link replace href={readingPath(previous.id)} className={`${link} items-start text-left`}>
          <span className="type-small flex items-center gap-1 text-text-secondary">
            <ArrowLeft size={16} strokeWidth={2} aria-hidden="true" />
            Previous
          </span>
          <span className="type-body-strong">{previous.title}</span>
        </Link>
      ) : (
        <span aria-hidden="true" />
      )}
      {next ? (
        <Link replace href={readingPath(next.id)} className={`${link} items-end text-right`}>
          <span className="type-small flex items-center gap-1 text-text-secondary">
            Next
            <ArrowRight size={16} strokeWidth={2} aria-hidden="true" />
          </span>
          <span className="type-body-strong">{next.title}</span>
        </Link>
      ) : (
        <span aria-hidden="true" />
      )}
    </nav>
  );
}
