"use client";

import { FilePlus, Lightbulb } from "lucide-react";
import Link from "next/link";
import { ButtonLink } from "@/components/Button/Button";
import { Chevron } from "@/components/Chevron/Chevron";
import { FlashNotice } from "@/components/FlashNotice/FlashNotice";
import { ContentEmpty } from "@/components/InstructorContent/ContentEmpty";
import { PackageCard } from "@/components/InstructorContent/PackageCard";
import { SetCard } from "@/components/InstructorContent/SetCard";
import { PageHeaderBand } from "@/components/PageHeaderBand/PageHeaderBand";
import { ProfileAvatar } from "@/components/ProfileAvatar/ProfileAvatar";
import type { ContentSet } from "@/lib/content-sets";
import type { DemoTopic } from "@/lib/packages";

export const CONTENT_NOTE = "Your topics stay in this browser (prototype).";
export const COURSE_SUBTITLE = "Provided with the product · read-only";

export type BuiltInTopic = { id: string; title: string; count: number };

/**
 * The Content tab of the Instructor (DESIGN.md: Content page): the band, the one Primary "Import
 * content" with a document-plus icon, YOUR TOPICS (the illustrated empty state, or the cards of the
 * topics from documents first and earlier question sets after), ONE row card "Course topics (10)" that
 * opens the full-screen list, and the info card with the lightbulb.
 */
export function ContentView({
  sets,
  packages = [],
  builtIn,
  topicTitle,
}: {
  sets: ContentSet[];
  /** The topics made from documents. */
  packages?: DemoTopic[];
  builtIn: BuiltInTopic[];
  topicTitle: (id: string) => string;
}) {
  return (
    <div className="flex flex-col gap-4 pb-4">
      <PageHeaderBand
        title="Content"
        subtitle={<span className="text-text-secondary">Materials for your students</span>}
        action={<ProfileAvatar />}
      />
      <FlashNotice />
      <ButtonLink href="/instructor/content/import" icon={FilePlus}>
        Import content
      </ButtonLink>

      <section aria-labelledby="sets-title" data-your-topics className="flex flex-col gap-3">
        <h2 id="sets-title" className="type-label text-text-secondary">
          YOUR TOPICS
        </h2>
        {sets.length === 0 && packages.length === 0 ? (
          <ContentEmpty />
        ) : (
          <ul className="flex flex-col gap-3">
            {packages.map((topic) => (
              <li key={topic.id}>
                <PackageCard topic={topic} />
              </li>
            ))}
            {sets.map((set) => (
              <li key={set.id}>
                <SetCard set={set} topicTitle={topicTitle(set.topic)} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <Link
        href="/instructor/content/course"
        data-course-row
        className="flex h-[72px] items-center gap-3 rounded-card border border-selectable-stroke bg-card px-4 shadow-(--card-shadow) has-focus-visible:outline-2"
      >
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="type-body-strong truncate">Course topics ({builtIn.length})</span>
          <span className="type-small truncate text-text-secondary">{COURSE_SUBTITLE}</span>
        </span>
        <Chevron />
      </Link>

      <div
        data-content-note
        className="flex items-center gap-3 rounded-[14px] bg-secondary-sand px-4 py-3"
      >
        <span
          aria-hidden="true"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-neutral-tile-bg text-neutral-tile-ink"
        >
          <Lightbulb size={20} strokeWidth={2} />
        </span>
        <span aria-hidden="true" className="h-8 w-px shrink-0 bg-selectable-stroke" />
        <p className="type-small min-w-0 flex-1 text-text-secondary">{CONTENT_NOTE}</p>
      </div>
    </div>
  );
}
