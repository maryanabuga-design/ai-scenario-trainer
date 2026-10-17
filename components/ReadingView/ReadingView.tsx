"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button, ButtonLink } from "@/components/Button/Button";
import { HighlightableText } from "@/components/HighlightableText/HighlightableText";
import { QuickActionsBar } from "@/components/QuickActionsBar/QuickActionsBar";
import { ReadingHeader } from "@/components/ReadingHeader/ReadingHeader";
import { dismissTip, useTipSeen } from "@/lib/highlight-store";
import { canGoBackToList, requestListRestore } from "@/lib/navigation-origin";
import { initialQuickBar, nextQuickBar } from "@/lib/quick-bar";
import type { QuickBarState } from "@/lib/quick-bar";
import { readingLabel, readingPath } from "@/lib/reading";
import { TIP_TEXT } from "@/lib/selection-actions";
import { usePractise } from "@/lib/use-practise";

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
  /** The place in its guide: 3 of 10. */
  position: number;
  total: number;
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

/** How far above the viewport bottom the end block must stay for the quick-actions bar to show. */
const BAR_CLEARANCE = 100;

/**
 * The reading screen of one topic: the sticky header (Back, "S3 · 3 of 10", the previous and next
 * topic arrows), the title, one meta line, the text, and at the end of the column (not sticky, not
 * fixed) the action block: Practise this topic and Steps for this topic.
 * A short text leaves the block at the bottom of the screen, a long one lets it follow the text. On
 * a long topic a quick-actions bar appears when the reader scrolls up. Reading changes no progress;
 * only tapping Practise starts or resumes a session.
 */
export function ReadingView({ topic }: { topic: ReadingTopic }) {
  const router = useRouter();
  const endRef = useRef<HTMLElement>(null);
  const bar = useRef<QuickBarState>(initialQuickBar);
  const selecting = useRef(false);
  const [scrolled, setScrolled] = useState(false);
  const [barVisible, setBarVisible] = useState(false);

  // Exit and Back on Results return here, not to Home or Training.
  const practise = usePractise(topic.id, readingPath(topic.id));

  /** One pass of the scroll rules: the header line and the quick-actions bar. */
  const update = useCallback(() => {
    const y = window.scrollY;
    const viewport = window.innerHeight;
    setScrolled(y > 0);
    const end = endRef.current?.getBoundingClientRect();
    bar.current = nextQuickBar(bar.current, {
      y,
      viewport,
      endNear: !end || end.top <= viewport + BAR_CLEARANCE,
      busy: selecting.current,
    });
    setBarVisible(bar.current.visible);
  }, []);

  useEffect(() => {
    bar.current = { ...initialQuickBar, lastY: window.scrollY, peak: window.scrollY };
    let frame = 0;
    const soon = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(update);
    };
    soon();
    window.addEventListener("scroll", soon, { passive: true });
    window.addEventListener("resize", soon);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", soon);
      window.removeEventListener("resize", soon);
    };
  }, [update]);

  const onSelecting = useCallback(
    (active: boolean) => {
      selecting.current = active;
      update();
    },
    [update],
  );

  return (
    <div className="flex flex-1 flex-col pb-[var(--gutter,1rem)]">
      <ReadingHeader
        label={`${topic.id} · ${topic.position} of ${topic.total}`}
        previousId={topic.previous?.id ?? null}
        nextId={topic.next?.id ?? null}
        scrolled={scrolled}
        onBack={() => {
          // always the Materials list: the history when it leads there (the list keeps its scroll),
          // otherwise a new navigation to the list, which scrolls back to where it was
          if (canGoBackToList()) router.back();
          else {
            requestListRestore();
            router.push("/materials");
          }
        }}
      />
      <div className="flex flex-col gap-6">
        <header className="flex flex-col gap-2">
          <h1 className="type-page-title">{topic.title}</h1>
          <p className="type-small text-text-secondary tabular-nums">
            {topic.guideTitle} · {topic.id} · {readingLabel(topic.minutes)}
          </p>
          <ReadingTip />
        </header>

        <HighlightableText topicId={topic.id} markdown={topic.body} onActiveChange={onSelecting} />
      </div>

      {(topic.canPractise || topic.stepsHref) && (
        <section ref={endRef} aria-label="What next" className="mt-auto flex flex-col gap-3 pt-6">
          {topic.canPractise && <Button onClick={practise}>Practise this topic</Button>}
          {topic.stepsHref && (
            <ButtonLink href={topic.stepsHref} variant="secondary">
              Steps for this topic
            </ButtonLink>
          )}
        </section>
      )}

      {topic.canPractise && (
        <QuickActionsBar visible={barVisible} stepsHref={topic.stepsHref} onPractise={practise} />
      )}
    </div>
  );
}
