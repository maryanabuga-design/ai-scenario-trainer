"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { ExamNotFound } from "@/components/InstructorExams/ExamDetailView";
import {
  PackageGone,
  PackageStudentScreen,
  isStudentPart,
} from "@/components/PackageContent/PackageStudentScreen";
import type { StudentPart } from "@/components/PackageContent/PackageStudentScreen";
import { blockingIssues, checkPackage } from "@/lib/package-read";
import { publishedPackages, usePackages } from "@/lib/packages";

/**
 * The one page of a demo topic for both routes (the student's under Materials, the preview under
 * Content): the same screen, with the preview flag. A student sees only published topics; the preview
 * opens only when nothing is left to fix (otherwise it goes back to the topic screen).
 */
export function PackageStudentRoute({
  id,
  part: asked,
  preview,
}: {
  id: string;
  /** The last part of the address: nothing for the reading screen. */
  part?: string;
  preview: boolean;
}) {
  const router = useRouter();
  const topics = usePackages();
  const topic =
    topics === "loading"
      ? undefined
      : preview
        ? topics.find((entry) => entry.id === id)
        : publishedPackages(topics).find((entry) => entry.id === id);
  const unfinished =
    preview && topic !== undefined && blockingIssues(checkPackage(topic)).length > 0;
  useEffect(() => {
    if (unfinished) router.replace(`/instructor/content/package/${id}`);
  }, [unfinished, router, id]);
  if (topics === "loading" || unfinished) return null;
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
    />
  );
}
