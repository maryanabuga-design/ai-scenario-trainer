"use client";

import { ChevronDown, FileText } from "lucide-react";
import { useRef, useState } from "react";
import type { MouseEvent } from "react";
import { Button, ButtonLink } from "@/components/Button/Button";
import { EmptyState } from "@/components/EmptyState/EmptyState";
import { SetCard } from "@/components/InstructorContent/SetCard";
import { PageHeaderBand } from "@/components/PageHeaderBand/PageHeaderBand";
import { ProfileAvatar } from "@/components/ProfileAvatar/ProfileAvatar";
import type { ContentSet } from "@/lib/content-sets";
import { clearDraft } from "@/lib/import-draft";

export const CONTENT_EMPTY = "No imported sets yet. Import questions from a file to create one.";
export const CONTENT_NOTE = "Imported content stays in this browser (prototype).";

export type BuiltInTopic = { id: string; title: string; count: number };

/**
 * The Content tab of the Instructor (DESIGN.md: Instructor, Content): the band, the Primary "Import
 * questions", the IMPORTED SETS cards (88px), and at the end the toggle of the "Other topics" pattern
 * that opens the read-only BUILT-IN TOPICS (72px rows, not tappable, no chevron).
 */
export function ContentView({
  sets,
  builtIn,
  topicTitle,
  initiallyOpen = false,
}: {
  sets: ContentSet[];
  builtIn: BuiltInTopic[];
  topicTitle: (id: string) => string;
  /** Only for the screen review page: the built-in topics start open. */
  initiallyOpen?: boolean;
}) {
  const [open, setOpen] = useState(initiallyOpen);
  const wrapper = useRef<HTMLDivElement>(null);

  function toggle(event: MouseEvent<HTMLButtonElement>) {
    // Safari does not focus a button on click: keep the focus on the toggle
    event.currentTarget.focus();
    const closing = open;
    setOpen(!open);
    if (!closing) return;
    window.setTimeout(() => {
      wrapper.current?.querySelector("button")?.scrollIntoView({ block: "nearest" });
    }, 220);
  }

  return (
    <div className="flex flex-col gap-4 pb-4">
      <PageHeaderBand
        title="Content"
        subtitle="Questions for your students"
        action={<ProfileAvatar />}
      />
      <ButtonLink href="/instructor/content/import" onClick={clearDraft}>
        Import questions
      </ButtonLink>

      <section aria-labelledby="sets-title" className="flex flex-col gap-3">
        <h2 id="sets-title" className="type-label text-text-secondary">
          IMPORTED SETS
        </h2>
        {sets.length === 0 ? (
          <EmptyState icon={FileText} text={CONTENT_EMPTY} />
        ) : (
          <ul className="flex flex-col gap-3">
            {sets.map((set) => (
              <li key={set.id}>
                <SetCard set={set} topicTitle={topicTitle(set.topic)} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <div ref={wrapper} className="flex flex-col">
        <div
          id="built-in-topics"
          inert={!open}
          className={`grid transition-[grid-template-rows,visibility] duration-200 motion-reduce:transition-none ${open ? "visible grid-rows-[1fr]" : "invisible grid-rows-[0fr]"}`}
        >
          <div className="min-h-0 overflow-hidden">
            <section aria-labelledby="built-in-title" className="flex flex-col gap-3 pb-3">
              <h2 id="built-in-title" className="type-label text-text-secondary">
                BUILT-IN TOPICS
              </h2>
              <ul className="flex flex-col gap-2">
                {builtIn.map((topic) => (
                  <li
                    key={topic.id}
                    data-built-in={topic.id}
                    className="flex h-[72px] items-center gap-3 rounded-card bg-card px-4 shadow-(--card-shadow)"
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
                      <span className="type-small text-text-secondary">
                        {topic.count} {topic.count === 1 ? "question" : "questions"}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </div>
        <div className="-ml-3 self-start">
          <Button
            variant="tertiary"
            aria-expanded={open}
            aria-controls="built-in-topics"
            onClick={toggle}
            trailing={
              <ChevronDown
                size={16}
                strokeWidth={2}
                aria-hidden="true"
                className={`shrink-0 transition-transform duration-200 motion-reduce:transition-none ${open ? "rotate-180" : ""}`}
              />
            }
          >
            {open ? "Hide built-in topics" : `Show built-in topics (${builtIn.length})`}
          </Button>
        </div>
      </div>

      <p data-content-note className="type-small text-center text-text-secondary">
        {CONTENT_NOTE}
      </p>
    </div>
  );
}
