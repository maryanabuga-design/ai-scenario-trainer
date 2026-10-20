"use client";

import { useState } from "react";
import { InstructorOverviewView } from "@/components/InstructorOverview/InstructorOverviewView";
import { useSourceSheet } from "@/components/SourceSheet/SourceSheet";
import { currentAccount, useAuth } from "@/lib/auth";
import type { Account } from "@/lib/auth";
import { groupCounts, participants } from "@/lib/cohort";
import type { Attempt } from "@/lib/cohort";
import type { GroupExam } from "@/lib/group-exams";
import { useAttempts, useGroupExams } from "@/lib/group-store";
import { nearestActiveExam } from "@/lib/overview";
import { readHistories } from "@/lib/student-data";
import { profiles } from "@/lib/students";

/** Rendered once everything is read, so the time is never part of the prerender. */
function Loaded({
  name,
  accounts,
  exams,
  attempts,
}: {
  name: string;
  accounts: Account[];
  exams: GroupExam[];
  attempts: Attempt[];
}) {
  const [now] = useState(() => Date.now());
  const { sections } = useSourceSheet();
  const people = participants(accounts);
  const exam = nearestActiveExam(exams, now);
  return (
    <InstructorOverviewView
      name={name}
      list={profiles(people, readHistories(accounts))}
      exam={exam}
      counts={exam ? groupCounts(people, exam, { attempts, active: true }) : null}
      titleOf={(id) => sections.find((section) => section.id === id)?.title ?? id}
    />
  );
}

export default function InstructorOverviewPage() {
  const auth = useAuth();
  const exams = useGroupExams();
  const attempts = useAttempts();
  if (auth === "loading" || exams === "loading" || attempts === "loading") return null;
  const account = currentAccount(auth);
  return (
    <Loaded
      name={account?.name ?? "Instructor"}
      accounts={auth.accounts}
      exams={exams}
      attempts={attempts}
    />
  );
}
