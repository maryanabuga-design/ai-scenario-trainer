"use client";

import { TopicsView } from "@/components/InstructorTopics/TopicsView";
import { useSourceSheet } from "@/components/SourceSheet/SourceSheet";
import { useAuth } from "@/lib/auth";
import { participants } from "@/lib/cohort";
import { ALL_GROUPS, scopeName } from "@/lib/groups";
import { topicStandings } from "@/lib/overview";
import { useScope } from "@/lib/scope-store";
import { readHistories } from "@/lib/student-data";
import { profiles } from "@/lib/students";

export default function TopicsPage() {
  const auth = useAuth();
  const { sections } = useSourceSheet();
  const scope = useScope();
  if (auth === "loading" || scope === "loading") return null;
  const everyone = profiles(participants(auth.accounts), readHistories(auth.accounts));
  // the topics of the selected group (counts over All groups for All groups, never an average)
  const list =
    scope === ALL_GROUPS ? everyone : everyone.filter((p) => p.participant.groupId === scope);
  return (
    <TopicsView
      subtitle={
        scope === ALL_GROUPS
          ? "How your groups are doing by topic"
          : `How ${scopeName(scope)} is doing by topic`
      }
      standings={topicStandings(list)}
      titleOf={(id) => sections.find((section) => section.id === id)?.title ?? id}
    />
  );
}
