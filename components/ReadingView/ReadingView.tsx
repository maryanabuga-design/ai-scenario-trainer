"use client";

import { useRouter } from "next/navigation";
import { ButtonLink } from "@/components/Button/Button";
import { CircleBackButton } from "@/components/CircleBackButton/CircleBackButton";
import { HighlightableText } from "@/components/HighlightableText/HighlightableText";
import { dismissTip, useTipSeen } from "@/lib/highlight-store";
import { readingLabel, readingPath } from "@/lib/reading";
import { TIP_TEXT } from "@/lib/selection-actions";

export type ReadingTopic = {
  id: string;
  title: string;
  guideTitle: string;
  minutes: number;
  body: string;
  /** Training at this topic; null when the topic has no Training parts. */
  practiseHref: string | null;
  /** The Quick checklist covering the topic, if any. */
  stepsHref: string | null;
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
 * The reading screen of one topic: Back, the title, one meta line, the text, and at the end (not
 * sticky) Practise this topic, Steps for this topic and the link to the next topic. Reading changes
 * no progress.
 */
export function ReadingView({ topic }: { topic: ReadingTopic }) {
  const router = useRouter();
  return (
    <div className="flex flex-col gap-6 pb-6">
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

      <section aria-label="What next" className="mt-4 flex flex-col items-center gap-3">
        {topic.practiseHref && (
          <ButtonLink href={topic.practiseHref}>Practise this topic</ButtonLink>
        )}
        {topic.stepsHref && (
          <ButtonLink href={topic.stepsHref} variant="secondary">
            Steps for this topic
          </ButtonLink>
        )}
        {topic.next && (
          <ButtonLink href={readingPath(topic.next.id)} variant="tertiary">
            Next: {topic.next.title}
          </ButtonLink>
        )}
      </section>
    </div>
  );
}
