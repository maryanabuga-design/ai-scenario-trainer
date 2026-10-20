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
import { filterFrom, profiles, visibleStudents } from "@/lib/students";
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
  const filter = filterFrom(useSearchParams().get("filter"));
  const [now] = useState(() => Date.now());
  const people = useMemo(() => participants(accounts), [accounts]);
  const all = useMemo(() => profiles(people, readHistories(accounts)), [people, accounts]);

  return (
    <StudentsListView
      shown={visibleStudents(all, filter, exams, attempts, now)}
      count={people.length}
      filter={filter}
      onFilter={(next: StudentsFilter) =>
        router.replace(
          next === "all" ? "/instructor/students" : `/instructor/students?filter=${next}`,
        )
      }
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
