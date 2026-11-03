"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { AssignExamView } from "@/components/InstructorExams/AssignExamView";
import { useSourceSheet } from "@/components/SourceSheet/SourceSheet";
import { useAuth } from "@/lib/auth";
import { participants } from "@/lib/cohort";
import { setFlash } from "@/lib/flash";
import { createExam, knownTopicIds, shortDate } from "@/lib/group-exams";
import type { GroupExam } from "@/lib/group-exams";
import { addNotice, saveGroupExam, useGroupExams } from "@/lib/group-store";
import { ALL_GROUPS, groupNames, groups } from "@/lib/groups";
import type { Scope } from "@/lib/groups";
import { useScope } from "@/lib/scope-store";

function AssignExam({
  scope,
  counts,
  exams,
}: {
  scope: Scope;
  counts: Record<string, number>;
  exams: GroupExam[];
}) {
  const router = useRouter();
  const query = useSearchParams();
  const fromOverview = query.get("from") === "overview";
  // from "Assign exam on this topic": the topic is chosen and the title follows from it
  const topic = knownTopicIds(query.getAll("topic"));
  // from "Duplicate exam": the topics, attempts and audience of that exam, a new title, no deadline
  const source = exams.find((entry) => entry.id === query.get("duplicate"));
  const home = fromOverview ? "/instructor" : "/instructor/exams";
  const { sections } = useSourceSheet();
  const [now] = useState(() => Date.now());
  // a page kept in the background keeps its state: when this screen is hidden (the effect is
  // cleaned up) the form is reset, so it starts empty or prefilled the next time it is shown
  const [shown, setShown] = useState(0);
  useEffect(() => () => setShown((n) => n + 1), []);
  const titleOf = (id: string) => sections.find((section) => section.id === id)?.title ?? id;

  return (
    <AssignExamView
      key={`${query.toString()}-${shown}`}
      titleOf={titleOf}
      groupCounts={counts}
      initialGroups={source ? source.groupIds : scope === ALL_GROUPS ? [] : [scope]}
      now={now}
      fromOverview={fromOverview}
      initial={
        source
          ? {
              topics: source.topicIds,
              title: `${source.title} (copy)`,
              attempts: source.attemptsAllowed,
            }
          : topic.length > 0
            ? { topics: topic }
            : undefined
      }
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
        setFlash(
          source ? "Exam duplicated" : `Exam assigned to ${groupNames(exam.groupIds)}`,
          `/instructor/exams/${exam.id}`,
        );
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
  const exams = useGroupExams();
  if (auth === "loading" || scope === "loading" || exams === "loading") return null;
  const people = participants(auth.accounts);
  const counts = Object.fromEntries(
    groups.map((group) => [group.id, people.filter((p) => p.groupId === group.id).length]),
  );
  return <AssignExam scope={scope} counts={counts} exams={exams} />;
}

export default function AssignExamPage() {
  return (
    <Suspense fallback={null}>
      <Loaded />
    </Suspense>
  );
}
