/**
 * CLIENT ONLY: this reads progress (the part records and the saved session), so it is imported
 * only from client components such as ReadingView, never from a server page. The pure content
 * side (which parts a topic has) is in `lib/parts.ts`. See lib/server-client-boundary.test.ts.
 */
import { partState, recommendedPart } from "@/lib/part-progress";
import type { PartRecords } from "@/lib/part-progress";
import { practiceParts } from "@/lib/parts";
import type { Part } from "@/lib/parts";
import type { Session } from "@/lib/session";

/**
 * What "Practise this topic" does: resume an unfinished session of this topic, otherwise start the
 * topic's next recommended part (the one the Start/Continue pill of Training marks), and when
 * every part is done play the first part again. Null when the topic has nothing to practise.
 */
export function practicePlan(
  topicId: string,
  records: PartRecords | null,
  unfinished: Pick<Session, "partId" | "finished"> | null,
): { part: Part; resume: boolean } | null {
  const parts = practiceParts(topicId);
  if (parts.length === 0) return null;
  const open = parts.find((part) => partState(part, records, unfinished) === "in progress");
  if (open) return { part: open, resume: true };
  return {
    part: recommendedPart(parts, records, unfinished) ?? parts[0],
    resume: false,
  };
}
