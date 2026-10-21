"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState } from "react";
import { StudentsListView } from "@/components/InstructorStudents/StudentsListView";
import { useAuth } from "@/lib/auth";
import { participants } from "@/lib/cohort";
import { inScope } from "@/lib/groups";
import type { Scope } from "@/lib/groups";
import { useScope } from "@/lib/scope-store";
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
  scope,
}: {
  accounts: Account[];
  exams: GroupExam[];
  attempts: Attempt[];
  scope: Scope;
}) {
  const router = useRouter();
  const query = useSearchParams();
  const filter = filterFrom(query.get("filter"));
  const topic = topicFrom(query.get("topic"));
  const origin = originFrom(query.get("from"));
  const { sections } = useSourceSheet();
  const [now] = useState(() => Date.now());
  const people = useMemo(() => inScope(participants(accounts), scope), [accounts, scope]);
  const all = useMemo(() => profiles(people, readHistories(accounts)), [people, accounts]);
  // a filter from a tile or Topics (or Not started, or a topic) shows its label and Clear filter
  const showing =
    origin || topic
      ? showingLine(
          filter,
          topic
            ? {
                id: topic,
                title: sections.find((s) => s.id === topic)?.title ?? topic,
              }
            : null,
        )
      : null;

  return (
    <StudentsListView
      scope={scope}
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
  const scope = useScope();
  if (
    auth === "loading" ||
    exams === "loading" ||
    attempts === "loading" ||
    scope === "loading"
  )
    return null;
  return <Loaded accounts={auth.accounts} exams={exams} attempts={attempts} scope={scope} />;
}

export default function StudentsPage() {
  return (
    <Suspense fallback={null}>
      <StudentsScreen />
    </Suspense>
  );
}
