"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import { TopicStudentsView } from "@/components/InstructorTopics/TopicStudentsView";
import { StudentNotFound } from "@/components/InstructorStudents/StudentDetailView";
import { useSourceSheet } from "@/components/SourceSheet/SourceSheet";
import { useAuth } from "@/lib/auth";
import { participants } from "@/lib/cohort";
import { inScope } from "@/lib/groups";
import { topicStandings } from "@/lib/overview";
import { useScope } from "@/lib/scope-store";
import { readHistories } from "@/lib/student-data";
import { belowPassMark, profiles, sortProfiles, topicFrom } from "@/lib/students";

export default function TopicStudentsPage() {
  const params = useParams<{ code: string }>();
  const auth = useAuth();
  const scope = useScope();
  const { sections } = useSourceSheet();
  const [now] = useState(() => Date.now());
  if (auth === "loading" || scope === "loading") return null;
  const id = topicFrom(params.code);
  if (!id) return <StudentNotFound />;
  const people = inScope(participants(auth.accounts), scope);
  const all = profiles(people, readHistories(auth.accounts), now);
  const standing = topicStandings(all).find((topic) => topic.sectionId === id)!;
  return (
    <TopicStudentsView
      id={id}
      title={sections.find((section) => section.id === id)?.title ?? id}
      standing={standing}
      rows={sortProfiles(belowPassMark(all, id))}
    />
  );
}
