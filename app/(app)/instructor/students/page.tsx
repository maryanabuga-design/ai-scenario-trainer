"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState } from "react";
import { StudentsListView } from "@/components/InstructorStudents/StudentsListView";
import { useAuth } from "@/lib/auth";
import { participants } from "@/lib/cohort";
import type { Account } from "@/lib/auth";
import type { Attempt } from "@/lib/cohort";
import type { GroupExam } from "@/lib/group-exams";
import { useAttempts, useGroupExams } from "@/lib/group-store";
import { readHistories } from "@/lib/student-data";
import { useSourceSheet } from "@/components/SourceSheet/SourceSheet";
import {
  filterFrom,
  notStartedCount,
  originFrom,
  profiles,
  showingLine,
  topicFrom,
  visibleStudents,
} from "@/lib/students";
import type { StudentsFilter } from "@/lib/students";

/** Rendered once everything is read, so the time is never part of the prerender. */
function Loaded({
  accounts,
  exams,
  attempts,
}: {
  accounts: Account[];
  exams: GroupExam[];
  attempts: Attempt[];
}) {
  const router = useRouter();
  const query = useSearchParams();
  const filter = filterFrom(query.get("filter"));
  const topic = topicFrom(query.get("topic"));
  const origin = originFrom(query.get("from"));
  const { sections } = useSourceSheet();
  const [now] = useState(() => Date.now());
  const people = useMemo(() => participants(accounts), [accounts]);
  const all = useMemo(() => profiles(people, readHistories(accounts)), [people, accounts]);
  // a filter from a tile or Topics (or Not started, or a topic) shows its label and Clear filter
  const showing =
    origin || topic
      ? showingLine(
          filter,
          topic ? { id: topic, title: sections.find((s) => s.id === topic)?.title ?? topic } : null,
        )
      : null;

  return (
    <StudentsListView
      shown={visibleStudents(all, filter, exams, attempts, now, topic)}
      count={people.length}
      notStarted={notStartedCount(all)}
      filter={filter}
      topic={topic}
      origin={origin}
      showing={showing}
      onFilter={(next: StudentsFilter) => {
        const params = new URLSearchParams();
        if (next !== "all") params.set("filter", next);
        if (topic) params.set("topic", topic);
        if (origin) params.set("from", origin);
        const text = params.toString();
        router.replace(text ? `/instructor/students?${text}` : "/instructor/students");
      }}
      onClear={() => router.replace("/instructor/students")}
    />
  );
}

function StudentsScreen() {
  const auth = useAuth();
  const exams = useGroupExams();
  const attempts = useAttempts();
  if (auth === "loading" || exams === "loading" || attempts === "loading") return null;
  return <Loaded accounts={auth.accounts} exams={exams} attempts={attempts} />;
}

export default function StudentsPage() {
  return (
    <Suspense fallback={null}>
      <StudentsScreen />
    </Suspense>
  );
}
