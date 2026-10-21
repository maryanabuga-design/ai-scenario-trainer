"use client";

import { TopicsView } from "@/components/InstructorTopics/TopicsView";
import { useSourceSheet } from "@/components/SourceSheet/SourceSheet";
import { useAuth } from "@/lib/auth";
import { participants } from "@/lib/cohort";
import { topicStandings } from "@/lib/overview";
import { readHistories } from "@/lib/student-data";
import { profiles } from "@/lib/students";

export default function TopicsPage() {
  const auth = useAuth();
  const { sections } = useSourceSheet();
  if (auth === "loading") return null;
  const list = profiles(participants(auth.accounts), readHistories(auth.accounts));
  return (
    <TopicsView
      standings={topicStandings(list)}
      titleOf={(id) => sections.find((section) => section.id === id)?.title ?? id}
    />
  );
}
