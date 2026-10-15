"use client";

import { useSourceSheet } from "@/components/SourceSheet/SourceSheet";

/** The section title, for example "Checking the route", or the code if it is unknown. */
export function useTopicName(sectionId: string) {
  const { sections } = useSourceSheet();
  return sections.find((section) => section.id === sectionId)?.title ?? sectionId;
}
