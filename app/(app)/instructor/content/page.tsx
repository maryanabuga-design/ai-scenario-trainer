"use client";

import { ContentView } from "@/components/InstructorContent/ContentView";
import { useSourceSheet } from "@/components/SourceSheet/SourceSheet";
import { useContentSets } from "@/lib/content-sets";
import { usePackages } from "@/lib/packages";
import { topicQuestionCount } from "@/lib/group-exams";
import { trainingSections } from "@/lib/parts";

export default function ContentPage() {
  const sets = useContentSets();
  const packages = usePackages();
  const { sections } = useSourceSheet();
  if (sets === "loading" || packages === "loading") return null;
  const titleOf = (id: string) => sections.find((section) => section.id === id)?.title ?? id;
  return (
    <ContentView
      sets={sets}
      packages={packages}
      topicTitle={titleOf}
      builtIn={trainingSections.map((id) => ({
        id,
        title: titleOf(id),
        count: topicQuestionCount(id),
      }))}
    />
  );
}
