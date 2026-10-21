"use client";

import { useState } from "react";
import { InstructorExamsView } from "@/components/InstructorExams/InstructorExamsView";
import { useAuth } from "@/lib/auth";
import { participants } from "@/lib/cohort";
import { examsInScope } from "@/lib/groups";
import type { Scope } from "@/lib/groups";
import { useScope } from "@/lib/scope-store";
import type { Attempt } from "@/lib/cohort";
import type { GroupExam } from "@/lib/group-exams";
import { useAttempts, useGroupExams } from "@/lib/group-store";

/** Rendered once everything is read, so the time is never part of the prerender. */
function Loaded({
  exams,
  attempts,
  accounts,
  scope,
}: {
  exams: GroupExam[];
  attempts: Attempt[];
  accounts: { name: string; email: string }[];
  scope: Scope;
}) {
  const [now] = useState(() => Date.now());
  return (
    <InstructorExamsView
      scope={scope}
      exams={examsInScope(exams, scope)}
      people={participants(accounts)}
      attempts={attempts}
      now={now}
    />
  );
}

export default function ExamsPage() {
  const exams = useGroupExams();
  const attempts = useAttempts();
  const auth = useAuth();
  const scope = useScope();
  if (
    exams === "loading" ||
    attempts === "loading" ||
    auth === "loading" ||
    scope === "loading"
  )
    return null;
  return <Loaded exams={exams} attempts={attempts} accounts={auth.accounts} scope={scope} />;
}
