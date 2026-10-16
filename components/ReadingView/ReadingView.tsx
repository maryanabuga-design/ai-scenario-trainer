"use client";

import { useRouter } from "next/navigation";
import { Button, ButtonLink } from "@/components/Button/Button";
import { CircleBackButton } from "@/components/CircleBackButton/CircleBackButton";
import { HighlightableText } from "@/components/HighlightableText/HighlightableText";
import { TopicPager } from "@/components/TopicPager/TopicPager";
import { dismissTip, useTipSeen } from "@/lib/highlight-store";
import { usePartRecords } from "@/lib/part-progress";
import { practicePlan } from "@/lib/practise";
import { readingLabel, readingPath } from "@/lib/reading";
import { scenario } from "@/lib/scenario";
import { TIP_TEXT } from "@/lib/selection-actions";
import { isValidSession, saveSession, startSession, useSession } from "@/lib/session";

export type ReadingTopic = {
  id: string;
  title: string;
  guideTitle: string;
  minutes: number;
  body: string;
  /** Whether the topic has scenario steps or quiz questions to practise (the flood topics have not). */
  canPractise: boolean;
  /** The Quick checklist covering the topic, if any. */
  stepsHref: string | null;
  previous: { id: string; title: string } | null;
  next: { id: string; title: string } | null;
};

/** The one-time tip under the meta line; it goes after the first highlight or when it is tapped. */
function ReadingTip() {
  const seen = useTipSeen();
  if (seen !== null) return null;
  return (
    <button
      type="button"
      onClick={dismissTip}
      className="type-small self-start text-left text-text-secondary"
    >
      {TIP_TEXT}
    </button>
  );
}

/**
 * The reading screen of one topic: Back, the title, one meta line, the text, and at the end of the
 * column (not sticky, not fixed) the action block: Practise this topic, Steps for this topic and the
 * Previous / Next pager. A short text leaves the block at the bottom of the screen, a long one lets
 * it follow the text. Reading changes no progress; only tapping Practise starts or resumes a session.
 */
export function ReadingView({ topic }: { topic: ReadingTopic }) {
  const router = useRouter();
  const session = useSession();
  const records = usePartRecords();

  function practise() {
    if (session === "loading" || records === "loading") return;
    const unfinished = session && !session.finished && isValidSession(session) ? session : null;
    const plan = practicePlan(topic.id, records, unfinished);
    if (!plan) return;
    // Exit and Back on Results return here, not to Home or Training.
    const returnTo = readingPath(topic.id);
    if (plan.resume && unfinished) saveSession({ ...unfinished, returnTo });
    else
      startSession(plan.part.mode, plan.part.itemIds, {
        scenarioId: plan.part.mode === "scenario" ? scenario.id : undefined,
        partId: plan.part.id,
        returnTo,
      });
    router.push("/session");
  }

  return (
    <div className="flex flex-1 flex-col pb-[var(--gutter,1rem)]">
      <div className="flex flex-col gap-6">
        <CircleBackButton
          size="small"
          label="Back"
          onClick={() => (window.history.length > 1 ? router.back() : router.push("/materials"))}
        />
        <header className="flex flex-col gap-2">
          <h1 className="type-page-title">{topic.title}</h1>
          <p className="type-small text-text-secondary tabular-nums">
            {topic.guideTitle} · {topic.id} · {readingLabel(topic.minutes)}
          </p>
          <ReadingTip />
        </header>

        <HighlightableText topicId={topic.id} markdown={topic.body} />
      </div>

      <section aria-label="What next" className="mt-auto flex flex-col pt-6">
        {(topic.canPractise || topic.stepsHref) && (
          <div className="flex flex-col gap-3 pb-6">
            {topic.canPractise && <Button onClick={practise}>Practise this topic</Button>}
            {topic.stepsHref && (
              <ButtonLink href={topic.stepsHref} variant="secondary">
                Steps for this topic
              </ButtonLink>
            )}
          </div>
        )}
        <div
          className={
            topic.canPractise || topic.stepsHref ? "border-t border-selectable-stroke" : ""
          }
        >
          <TopicPager previous={topic.previous} next={topic.next} />
        </div>
      </section>
    </div>
  );
}
