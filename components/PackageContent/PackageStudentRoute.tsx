"use client";

import { PreviewFrame } from "@/components/PreviewFrame/PreviewFrame";
import { ButtonLink } from "@/components/Button/Button";
import { ExamNotFound } from "@/components/InstructorExams/ExamDetailView";
import {
  PackageGone,
  PackageStudentScreen,
  fromTab,
  packagePaths,
  isStudentPart,
} from "@/components/PackageContent/PackageStudentScreen";
import type { StudentPart } from "@/components/PackageContent/PackageStudentScreen";
import { publishedPackages, usePackages } from "@/lib/packages";

/**
 * The one page of a demo topic for both routes (the student's under Materials, the preview under
 * Content): the same screen, with the preview flag. A student sees only published topics; the preview
 * opens at any time (it shows what a student would see) and is the same screen with the preview flag.
 */
export function PackageStudentRoute({
  id,
  part: asked,
  preview,
  from,
}: {
  id: string;
  /** The last part of the address: nothing for the reading screen. */
  part?: string;
  preview: boolean;
  /** The tab of the topic screen the preview came from. */
  from?: string;
}) {
  const topics = usePackages();
  const topic =
    topics === "loading"
      ? undefined
      : preview
        ? topics.find((entry) => entry.id === id)
        : publishedPackages(topics).find((entry) => entry.id === id);
  if (topics === "loading") return null;
  const part: StudentPart | null =
    asked === undefined ? "guide" : isStudentPart(asked) ? asked : null;
  if (!topic || part === null) return preview ? <ExamNotFound /> : <PackageGone />;
  const screen = (
    <PackageStudentScreen
      id={topic.id}
      title={topic.title}
      data={topic}
      part={part}
      preview={preview}
      from={fromTab(from)}
    />
  );
  if (!preview) return screen;
  // from 1024px the preview is the phone screen in a framed 430px column, with Exit preview above it
  return (
    <div className="contents idesk:block">
      <div className="hidden idesk:mx-auto idesk:mb-4 idesk:flex idesk:w-full idesk:max-w-[430px] idesk:justify-end">
        <ButtonLink
          href={packagePaths(topic.id, true, fromTab(from)).leave}
          variant="secondary"
          wide={false}
          compact
        >
          Exit preview
        </ButtonLink>
      </div>
      <PreviewFrame>{screen}</PreviewFrame>
    </div>
  );
}
