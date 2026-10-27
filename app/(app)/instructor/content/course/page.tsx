"use client";

import { CourseTopicsView } from "@/components/InstructorContent/CourseTopicsView";
import { useSourceSheet } from "@/components/SourceSheet/SourceSheet";
import { topicQuestionCount } from "@/lib/group-exams";
import { trainingSections } from "@/lib/parts";

export default function CourseTopicsPage() {
  const { sections } = useSourceSheet();
  const titleOf = (id: string) => sections.find((section) => section.id === id)?.title ?? id;
  return (
    <CourseTopicsView
      topics={trainingSections.map((id) => ({
        id,
        title: titleOf(id),
        count: topicQuestionCount(id),
      }))}
    />
  );
}
