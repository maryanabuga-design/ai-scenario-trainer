"use client";

import { ExamNotFound } from "@/components/InstructorExams/ExamDetailView";
import {
  PackageGone,
  PackageStudentScreen,
  fromTab,
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
  return (
    <PackageStudentScreen
      id={topic.id}
      title={topic.title}
      data={topic}
      part={part}
      preview={preview}
      from={fromTab(from)}
    />
  );
}
