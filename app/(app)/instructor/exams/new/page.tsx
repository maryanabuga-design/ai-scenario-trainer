"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { AssignExamView } from "@/components/InstructorExams/AssignExamView";
import { useSourceSheet } from "@/components/SourceSheet/SourceSheet";
import { useAuth } from "@/lib/auth";
import { participants } from "@/lib/cohort";
import { createExam, knownTopicIds, shortDate } from "@/lib/group-exams";
import { addNotice, saveGroupExam } from "@/lib/group-store";
import { ALL_GROUPS, groups } from "@/lib/groups";
import type { Scope } from "@/lib/groups";
import { useScope } from "@/lib/scope-store";

function AssignExam({ scope, counts }: { scope: Scope; counts: Record<string, number> }) {
  const router = useRouter();
  const query = useSearchParams();
  const fromOverview = query.get("from") === "overview";
  // from "Assign exam on this topic": the topic is chosen and the title follows from it
  const topic = knownTopicIds(query.getAll("topic"));
  const home = fromOverview ? "/instructor" : "/instructor/exams";
  const { sections } = useSourceSheet();
  const [now] = useState(() => Date.now());
  const titleOf = (id: string) => sections.find((section) => section.id === id)?.title ?? id;

  return (
    <AssignExamView
      titleOf={titleOf}
      groupCounts={counts}
      initialGroups={scope === ALL_GROUPS ? [] : [scope]}
      now={now}
      fromOverview={fromOverview}
      initial={topic.length > 0 ? { topics: topic } : undefined}
      onCancel={() => router.push(home)}
      onAssign={(values) => {
        const at = Date.now();
        const exam = createExam(values, at);
        saveGroupExam(exam);
        // every local student account gets the notification once
        addNotice({
          id: `notice-${exam.id}`,
          title: `New exam assigned: ${exam.title}`,
          text: `Due ${shortDate(exam.deadline)}. Open the exam to see the rules and start.`,
          target: `/exam?id=${exam.id}`,
          createdAt: at,
          groups: exam.groupIds,
        });
        router.push(
          `/instructor/exams/${exam.id}?assigned=1${fromOverview ? "&from=overview" : ""}`,
        );
      }}
    />
  );
}

function Loaded() {
  const auth = useAuth();
  const scope = useScope();
  if (auth === "loading" || scope === "loading") return null;
  const people = participants(auth.accounts);
  const counts = Object.fromEntries(
    groups.map((group) => [group.id, people.filter((p) => p.groupId === group.id).length]),
  );
  return <AssignExam scope={scope} counts={counts} />;
}

export default function AssignExamPage() {
  return (
    <Suspense fallback={null}>
      <Loaded />
    </Suspense>
  );
}
