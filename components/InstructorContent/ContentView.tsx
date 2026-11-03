"use client";

import { FilePlus, Library } from "lucide-react";
import Link from "next/link";
import { PageAction } from "@/components/ActionBar/ActionBar";
import { ButtonLink } from "@/components/Button/Button";
import { Chevron } from "@/components/Chevron/Chevron";
import { FlashNotice } from "@/components/FlashNotice/FlashNotice";
import { IconTile } from "@/components/IconTile/IconTile";
import { ContentEmpty } from "@/components/InstructorContent/ContentEmpty";
import { PackageCard } from "@/components/InstructorContent/PackageCard";
import { SetCard } from "@/components/InstructorContent/SetCard";
import { PageHeaderBand } from "@/components/PageHeaderBand/PageHeaderBand";
import { ProfileAvatar } from "@/components/ProfileAvatar/ProfileAvatar";
import { TipNote } from "@/components/TipNote/TipNote";
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
    <div className="@container flex flex-col gap-4 pb-4">
      <PageHeaderBand
        title="Content"
        subtitle={<span className="text-text-secondary">Materials for your students</span>}
        action={<ProfileAvatar />}
      />
      <FlashNotice />
      <PageAction>
        <ButtonLink href="/instructor/content/import" icon={FilePlus}>
          Import content
        </ButtonLink>
      </PageAction>

      <section aria-labelledby="sets-title" data-your-topics className="flex flex-col gap-3">
        <h2 id="sets-title" className="type-label text-text-secondary">
          YOUR TOPICS
        </h2>
        {sets.length === 0 && packages.length === 0 ? (
          <ContentEmpty />
        ) : (
          <ul className="flex flex-col gap-3 idesk:grid idesk:grid-cols-2 idesk:gap-6 idesk:@[1100px]:grid-cols-3">
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
        className="flex min-h-[72px] items-center gap-3 rounded-card border border-selectable-stroke bg-card px-4 py-3 shadow-(--card-shadow) has-focus-visible:outline-2"
      >
        <IconTile size="default" tileId="course">
          <Library strokeWidth={2} />
        </IconTile>
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="type-body-strong">Course topics ({builtIn.length})</span>
          <span className="type-small text-text-secondary">{COURSE_SUBTITLE}</span>
        </span>
        <Chevron />
      </Link>

      <div className="contents idesk:block idesk:max-w-[640px]">
        <TipNote noteId="content-note">{CONTENT_NOTE}</TipNote>
      </div>
    </div>
  );
}
